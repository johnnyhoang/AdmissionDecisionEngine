import { Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Grade10School } from '../entities/school.entity';
import { Grade10District } from '../entities/district.entity';
import { Grade10Quota } from '../entities/quota.entity';
import { Grade10Cutoff } from '../entities/cutoff.entity';
import { CreateSchoolDto, UpdateSchoolDto } from '../dtos/school-crud.dto';
import { Grade10LocationService } from './grade10-location.service';
import { deduplicateDistrictsHelper } from '../utils/district-dedup.util';
import { deduplicateSchoolsHelper } from '../utils/school-dedup.util';

@Injectable()
export class Grade10SchoolService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Grade10School)
    private readonly schoolRepo: Repository<Grade10School>,
    @InjectRepository(Grade10District)
    private readonly districtRepo: Repository<Grade10District>,
    @InjectRepository(Grade10Quota)
    private readonly quotaRepo: Repository<Grade10Quota>,
    @InjectRepository(Grade10Cutoff)
    private readonly cutoffRepo: Repository<Grade10Cutoff>,
    private readonly locationService: Grade10LocationService,
  ) {}

  async onApplicationBootstrap() {
    await deduplicateDistrictsHelper(this.schoolRepo, this.districtRepo);
    await deduplicateSchoolsHelper(this.schoolRepo, this.quotaRepo, this.cutoffRepo);
  }

  async findAll(filters: {
    search?: string;
    districtId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(filters.page) || 1;
    const limit = Math.min(Number(filters.limit) || 50, 500);
    const skip = (page - 1) * limit;

    const query = this.schoolRepo
      .createQueryBuilder('school')
      .leftJoinAndSelect('school.district', 'district')
      .where('school.isActive = :isActive', { isActive: true });

    if (filters.search) {
      query.andWhere(
        '(unaccent(school.name) ILIKE unaccent(:search) OR unaccent(school.code) ILIKE unaccent(:search))',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.districtId) {
      const districtIds = filters.districtId
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id);
      if (districtIds.length > 0) {
        query.andWhere('school.districtId IN (:...districtIds)', {
          districtIds,
        });
      }
    }

    const [items, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('school.name', 'ASC')
      .getManyAndCount();

    // Map default average score for NV1 based on latest NV1 cutoff
    const schoolIds = items.map((i) => i.id);
    let latestCutoffs: Grade10Cutoff[] = [];
    if (schoolIds.length > 0) {
      latestCutoffs = await this.cutoffRepo
        .createQueryBuilder('cutoff')
        .where('cutoff.schoolId IN (:...schoolIds)', { schoolIds })
        .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
        .orderBy('cutoff.year', 'DESC')
        .getMany();
    }

    const itemsWithScores = items.map((school) => {
      const schoolCutoffs = latestCutoffs.filter(
        (c) => c.schoolId === school.id,
      );
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
      cutoffScores: cutoffs,
      quotaHistory: quotas,
    };
  }

  async findByCode(code: string) {
    const school = await this.schoolRepo.findOne({
      where: { code },
      relations: { district: true },
    });
    if (!school) throw new NotFoundException('Không tìm thấy trường');
    const cutoffs = await this.cutoffRepo.find({
      where: { schoolId: school.id },
      order: { year: 'DESC' },
    });
    const quotas = await this.quotaRepo.find({
      where: { schoolId: school.id },
      order: { year: 'DESC' },
    });
    return {
      ...school,
      cutoffScores: cutoffs.map((c) => ({
        ...c,
        cutoffNV1: Number(c.cutoffNV1),
        cutoffNV2: c.cutoffNV2 != null ? Number(c.cutoffNV2) : null,
        cutoffNV3: c.cutoffNV3 != null ? Number(c.cutoffNV3) : null,
      })),
      quotaHistory: quotas,
      quotas: quotas,
    };
  }

  async findNearbySchools(filters: {
    userLat: number;
    userLon: number;
    limit?: number;
    maxDistanceKm?: number;
    search?: string;
    districtId?: string;
  }) {
    const limit = Math.min(Math.max(Number(filters.limit || 15), 1), 50);
    const query = this.schoolRepo
      .createQueryBuilder('school')
      .leftJoinAndSelect('school.district', 'district')
      .where('school.isActive = :isActive', { isActive: true });

    if (filters.search) {
      query.andWhere(
        '(unaccent(school.name) ILIKE unaccent(:search) OR unaccent(school.code) ILIKE unaccent(:search))',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.districtId) {
      const districtIds = filters.districtId
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id);
      if (districtIds.length > 0) {
        query.andWhere('school.districtId IN (:...districtIds)', {
          districtIds,
        });
      }
    }

    const schools = await query.orderBy('school.name', 'ASC').getMany();
    if (schools.length === 0) {
      return { items: [], total: 0 };
    }

    const travelPoints = await this.locationService.enrichTravelPoints(
      {
        latitude: filters.userLat,
        longitude: filters.userLon,
        districtName: 'Hồ Chí Minh',
      },
      schools.map((school) => ({
        id: school.id,
        name: school.name,
        address: school.address || undefined,
        districtName: school.district?.name,
        latitude: school.latitude ?? null,
        longitude: school.longitude ?? null,
        mapUrl: school.mapUrl ?? null,
      })),
    );

    const latestCutoffs = await this.cutoffRepo
      .createQueryBuilder('cutoff')
      .leftJoinAndSelect('cutoff.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('cutoff.schoolId IN (:...schoolIds)', {
        schoolIds: schools.map((school) => school.id),
      })
      .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
      .orderBy('cutoff.year', 'DESC')
      .getMany();

    const items = travelPoints
      .map((point) => {
        const school = schools.find((item) => item.id === point.id);
        if (!school) return null;
        const schoolCutoffs = latestCutoffs.filter(
          (cutoff) => cutoff.schoolId === school.id,
        );
        const latestCutoff = schoolCutoffs[0] || null;
        const straightDistance = point.straightDistanceKm;
        const roadDistance = point.roadDistanceKm ?? straightDistance;
        return {
          ...school,
          mapUrl: school.mapUrl || point.mapUrl,
          latitude: school.latitude ?? point.latitude,
          longitude: school.longitude ?? point.longitude,
          latestCutoffNV1: latestCutoff ? Number(latestCutoff.cutoffNV1) : null,
          latestCutoffNV2: latestCutoff ? Number(latestCutoff.cutoffNV2) : null,
          latestCutoffNV3: latestCutoff ? Number(latestCutoff.cutoffNV3) : null,
          latestYear: latestCutoff ? latestCutoff.year : null,
          straightDistanceKm: straightDistance,
          roadDistanceKm: roadDistance,
          roadDurationMin: point.roadDurationMin,
          distanceSource: point.distanceSource,
          distancePrecision: point.precision,
        };
      })
      .filter(Boolean) as any[];

    const filtered = typeof filters.maxDistanceKm === 'number'
      ? items.filter((item) => item.roadDistanceKm <= filters.maxDistanceKm!)
      : items;

    filtered.sort((a, b) => a.roadDistanceKm - b.roadDistanceKm);

    return {
      items: filtered.slice(0, limit),
      total: filtered.length,
    };
  }

  async createSchool(dto: CreateSchoolDto) {
    const resolvedLocation = await this.locationService.geocodeLocation({
      name: dto.name,
      address: dto.address,
      mapUrl: dto.mapUrl,
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
    const school = this.schoolRepo.create({
      ...dto,
      latitude: dto.latitude ?? resolvedLocation.latitude,
      longitude: dto.longitude ?? resolvedLocation.longitude,
      mapUrl: dto.mapUrl ?? resolvedLocation.mapUrl ?? null,
    });
    return this.schoolRepo.save(school);
  }

  async updateSchool(id: string, dto: UpdateSchoolDto) {
    const school = await this.schoolRepo.findOne({
      where: { id },
      relations: { district: true },
    });
    if (!school) throw new NotFoundException('Không tìm thấy trường THPT');
    // cutoffs/quotas are persisted separately below — assigning arrays onto
    // the entity relations would be silently dropped (no cascade)
    const { cutoffs, quotas, ...schoolDto } = dto;
    const resolvedLocation = await this.locationService.geocodeLocation({
      name: dto.name || school.name,
      address: dto.address || school.address,
      districtName: school.districtId ? school.district?.name : undefined,
      mapUrl: dto.mapUrl || school.mapUrl,
      latitude: dto.latitude ?? school.latitude,
      longitude: dto.longitude ?? school.longitude,
    });
    Object.assign(school, schoolDto);
    if (dto.latitude === undefined || dto.latitude === null) {
      school.latitude = resolvedLocation.latitude;
    }
    if (dto.longitude === undefined || dto.longitude === null) {
      school.longitude = resolvedLocation.longitude;
    }
    if (!school.mapUrl) {
      school.mapUrl = resolvedLocation.mapUrl ?? null;
    }
    const saved = await this.schoolRepo.save(school);

    if (Array.isArray(cutoffs)) {
      for (const cutoff of cutoffs) {
        const year = Number(cutoff?.year);
        const nv1 = cutoff?.cutoffNV1;
        if (!year || (nv1 === null || nv1 === undefined || nv1 === '')) continue;
        const programType = cutoff.programType || 'REGULAR';
        const values = {
          cutoffNV1: Number(nv1),
          cutoffNV2:
            cutoff.cutoffNV2 !== null && cutoff.cutoffNV2 !== undefined && cutoff.cutoffNV2 !== ''
              ? Number(cutoff.cutoffNV2)
              : null,
          cutoffNV3:
            cutoff.cutoffNV3 !== null && cutoff.cutoffNV3 !== undefined && cutoff.cutoffNV3 !== ''
              ? Number(cutoff.cutoffNV3)
              : null,
        };
        const existing = await this.cutoffRepo.findOne({
          where: { schoolId: id, year, programType },
        });
        if (existing) {
          Object.assign(existing, values);
          await this.cutoffRepo.save(existing);
        } else {
          await this.cutoffRepo.save(
            this.cutoffRepo.create({ schoolId: id, year, programType, ...values }),
          );
        }
      }
    }

    if (Array.isArray(quotas)) {
      for (const quota of quotas) {
        const year = Number(quota?.year);
        if (!year) continue;
        const programType = quota.programType || 'REGULAR';
        const quotaCount = Number(quota.quota) || 0;
        const registeredCount = Number(quota.registeredCount) || 0;
        const values = {
          quota: quotaCount,
          registeredCount,
          competitionRatio:
            quotaCount > 0 && registeredCount > 0
              ? Number((registeredCount / quotaCount).toFixed(2))
              : Number(quota.competitionRatio) || 0,
        };
        const existing = await this.quotaRepo.findOne({
          where: { schoolId: id, year, programType },
        });
        if (existing) {
          Object.assign(existing, values);
          await this.quotaRepo.save(existing);
        } else {
          await this.quotaRepo.save(
            this.quotaRepo.create({ schoolId: id, year, programType, ...values }),
          );
        }
      }
    }

    return saved;
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
    const latestYearObj = await this.cutoffRepo
      .createQueryBuilder('cutoff')
      .select('MAX(cutoff.year)', 'maxYear')
      .getRawOne();

    const latestYear = latestYearObj?.maxYear || 2025;

    const topSchoolsRaw = await this.cutoffRepo
      .createQueryBuilder('cutoff')
      .leftJoinAndSelect('cutoff.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('cutoff.year = :year', { year: latestYear })
      .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
      .orderBy('cutoff.cutoffNV1', 'DESC')
      .limit(10)
      .getMany();

    const topSchools = topSchoolsRaw.map((c) => ({
      schoolId: c.school.id,
      schoolName: c.school.name,
      schoolCode: c.school.code,
      districtName: c.school.district?.name || 'N/A',
      cutoffNV1: Number(c.cutoffNV1),
      year: c.year,
    }));

    // 2. Bottom 10 schools by latest NV1 Cutoff
    const bottomSchoolsRaw = await this.cutoffRepo
      .createQueryBuilder('cutoff')
      .leftJoinAndSelect('cutoff.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('cutoff.year = :year', { year: latestYear })
      .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
      .andWhere('cutoff.cutoffNV1 > 0')
      .orderBy('cutoff.cutoffNV1', 'ASC')
      .limit(10)
      .getMany();

    const bottomSchools = bottomSchoolsRaw.map((c) => ({
      schoolId: c.school.id,
      schoolName: c.school.name,
      schoolCode: c.school.code,
      districtName: c.school.district?.name || 'N/A',
      cutoffNV1: Number(c.cutoffNV1),
      year: c.year,
    }));

    // 3. Top Quota
    const topQuotaRaw = await this.quotaRepo
      .createQueryBuilder('quota')
      .leftJoinAndSelect('quota.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('quota.year = :year', { year: latestYear })
      .andWhere('quota.programType = :pt', { pt: 'REGULAR' })
      .orderBy('quota.quota', 'DESC')
      .limit(10)
      .getMany();

    const topQuota = topQuotaRaw.map((q) => ({
      schoolId: q.school.id,
      schoolName: q.school.name,
      schoolCode: q.school.code,
      districtName: q.school.district?.name || 'N/A',
      quota: Number(q.quota),
      year: q.year,
    }));

    // 4. Top Ratio (Competition)
    const topRatioRaw = await this.quotaRepo
      .createQueryBuilder('quota')
      .leftJoinAndSelect('quota.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('quota.year = :year', { year: latestYear })
      .andWhere('quota.programType = :pt', { pt: 'REGULAR' })
      .orderBy('quota.competitionRatio', 'DESC')
      .limit(10)
      .getMany();

    const topRatio = topRatioRaw.map((q) => ({
      schoolId: q.school.id,
      schoolName: q.school.name,
      schoolCode: q.school.code,
      districtName: q.school.district?.name || 'N/A',
      ratio: Number(q.competitionRatio),
      year: q.year,
    }));

    // 5. Bottom Ratio (Lowest competition)
    const bottomRatioRaw = await this.quotaRepo
      .createQueryBuilder('quota')
      .leftJoinAndSelect('quota.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('quota.year = :year', { year: latestYear })
      .andWhere('quota.programType = :pt', { pt: 'REGULAR' })
      .andWhere('quota.competitionRatio > 0')
      .orderBy('quota.competitionRatio', 'ASC')
      .limit(10)
      .getMany();

    const bottomRatio = bottomRatioRaw.map((q) => ({
      schoolId: q.school.id,
      schoolName: q.school.name,
      schoolCode: q.school.code,
      districtName: q.school.district?.name || 'N/A',
      ratio: Number(q.competitionRatio),
      year: q.year,
    }));

    // 6. Top Increase (Difference latest vs previous year)
    const diffSchoolsRaw = await this.cutoffRepo
      .createQueryBuilder('c1')
      .innerJoin(
        Grade10Cutoff,
        'c2',
        'c1.schoolId = c2.schoolId AND c2.year = :prevYear AND c2.programType = :pt',
        { prevYear: latestYear - 1, pt: 'REGULAR' },
      )
      .leftJoinAndSelect('c1.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .select('school.id', 'schoolId')
      .addSelect('school.name', 'schoolName')
      .addSelect('school.code', 'schoolCode')
      .addSelect('district.name', 'districtName')
      .addSelect('c1.cutoffNV1', 'cutoffNew')
      .addSelect('c2.cutoffNV1', 'cutoffOld')
      .addSelect('(c1.cutoffNV1 - c2.cutoffNV1)', 'diff')
      .where('c1.year = :year', { year: latestYear })
      .andWhere('c1.programType = :pt', { pt: 'REGULAR' })
      .orderBy('diff', 'DESC')
      .limit(10)
      .getRawMany();

    const topIncrease = diffSchoolsRaw.map((r) => ({
      schoolId: r.schoolId,
      schoolName: r.schoolName,
      schoolCode: r.schoolCode,
      districtName: r.districtName || 'N/A',
      cutoffNew: Number(r.cutoffNew),
      cutoffOld: Number(r.cutoffOld),
      diff: Number(Number(r.diff).toFixed(2)),
    }));

    // 7. Top Registered count
    const topRegisteredRaw = await this.quotaRepo
      .createQueryBuilder('quota')
      .leftJoinAndSelect('quota.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('quota.year = :year', { year: latestYear })
      .andWhere('quota.programType = :pt', { pt: 'REGULAR' })
      .orderBy('quota.registeredCount', 'DESC')
      .limit(10)
      .getMany();

    const topRegistered = topRegisteredRaw.map((q) => ({
      schoolId: q.school.id,
      schoolName: q.school.name,
      schoolCode: q.school.code,
      districtName: q.school.district?.name || 'N/A',
      registeredCount: Number(q.registeredCount),
      year: q.year,
    }));

    // 8. Top Specialized Schools
    const topSpecializedRaw = await this.cutoffRepo
      .createQueryBuilder('cutoff')
      .leftJoinAndSelect('cutoff.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('cutoff.year = :year', { year: latestYear })
      .andWhere('school.schoolType = :st', { st: 'SPECIALIZED' })
      .orderBy('cutoff.cutoffNV1', 'DESC')
      .limit(10)
      .getMany();

    const topSpecialized = topSpecializedRaw.map((c) => ({
      schoolId: c.school.id,
      schoolName: c.school.name,
      schoolCode: c.school.code,
      districtName: c.school.district?.name || 'N/A',
      cutoffNV1: Number(c.cutoffNV1),
      year: c.year,
    }));

    // 9. Top Decrease (Largest Cutoff Drop vs Previous Year)
    const dropSchoolsRaw = await this.cutoffRepo
      .createQueryBuilder('c1')
      .innerJoin(
        Grade10Cutoff,
        'c2',
        'c1.schoolId = c2.schoolId AND c2.year = :prevYear AND c2.programType = :pt',
        { prevYear: latestYear - 1, pt: 'REGULAR' },
      )
      .leftJoinAndSelect('c1.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .select('school.id', 'schoolId')
      .addSelect('school.name', 'schoolName')
      .addSelect('school.code', 'schoolCode')
      .addSelect('district.name', 'districtName')
      .addSelect('c1.cutoffNV1', 'cutoffNew')
      .addSelect('c2.cutoffNV1', 'cutoffOld')
      .addSelect('(c1.cutoffNV1 - c2.cutoffNV1)', 'diff')
      .where('c1.year = :year', { year: latestYear })
      .andWhere('c1.programType = :pt', { pt: 'REGULAR' })
      .andWhere('c1.cutoffNV1 - c2.cutoffNV1 < 0')
      .orderBy('diff', 'ASC') // Largest drop first (most negative)
      .limit(10)
      .getRawMany();

    const topDecrease = dropSchoolsRaw.map((r) => ({
      schoolId: r.schoolId,
      schoolName: r.schoolName,
      schoolCode: r.schoolCode,
      districtName: r.districtName || 'N/A',
      cutoffNew: Number(r.cutoffNew),
      cutoffOld: Number(r.cutoffOld),
      diff: Number(Number(r.diff).toFixed(2)),
    }));

    // 10. Top NV3 Gap (Largest Gap between NV3 and NV1)
    const nv3GapRaw = await this.cutoffRepo
      .createQueryBuilder('cutoff')
      .leftJoinAndSelect('cutoff.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('cutoff.year = :year', { year: latestYear })
      .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
      .andWhere('cutoff.cutoffNV3 > 0')
      .andWhere('cutoff.cutoffNV1 > 0')
      .orderBy('(cutoff.cutoffNV3 - cutoff.cutoffNV1)', 'DESC')
      .limit(10)
      .getMany();

    const topNV3Gap = nv3GapRaw.map((c) => ({
      schoolId: c.school.id,
      schoolName: c.school.name,
      schoolCode: c.school.code,
      districtName: c.school.district?.name || 'N/A',
      cutoffNV1: Number(c.cutoffNV1),
      cutoffNV3: Number(c.cutoffNV3),
      gap: Number((Number(c.cutoffNV3) - Number(c.cutoffNV1)).toFixed(2)),
      year: c.year,
    }));

    // Average NV1 Cutoff score by district
    const districtStats = await this.cutoffRepo
      .createQueryBuilder('cutoff')
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

    const districtAverages = districtStats.map((d) => ({
      districtName: d.districtName || 'N/A',
      avgCutoff: Number(Number(d.avgCutoff).toFixed(2)),
      schoolCount: parseInt(d.schoolCount),
    }));

    // Quota and Registration trend over years
    const overallTrends = await this.quotaRepo
      .createQueryBuilder('quota')
      .select('quota.year', 'year')
      .addSelect('SUM(quota.quota)', 'totalQuota')
      .addSelect('SUM(quota.registeredCount)', 'totalRegistered')
      .where('quota.programType = :pt', { pt: 'REGULAR' })
      .groupBy('quota.year')
      .orderBy('quota.year', 'ASC')
      .getRawMany();

    const trends = overallTrends.map((t) => ({
      year: parseInt(t.year),
      totalQuota: parseInt(t.totalQuota || 0),
      totalRegistered: parseInt(t.totalRegistered || 0),
      avgCompetitionRatio:
        t.totalQuota > 0
          ? Number((t.totalRegistered / t.totalQuota).toFixed(2))
          : 0,
    }));

    return {
      latestYear,
      topSchools,
      bottomSchools,
      topQuota,
      topRatio,
      bottomRatio,
      topIncrease,
      topRegistered,
      topSpecialized,
      topDecrease,
      topNV3Gap,
      districtAverages,
      trends,
    };
  }

  /**
   * Returns all school names for autocomplete suggestions
   * Optionally filtered by a query string
   */
  async getSchoolNames(
    query?: string,
  ): Promise<
    { id: string; name: string; code: string; districtName?: string }[]
  > {
    const qb = this.schoolRepo
      .createQueryBuilder('school')
      .leftJoinAndSelect('school.district', 'district')
      .where('school.isActive = :isActive', { isActive: true })
      .orderBy('school.name', 'ASC')
      .take(30);

    if (query && query.trim()) {
      qb.andWhere('school.name ILIKE :q', { q: `%${query.trim()}%` });
    }

    const schools = await qb.getMany();
    return schools.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      districtName: s.district?.name,
      districtCode: s.district?.code,
    }));
  }

  /**
   * Bulk seeds all THPT schools from g10hcm_all_schools.json
   * Only creates districts and schools that don't exist yet (safe upsert)
   */
  async seedAllSchools(): Promise<{ created: number; skipped: number }> {
    const dataPath = path.join(
      process.cwd(),
      '..',
      '..',
      'data',
      'imports',
      'g10hcm_all_schools.json',
    );
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
      let district = await this.districtRepo.findOne({
        where: { code: districtData.code },
      });
      if (!district) {
        district = this.districtRepo.create({
          name: districtData.name,
          code: districtData.code,
        });
        district = await this.districtRepo.save(district);
      }

      // Upsert each school
      for (const schoolData of districtData.schools) {
        const existing = await this.schoolRepo.findOne({
          where: { code: schoolData.code },
        });
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
            isActive: true,
          });
          await this.schoolRepo.save(school);
          created++;
        }
      }
    }

    return { created, skipped };
  }

  async mergeSchools(primaryId: string, secondaryId: string, mergedData: any) {
    const primary = await this.schoolRepo.findOneBy({ id: primaryId });
    const secondary = await this.schoolRepo.findOneBy({ id: secondaryId });
    if (!primary || !secondary) {
      throw new NotFoundException('One or both schools not found');
    }

    // Process cutoffs from mergedData
    if (mergedData.cutoffs && Array.isArray(mergedData.cutoffs)) {
      // Explicit curated list from the UI (if ever provided) takes priority
      await this.cutoffRepo.delete({ schoolId: primaryId });
      await this.cutoffRepo.delete({ schoolId: secondaryId });

      const newCutoffs = mergedData.cutoffs.map((c: any) =>
        this.cutoffRepo.create({
          ...c,
          schoolId: primaryId,
        }),
      );
      await this.cutoffRepo.save(newCutoffs);
    } else {
      // No curated list from the UI: auto-merge so cutoff history from the
      // secondary school isn't lost when it gets deleted below (cascade).
      // Years/programTypes that already exist on the primary school are
      // kept as-is (primary wins on conflict); everything else is moved over.
      const [primaryCutoffs, secondaryCutoffs] = await Promise.all([
        this.cutoffRepo.find({ where: { schoolId: primaryId } }),
        this.cutoffRepo.find({ where: { schoolId: secondaryId } }),
      ]);
      const existingKeys = new Set(
        primaryCutoffs.map((c) => `${c.year}_${c.programType}`),
      );
      const toMove = secondaryCutoffs.filter(
        (c) => !existingKeys.has(`${c.year}_${c.programType}`),
      );
      for (const c of toMove) {
        c.schoolId = primaryId;
        await this.cutoffRepo.save(c);
      }
    }

    // Process quotas from mergedData
    if (mergedData.quotas && Array.isArray(mergedData.quotas)) {
      await this.quotaRepo.delete({ schoolId: primaryId });
      await this.quotaRepo.delete({ schoolId: secondaryId });

      const newQuotas = mergedData.quotas.map((q: any) =>
        this.quotaRepo.create({
          ...q,
          schoolId: primaryId,
        }),
      );
      await this.quotaRepo.save(newQuotas);
    } else {
      // Same auto-merge safeguard as cutoffs above, for quotas
      // (chỉ tiêu / số đăng ký / tỷ lệ chọi).
      const [primaryQuotas, secondaryQuotas] = await Promise.all([
        this.quotaRepo.find({ where: { schoolId: primaryId } }),
        this.quotaRepo.find({ where: { schoolId: secondaryId } }),
      ]);
      const existingKeys = new Set(
        primaryQuotas.map((q) => `${q.year}_${q.programType}`),
      );
      const toMove = secondaryQuotas.filter(
        (q) => !existingKeys.has(`${q.year}_${q.programType}`),
      );
      for (const q of toMove) {
        q.schoolId = primaryId;
        await this.quotaRepo.save(q);
      }
    }

    // Clean up basic merged data so we don't save arrays into school
    const basicData = { ...mergedData };
    delete basicData.cutoffs;
    delete basicData.quotas;

    // Update primary
    Object.assign(primary, basicData);
    await this.schoolRepo.save(primary);

    // Hard delete secondary (will cascade to its history if any)
    await this.schoolRepo.remove(secondary);

    return primary;
  }
}
