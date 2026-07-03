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
exports.Campus = void 0;
const typeorm_1 = require("typeorm");
const university_entity_1 = require("./university.entity");
const program_entity_1 = require("./program.entity");
let Campus = class Campus {
    id;
    universityId;
    name;
    address;
    city;
    university;
    programs;
    createdAt;
    updatedAt;
};
exports.Campus = Campus;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Campus.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'university_id' }),
    __metadata("design:type", String)
], Campus.prototype, "universityId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Campus.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Campus.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Campus.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => university_entity_1.University, (university) => university.campuses, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'university_id' }),
    __metadata("design:type", university_entity_1.University)
], Campus.prototype, "university", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => program_entity_1.Program, (program) => program.campus),
    __metadata("design:type", Array)
], Campus.prototype, "programs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Campus.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Campus.prototype, "updatedAt", void 0);
exports.Campus = Campus = __decorate([
    (0, typeorm_1.Entity)('ade_campuses')
], Campus);
//# sourceMappingURL=campus.entity.js.map