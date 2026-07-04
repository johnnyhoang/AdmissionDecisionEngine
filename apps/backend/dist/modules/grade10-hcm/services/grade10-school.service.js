"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grade10SchoolService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fs = require("fs");
const path = require("path");
const school_entity_1 = require("../entities/school.entity");
const district_entity_1 = require("../entities/district.entity");
const quota_entity_1 = require("../entities/quota.entity");
const cutoff_entity_1 = require("../entities/cutoff.entity");
let Grade10SchoolService = class Grade10SchoolService {
    schoolRepo;
    districtRepo;
    quotaRepo;
    cutoffRepo;
    constructor(schoolRepo, districtRepo, quotaRepo, cutoffRepo) {
        this.schoolRepo = schoolRepo;
        this.districtRepo = districtRepo;
        this.quotaRepo = quotaRepo;
        this.cutoffRepo = cutoffRepo;
    }
    async findAll(filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const skip = (page - 1) * limit;
        const query = this.schoolRepo
            .createQueryBuilder('school')
            .leftJoinAndSelect('school.district', 'district')
            .where('school.isActive = :isActive', { isActive: true });
        if (filters.search) {
            query.andWhere('(unaccent(school.name) ILIKE unaccent(:search) OR unaccent(school.code) ILIKE unaccent(:search))', { search: `%${filters.search}%` });
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
        const schoolIds = items.map((i) => i.id);
        let latestCutoffs = [];
        if (schoolIds.length > 0) {
            latestCutoffs = await this.cutoffRepo
                .createQueryBuilder('cutoff')
                .where('cutoff.schoolId IN (:...schoolIds)', { schoolIds })
                .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
                .orderBy('cutoff.year', 'DESC')
                .getMany();
        }
        const itemsWithScores = items.map((school) => {
            const schoolCutoffs = latestCutoffs.filter((c) => c.schoolId === school.id);
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
    async findOne(id) {
        const school = await this.schoolRepo.findOne({
            where: { id },
            relations: { district: true },
        });
        if (!school) {
            throw new common_1.NotFoundException('Không tìm thấy trường THPT');
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
    async findByCode(code) {
        const school = await this.schoolRepo.findOne({
            where: { code },
            relations: { district: true },
        });
        if (!school)
            throw new common_1.NotFoundException('Không tìm thấy trường');
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
    async createSchool(dto) {
        const school = this.schoolRepo.create(dto);
        return this.schoolRepo.save(school);
    }
    async updateSchool(id, dto) {
        const school = await this.schoolRepo.findOne({ where: { id } });
        if (!school)
            throw new common_1.NotFoundException('Không tìm thấy trường THPT');
        Object.assign(school, dto);
        return this.schoolRepo.save(school);
    }
    async deleteSchool(id) {
        const result = await this.schoolRepo.delete(id);
        return typeof result.affected === 'number' && result.affected > 0;
    }
    async getDistricts() {
        return this.districtRepo.find({ order: { name: 'ASC' } });
    }
    async getAdminStats() {
        const schools = await this.schoolRepo.count();
        const districts = await this.districtRepo.count();
        const cutoffs = await this.cutoffRepo.count();
        const quotas = await this.quotaRepo.count();
        return { schools, districts, cutoffs, quotas };
    }
    async getAnalytics() {
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
        const diffSchoolsRaw = await this.cutoffRepo
            .createQueryBuilder('c1')
            .innerJoin(cutoff_entity_1.Grade10Cutoff, 'c2', 'c1.schoolId = c2.schoolId AND c2.year = :prevYear AND c2.programType = :pt', { prevYear: latestYear - 1, pt: 'REGULAR' })
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
            avgCompetitionRatio: t.totalQuota > 0
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
            districtAverages,
            trends,
        };
    }
    async getSchoolNames(query) {
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
    async seedAllSchools() {
        const dataPath = path.join(process.cwd(), '..', '..', 'data', 'imports', 'g10hcm_all_schools.json');
        let rawData;
        try {
            rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        }
        catch (e) {
            throw new Error(`Cannot read g10hcm_all_schools.json: ${e.message}`);
        }
        let created = 0;
        let skipped = 0;
        for (const districtData of rawData.districts) {
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
            for (const schoolData of districtData.schools) {
                const existing = await this.schoolRepo.findOne({
                    where: { code: schoolData.code },
                });
                if (existing) {
                    if (!existing.districtId) {
                        existing.districtId = district.id;
                        await this.schoolRepo.save(existing);
                    }
                    skipped++;
                }
                else {
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
    async mergeSchools(primaryId, secondaryId, mergedData) {
        const primary = await this.schoolRepo.findOneBy({ id: primaryId });
        const secondary = await this.schoolRepo.findOneBy({ id: secondaryId });
        if (!primary || !secondary) {
            throw new common_1.NotFoundException('One or both schools not found');
        }
        if (mergedData.cutoffs && Array.isArray(mergedData.cutoffs)) {
            await this.cutoffRepo.delete({ schoolId: primaryId });
            await this.cutoffRepo.delete({ schoolId: secondaryId });
            const newCutoffs = mergedData.cutoffs.map((c) => this.cutoffRepo.create({
                ...c,
                schoolId: primaryId,
            }));
            await this.cutoffRepo.save(newCutoffs);
        }
        if (mergedData.quotas && Array.isArray(mergedData.quotas)) {
            await this.quotaRepo.delete({ schoolId: primaryId });
            await this.quotaRepo.delete({ schoolId: secondaryId });
            const newQuotas = mergedData.quotas.map((q) => this.quotaRepo.create({
                ...q,
                schoolId: primaryId,
            }));
            await this.quotaRepo.save(newQuotas);
        }
        const basicData = { ...mergedData };
        delete basicData.cutoffs;
        delete basicData.quotas;
        Object.assign(primary, basicData);
        await this.schoolRepo.save(primary);
        await this.schoolRepo.remove(secondary);
        return primary;
    }
};
exports.Grade10SchoolService = Grade10SchoolService;
exports.Grade10SchoolService = Grade10SchoolService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(school_entity_1.Grade10School)),
    __param(1, (0, typeorm_1.InjectRepository)(district_entity_1.Grade10District)),
    __param(2, (0, typeorm_1.InjectRepository)(quota_entity_1.Grade10Quota)),
    __param(3, (0, typeorm_1.InjectRepository)(cutoff_entity_1.Grade10Cutoff)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], Grade10SchoolService);
//# sourceMappingURL=grade10-school.service.js.map