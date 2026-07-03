import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRE_PERMISSION_KEY,
  PermissionRequirements,
} from './require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requirement =
      this.reflector.getAllAndOverride<PermissionRequirements>(
        REQUIRE_PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Chưa được định danh');
    }

    // Admins always have access to all routes
    if (user.role === 'ADMIN') {
      return true;
    }

    const permissions = user.permissions || [];
    const matchedPerm = permissions.find(
      (p: any) =>
        p.module === requirement.module &&
        p.functionKey === requirement.functionKey,
    );

    if (!matchedPerm) {
      throw new ForbiddenException(
        `Không có quyền truy cập chức năng ${requirement.functionKey}`,
      );
    }

    if (requirement.type === 'view' && !matchedPerm.canView) {
      throw new ForbiddenException(
        `Yêu cầu quyền VIEW cho chức năng ${requirement.functionKey}`,
      );
    }

    if (requirement.type === 'edit' && !matchedPerm.canEdit) {
      throw new ForbiddenException(
        `Yêu cầu quyền EDIT cho chức năng ${requirement.functionKey}`,
      );
    }

    return true;
  }
}
