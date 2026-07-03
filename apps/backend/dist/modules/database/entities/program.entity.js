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
exports.Program = exports.TrainingType = void 0;
const typeorm_1 = require("typeorm");
const university_entity_1 = require("./university.entity");
const major_entity_1 = require("./major.entity");
const campus_entity_1 = require("./campus.entity");
const admission_rule_entity_1 = require("./admission-rule.entity");
var TrainingType;
(function (TrainingType) {
    TrainingType["DAI_TRA"] = "DAI_TRA";
    TrainingType["CHAT_LUONG_CAO"] = "CHAT_LUONG_CAO";
    TrainingType["TIEN_TIEN"] = "TIEN_TIEN";
    TrainingType["LIEN_KET_NUOC_NGOAI"] = "LIEN_KET_NUOC_NGOAI";
    TrainingType["POHE"] = "POHE";
    TrainingType["TAI_NANG"] = "TAI_NANG";
    TrainingType["VIET_PHAP"] = "VIET_PHAP";
})(TrainingType || (exports.TrainingType = TrainingType = {}));
let Program = class Program {
    id;
    universityId;
    majorId;
    campusId;
    majorCode;
    code;
    name;
    trainingType;
    language;
    tuitionFee;
    tuitionFeeMax;
    durationYears;
    totalQuota;
    dataYear;
    dataSource;
    isActive;
    university;
    major;
    campus;
    admissionRules;
    createdAt;
    updatedAt;
};
exports.Program = Program;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Program.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'university_id' }),
    __metadata("design:type", String)
], Program.prototype, "universityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'major_id', nullable: true }),
    __metadata("design:type", String)
], Program.prototype, "majorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campus_id', nullable: true }),
    __metadata("design:type", String)
], Program.prototype, "campusId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'major_code', nullable: true }),
    __metadata("design:type", String)
], Program.prototype, "majorCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Program.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Program.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'training_type',
        type: 'varchar',
        default: TrainingType.DAI_TRA,
    }),
    __metadata("design:type", String)
], Program.prototype, "trainingType", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'Tiếng Việt' }),
    __metadata("design:type", String)
], Program.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'tuition_fee',
        type: 'decimal',
        precision: 15,
        scale: 2,
        default: 0,
        comment: 'Học phí VNĐ/năm',
    }),
    __metadata("design:type", Number)
], Program.prototype, "tuitionFee", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'tuition_fee_max',
        type: 'decimal',
        precision: 15,
        scale: 2,
        nullable: true,
        comment: 'Học phí tối đa (nếu theo tín chỉ)',
    }),
    __metadata("design:type", Number)
], Program.prototype, "tuitionFeeMax", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'duration_years',
        type: 'decimal',
        precision: 3,
        scale: 1,
        default: 4.0,
    }),
    __metadata("design:type", Number)
], Program.prototype, "durationYears", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'total_quota',
        type: 'int',
        default: 0,
        comment: 'Tổng chỉ tiêu tuyển sinh',
    }),
    __metadata("design:type", Number)
], Program.prototype, "totalQuota", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'data_year', type: 'int', default: 2025 }),
    __metadata("design:type", Number)
], Program.prototype, "dataYear", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'data_source', nullable: true }),
    __metadata("design:type", String)
], Program.prototype, "dataSource", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Program.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => university_entity_1.University, (university) => university.programs, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'university_id' }),
    __metadata("design:type", university_entity_1.University)
], Program.prototype, "university", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => major_entity_1.Major, (major) => major.programs, {
        onDelete: 'SET NULL',
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'major_id' }),
    __metadata("design:type", major_entity_1.Major)
], Program.prototype, "major", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => campus_entity_1.Campus, (campus) => campus.programs, {
        onDelete: 'SET NULL',
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'campus_id' }),
    __metadata("design:type", campus_entity_1.Campus)
], Program.prototype, "campus", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => admission_rule_entity_1.AdmissionRule, (rule) => rule.program),
    __metadata("design:type", Array)
], Program.prototype, "admissionRules", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Program.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Program.prototype, "updatedAt", void 0);
exports.Program = Program = __decorate([
    (0, typeorm_1.Entity)('ade_programs')
], Program);
//# sourceMappingURL=program.entity.js.map