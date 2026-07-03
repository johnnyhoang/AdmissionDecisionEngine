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
exports.AdmissionScore = void 0;
const typeorm_1 = require("typeorm");
const admission_rule_entity_1 = require("./admission-rule.entity");
let AdmissionScore = class AdmissionScore {
    id;
    admissionRuleId;
    year;
    benchmarkScore;
    totalAdmitted;
    admissionRule;
    createdAt;
    updatedAt;
};
exports.AdmissionScore = AdmissionScore;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AdmissionScore.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'admission_rule_id' }),
    __metadata("design:type", String)
], AdmissionScore.prototype, "admissionRuleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], AdmissionScore.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'benchmark_score', type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], AdmissionScore.prototype, "benchmarkScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_admitted', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AdmissionScore.prototype, "totalAdmitted", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => admission_rule_entity_1.AdmissionRule, (rule) => rule.admissionScores, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'admission_rule_id' }),
    __metadata("design:type", admission_rule_entity_1.AdmissionRule)
], AdmissionScore.prototype, "admissionRule", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AdmissionScore.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], AdmissionScore.prototype, "updatedAt", void 0);
exports.AdmissionScore = AdmissionScore = __decorate([
    (0, typeorm_1.Entity)('ade_admission_scores')
], AdmissionScore);
//# sourceMappingURL=admission-score.entity.js.map