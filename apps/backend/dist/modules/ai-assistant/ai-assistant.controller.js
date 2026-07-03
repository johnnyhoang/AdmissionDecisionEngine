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
exports.AiAssistantController = exports.ImportCutoffsDto = exports.SearchCutoffsDto = exports.ChatMessageDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const ai_assistant_service_1 = require("./ai-assistant.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const admin_role_guard_1 = require("../auth/admin-role.guard");
class ChatMessageDto {
    message;
}
exports.ChatMessageDto = ChatMessageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ChatMessageDto.prototype, "message", void 0);
class SearchCutoffsDto {
    type;
    schoolQuery;
    majorQuery;
    schoolCode;
    districtName;
    districtCode;
}
exports.SearchCutoffsDto = SearchCutoffsDto;
__decorate([
    (0, class_validator_1.IsEnum)(['GRADE10', 'UNIVERSITY']),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SearchCutoffsDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SearchCutoffsDto.prototype, "schoolQuery", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchCutoffsDto.prototype, "majorQuery", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchCutoffsDto.prototype, "schoolCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchCutoffsDto.prototype, "districtName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchCutoffsDto.prototype, "districtCode", void 0);
class ImportCutoffsDto {
    type;
    schoolCode;
    majorCode;
    districtName;
    overrides;
    address;
    website;
    description;
    mapUrl;
}
exports.ImportCutoffsDto = ImportCutoffsDto;
__decorate([
    (0, class_validator_1.IsEnum)(['GRADE10', 'UNIVERSITY']),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ImportCutoffsDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ImportCutoffsDto.prototype, "schoolCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportCutoffsDto.prototype, "majorCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportCutoffsDto.prototype, "districtName", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], ImportCutoffsDto.prototype, "overrides", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportCutoffsDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportCutoffsDto.prototype, "website", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportCutoffsDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportCutoffsDto.prototype, "mapUrl", void 0);
let AiAssistantController = class AiAssistantController {
    aiAssistantService;
    constructor(aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }
    async chat(dto) {
        return this.aiAssistantService.chat(dto.message);
    }
    async searchCutoffs(dto) {
        return this.aiAssistantService.searchCutoffs(dto);
    }
    async importCutoffs(dto) {
        return this.aiAssistantService.importCutoffs(dto);
    }
};
exports.AiAssistantController = AiAssistantController;
__decorate([
    (0, common_1.Post)('chat'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ChatMessageDto]),
    __metadata("design:returntype", Promise)
], AiAssistantController.prototype, "chat", null);
__decorate([
    (0, common_1.Post)('search-cutoffs'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_role_guard_1.AdminRoleGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SearchCutoffsDto]),
    __metadata("design:returntype", Promise)
], AiAssistantController.prototype, "searchCutoffs", null);
__decorate([
    (0, common_1.Post)('import-cutoffs'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_role_guard_1.AdminRoleGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ImportCutoffsDto]),
    __metadata("design:returntype", Promise)
], AiAssistantController.prototype, "importCutoffs", null);
exports.AiAssistantController = AiAssistantController = __decorate([
    (0, common_1.Controller)('api/v1/ai'),
    __metadata("design:paramtypes", [ai_assistant_service_1.AiAssistantService])
], AiAssistantController);
//# sourceMappingURL=ai-assistant.controller.js.map