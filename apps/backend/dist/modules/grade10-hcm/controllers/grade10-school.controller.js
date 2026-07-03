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
exports.Grade10SchoolController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const grade10_school_service_1 = require("../services/grade10-school.service");
const school_crud_dto_1 = require("../dtos/school-crud.dto");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const permissions_guard_1 = require("../../auth/permissions.guard");
const require_permission_decorator_1 = require("../../auth/require-permission.decorator");
let Grade10SchoolController = class Grade10SchoolController {
    schoolService;
    constructor(schoolService) {
        this.schoolService = schoolService;
    }
    async getSchools(search, districtId, page, limit) {
        return this.schoolService.findAll({ search, districtId, page, limit });
    }
    async getDistricts() {
        return this.schoolService.getDistricts();
    }
    async getSchoolNames(q) {
        return this.schoolService.getSchoolNames(q);
    }
    async getAnalytics() {
        return this.schoolService.getAnalytics();
    }
    async getAdminStats() {
        return this.schoolService.getAdminStats();
    }
    async seedAllSchools() {
        return this.schoolService.seedAllSchools();
    }
    async getSchoolDetailByCode(code) {
        return this.schoolService.findByCode(code);
    }
    async getSchoolDetail(id) {
        return this.schoolService.findOne(id);
    }
    async createSchool(dto) {
        return this.schoolService.createSchool(dto);
    }
    async updateSchool(id, dto) {
        return this.schoolService.updateSchool(id, dto);
    }
    async deleteSchool(id) {
        await this.schoolService.deleteSchool(id);
    }
};
exports.Grade10SchoolController = Grade10SchoolController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search and filter public high schools in HCMC' }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'view_dashboard', 'view'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('districtId')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], Grade10SchoolController.prototype, "getSchools", null);
__decorate([
    (0, common_1.Get)('districts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of HCMC districts' }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'view_dashboard', 'view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Grade10SchoolController.prototype, "getDistricts", null);
__decorate([
    (0, common_1.Get)('names'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get school names for autocomplete suggestions (q= optional filter)',
    }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'view_dashboard', 'view'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], Grade10SchoolController.prototype, "getSchoolNames", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get historical cutoff trend and top competitive schools charts',
    }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'view_dashboard', 'view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Grade10SchoolController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('admin-stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get administrative entity counts' }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'view_dashboard', 'view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Grade10SchoolController.prototype, "getAdminStats", null);
__decorate([
    (0, common_1.Post)('seed-all'),
    (0, swagger_1.ApiOperation)({
        summary: 'Seed all public THPT schools in HCMC from master JSON list',
    }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'edit_data', 'edit'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Grade10SchoolController.prototype, "seedAllSchools", null);
__decorate([
    (0, common_1.Get)('code/:code'),
    (0, swagger_1.ApiOperation)({ summary: 'Get school detail by school code (e.g. BTX, LQD)' }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'view_dashboard', 'view'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], Grade10SchoolController.prototype, "getSchoolDetailByCode", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get details, cutoff history, and quotas of a high school',
    }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'view_dashboard', 'view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], Grade10SchoolController.prototype, "getSchoolDetail", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new high school' }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'edit_data', 'edit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [school_crud_dto_1.CreateSchoolDto]),
    __metadata("design:returntype", Promise)
], Grade10SchoolController.prototype, "createSchool", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update high school profile' }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'edit_data', 'edit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, school_crud_dto_1.UpdateSchoolDto]),
    __metadata("design:returntype", Promise)
], Grade10SchoolController.prototype, "updateSchool", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete high school' }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'edit_data', 'edit'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], Grade10SchoolController.prototype, "deleteSchool", null);
exports.Grade10SchoolController = Grade10SchoolController = __decorate([
    (0, swagger_1.ApiTags)('grade10-hcm-schools'),
    (0, common_1.Controller)('api/v1/grade10-hcm/schools'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [grade10_school_service_1.Grade10SchoolService])
], Grade10SchoolController);
//# sourceMappingURL=grade10-school.controller.js.map