import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        name: string;
        createdAt: Date;
    }[]>;
}
