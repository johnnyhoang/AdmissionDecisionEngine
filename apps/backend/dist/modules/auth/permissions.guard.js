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
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const require_permission_decorator_1 = require("./require-permission.decorator");
let PermissionsGuard = class PermissionsGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requirement = this.reflector.getAllAndOverride(require_permission_decorator_1.REQUIRE_PERMISSION_KEY, [context.getHandler(), context.getClass()]);
        if (!requirement) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Chưa được định danh');
        }
        if (user.role === 'ADMIN') {
            return true;
        }
        const permissions = user.permissions || [];
        const matchedPerm = permissions.find((p) => p.module === requirement.module &&
            p.functionKey === requirement.functionKey);
        if (!matchedPerm) {
            throw new common_1.ForbiddenException(`Không có quyền truy cập chức năng ${requirement.functionKey}`);
        }
        if (requirement.type === 'view' && !matchedPerm.canView) {
            throw new common_1.ForbiddenException(`Yêu cầu quyền VIEW cho chức năng ${requirement.functionKey}`);
        }
        if (requirement.type === 'edit' && !matchedPerm.canEdit) {
            throw new common_1.ForbiddenException(`Yêu cầu quyền EDIT cho chức năng ${requirement.functionKey}`);
        }
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map