import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Grade10School } from '../entities/school.entity';
import { Grade10District } from '../entities/district.entity';
import { Grade10Quota } from '../entities/quota.entity';
import { Grade10Cutoff } from '../entities/cutoff.entity';
import { CreateSchoolDto, UpdateSchoolDto } from '../dtos/school-crud.dto';

@Injectable()
export class Grade10SchoolService {
  constructor(
    @InjectRepository(Grade10School)
    private readonly schoolRepo: Repository<Grade10School>,
    @InjectRepository(Grade10District)
    private readonly districtRepo: Repository<Grade10District>,
    @InjectRepository(Grade10Quota)
    private readonly quotaRepo: Repository<Grade10Quota>,
    @InjectRepository(Grade10Cutoff)
    private readonly cutoffRepo: Repository<Grade10Cutoff>
  ) {}

  async findAll(filters: { search?: string; districtId?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const query = this.schoolRepo.createQueryBuilder('school')
      .leftJoinAndSelect('school.district', 'district')
      .where('school.isActive = :isActive', { isActive: true });

    if (filters.search) {
      query.andWhere('(school.name ILIKE :search OR school.code ILIKE :search)', { search: `%${filters.search}%` });
    }

    if (filters.districtId) {
      query.andWhere('school.districtId = :districtId', { districtId: filters.districtId });
    }

    const [items, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('school.name', 'ASC')
      .getManyAndCount();

    // Map default average score for NV1 based on latest NV1 cutoff
    const schoolIds = items.map(i => i.id);
    let latestCutoffs: Grade10Cutoff[] = [];
    if (schoolIds.length > 0) {
      latestCutoffs = await this.cutoffRepo.createQueryBuilder('cutoff')
        .where('cutoff.schoolId IN (:...schoolIds)', { schoolIds })
        .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
        .orderBy('cutoff.year', 'DESC')
        .getMany();
    }

    const itemsWithScores = items.map(school => {
      const schoolCutoffs = latestCutoffs.filter(c => c.schoolId === school.id);
      const latestCutoff = schoolCutoffs[0] || null;
      return {
        ...school,
        latestCutoffNV1: latestCutoff ? Number(latestCutoff.cutoffNV1) : null,
        latestCutoffNV2: latestCutoff ? Number(latestCutoff.cutoffNV2) : null,
        latestCutoffNV3: latestCutoff ? Number(latestCutoff.cutoffNV3) : null,
        latestYear: latestCutoff ? latestCutoff.year : null,
      };
    });

    return {
      items: itemsWithScores,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const school = await this.schoolRepo.findOne({
      where: { id },
      relations: { district: true },
    });

    if (!school) {
      throw new NotFoundException('Không tìm thấy trường THPT');
    }

    const cutoffs = await this.cutoffRepo.find({
      where: { schoolId: id },
      order: { year: 'DESC' },
    });

    const quotas = await this.quotaRepo.find({
      where: { schoolId: id },
      order: { year: 'DESC' },
    });

    return {
      ...school,
      cutoffs: cutoffs.map(c => ({
        ...c,
        cutoffNV1: Number(c.cutoffNV1),
        cutoffNV2: c.cutoffNV2 ? Number(c.cutoffNV2) : null,
        cutoffNV3: c.cutoffNV3 ? Number(c.cutoffNV3) : null,
        lowestScore: c.lowestScore ? Number(c.lowestScore) : null,
        highestScore: c.highestScore ? Number(c.highestScore) : null,
      })),
      quotas: quotas.map(q => ({
        ...q,
        competitionRatio: q.competitionRatio ? Number(q.competitionRatio) : null,
      })),
    };
  }

  async createSchool(dto: CreateSchoolDto) {
    const school = this.schoolRepo.create(dto);
    return this.schoolRepo.save(school);
  }

  async updateSchool(id: string, dto: UpdateSchoolDto) {
    const school = await this.schoolRepo.findOne({ where: { id } });
    if (!school) throw new NotFoundException('Không tìm thấy trường THPT');
    Object.assign(school, dto);
    return this.schoolRepo.save(school);
  }

  async deleteSchool(id: string) {
    const result = await this.schoolRepo.delete(id);
    return typeof result.affected === 'number' && result.affected > 0;
  }

  async getDistricts() {
    return this.districtRepo.find({ order: { name: 'ASC' } } as any);
  }

  async getAdminStats() {
    const schools = await this.schoolRepo.count();
    const districts = await this.districtRepo.count();
    const cutoffs = await this.cutoffRepo.count();
    const quotas = await this.quotaRepo.count();
    return { schools, districts, cutoffs, quotas };
  }

  async getAnalytics() {
    // 1. Top 10 schools by latest NV1 Cutoff
    const latestYearObj = await this.cutoffRepo.createQueryBuilder('cutoff')
      .select('MAX(cutoff.year)', 'maxYear')
      .getRawOne();
    
    const latestYear = latestYearObj?.maxYear || 2025;

    const topSchoolsRaw = await this.cutoffRepo.createQueryBuilder('cutoff')
      .leftJoinAndSelect('cutoff.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('cutoff.year = :year', { year: latestYear })
      .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
      .orderBy('cutoff.cutoffNV1', 'DESC')
      .limit(10)
      .getMany();

    const topSchools = topSchoolsRaw.map(c => ({
      schoolId: c.school.id,
      schoolName: c.school.name,
      schoolCode: c.school.code,
      districtName: c.school.district?.name || 'N/A',
      cutoffNV1: Number(c.cutoffNV1),
      year: c.year,
    }));

    // 2. Average NV1 Cutoff score by district
    const districtStats = await this.cutoffRepo.createQueryBuilder('cutoff')
      .leftJoin('cutoff.school', 'school')
      .leftJoin('school.district', 'district')
      .select('district.name', 'districtName')
      .addSelect('AVG(cutoff.cutoffNV1)', 'avgCutoff')
      .addSelect('COUNT(school.id)', 'schoolCount')
      .where('cutoff.year = :year', { year: latestYear })
      .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
      .groupBy('district.name')
      .orderBy('avgCutoff', 'DESC')
      .getRawMany();

    const districtAverages = districtStats.map(d => ({
      districtName: d.districtName || 'N/A',
      avgCutoff: Number(Number(d.avgCutoff).toFixed(2)),
      schoolCount: parseInt(d.schoolCount),
    }));

    // 3. Quota and Registration trend over years
    const overallTrends = await this.quotaRepo.createQueryBuilder('quota')
      .select('quota.year', 'year')
      .addSelect('SUM(quota.quota)', 'totalQuota')
      .addSelect('SUM(quota.registeredCount)', 'totalRegistered')
      .where('quota.programType = :pt', { pt: 'REGULAR' })
      .groupBy('quota.year')
      .orderBy('quota.year', 'ASC')
      .getRawMany();

    const trends = overallTrends.map(t => ({
      year: parseInt(t.year),
      totalQuota: parseInt(t.totalQuota || 0),
      totalRegistered: parseInt(t.totalRegistered || 0),
      avgCompetitionRatio: t.totalQuota > 0 ? Number((t.totalRegistered / t.totalQuota).toFixed(2)) : 0,
    }));

    return {
      latestYear,
      topSchools,
      districtAverages,
      trends,
    };
  }

  /**
   * Returns all school names for autocomplete suggestions
   * Optionally filtered by a query string
   */
  async getSchoolNames(query?: string): Promise<{ id: string; name: string; code: string; districtName?: string }[]> {
    const qb = this.schoolRepo.createQueryBuilder('school')
      .leftJoinAndSelect('school.district', 'district')
      .where('school.isActive = :isActive', { isActive: true })
      .orderBy('school.name', 'ASC')
      .take(30);

    if (query && query.trim()) {
      qb.andWhere('school.name ILIKE :q', { q: `%${query.trim()}%` });
    }

    const schools = await qb.getMany();
    return schools.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      districtName: s.district?.name
    }));
  }

  /**
   * Bulk seeds all THPT schools from g10hcm_all_schools.json
   * Only creates districts and schools that don't exist yet (safe upsert)
   */
  async seedAllSchools(): Promise<{ created: number; skipped: number }> {
    const dataPath = path.join(process.cwd(), '..', '..', 'data', 'imports', 'g10hcm_all_schools.json');
    let rawData: any;
    try {
      rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    } catch (e) {
      throw new Error(`Cannot read g10hcm_all_schools.json: ${e.message}`);
    }

    let created = 0;
    let skipped = 0;

    for (const districtData of rawData.districts) {
      // Upsert district
      let district = await this.districtRepo.findOne({ where: { code: districtData.code } });
      if (!district) {
        district = this.districtRepo.create({ name: districtData.name, code: districtData.code });
        district = await this.districtRepo.save(district);
      }

      // Upsert each school
      for (const schoolData of districtData.schools) {
        const existing = await this.schoolRepo.findOne({ where: { code: schoolData.code } });
        if (existing) {
          // Update district link if missing
          if (!existing.districtId) {
            existing.districtId = district.id;
            await this.schoolRepo.save(existing);
          }
          skipped++;
        } else {
          const school = this.schoolRepo.create({
            name: schoolData.name,
            code: schoolData.code,
            districtId: district.id,
            schoolType: schoolData.type || 'REGULAR',
            isActive: true
          });
          await this.schoolRepo.save(school);
          created++;
        }
      }
    }

    return { created, skipped };
  }
}
