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
exports.Grade10Quota = void 0;
const typeorm_1 = require("typeorm");
const school_entity_1 = require("./school.entity");
let Grade10Quota = class Grade10Quota {
    id;
    schoolId;
    school;
    year;
    quota;
    registeredCount;
    competitionRatio;
    programType;
    createdAt;
};
exports.Grade10Quota = Grade10Quota;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Grade10Quota.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'school_id' }),
    __metadata("design:type", String)
], Grade10Quota.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => school_entity_1.Grade10School, (school) => school.quotas, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", school_entity_1.Grade10School)
], Grade10Quota.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Grade10Quota.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Grade10Quota.prototype, "quota", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'registered_count', default: 0, nullable: true }),
    __metadata("design:type", Number)
], Grade10Quota.prototype, "registeredCount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'competition_ratio',
        type: 'decimal',
        precision: 8,
        scale: 2,
        default: 0.0,
        nullable: true,
    }),
    __metadata("design:type", Number)
], Grade10Quota.prototype, "competitionRatio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'program_type', default: 'REGULAR' }),
    __metadata("design:type", String)
], Grade10Quota.prototype, "programType", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Grade10Quota.prototype, "createdAt", void 0);
exports.Grade10Quota = Grade10Quota = __decorate([
    (0, typeorm_1.Entity)('G10HCM_QUOTA'),
    (0, typeorm_1.Unique)(['schoolId', 'year', 'programType'])
], Grade10Quota);
//# sourceMappingURL=quota.entity.js.map