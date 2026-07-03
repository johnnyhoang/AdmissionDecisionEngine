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
exports.EvaluationHistory = void 0;
const typeorm_1 = require("typeorm");
let EvaluationHistory = class EvaluationHistory {
    id;
    fullName;
    region;
    priorityGroup;
    examScores;
    certificates;
    recommendedCount;
    createdAt;
};
exports.EvaluationHistory = EvaluationHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EvaluationHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'full_name' }),
    __metadata("design:type", String)
], EvaluationHistory.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EvaluationHistory.prototype, "region", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'priority_group', nullable: true }),
    __metadata("design:type", String)
], EvaluationHistory.prototype, "priorityGroup", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exam_scores', type: 'text', nullable: true }),
    __metadata("design:type", String)
], EvaluationHistory.prototype, "examScores", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EvaluationHistory.prototype, "certificates", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recommended_count', default: 0 }),
    __metadata("design:type", Number)
], EvaluationHistory.prototype, "recommendedCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], EvaluationHistory.prototype, "createdAt", void 0);
exports.EvaluationHistory = EvaluationHistory = __decorate([
    (0, typeorm_1.Entity)('ade_evaluation_history')
], EvaluationHistory);
//# sourceMappingURL=evaluation-history.entity.js.map