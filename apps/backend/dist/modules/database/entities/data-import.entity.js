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
exports.DataImport = void 0;
const typeorm_1 = require("typeorm");
let DataImport = class DataImport {
    id;
    sourceName;
    sourceUrl;
    dataYear;
    universitiesCount;
    programsCount;
    scoresCount;
    duplicatesSkipped;
    status;
    notes;
    createdAt;
    updatedAt;
};
exports.DataImport = DataImport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DataImport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_name' }),
    __metadata("design:type", String)
], DataImport.prototype, "sourceName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_url', nullable: true }),
    __metadata("design:type", String)
], DataImport.prototype, "sourceUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'data_year', type: 'int' }),
    __metadata("design:type", Number)
], DataImport.prototype, "dataYear", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'universities_count', default: 0 }),
    __metadata("design:type", Number)
], DataImport.prototype, "universitiesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'programs_count', default: 0 }),
    __metadata("design:type", Number)
], DataImport.prototype, "programsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'scores_count', default: 0 }),
    __metadata("design:type", Number)
], DataImport.prototype, "scoresCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duplicates_skipped', default: 0 }),
    __metadata("design:type", Number)
], DataImport.prototype, "duplicatesSkipped", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'SUCCESS' }),
    __metadata("design:type", String)
], DataImport.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DataImport.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DataImport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], DataImport.prototype, "updatedAt", void 0);
exports.DataImport = DataImport = __decorate([
    (0, typeorm_1.Entity)('ade_data_imports')
], DataImport);
//# sourceMappingURL=data-import.entity.js.map