export interface PermissionRequirements {
    module: string;
    functionKey: string;
    type: 'view' | 'edit';
}
export declare const REQUIRE_PERMISSION_KEY = "require_permission";
export declare const RequirePermission: (module: string, functionKey: string, type: "view" | "edit") => import("@nestjs/common").CustomDecorator<string>;
