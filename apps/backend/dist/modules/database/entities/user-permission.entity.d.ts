import { User } from './user.entity';
export declare class UserPermission {
    id: string;
    userId: string;
    user: User;
    module: string;
    functionKey: string;
    canView: boolean;
    canEdit: boolean;
    createdAt: Date;
    updatedAt: Date;
}
