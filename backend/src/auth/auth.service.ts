import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 10);
    const hashedPassword = await bcrypt.hash(dto.password, bcryptRounds);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarType: true,
        avatarValue: true,
        backgroundColor: true,
        createdAt: true,
      },
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        avatarType: true,
        avatarValue: true,
        backgroundColor: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'No account found with this email address',
      );
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Incorrect password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      avatarType: user.avatarType,
      avatarValue: user.avatarValue,
      backgroundColor: user.backgroundColor,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    console.log('UPDATE PROFILE userId:', userId)
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.avatarType && { avatarType: dto.avatarType }),
        ...(dto.avatarValue && { avatarValue: dto.avatarValue }),
        ...(dto.backgroundColor && { backgroundColor: dto.backgroundColor }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarType: true,
        avatarValue: true,
        backgroundColor: true,
        createdAt: true,
      },
    });
  }
}
