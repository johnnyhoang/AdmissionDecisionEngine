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
exports.Grade10ImportLog = void 0;
const typeorm_1 = require("typeorm");
let Grade10ImportLog = class Grade10ImportLog {
    id;
    sourceName;
    sourceUrl;
    status;
    rowsCount;
    notes;
    createdAt;
};
exports.Grade10ImportLog = Grade10ImportLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Grade10ImportLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_name' }),
    __metadata("design:type", String)
], Grade10ImportLog.prototype, "sourceName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Grade10ImportLog.prototype, "sourceUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'SUCCESS' }),
    __metadata("design:type", String)
], Grade10ImportLog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rows_count', default: 0 }),
    __metadata("design:type", Number)
], Grade10ImportLog.prototype, "rowsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Grade10ImportLog.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Grade10ImportLog.prototype, "createdAt", void 0);
exports.Grade10ImportLog = Grade10ImportLog = __decorate([
    (0, typeorm_1.Entity)('G10HCM_IMPORT_LOG')
], Grade10ImportLog);
//# sourceMappingURL=import-log.entity.js.map