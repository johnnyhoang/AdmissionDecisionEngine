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
exports.Grade10CalcService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const school_entity_1 = require("../entities/school.entity");
const cutoff_entity_1 = require("../entities/cutoff.entity");
const history_entity_1 = require("../entities/history.entity");
let Grade10CalcService = class Grade10CalcService {
    schoolRepo;
    cutoffRepo;
    historyRepo;
    constructor(schoolRepo, cutoffRepo, historyRepo) {
        this.schoolRepo = schoolRepo;
        this.cutoffRepo = cutoffRepo;
        this.historyRepo = historyRepo;
    }
    calculateScore(dto) {
        return (Number(dto.math) +
            Number(dto.literature) +
            Number(dto.english) +
            Number(dto.priority || 0) +
            Number(dto.bonus || 0));
    }
    async getRecommendations(dto) {
        const totalScore = this.calculateScore({
            math: dto.math,
            literature: dto.literature,
            english: dto.english,
            priority: dto.priority,
            bonus: dto.bonus,
        });
        this.historyRepo
            .save(this.historyRepo.create({
            mathScore: dto.math,
            literatureScore: dto.literature,
            englishScore: dto.english,
            priorityScore: dto.priority || 0,
            bonusScore: dto.bonus || 0,
            totalScore,
            preferredDistrict: dto.preferredDistrict || undefined,
        }))
            .catch((err) => console.error('Failed to save search history', err));
        const latestYearObj = await this.cutoffRepo
            .createQueryBuilder('cutoff')
            .select('MAX(cutoff.year)', 'maxYear')
            .getRawOne();
        const latestYear = latestYearObj?.maxYear || 2025;
        const query = this.cutoffRepo
            .createQueryBuilder('cutoff')
            .leftJoinAndSelect('cutoff.school', 'school')
            .leftJoinAndSelect('school.district', 'district')
            .where('cutoff.year = :year', { year: latestYear })
            .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' });
        if (dto.preferredDistrict) {
            query.andWhere('school.districtId = :distId', {
                distId: dto.preferredDistrict,
            });
        }
        const cutoffs = await query.getMany();
        const schoolIds = cutoffs.map((c) => c.schoolId);
        let historicalScores = [];
        if (schoolIds.length > 0) {
            historicalScores = await this.cutoffRepo
                .createQueryBuilder('cutoff')
                .where('cutoff.schoolId IN (:...schoolIds)', { schoolIds })
                .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
                .andWhere('cutoff.year >= :year', { year: latestYear - 3 })
                .orderBy('cutoff.year', 'DESC')
                .getMany();
        }
        const results = cutoffs.map((c) => {
            const schoolHist = historicalScores.filter((h) => h.schoolId === c.schoolId);
            const cutoffVal = Number(c.cutoffNV1);
            const diff = totalScore - cutoffVal;
            let safetyCategory = 'VERY_RISKY';
            if (diff >= 2.5)
                safetyCategory = 'VERY_SAFE';
            else if (diff >= 1.0)
                safetyCategory = 'SAFE';
            else if (diff >= -1.0)
                safetyCategory = 'COMPETITIVE';
            else if (diff >= -2.0)
                safetyCategory = 'RISKY';
            const historicalNV1s = schoolHist.map((h) => Number(h.cutoffNV1));
            const avgNV1 = historicalNV1s.length > 0
                ? historicalNV1s.reduce((sum, val) => sum + val, 0) /
                    historicalNV1s.length
                : cutoffVal;
            let trend = 'STABLE';
            if (schoolHist.length >= 2) {
                const diffTrend = Number(schoolHist[0].cutoffNV1) -
                    Number(schoolHist[schoolHist.length - 1].cutoffNV1);
                if (diffTrend > 0.5)
                    trend = 'UP';
                else if (diffTrend < -0.5)
                    trend = 'DOWN';
            }
            const deltaMean = totalScore - avgNV1;
            const stdDev = 1.2;
            const z = deltaMean / stdDev;
            let probability = 50 + z * 25;
            if (probability > 99)
                probability = 99;
            if (probability < 1)
                probability = 1;
            return {
                schoolId: c.school.id,
                schoolName: c.school.name,
                schoolCode: c.school.code,
                districtName: c.school.district?.name || 'N/A',
                cutoffNV1: cutoffVal,
                cutoffNV2: c.cutoffNV2 ? Number(c.cutoffNV2) : null,
                cutoffNV3: c.cutoffNV3 ? Number(c.cutoffNV3) : null,
                diff: Number(diff.toFixed(2)),
                safetyCategory,
                trend,
                probability: Math.round(probability),
                historicalAvg: Number(avgNV1.toFixed(2)),
                last3YearsScores: schoolHist.map((h) => ({
                    year: h.year,
                    score: Number(h.cutoffNV1),
                })),
            };
        });
        results.sort((a, b) => b.diff - a.diff);
        return {
            candidateScore: totalScore,
            details: {
                math: dto.math,
                literature: dto.literature,
                english: dto.english,
                priority: dto.priority || 0,
                bonus: dto.bonus || 0,
            },
            recommendations: results,
        };
    }
};
exports.Grade10CalcService = Grade10CalcService;
exports.Grade10CalcService = Grade10CalcService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(school_entity_1.Grade10School)),
    __param(1, (0, typeorm_1.InjectRepository)(cutoff_entity_1.Grade10Cutoff)),
    __param(2, (0, typeorm_1.InjectRepository)(history_entity_1.Grade10History)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], Grade10CalcService);
//# sourceMappingURL=grade10-calc.service.js.map