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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationController = exports.OptimizePreferencesDto = exports.EvaluateProfileDto = void 0;
const common_1 = require("@nestjs/common");
const recommendation_service_1 = require("./recommendation.service");
const candidate_profile_entity_1 = require("../database/entities/candidate-profile.entity");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_history_entity_1 = require("../database/entities/evaluation-history.entity");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/permissions.guard");
const require_permission_decorator_1 = require("../auth/require-permission.decorator");
class EvaluateProfileDto {
    fullName;
    province;
    region;
    priorityGroup;
    highSchoolGrades;
    examScores;
    certificates;
    careerInterests;
    tuitionMax;
    isPublic;
    city;
    majorSector;
}
exports.EvaluateProfileDto = EvaluateProfileDto;
class OptimizePreferencesDto {
    profile;
    preferences;
}
exports.OptimizePreferencesDto = OptimizePreferencesDto;
let RecommendationController = class RecommendationController {
    recommendationService;
    historyRepository;
    constructor(recommendationService, historyRepository) {
        this.recommendationService = recommendationService;
        this.historyRepository = historyRepository;
    }
    async evaluateProfile(dto) {
        const profile = new candidate_profile_entity_1.CandidateProfile();
        profile.fullName = dto.fullName || 'Thí sinh';
        profile.province = dto.province || '';
        profile.region = dto.region || 'KV3';
        profile.priorityGroup = dto.priorityGroup || '';
        profile.highSchoolGrades = dto.highSchoolGrades
            ? JSON.stringify(dto.highSchoolGrades)
            : '{}';
        profile.examScores = dto.examScores ? JSON.stringify(dto.examScores) : '{}';
        profile.certificates = dto.certificates
            ? JSON.stringify(dto.certificates)
            : '{}';
        profile.careerInterests = dto.careerInterests
            ? JSON.stringify(dto.careerInterests)
            : '[]';
        const filters = {
            tuitionMax: dto.tuitionMax,
            isPublic: dto.isPublic,
            city: dto.city,
            majorSector: dto.majorSector,
        };
        const results = await this.recommendationService.getRecommendations(profile, filters);
        try {
            const history = this.historyRepository.create({
                fullName: dto.fullName || 'Thí sinh',
                region: dto.region || 'KV3',
                priorityGroup: dto.priorityGroup || '',
                examScores: JSON.stringify(dto.examScores || {}),
                certificates: JSON.stringify(dto.certificates || {}),
                recommendedCount: results.length,
            });
            await this.historyRepository.save(history);
        }
        catch (err) {
            console.error('Failed to save evaluation log:', err);
        }
        return results;
    }
    async optimizePreferences(dto) {
        const profile = new candidate_profile_entity_1.CandidateProfile();
        profile.fullName = dto.profile.fullName || 'Thí sinh';
        profile.province = dto.profile.province || '';
        profile.region = dto.profile.region || 'KV3';
        profile.priorityGroup = dto.profile.priorityGroup || '';
        profile.highSchoolGrades = dto.profile.highSchoolGrades
            ? JSON.stringify(dto.profile.highSchoolGrades)
            : '{}';
        profile.examScores = dto.profile.examScores
            ? JSON.stringify(dto.profile.examScores)
            : '{}';
        profile.certificates = dto.profile.certificates
            ? JSON.stringify(dto.profile.certificates)
            : '{}';
        return this.recommendationService.optimizePreferences(profile, dto.preferences);
    }
};
exports.RecommendationController = RecommendationController;
__decorate([
    (0, common_1.Post)('evaluate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permission_decorator_1.RequirePermission)('UNIVERSITY', 'view_recommendation', 'view'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [EvaluateProfileDto]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "evaluateProfile", null);
__decorate([
    (0, common_1.Post)('optimize-preferences'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permission_decorator_1.RequirePermission)('UNIVERSITY', 'view_optimization', 'view'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [OptimizePreferencesDto]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "optimizePreferences", null);
exports.RecommendationController = RecommendationController = __decorate([
    (0, common_1.Controller)('api/v1/recommendations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_history_entity_1.EvaluationHistory)),
    __metadata("design:paramtypes", [recommendation_service_1.RecommendationService,
        typeorm_2.Repository])
], RecommendationController);
//# sourceMappingURL=recommendation.controller.js.map