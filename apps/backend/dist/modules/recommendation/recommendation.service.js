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
exports.RecommendationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rule_engine_service_1 = require("../rule-engine/rule-engine.service");
const program_entity_1 = require("../database/entities/program.entity");
const admission_rule_entity_1 = require("../database/entities/admission-rule.entity");
let RecommendationService = class RecommendationService {
    programRepository;
    ruleRepository;
    ruleEngineService;
    constructor(programRepository, ruleRepository, ruleEngineService) {
        this.programRepository = programRepository;
        this.ruleRepository = ruleRepository;
        this.ruleEngineService = ruleEngineService;
    }
    async getRecommendations(profile, filters) {
        const query = this.programRepository
            .createQueryBuilder('program')
            .leftJoinAndSelect('program.university', 'university')
            .leftJoinAndSelect('program.campus', 'campus')
            .leftJoinAndSelect('program.major', 'major')
            .leftJoinAndSelect('program.admissionRules', 'rule')
            .leftJoinAndSelect('rule.admissionMethod', 'method')
            .leftJoinAndSelect('rule.admissionScores', 'score');
        if (filters?.tuitionMax) {
            query.andWhere('program.tuitionFee <= :tuitionMax', {
                tuitionMax: filters.tuitionMax,
            });
        }
        if (filters?.isPublic !== undefined) {
            query.andWhere('university.isPublic = :isPublic', {
                isPublic: filters.isPublic,
            });
        }
        if (filters?.city) {
            query.andWhere('campus.city = :city', { city: filters.city });
        }
        if (filters?.majorSector) {
            query.andWhere('major.sector = :sector', { sector: filters.majorSector });
        }
        const programs = await query.getMany();
        const recommendations = [];
        for (const program of programs) {
            for (const rule of program.admissionRules) {
                try {
                    const evalResult = this.ruleEngineService.evaluate(profile, rule);
                    if (!evalResult.isEligible) {
                        continue;
                    }
                    const scores = rule.admissionScores || [];
                    const sortedScores = [...scores].sort((a, b) => b.year - a.year);
                    const lastYearScoreRecord = sortedScores[0];
                    const lastYearBenchmark = lastYearScoreRecord
                        ? Number(lastYearScoreRecord.benchmarkScore)
                        : 0;
                    const { probability, category, explanation } = this.calculateProbability(evalResult.candidateScore, lastYearBenchmark, rule.minScoreThreshold, rule.admissionMethod?.code || '');
                    recommendations.push({
                        programId: program.id,
                        programCode: program.code,
                        programName: program.name,
                        universityCode: program.university.code,
                        universityName: program.university.nameVi,
                        campusName: program.campus.name,
                        tuitionFee: Number(program.tuitionFee),
                        language: program.language,
                        admissionMethod: rule.admissionMethod?.name || 'Xét tuyển',
                        candidateScore: evalResult.candidateScore,
                        benchmarkScoreLastYear: lastYearBenchmark,
                        minScoreThreshold: Number(rule.minScoreThreshold),
                        admissionProbability: probability,
                        probabilityCategory: category,
                        explanation,
                        breakdown: evalResult.breakdown,
                    });
                }
                catch (err) {
                    continue;
                }
            }
        }
        const categoryOrder = { SAFE: 1, MATCH: 2, REACH: 3, LOW: 4 };
        return recommendations.sort((a, b) => {
            const orderDiff = categoryOrder[a.probabilityCategory] -
                categoryOrder[b.probabilityCategory];
            if (orderDiff !== 0)
                return orderDiff;
            return b.candidateScore - a.candidateScore;
        });
    }
    calculateProbability(candidateScore, lastYearBenchmark, minThreshold, methodCode) {
        if (lastYearBenchmark === 0) {
            return {
                probability: 60,
                category: 'MATCH',
                explanation: `Điểm của bạn (${candidateScore}) đạt điểm sàn tối thiểu (${minThreshold}). Chưa có dữ liệu điểm chuẩn năm trước.`,
            };
        }
        const diff = candidateScore - lastYearBenchmark;
        let marginSafe = 1.5;
        let marginReach = -1.0;
        if (methodCode.includes('DGNL') && lastYearBenchmark > 150) {
            marginSafe = 50;
            marginReach = -40;
        }
        else if (methodCode.includes('DGNL') && lastYearBenchmark <= 150) {
            marginSafe = 10;
            marginReach = -8;
        }
        if (diff >= marginSafe) {
            const percent = Math.min(99, 95 + (diff - marginSafe) * 0.5);
            return {
                probability: parseFloat(percent.toFixed(0)),
                category: 'SAFE',
                explanation: `Khả năng trúng tuyển RẤT CAO. Điểm của bạn (${candidateScore}) vượt điểm chuẩn năm ngoái (${lastYearBenchmark}) là ${diff.toFixed(2)} điểm.`,
            };
        }
        else if (diff >= 0) {
            const ratio = diff / marginSafe;
            const percent = 75 + ratio * 20;
            return {
                probability: parseFloat(percent.toFixed(0)),
                category: 'MATCH',
                explanation: `Cơ hội trúng tuyển TỐT. Điểm của bạn (${candidateScore}) bằng hoặc cao hơn một chút so với điểm chuẩn năm ngoái (${lastYearBenchmark}).`,
            };
        }
        else if (diff >= marginReach) {
            const ratio = (diff - marginReach) / Math.abs(marginReach);
            const percent = 45 + ratio * 30;
            return {
                probability: parseFloat(percent.toFixed(0)),
                category: 'REACH',
                explanation: `Có cơ hội nhưng CẦN CÂN NHẮC. Điểm của bạn (${candidateScore}) thấp hơn điểm chuẩn năm ngoái (${lastYearBenchmark}) một chút (${Math.abs(diff).toFixed(2)} điểm).`,
            };
        }
        else {
            const percent = Math.max(5, 40 + (diff / Math.abs(marginReach)) * 10);
            return {
                probability: parseFloat(percent.toFixed(0)),
                category: 'LOW',
                explanation: `Khả năng trúng tuyển THẤP. Điểm của bạn (${candidateScore}) thấp hơn nhiều so với điểm chuẩn năm ngoái (${lastYearBenchmark}).`,
            };
        }
    }
    async optimizePreferences(profile, preferences) {
        const list = [];
        const warnings = [];
        for (const pref of preferences) {
            const program = await this.programRepository.findOne({
                where: { id: pref.programId },
                relations: {
                    university: true,
                    campus: true,
                    major: true,
                    admissionRules: {
                        admissionMethod: true,
                        admissionScores: true,
                    },
                },
            });
            if (!program)
                continue;
            const rule = program.admissionRules.find((r) => r.admissionMethod.code === pref.methodCode);
            if (!rule)
                continue;
            try {
                const evalResult = this.ruleEngineService.evaluate(profile, rule);
                const sortedScores = [...(rule.admissionScores || [])].sort((a, b) => b.year - a.year);
                const lastYearScoreRecord = sortedScores[0];
                const lastYearBenchmark = lastYearScoreRecord
                    ? Number(lastYearScoreRecord.benchmarkScore)
                    : 0;
                const { probability, category, explanation } = this.calculateProbability(evalResult.candidateScore, lastYearBenchmark, rule.minScoreThreshold, rule.admissionMethod?.code || '');
                list.push({
                    programId: program.id,
                    programCode: program.code,
                    programName: program.name,
                    universityCode: program.university.code,
                    universityName: program.university.nameVi,
                    admissionMethod: rule.admissionMethod.name,
                    admissionMethodCode: pref.methodCode,
                    candidateScore: evalResult.candidateScore,
                    benchmarkScoreLastYear: lastYearBenchmark,
                    probability,
                    probabilityCategory: category,
                    explanation,
                    currentOrder: pref.order,
                });
            }
            catch (err) {
                list.push({
                    programId: program.id,
                    programCode: program.code,
                    programName: program.name,
                    universityCode: program.university.code,
                    universityName: program.university.nameVi,
                    admissionMethod: rule.admissionMethod.name,
                    admissionMethodCode: pref.methodCode,
                    candidateScore: 0,
                    benchmarkScoreLastYear: 0,
                    probability: 0,
                    probabilityCategory: 'LOW',
                    explanation: 'Không thể tính toán điểm cho tổ hợp này.',
                    currentOrder: pref.order,
                });
            }
        }
        const sortedByCurrentOrder = [...list].sort((a, b) => a.currentOrder - b.currentOrder);
        for (let i = 0; i < sortedByCurrentOrder.length - 1; i++) {
            const current = sortedByCurrentOrder[i];
            const next = sortedByCurrentOrder[i + 1];
            if (current.probabilityCategory === 'SAFE' &&
                (next.probabilityCategory === 'MATCH' ||
                    next.probabilityCategory === 'REACH')) {
                warnings.push(`Nguyện vọng số ${current.currentOrder} (${current.programCode}) có tỷ lệ đậu Rất Cao (SAFE) nằm trên nguyện vọng số ${next.currentOrder} (${next.programCode}) có tỷ lệ đậu thấp hơn (${next.probabilityCategory === 'MATCH' ? 'Thích hợp' : 'Thử thách'}). Nếu đỗ NV ${current.currentOrder}, NV ${next.currentOrder} sẽ bị hủy.`);
            }
        }
        const hasSafeOrMatch = list.some((item) => item.probabilityCategory === 'SAFE' ||
            item.probabilityCategory === 'MATCH');
        if (list.length > 0 && !hasSafeOrMatch) {
            warnings.push('Cảnh báo: Danh sách chưa có nguyện vọng AN TOÀN (SAFE) hoặc THÍCH HỢP (MATCH). Hãy thêm ít nhất một phương án dự phòng.');
        }
        const optimizedList = [...list]
            .sort((a, b) => {
            const weights = { REACH: 1, MATCH: 2, SAFE: 3, LOW: 4 };
            const aWeight = weights[a.probabilityCategory] || 5;
            const bWeight = weights[b.probabilityCategory] || 5;
            return aWeight - bWeight;
        })
            .map((item, idx) => ({
            ...item,
            suggestedOrder: idx + 1,
        }));
        return {
            optimizedList,
            warnings,
        };
    }
};
exports.RecommendationService = RecommendationService;
exports.RecommendationService = RecommendationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(program_entity_1.Program)),
    __param(1, (0, typeorm_1.InjectRepository)(admission_rule_entity_1.AdmissionRule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        rule_engine_service_1.RuleEngineService])
], RecommendationService);
//# sourceMappingURL=recommendation.service.js.map