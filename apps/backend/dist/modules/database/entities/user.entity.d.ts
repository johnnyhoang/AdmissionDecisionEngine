import { UserPermission } from './user-permission.entity';
export declare class User {
    id: string;
    email: string;
    name: string;
    avatar: string;
    role: string;
    permissions: UserPermission[];
    createdAt: Date;
    updatedAt: Date;
}
