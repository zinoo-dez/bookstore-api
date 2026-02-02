import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        name: string;
        createdAt: Date;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
    }>;
}
