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
exports.AdmissionRule = void 0;
const typeorm_1 = require("typeorm");
const program_entity_1 = require("./program.entity");
const admission_method_entity_1 = require("./admission-method.entity");
const admission_score_entity_1 = require("./admission-score.entity");
let AdmissionRule = class AdmissionRule {
    id;
    programId;
    admissionMethodId;
    subjectCombination;
    combinationDescription;
    formulaExpression;
    subjectWeights;
    minScoreThreshold;
    priorityRules;
    quota;
    applyYear;
    program;
    admissionMethod;
    admissionScores;
    createdAt;
    updatedAt;
};
exports.AdmissionRule = AdmissionRule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AdmissionRule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'program_id' }),
    __metadata("design:type", String)
], AdmissionRule.prototype, "programId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'admission_method_id' }),
    __metadata("design:type", String)
], AdmissionRule.prototype, "admissionMethodId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'subject_combination',
        nullable: true,
        comment: 'Mã tổ hợp môn: A00, A01, B00, D01...',
    }),
    __metadata("design:type", String)
], AdmissionRule.prototype, "subjectCombination", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'combination_description', nullable: true }),
    __metadata("design:type", String)
], AdmissionRule.prototype, "combinationDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'formula_expression', default: 'Math + Physics + Chemistry' }),
    __metadata("design:type", String)
], AdmissionRule.prototype, "formulaExpression", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'subject_weights', type: 'text', nullable: true }),
    __metadata("design:type", String)
], AdmissionRule.prototype, "subjectWeights", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'min_score_threshold',
        type: 'decimal',
        precision: 6,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], AdmissionRule.prototype, "minScoreThreshold", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'priority_rules', type: 'text', nullable: true }),
    __metadata("design:type", String)
], AdmissionRule.prototype, "priorityRules", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], AdmissionRule.prototype, "quota", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'apply_year', type: 'int', default: 2025 }),
    __metadata("design:type", Number)
], AdmissionRule.prototype, "applyYear", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => program_entity_1.Program, (program) => program.admissionRules, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'program_id' }),
    __metadata("design:type", program_entity_1.Program)
], AdmissionRule.prototype, "program", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => admission_method_entity_1.AdmissionMethod, (method) => method.admissionRules, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'admission_method_id' }),
    __metadata("design:type", admission_method_entity_1.AdmissionMethod)
], AdmissionRule.prototype, "admissionMethod", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => admission_score_entity_1.AdmissionScore, (score) => score.admissionRule),
    __metadata("design:type", Array)
], AdmissionRule.prototype, "admissionScores", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AdmissionRule.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], AdmissionRule.prototype, "updatedAt", void 0);
exports.AdmissionRule = AdmissionRule = __decorate([
    (0, typeorm_1.Entity)('ade_admission_rules')
], AdmissionRule);
//# sourceMappingURL=admission-rule.entity.js.map