import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { UserPermission } from '../database/entities/user-permission.entity';
export declare class AuthService {
    private readonly userRepo;
    private readonly permissionRepo;
    constructor(userRepo: Repository<User>, permissionRepo: Repository<UserPermission>);
    getOrCreateUser(payload: any): Promise<User>;
    getAllUsers(): Promise<User[]>;
    updateRole(userId: string, role: string): Promise<User>;
    updatePermissions(userId: string, permissionsDto: any[]): Promise<void>;
}
