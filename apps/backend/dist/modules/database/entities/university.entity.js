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
exports.University = void 0;
const typeorm_1 = require("typeorm");
const campus_entity_1 = require("./campus.entity");
const program_entity_1 = require("./program.entity");
let University = class University {
    id;
    code;
    nameVi;
    nameEn;
    logoUrl;
    description;
    website;
    globalRanking;
    localRanking;
    averageTuition;
    isPublic;
    campuses;
    programs;
    createdAt;
    updatedAt;
};
exports.University = University;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], University.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], University.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name_vi' }),
    __metadata("design:type", String)
], University.prototype, "nameVi", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name_en', nullable: true }),
    __metadata("design:type", String)
], University.prototype, "nameEn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'logo_url', nullable: true }),
    __metadata("design:type", String)
], University.prototype, "logoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], University.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], University.prototype, "website", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'global_ranking', nullable: true }),
    __metadata("design:type", Number)
], University.prototype, "globalRanking", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'local_ranking', nullable: true }),
    __metadata("design:type", Number)
], University.prototype, "localRanking", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'average_tuition',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], University.prototype, "averageTuition", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_public', default: true }),
    __metadata("design:type", Boolean)
], University.prototype, "isPublic", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => campus_entity_1.Campus, (campus) => campus.university),
    __metadata("design:type", Array)
], University.prototype, "campuses", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => program_entity_1.Program, (program) => program.university),
    __metadata("design:type", Array)
], University.prototype, "programs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], University.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], University.prototype, "updatedAt", void 0);
exports.University = University = __decorate([
    (0, typeorm_1.Entity)('ade_universities')
], University);
//# sourceMappingURL=university.entity.js.map