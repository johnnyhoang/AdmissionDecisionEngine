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
var Grade10ImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grade10ImportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const school_entity_1 = require("../entities/school.entity");
const district_entity_1 = require("../entities/district.entity");
const quota_entity_1 = require("../entities/quota.entity");
const cutoff_entity_1 = require("../entities/cutoff.entity");
const import_log_entity_1 = require("../entities/import-log.entity");
let Grade10ImportService = Grade10ImportService_1 = class Grade10ImportService {
    schoolRepo;
    districtRepo;
    quotaRepo;
    cutoffRepo;
    logRepo;
    logger = new common_1.Logger(Grade10ImportService_1.name);
    constructor(schoolRepo, districtRepo, quotaRepo, cutoffRepo, logRepo) {
        this.schoolRepo = schoolRepo;
        this.districtRepo = districtRepo;
        this.quotaRepo = quotaRepo;
        this.cutoffRepo = cutoffRepo;
        this.logRepo = logRepo;
    }
    resolveDataDir() {
        const fs = require('fs');
        const path = require('path');
        let dir = path.join(process.cwd(), 'data', 'imports');
        if (fs.existsSync(dir))
            return dir;
        dir = path.join(process.cwd(), '..', '..', 'data', 'imports');
        if (fs.existsSync(dir))
            return dir;
        dir = path.join(__dirname, '..', '..', '..', '..', '..', 'data', 'imports');
        if (fs.existsSync(dir))
            return dir;
        return path.join(process.cwd(), 'data', 'imports');
    }
    async getPresets() {
        const fs = require('fs');
        const path = require('path');
        const dataDir = this.resolveDataDir();
        if (!fs.existsSync(dataDir)) {
            return [];
        }
        const files = fs
            .readdirSync(dataDir)
            .filter((f) => f.startsWith('g10hcm_') && f.endsWith('.json'));
        const presets = [];
        for (const file of files) {
            try {
                const filePath = path.join(dataDir, file);
                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                let schoolCount = 0;
                let quotaCount = 0;
                let cutoffCount = 0;
                content.districts?.forEach((d) => {
                    schoolCount += d.schools?.length || 0;
                    d.schools?.forEach((s) => {
                        quotaCount += s.quotas?.length || 0;
                        cutoffCount += s.cutoffs?.length || 0;
                    });
                });
                presets.push({
                    filename: file,
                    sourceName: content.sourceName,
                    sourceUrl: content.sourceUrl,
                    dataYear: content.dataYear,
                    districtsCount: content.districts?.length || 0,
                    schoolsCount: schoolCount,
                    quotasCount: quotaCount,
                    cutoffsCount: cutoffCount,
                });
            }
            catch (e) {
            }
        }
        return presets;
    }
    async runPreset(filename) {
        const fs = require('fs');
        const path = require('path');
        const dataDir = this.resolveDataDir();
        const filePath = path.join(dataDir, filename);
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filename}`);
        }
        const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return this.importData(payload);
    }
    async importData(payload) {
        let schoolsAdded = 0;
        let schoolsUpdated = 0;
        let quotasAdded = 0;
        let cutoffsAdded = 0;
        const errors = [];
        for (const distDto of payload.districts) {
            try {
                let district = await this.districtRepo.findOne({
                    where: { code: distDto.code },
                });
                if (!district) {
                    district = this.districtRepo.create({
                        code: distDto.code,
                        name: distDto.name,
                    });
                    district = await this.districtRepo.save(district);
                }
                if (distDto.schools?.length) {
                    for (const schoolDto of distDto.schools) {
                        try {
                            let school = await this.schoolRepo.findOne({
                                where: { code: schoolDto.code },
                            });
                            if (school) {
                                school.name = schoolDto.name || school.name;
                                school.address = schoolDto.address || school.address;
                                school.website = schoolDto.website || school.website;
                                school.schoolType = schoolDto.schoolType || school.schoolType;
                                school.districtId = district.id;
                                await this.schoolRepo.save(school);
                                schoolsUpdated++;
                            }
                            else {
                                school = this.schoolRepo.create({
                                    code: schoolDto.code,
                                    name: schoolDto.name,
                                    address: schoolDto.address,
                                    website: schoolDto.website,
                                    schoolType: schoolDto.schoolType || 'REGULAR',
                                    districtId: district.id,
                                });
                                school = await this.schoolRepo.save(school);
                                schoolsAdded++;
                            }
                            if (schoolDto.quotas?.length) {
                                for (const qDto of schoolDto.quotas) {
                                    const pt = qDto.programType || 'REGULAR';
                                    let quota = await this.quotaRepo.findOne({
                                        where: {
                                            schoolId: school.id,
                                            year: qDto.year,
                                            programType: pt,
                                        },
                                    });
                                    if (!quota) {
                                        quota = this.quotaRepo.create({
                                            schoolId: school.id,
                                            year: qDto.year,
                                            quota: qDto.quota,
                                            registeredCount: qDto.registeredCount || 0,
                                            competitionRatio: qDto.competitionRatio || 0,
                                            programType: pt,
                                        });
                                        await this.quotaRepo.save(quota);
                                        quotasAdded++;
                                    }
                                    else {
                                        quota.quota = qDto.quota;
                                        quota.registeredCount =
                                            qDto.registeredCount || quota.registeredCount;
                                        quota.competitionRatio =
                                            qDto.competitionRatio || quota.competitionRatio;
                                        await this.quotaRepo.save(quota);
                                    }
                                }
                            }
                            if (schoolDto.cutoffs?.length) {
                                for (const cDto of schoolDto.cutoffs) {
                                    const pt = cDto.programType || 'REGULAR';
                                    let cutoff = await this.cutoffRepo.findOne({
                                        where: {
                                            schoolId: school.id,
                                            year: cDto.year,
                                            programType: pt,
                                        },
                                    });
                                    if (!cutoff) {
                                        cutoff = this.cutoffRepo.create({
                                            schoolId: school.id,
                                            year: cDto.year,
                                            cutoffNV1: cDto.cutoffNV1,
                                            cutoffNV2: cDto.cutoffNV2,
                                            cutoffNV3: cDto.cutoffNV3,
                                            lowestScore: cDto.lowestScore,
                                            highestScore: cDto.highestScore,
                                            programType: pt,
                                            notes: cDto.notes,
                                            changes: cDto.changes,
                                            dataSource: cDto.dataSource || payload.sourceUrl,
                                        });
                                        await this.cutoffRepo.save(cutoff);
                                        cutoffsAdded++;
                                    }
                                    else {
                                        cutoff.cutoffNV1 = cDto.cutoffNV1;
                                        cutoff.cutoffNV2 = cDto.cutoffNV2 || cutoff.cutoffNV2;
                                        cutoff.cutoffNV3 = cDto.cutoffNV3 || cutoff.cutoffNV3;
                                        cutoff.lowestScore = cDto.lowestScore || cutoff.lowestScore;
                                        cutoff.highestScore =
                                            cDto.highestScore || cutoff.highestScore;
                                        cutoff.notes = cDto.notes || cutoff.notes;
                                        await this.cutoffRepo.save(cutoff);
                                    }
                                }
                            }
                        }
                        catch (e) {
                            errors.push(`School error ${schoolDto.name}: ${e.message}`);
                        }
                    }
                }
            }
            catch (e) {
                errors.push(`District error ${distDto.name}: ${e.message}`);
            }
        }
        const totalRows = schoolsAdded + schoolsUpdated + quotasAdded + cutoffsAdded;
        const log = this.logRepo.create({
            sourceName: payload.sourceName,
            sourceUrl: payload.sourceUrl || undefined,
            status: errors.length === 0 ? 'SUCCESS' : 'PARTIAL',
            rowsCount: totalRows,
            notes: errors.length > 0 ? errors.slice(0, 5).join('\n') : undefined,
        });
        await this.logRepo.save(log);
        return {
            schoolsAdded,
            schoolsUpdated,
            quotasAdded,
            cutoffsAdded,
            errors,
        };
    }
    async getImportHistory() {
        return this.logRepo.find({ order: { createdAt: 'DESC' }, take: 50 });
    }
};
exports.Grade10ImportService = Grade10ImportService;
exports.Grade10ImportService = Grade10ImportService = Grade10ImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(school_entity_1.Grade10School)),
    __param(1, (0, typeorm_1.InjectRepository)(district_entity_1.Grade10District)),
    __param(2, (0, typeorm_1.InjectRepository)(quota_entity_1.Grade10Quota)),
    __param(3, (0, typeorm_1.InjectRepository)(cutoff_entity_1.Grade10Cutoff)),
    __param(4, (0, typeorm_1.InjectRepository)(import_log_entity_1.Grade10ImportLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], Grade10ImportService);
//# sourceMappingURL=grade10-import.service.js.map