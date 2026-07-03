import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { UserPermission } from '../database/entities/user-permission.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserPermission)
    private readonly permissionRepo: Repository<UserPermission>,
  ) {}

  async getOrCreateUser(payload: any): Promise<User> {
    const id = payload.sub;
    const email = payload.email;
    const name =
      payload.user_metadata?.full_name || payload.name || email.split('@')[0];
    const avatar = payload.user_metadata?.avatar_url || payload.avatar || null;

    let user = await this.userRepo.findOne({
      where: { id },
      relations: { permissions: true },
    });

    if (!user) {
      // Check if user table is empty to assign ADMIN to first user
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

      // Create default permissions for new USERs (view = true for all, edit = false)
      const defaultPermissions = [
        // Lớp 10
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
        // Đại học
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

      const permissionEntities = defaultPermissions.map((p) =>
        this.permissionRepo.create({
          userId: user!.id,
          ...p,
        }),
      );
      await this.permissionRepo.save(permissionEntities);

      // Reload user with permissions
      user = await this.userRepo.findOne({
        where: { id },
        relations: { permissions: true },
      });
    }

    return user!;
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepo.find({
      relations: { permissions: true },
      order: { email: 'ASC' },
    });
  }

  async updateRole(userId: string, role: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    user.role = role;
    return this.userRepo.save(user);
  }

  async updatePermissions(
    userId: string,
    permissionsDto: any[],
  ): Promise<void> {
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
}
