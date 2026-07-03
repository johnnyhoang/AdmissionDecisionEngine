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
exports.Grade10Cutoff = void 0;
const typeorm_1 = require("typeorm");
const school_entity_1 = require("./school.entity");
let Grade10Cutoff = class Grade10Cutoff {
    id;
    schoolId;
    school;
    year;
    cutoffNV1;
    cutoffNV2;
    cutoffNV3;
    lowestScore;
    highestScore;
    programType;
    notes;
    changes;
    dataSource;
    createdAt;
};
exports.Grade10Cutoff = Grade10Cutoff;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Grade10Cutoff.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'school_id' }),
    __metadata("design:type", String)
], Grade10Cutoff.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => school_entity_1.Grade10School, (school) => school.cutoffs, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", school_entity_1.Grade10School)
], Grade10Cutoff.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Grade10Cutoff.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cutoff_nv1', type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], Grade10Cutoff.prototype, "cutoffNV1", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'cutoff_nv2',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Grade10Cutoff.prototype, "cutoffNV2", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'cutoff_nv3',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Grade10Cutoff.prototype, "cutoffNV3", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'lowest_score',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], Grade10Cutoff.prototype, "lowestScore", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'highest_score',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], Grade10Cutoff.prototype, "highestScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'program_type', default: 'REGULAR' }),
    __metadata("design:type", String)
], Grade10Cutoff.prototype, "programType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Grade10Cutoff.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Grade10Cutoff.prototype, "changes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'data_source', nullable: true }),
    __metadata("design:type", String)
], Grade10Cutoff.prototype, "dataSource", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Grade10Cutoff.prototype, "createdAt", void 0);
exports.Grade10Cutoff = Grade10Cutoff = __decorate([
    (0, typeorm_1.Entity)('G10HCM_CUTOFF_SCORE'),
    (0, typeorm_1.Unique)(['schoolId', 'year', 'programType'])
], Grade10Cutoff);
//# sourceMappingURL=cutoff.entity.js.map