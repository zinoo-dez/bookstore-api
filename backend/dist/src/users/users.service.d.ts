import { PrismaService } from '../database/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        name: string;
        createdAt: Date;
    }[]>;
}
