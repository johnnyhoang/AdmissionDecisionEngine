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
exports.UniversityController = void 0;
const common_1 = require("@nestjs/common");
const university_service_1 = require("./university.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/permissions.guard");
const require_permission_decorator_1 = require("../auth/require-permission.decorator");
let UniversityController = class UniversityController {
    universityService;
    constructor(universityService) {
        this.universityService = universityService;
    }
    async getUniversities(search, city, isPublic, page, limit) {
        const isPublicBool = isPublic !== undefined ? isPublic === 'true' : undefined;
        return this.universityService.findAll({
            search,
            city,
            isPublic: isPublicBool,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
        });
    }
    async getUniversityById(id) {
        return this.universityService.findOne(id);
    }
    async getMajors(search, sector) {
        return this.universityService.findMajors(search, sector);
    }
    async getMajorAnalytics(code) {
        return this.universityService.getMajorAnalytics(code);
    }
    async seedMethods() {
        await this.universityService.seedAdmissionMethodsIfMissing();
        return { message: 'Admission methods seeded (safe - no data deleted).' };
    }
    async getStats() {
        return this.universityService.getStats();
    }
    async getHistories() {
        return this.universityService.getEvaluationHistory();
    }
};
exports.UniversityController = UniversityController;
__decorate([
    (0, common_1.Get)('universities'),
    (0, require_permission_decorator_1.RequirePermission)('UNIVERSITY', 'view_universities', 'view'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('city')),
    __param(2, (0, common_1.Query)('isPublic')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UniversityController.prototype, "getUniversities", null);
__decorate([
    (0, common_1.Get)('universities/:id'),
    (0, require_permission_decorator_1.RequirePermission)('UNIVERSITY', 'view_universities', 'view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UniversityController.prototype, "getUniversityById", null);
__decorate([
    (0, common_1.Get)('majors'),
    (0, require_permission_decorator_1.RequirePermission)('UNIVERSITY', 'view_universities', 'view'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('sector')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UniversityController.prototype, "getMajors", null);
__decorate([
    (0, common_1.Get)('majors/:code/analytics'),
    (0, require_permission_decorator_1.RequirePermission)('UNIVERSITY', 'view_universities', 'view'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UniversityController.prototype, "getMajorAnalytics", null);
__decorate([
    (0, common_1.Post)('admin/seed-methods'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permission_decorator_1.RequirePermission)('UNIVERSITY', 'edit_data', 'edit'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UniversityController.prototype, "seedMethods", null);
__decorate([
    (0, common_1.Get)('admin/stats'),
    (0, require_permission_decorator_1.RequirePermission)('UNIVERSITY', 'edit_data', 'view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UniversityController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('admin/histories'),
    (0, require_permission_decorator_1.RequirePermission)('UNIVERSITY', 'edit_data', 'view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UniversityController.prototype, "getHistories", null);
exports.UniversityController = UniversityController = __decorate([
    (0, common_1.Controller)('api/v1'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [university_service_1.UniversityService])
], UniversityController);
//# sourceMappingURL=university.controller.js.map