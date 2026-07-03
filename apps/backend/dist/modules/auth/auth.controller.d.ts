import { AuthService } from './auth.service';
import { User } from '../database/entities/user.entity';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getProfile(user: User): Promise<User>;
    getUsers(): Promise<User[]>;
    updateRole(userId: string, role: string): Promise<User>;
    updatePermissions(userId: string, permissions: any[]): Promise<{
        success: boolean;
    }>;
}
