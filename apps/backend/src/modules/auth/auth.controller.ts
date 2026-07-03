import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminRoleGuard } from './admin-role.guard';
import { CurrentUser } from './current-user.decorator';
import { AuthService } from './auth.service';
import { User } from '../database/entities/user.entity';

@Controller('api/v1')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('auth/profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Get('admin/users')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async getUsers() {
    return this.authService.getAllUsers();
  }

  @Put('admin/users/:id/role')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async updateRole(@Param('id') userId: string, @Body('role') role: string) {
    return this.authService.updateRole(userId, role);
  }

  @Put('admin/users/:id/permissions')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async updatePermissions(
    @Param('id') userId: string,
    @Body('permissions') permissions: any[],
  ) {
    await this.authService.updatePermissions(userId, permissions);
    return { success: true };
  }
}
