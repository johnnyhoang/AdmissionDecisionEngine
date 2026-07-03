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
exports.Grade10AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const grade10_import_service_1 = require("../services/grade10-import.service");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const permissions_guard_1 = require("../../auth/permissions.guard");
const require_permission_decorator_1 = require("../../auth/require-permission.decorator");
let Grade10AdminController = class Grade10AdminController {
    importService;
    constructor(importService) {
        this.importService = importService;
    }
    async getPresets() {
        return this.importService.getPresets();
    }
    async runPreset(filename) {
        return this.importService.runPreset(filename);
    }
    async getHistory() {
        return this.importService.getImportHistory();
    }
    async importData(payload) {
        return this.importService.importData(payload);
    }
};
exports.Grade10AdminController = Grade10AdminController;
__decorate([
    (0, common_1.Get)('presets'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of available Grade 10 presets' }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'edit_data', 'view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Grade10AdminController.prototype, "getPresets", null);
__decorate([
    (0, common_1.Post)('presets/:filename/run'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Run synchronization for a preset file' }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'edit_data', 'edit'),
    __param(0, (0, common_1.Param)('filename')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], Grade10AdminController.prototype, "runPreset", null);
__decorate([
    (0, common_1.Get)('imports/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of past imports' }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'edit_data', 'view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Grade10AdminController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload custom JSON payload to import schools/scores directly',
    }),
    (0, require_permission_decorator_1.RequirePermission)('GRADE10', 'edit_data', 'edit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Grade10AdminController.prototype, "importData", null);
exports.Grade10AdminController = Grade10AdminController = __decorate([
    (0, swagger_1.ApiTags)('grade10-hcm-admin'),
    (0, common_1.Controller)('api/v1/grade10-hcm/admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [grade10_import_service_1.Grade10ImportService])
], Grade10AdminController);
//# sourceMappingURL=grade10-admin.controller.js.map