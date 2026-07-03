import { SetMetadata } from '@nestjs/common';

export interface PermissionRequirements {
  module: string;
  functionKey: string;
  type: 'view' | 'edit';
}

export const REQUIRE_PERMISSION_KEY = 'require_permission';
export const RequirePermission = (
  module: string,
  functionKey: string,
  type: 'view' | 'edit',
) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, {
    module,
    functionKey,
    type,
  });
