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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../database/entities/user.entity");
const user_permission_entity_1 = require("../database/entities/user-permission.entity");
let AuthService = class AuthService {
    userRepo;
    permissionRepo;
    constructor(userRepo, permissionRepo) {
        this.userRepo = userRepo;
        this.permissionRepo = permissionRepo;
    }
    async getOrCreateUser(payload) {
        const id = payload.sub;
        const email = payload.email;
        const name = payload.user_metadata?.full_name || payload.name || email.split('@')[0];
        const avatar = payload.user_metadata?.avatar_url || payload.avatar || null;
        let user = await this.userRepo.findOne({
            where: { id },
            relations: { permissions: true },
        });
        if (!user) {
            const count = await this.userRepo.count();
            const role = count === 0 ? 'ADMIN' : 'USER';
            user = this.userRepo.create({
                id,
                email,
                name,
                avatar,
                role,
            });
            user = await this.userRepo.save(user);
            const defaultPermissions = [
                {
                    module: 'GRADE10',
                    functionKey: 'view_dashboard',
                    canView: true,
                    canEdit: false,
                },
                {
                    module: 'GRADE10',
                    functionKey: 'view_recommendation',
                    canView: true,
                    canEdit: false,
                },
                {
                    module: 'GRADE10',
                    functionKey: 'edit_data',
                    canView: false,
                    canEdit: false,
                },
                {
                    module: 'UNIVERSITY',
                    functionKey: 'view_universities',
                    canView: true,
                    canEdit: false,
                },
                {
                    module: 'UNIVERSITY',
                    functionKey: 'view_recommendation',
                    canView: true,
                    canEdit: false,
                },
                {
                    module: 'UNIVERSITY',
                    functionKey: 'view_optimization',
                    canView: true,
                    canEdit: false,
                },
                {
                    module: 'UNIVERSITY',
                    functionKey: 'edit_data',
                    canView: false,
                    canEdit: false,
                },
            ];
            const permissionEntities = defaultPermissions.map((p) => this.permissionRepo.create({
                userId: user.id,
                ...p,
            }));
            await this.permissionRepo.save(permissionEntities);
            user = await this.userRepo.findOne({
                where: { id },
                relations: { permissions: true },
            });
        }
        return user;
    }
    async getAllUsers() {
        return this.userRepo.find({
            relations: { permissions: true },
            order: { email: 'ASC' },
        });
    }
    async updateRole(userId, role) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new Error('User not found');
        user.role = role;
        return this.userRepo.save(user);
    }
    async updatePermissions(userId, permissionsDto) {
        for (const item of permissionsDto) {
            let perm = await this.permissionRepo.findOne({
                where: { userId, module: item.module, functionKey: item.functionKey },
            });
            if (!perm) {
                perm = this.permissionRepo.create({
                    userId,
                    module: item.module,
                    functionKey: item.functionKey,
                });
            }
            perm.canView = !!item.canView;
            perm.canEdit = !!item.canEdit;
            await this.permissionRepo.save(perm);
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_permission_entity_1.UserPermission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map