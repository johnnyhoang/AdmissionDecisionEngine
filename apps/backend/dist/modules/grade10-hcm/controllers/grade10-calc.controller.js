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
exports.Grade10CalcController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const grade10_calc_service_1 = require("../services/grade10-calc.service");
const calculate_dto_1 = require("../dtos/calculate.dto");
const recommendation_dto_1 = require("../dtos/recommendation.dto");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const permissions_guard_1 = require("../../auth/permissions.guard");
const require_permission_decorator_1 = require("../../auth/require-permission.decorator");
let Grade10CalcController = class Grade10CalcController {
    calcService;
    constructor(calcService) {
        this.calcService = calcService;
    }
    async getMacroConfig() {
        return this.calcService.getMacroConfig();
    }
    async updateMacroConfig(body) {
        return this.calcService.updateMacroConfig(body);
    }
    async calculate(dto) {
        const finalScore = this.calcService.calculateScore(dto);
        return { finalScore };
    }
    async getRecommendations(dto, req) {
        const user = req.user;
        const context = {
            userId: user?.id ?? null,
            userName: user?.email ?? user?.displayName ?? null,
            userAgent: req.headers['user-agent'] ?? null,
            ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
                req.socket?.remoteAddress ??
                null,
        };
        return this.calcService.getRecommendations(dto, context);
    }
    async getComboRecommendations(dto, req) {
        const user = req.user;
        const context = {
            userId: user?.id ?? null,
            userName: user?.email ?? user?.displayName ?? null,
            userAgent: req.headers['user-agent'] ?? null,
            ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
                req.socket?.remoteAddress ??
                null,
        };
        return this.calcService.getComboRecommendations(dto, context);
    }
};
exports.Grade10CalcController = Grade10CalcController;
__decorate([
    (0, common_1.Get)('recommendation/macro-config'),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'view_recommendation', 'view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Grade10CalcController.prototype, "getMacroConfig", null);
__decorate([
    (0, common_1.Post)('recommendation/macro-config'),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'manage_schools', 'edit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Grade10CalcController.prototype, "updateMacroConfig", null);
__decorate([
    (0, common_1.Post)('calculate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Calculate final admission score from subject values',
    }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'view_recommendation', 'view'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calculate_dto_1.CalculateScoreDto]),
    __metadata("design:returntype", Promise)
], Grade10CalcController.prototype, "calculate", null);
__decorate([
    (0, common_1.Post)('recommendation'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Get smart school recommendations with estimated pass probability',
    }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'view_recommendation', 'view'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recommendation_dto_1.GetRecommendationDto, Object]),
    __metadata("design:returntype", Promise)
], Grade10CalcController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Post)('recommendation/combo'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Get smart 3-NV combo recommendations',
    }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'view_recommendation', 'view'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recommendation_dto_1.GetComboRecommendationDto, Object]),
    __metadata("design:returntype", Promise)
], Grade10CalcController.prototype, "getComboRecommendations", null);
exports.Grade10CalcController = Grade10CalcController = __decorate([
    (0, swagger_1.ApiTags)('grade10-hcm-calculator'),
    (0, common_1.Controller)('api/v1/grade10-hcm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [grade10_calc_service_1.Grade10CalcService])
], Grade10CalcController);
//# sourceMappingURL=grade10-calc.controller.js.map