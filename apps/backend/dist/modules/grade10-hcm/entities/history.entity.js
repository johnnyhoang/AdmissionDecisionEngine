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
exports.Grade10History = void 0;
const typeorm_1 = require("typeorm");
let Grade10History = class Grade10History {
    id;
    mathScore;
    literatureScore;
    englishScore;
    priorityScore;
    bonusScore;
    totalScore;
    preferredDistrict;
    createdAt;
};
exports.Grade10History = Grade10History;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Grade10History.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'math_score', type: 'decimal', precision: 4, scale: 2 }),
    __metadata("design:type", Number)
], Grade10History.prototype, "mathScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'literature_score', type: 'decimal', precision: 4, scale: 2 }),
    __metadata("design:type", Number)
], Grade10History.prototype, "literatureScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'english_score', type: 'decimal', precision: 4, scale: 2 }),
    __metadata("design:type", Number)
], Grade10History.prototype, "englishScore", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'priority_score',
        type: 'decimal',
        precision: 4,
        scale: 2,
        default: 0.0,
    }),
    __metadata("design:type", Number)
], Grade10History.prototype, "priorityScore", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'bonus_score',
        type: 'decimal',
        precision: 4,
        scale: 2,
        default: 0.0,
    }),
    __metadata("design:type", Number)
], Grade10History.prototype, "bonusScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_score', type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], Grade10History.prototype, "totalScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'preferred_district', nullable: true }),
    __metadata("design:type", String)
], Grade10History.prototype, "preferredDistrict", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Grade10History.prototype, "createdAt", void 0);
exports.Grade10History = Grade10History = __decorate([
    (0, typeorm_1.Entity)('G10HCM_USER_SEARCH_HISTORY')
], Grade10History);
//# sourceMappingURL=history.entity.js.map