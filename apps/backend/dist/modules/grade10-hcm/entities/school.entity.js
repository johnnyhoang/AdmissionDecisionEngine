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
exports.Grade10School = void 0;
const typeorm_1 = require("typeorm");
const district_entity_1 = require("./district.entity");
const quota_entity_1 = require("./quota.entity");
const cutoff_entity_1 = require("./cutoff.entity");
let Grade10School = class Grade10School {
    id;
    name;
    code;
    districtId;
    district;
    address;
    website;
    description;
    mapUrl;
    schoolType;
    isActive;
    isVerified;
    latitude;
    longitude;
    quotas;
    cutoffs;
    createdAt;
    updatedAt;
};
exports.Grade10School = Grade10School;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Grade10School.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Grade10School.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Grade10School.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'district_id', nullable: true }),
    __metadata("design:type", String)
], Grade10School.prototype, "districtId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => district_entity_1.Grade10District, (district) => district.schools, {
        onDelete: 'SET NULL',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'district_id' }),
    __metadata("design:type", district_entity_1.Grade10District)
], Grade10School.prototype, "district", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Grade10School.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Grade10School.prototype, "website", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Grade10School.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'map_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Grade10School.prototype, "mapUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'school_type', default: 'REGULAR' }),
    __metadata("design:type", String)
], Grade10School.prototype, "schoolType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Grade10School.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_verified', default: false }),
    __metadata("design:type", Boolean)
], Grade10School.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'latitude', type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Grade10School.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'longitude', type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Grade10School.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => quota_entity_1.Grade10Quota, (quota) => quota.school),
    __metadata("design:type", Array)
], Grade10School.prototype, "quotas", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => cutoff_entity_1.Grade10Cutoff, (cutoff) => cutoff.school),
    __metadata("design:type", Array)
], Grade10School.prototype, "cutoffs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Grade10School.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Grade10School.prototype, "updatedAt", void 0);
exports.Grade10School = Grade10School = __decorate([
    (0, typeorm_1.Entity)('G10HCM_SCHOOL')
], Grade10School);
//# sourceMappingURL=school.entity.js.map