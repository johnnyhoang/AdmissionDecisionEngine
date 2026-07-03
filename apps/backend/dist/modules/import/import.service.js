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
var ImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const university_entity_1 = require("../database/entities/university.entity");
const campus_entity_1 = require("../database/entities/campus.entity");
const major_entity_1 = require("../database/entities/major.entity");
const program_entity_1 = require("../database/entities/program.entity");
const admission_method_entity_1 = require("../database/entities/admission-method.entity");
const admission_rule_entity_1 = require("../database/entities/admission-rule.entity");
const admission_score_entity_1 = require("../database/entities/admission-score.entity");
const data_import_entity_1 = require("../database/entities/data-import.entity");
const SUBJECT_COMBINATION_MAP = {
    A00: 'Toán, Vật Lý, Hóa Học',
    A01: 'Toán, Vật Lý, Tiếng Anh',
    A02: 'Toán, Vật Lý, Sinh Học',
    A03: 'Toán, Vật Lý, Lịch Sử',
    A04: 'Toán, Vật Lý, Địa Lý',
    A05: 'Toán, Hóa Học, Lịch Sử',
    A06: 'Toán, Hóa Học, Địa Lý',
    A07: 'Toán, Lịch Sử, Địa Lý',
    A08: 'Toán, Lịch Sử, Giáo dục công dân',
    A09: 'Toán, Địa Lý, Giáo dục công dân',
    A10: 'Toán, Vật Lý, Giáo dục quốc phòng',
    B00: 'Toán, Hóa Học, Sinh Học',
    B01: 'Toán, Sinh Học, Lịch Sử',
    B02: 'Toán, Sinh Học, Địa Lý',
    B03: 'Toán, Sinh Học, Ngữ Văn',
    B04: 'Toán, Sinh Học, Giáo dục công dân',
    B08: 'Toán, Sinh Học, Tiếng Anh',
    C00: 'Ngữ Văn, Lịch Sử, Địa Lý',
    C01: 'Ngữ Văn, Toán, Vật Lý',
    C02: 'Ngữ Văn, Toán, Hóa Học',
    C03: 'Ngữ Văn, Toán, Lịch Sử',
    C04: 'Ngữ Văn, Toán, Địa Lý',
    C05: 'Ngữ Văn, Vật Lý, Hóa Học',
    C06: 'Ngữ Văn, Toán, Sinh Học',
    C07: 'Ngữ Văn, Toán, Giáo dục công dân',
    C08: 'Ngữ Văn, Hóa Học, Sinh Học',
    C14: 'Ngữ Văn, Toán, Tiếng Anh',
    C15: 'Ngữ Văn, Toán, Khoa học xã hội',
    C19: 'Ngữ Văn, Lịch Sử, Giáo dục công dân',
    C20: 'Ngữ Văn, Địa Lý, Giáo dục công dân',
    D01: 'Ngữ Văn, Toán, Tiếng Anh',
    D07: 'Toán, Hóa Học, Tiếng Anh',
    D08: 'Toán, Sinh Học, Tiếng Anh',
    D09: 'Toán, Lịch Sử, Tiếng Anh',
    D10: 'Toán, Địa Lý, Tiếng Anh',
    D11: 'Toán, Tiếng Anh, Ngữ Văn',
    D14: 'Ngữ Văn, Lịch Sử, Tiếng Anh',
    D15: 'Ngữ Văn, Địa Lý, Tiếng Anh',
    D66: 'Ngữ Văn, Giáo dục công dân, Tiếng Anh',
    D90: 'Toán, Khoa học tự nhiên, Tiếng Anh',
    DGNL: 'Điểm thi Đánh giá Năng lực (ĐHQG)',
    HOCBA: 'Xét học bạ THPT',
    SAT: 'Điểm thi SAT quốc tế',
    IELTS: 'Chứng chỉ IELTS',
};
let ImportService = ImportService_1 = class ImportService {
    universityRepo;
    campusRepo;
    majorRepo;
    programRepo;
    methodRepo;
    ruleRepo;
    scoreRepo;
    importRepo;
    logger = new common_1.Logger(ImportService_1.name);
    constructor(universityRepo, campusRepo, majorRepo, programRepo, methodRepo, ruleRepo, scoreRepo, importRepo) {
        this.universityRepo = universityRepo;
        this.campusRepo = campusRepo;
        this.majorRepo = majorRepo;
        this.programRepo = programRepo;
        this.methodRepo = methodRepo;
        this.ruleRepo = ruleRepo;
        this.scoreRepo = scoreRepo;
        this.importRepo = importRepo;
    }
    async importData(payload) {
        const result = {
            importId: '',
            universitiesAdded: 0,
            universitiesUpdated: 0,
            programsAdded: 0,
            programsUpdated: 0,
            scoresAdded: 0,
            duplicatesSkipped: 0,
            warnings: [],
            errors: [],
        };
        await this.ensureAdmissionMethods();
        for (const uniDto of payload.universities) {
            try {
                const uni = await this.upsertUniversity(uniDto, result);
                const campusMap = {};
                if (uniDto.campuses?.length) {
                    for (const campDto of uniDto.campuses) {
                        const campus = await this.upsertCampus(campDto, uni.id);
                        campusMap[campDto.city] = campus.id;
                    }
                }
                const defaultCampusId = Object.values(campusMap)[0] || null;
                if (uniDto.programs?.length) {
                    for (const progDto of uniDto.programs) {
                        try {
                            const program = await this.upsertProgram(progDto, uni.id, defaultCampusId ?? undefined, payload.dataYear, payload.sourceUrl ?? '', result);
                            if (progDto.admissionRules?.length) {
                                for (const ruleDto of progDto.admissionRules) {
                                    try {
                                        await this.upsertAdmissionRule(ruleDto, program.id, payload.dataYear, result);
                                    }
                                    catch (e) {
                                        result.errors.push(`Rule error for ${progDto.name}: ${e.message}`);
                                    }
                                }
                            }
                        }
                        catch (e) {
                            result.errors.push(`Program error ${progDto.name}: ${e.message}`);
                        }
                    }
                }
            }
            catch (e) {
                result.errors.push(`University error ${uniDto.code}: ${e.message}`);
            }
        }
        try {
            const importLog = this.importRepo.create({
                sourceName: payload.sourceName,
                sourceUrl: payload.sourceUrl ?? undefined,
                dataYear: payload.dataYear,
                universitiesCount: result.universitiesAdded + result.universitiesUpdated,
                programsCount: result.programsAdded + result.programsUpdated,
                scoresCount: result.scoresAdded,
                duplicatesSkipped: result.duplicatesSkipped,
                status: result.errors.length === 0
                    ? 'SUCCESS'
                    : result.programsAdded > 0
                        ? 'PARTIAL'
                        : 'FAILED',
                notes: result.errors.length > 0
                    ? result.errors.slice(0, 5).join('\n')
                    : undefined,
            });
            const saved = (await this.importRepo.save(importLog));
            result.importId = saved.id;
        }
        catch (e) {
            this.logger.error('Failed to save import log', e);
        }
        return result;
    }
    async upsertUniversity(dto, result) {
        let uni = await this.universityRepo.findOne({ where: { code: dto.code } });
        if (uni) {
            uni.nameVi = dto.nameVi || uni.nameVi;
            uni.nameEn = dto.nameEn || uni.nameEn;
            uni.website = dto.website || uni.website;
            uni.description = dto.description || uni.description;
            uni.isPublic = dto.isPublic !== undefined ? dto.isPublic : uni.isPublic;
            uni.localRanking = dto.localRanking || uni.localRanking;
            uni.logoUrl = dto.logoUrl || uni.logoUrl;
            await this.universityRepo.save(uni);
            result.universitiesUpdated++;
        }
        else {
            uni = this.universityRepo.create({
                code: dto.code,
                nameVi: dto.nameVi,
                nameEn: dto.nameEn,
                website: dto.website,
                description: dto.description,
                isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
                localRanking: dto.localRanking,
                logoUrl: dto.logoUrl,
                averageTuition: 0,
            });
            await this.universityRepo.save(uni);
            result.universitiesAdded++;
        }
        return uni;
    }
    async upsertCampus(dto, universityId) {
        let campus = await this.campusRepo.findOne({
            where: { universityId, city: dto.city },
        });
        if (!campus) {
            campus = this.campusRepo.create({
                universityId,
                name: dto.name,
                address: dto.address,
                city: dto.city,
            });
            await this.campusRepo.save(campus);
        }
        else {
            campus.address = dto.address || campus.address;
            campus.name = dto.name || campus.name;
            await this.campusRepo.save(campus);
        }
        return campus;
    }
    async upsertProgram(dto, universityId, defaultCampusId, dataYear, dataSource, result) {
        const trainingType = dto.trainingType || 'DAI_TRA';
        const year = dto.dataYear || dataYear;
        const major = await this.ensureMajor(dto.majorCode, dto.name);
        let program = await this.programRepo.findOne({
            where: {
                universityId,
                majorCode: dto.majorCode,
                trainingType,
                dataYear: year,
            },
        });
        if (program) {
            program.name = dto.name || program.name;
            program.tuitionFee = dto.tuitionFee ?? program.tuitionFee;
            program.tuitionFeeMax = dto.tuitionFeeMax ?? program.tuitionFeeMax;
            program.totalQuota = dto.totalQuota ?? program.totalQuota;
            program.language = dto.language || program.language;
            program.durationYears = dto.durationYears ?? program.durationYears;
            program.dataSource = dto.dataSource || dataSource || program.dataSource;
            program.majorId = major?.id || program.majorId;
            program.campusId = defaultCampusId || program.campusId;
            await this.programRepo.save(program);
            result.programsUpdated++;
            result.duplicatesSkipped++;
        }
        else {
            program = this.programRepo.create({
                universityId,
                majorId: major?.id ?? undefined,
                campusId: defaultCampusId ?? undefined,
                majorCode: dto.majorCode,
                name: dto.name,
                trainingType,
                language: dto.language || 'Tiếng Việt',
                tuitionFee: dto.tuitionFee || 0,
                tuitionFeeMax: dto.tuitionFeeMax ?? undefined,
                durationYears: dto.durationYears || 4.0,
                totalQuota: dto.totalQuota || 0,
                dataYear: year,
                dataSource: dto.dataSource || dataSource,
            });
            await this.programRepo.save(program);
            result.programsAdded++;
        }
        if (dto.tuitionFee) {
            await this.updateUniversityAvgTuition(universityId);
        }
        return program;
    }
    async upsertAdmissionRule(dto, programId, dataYear, result) {
        const method = await this.methodRepo.findOne({
            where: { code: dto.methodCode },
        });
        if (!method) {
            result.warnings.push(`Unknown admission method: ${dto.methodCode}`);
            return;
        }
        const applyYear = dto.applyYear || dataYear;
        const combDesc = dto.combinationDescription ||
            (dto.subjectCombination
                ? SUBJECT_COMBINATION_MAP[dto.subjectCombination]
                : null) ||
            null;
        let rule = await this.ruleRepo.findOne({
            where: {
                programId,
                admissionMethodId: method.id,
                subjectCombination: dto.subjectCombination ?? undefined,
                applyYear,
            },
        });
        if (!rule) {
            rule = this.ruleRepo.create({
                programId,
                admissionMethodId: method.id,
                subjectCombination: dto.subjectCombination ?? undefined,
                combinationDescription: combDesc ?? undefined,
                formulaExpression: dto.formulaExpression ||
                    this.getDefaultFormula(dto.methodCode, dto.subjectCombination ?? ''),
                subjectWeights: dto.subjectWeights
                    ? JSON.stringify(dto.subjectWeights)
                    : undefined,
                minScoreThreshold: dto.minScoreThreshold || 0,
                quota: dto.quota || 0,
                applyYear,
            });
            await this.ruleRepo.save(rule);
        }
        else {
            rule.quota = dto.quota ?? rule.quota;
            rule.minScoreThreshold = dto.minScoreThreshold ?? rule.minScoreThreshold;
            rule.formulaExpression = dto.formulaExpression || rule.formulaExpression;
            await this.ruleRepo.save(rule);
        }
        if (dto.benchmarkScores?.length) {
            for (const scoreDto of dto.benchmarkScores) {
                let score = await this.scoreRepo.findOne({
                    where: { admissionRuleId: rule.id, year: scoreDto.year },
                });
                if (!score) {
                    score = this.scoreRepo.create({
                        admissionRuleId: rule.id,
                        year: scoreDto.year,
                        benchmarkScore: scoreDto.benchmarkScore,
                        totalAdmitted: scoreDto.totalAdmitted || 0,
                    });
                    await this.scoreRepo.save(score);
                    result.scoresAdded++;
                }
                else {
                    score.benchmarkScore = scoreDto.benchmarkScore;
                    score.totalAdmitted = scoreDto.totalAdmitted || score.totalAdmitted;
                    await this.scoreRepo.save(score);
                }
            }
        }
    }
    async ensureMajor(majorCode, programName) {
        if (!majorCode)
            return null;
        let major = await this.majorRepo.findOne({ where: { code: majorCode } });
        if (!major) {
            major = this.majorRepo.create({
                code: majorCode,
                nameVi: this.inferMajorName(majorCode, programName),
                sector: this.inferSector(majorCode),
            });
            await this.majorRepo.save(major);
        }
        return major;
    }
    async ensureAdmissionMethods() {
        const methods = [
            {
                code: 'THPT',
                name: 'Xét điểm thi tốt nghiệp THPT',
                description: 'Xét tuyển dựa trên kết quả kỳ thi tốt nghiệp THPT quốc gia',
            },
            {
                code: 'HOCBA',
                name: 'Xét học bạ THPT',
                description: 'Xét tuyển dựa trên kết quả học tập ở bậc THPT',
            },
            {
                code: 'DGNL_HCM',
                name: 'Xét điểm ĐGNL ĐHQG-HCM',
                description: 'Xét tuyển dựa trên kỳ thi Đánh giá năng lực ĐHQG TP.HCM',
            },
            {
                code: 'DGNL_HN',
                name: 'Xét điểm ĐGNL ĐHQG Hà Nội',
                description: 'Xét tuyển dựa trên kỳ thi Đánh giá năng lực ĐHQG Hà Nội',
            },
            {
                code: 'COMBINED',
                name: 'Xét tuyển kết hợp (IELTS/SAT)',
                description: 'Xét tuyển kết hợp chứng chỉ quốc tế',
            },
            {
                code: 'XDTN',
                name: 'Xét điểm thi năng khiếu',
                description: 'Xét tuyển dựa trên điểm thi năng khiếu/nghệ thuật',
            },
            {
                code: 'TUYEN_THANG',
                name: 'Tuyển thẳng',
                description: 'Tuyển thẳng thí sinh đạt giải/xuất sắc',
            },
        ];
        for (const m of methods) {
            const exists = await this.methodRepo.findOne({ where: { code: m.code } });
            if (!exists) {
                await this.methodRepo.save(this.methodRepo.create(m));
            }
        }
    }
    getDefaultFormula(methodCode, subjectCombination) {
        if (methodCode === 'DGNL_HCM' || methodCode === 'DGNL_HN')
            return 'DGNL + PriorityBonus';
        if (methodCode === 'HOCBA')
            return 'Grade10 + Grade11 + Grade12';
        if (methodCode === 'COMBINED')
            return 'Certificate + PriorityBonus';
        const comboMap = {
            A00: 'Math + Physics + Chemistry + PriorityBonus',
            A01: 'Math + Physics + English + PriorityBonus',
            B00: 'Math + Chemistry + Biology + PriorityBonus',
            D01: 'Literature + Math + English + PriorityBonus',
            D07: 'Math + Chemistry + English + PriorityBonus',
        };
        return (comboMap[subjectCombination] ||
            'Math + Physics + Chemistry + PriorityBonus');
    }
    inferMajorName(code, programName) {
        return programName
            .replace(/\s*\(.*?\)\s*/g, '')
            .replace(/chất lượng cao/gi, '')
            .replace(/tiên tiến/gi, '')
            .replace(/kỹ sư tài năng/gi, '')
            .replace(/định hướng nghiên cứu/gi, '')
            .trim();
    }
    inferSector(majorCode) {
        const code = parseInt(majorCode.substring(0, 2));
        const sectorMap = {
            74: 'Công nghệ thông tin',
            52: 'Kinh tế',
            58: 'Luật',
            72: 'Y - Dược',
            76: 'Máy tính & CNTT',
            78: 'Kỹ thuật',
            60: 'Khoa học xã hội',
            22: 'Nghệ thuật',
            71: 'Khoa học sức khỏe',
        };
        return sectorMap[code] || 'Khác';
    }
    async updateUniversityAvgTuition(universityId) {
        const programs = await this.programRepo.find({
            where: { universityId, isActive: true },
        });
        if (programs.length === 0)
            return;
        const totalFee = programs.reduce((sum, p) => sum + (Number(p.tuitionFee) || 0), 0);
        const avgFee = totalFee / programs.length;
        await this.universityRepo.update(universityId, { averageTuition: avgFee });
    }
    async getImportHistory() {
        return this.importRepo.find({ order: { createdAt: 'DESC' }, take: 50 });
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
        dir = path.join(__dirname, '..', '..', '..', '..', 'data', 'imports');
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
            .filter((f) => f.endsWith('.json'));
        const presets = [];
        for (const file of files) {
            try {
                const filePath = path.join(dataDir, file);
                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const uniCount = content.universities?.length || 0;
                let progCount = 0;
                let scoreCount = 0;
                content.universities?.forEach((u) => {
                    progCount += u.programs?.length || 0;
                    u.programs?.forEach((p) => {
                        p.admissionRules?.forEach((r) => {
                            scoreCount += r.benchmarkScores?.length || 0;
                        });
                    });
                });
                presets.push({
                    filename: file,
                    sourceName: content.sourceName,
                    sourceUrl: content.sourceUrl,
                    dataYear: content.dataYear,
                    universitiesCount: uniCount,
                    programsCount: progCount,
                    scoresCount: scoreCount,
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
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = ImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(university_entity_1.University)),
    __param(1, (0, typeorm_1.InjectRepository)(campus_entity_1.Campus)),
    __param(2, (0, typeorm_1.InjectRepository)(major_entity_1.Major)),
    __param(3, (0, typeorm_1.InjectRepository)(program_entity_1.Program)),
    __param(4, (0, typeorm_1.InjectRepository)(admission_method_entity_1.AdmissionMethod)),
    __param(5, (0, typeorm_1.InjectRepository)(admission_rule_entity_1.AdmissionRule)),
    __param(6, (0, typeorm_1.InjectRepository)(admission_score_entity_1.AdmissionScore)),
    __param(7, (0, typeorm_1.InjectRepository)(data_import_entity_1.DataImport)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ImportService);
//# sourceMappingURL=import.service.js.map