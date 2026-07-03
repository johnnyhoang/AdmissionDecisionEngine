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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEngineService = void 0;
const common_1 = require("@nestjs/common");
const formula_parser_service_1 = require("./formula-parser.service");
let RuleEngineService = class RuleEngineService {
    formulaParser;
    constructor(formulaParser) {
        this.formulaParser = formulaParser;
    }
    evaluate(profile, rule) {
        const examScores = profile.examScores ? JSON.parse(profile.examScores) : {};
        const highSchoolGrades = profile.highSchoolGrades
            ? JSON.parse(profile.highSchoolGrades)
            : {};
        const certificates = profile.certificates
            ? JSON.parse(profile.certificates)
            : {};
        const subjectWeights = rule.subjectWeights
            ? JSON.parse(rule.subjectWeights)
            : {};
        const priorityRules = rule.priorityRules
            ? JSON.parse(rule.priorityRules)
            : {};
        const context = {};
        const allSubjects = [
            'Math',
            'Physics',
            'Chemistry',
            'Biology',
            'Literature',
            'History',
            'Geography',
            'English',
            'Civics',
        ];
        for (const sub of allSubjects) {
            context[sub] = 0;
        }
        const methodCode = rule.admissionMethod?.code || '';
        if (methodCode === 'THPT') {
            const thptScores = examScores.THPT || {};
            for (const sub of Object.keys(thptScores)) {
                context[sub] = Number(thptScores[sub]) || 0;
            }
        }
        else if (methodCode === 'HOCBA') {
            const averages = highSchoolGrades.Average || {};
            for (const sub of Object.keys(averages)) {
                context[sub] = Number(averages[sub]) || 0;
            }
        }
        else if (methodCode.startsWith('DGNL')) {
            context['DGNL'] =
                Number(examScores[methodCode]) ||
                    Number(examScores.DGNL_HCM) ||
                    Number(examScores.DGNL_HN) ||
                    0;
        }
        else if (methodCode === 'VSAT') {
            context['VSAT'] = Number(examScores.VSAT) || 0;
        }
        for (const sub of Object.keys(subjectWeights)) {
            if (context[sub] !== undefined) {
                context[sub] = context[sub] * Number(subjectWeights[sub]);
            }
        }
        let regionBonus = 0;
        if (profile.region) {
            const regionPoints = {
                KV1: 0.75,
                'KV2-NT': 0.5,
                KV2: 0.25,
                KV3: 0.0,
            };
            regionBonus = regionPoints[profile.region] ?? 0;
        }
        let policyBonus = 0;
        if (profile.priorityGroup) {
            const policyPoints = {
                UT1: 2.0,
                UT2: 1.0,
            };
            policyBonus = policyPoints[profile.priorityGroup] ?? 0;
        }
        let certificateBonus = 0;
        if (certificates.IELTS) {
            const ieltsVal = Number(certificates.IELTS);
            if (ieltsVal >= 7.5 && priorityRules['IELTS_7.5_UP'])
                certificateBonus = Number(priorityRules['IELTS_7.5_UP']);
            else if (ieltsVal >= 7.0 && priorityRules['IELTS_7.0'])
                certificateBonus = Number(priorityRules['IELTS_7.0']);
            else if (ieltsVal >= 6.5 && priorityRules['IELTS_6.5'])
                certificateBonus = Number(priorityRules['IELTS_6.5']);
            else if (ieltsVal >= 6.0 && priorityRules['IELTS_6.0'])
                certificateBonus = Number(priorityRules['IELTS_6.0']);
        }
        const totalPriorityBonus = regionBonus + policyBonus + certificateBonus;
        context['PriorityBonus'] = totalPriorityBonus;
        const formula = rule.formulaExpression || 'Math + Physics + Chemistry';
        const computedScore = this.formulaParser.evaluate(formula, context);
        const threshold = Number(rule.minScoreThreshold) || 0;
        const isEligible = computedScore >= threshold;
        return {
            candidateScore: parseFloat(computedScore.toFixed(2)),
            isEligible,
            minScoreThreshold: threshold,
            breakdown: {
                rawScore: parseFloat((computedScore - totalPriorityBonus).toFixed(2)),
                priorityBonus: totalPriorityBonus,
                regionBonus,
                policyBonus,
                certificateBonus,
            },
        };
    }
};
exports.RuleEngineService = RuleEngineService;
exports.RuleEngineService = RuleEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [formula_parser_service_1.FormulaParserService])
], RuleEngineService);
//# sourceMappingURL=rule-engine.service.js.map