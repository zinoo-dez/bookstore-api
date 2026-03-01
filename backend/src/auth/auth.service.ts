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
import { resolveUserPermissionKeys } from './permission-resolution';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { randomUUID } from 'crypto';

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
        isActive: true,
        avatarType: true,
        avatarValue: true,
        backgroundColor: true,
        pronouns: true,
        shortBio: true,
        about: true,
        coverImage: true,
        showEmail: true,
        showFollowers: true,
        showFollowing: true,
        showFavorites: true,
        showLikedPosts: true,
        supportEnabled: true,
        supportUrl: true,
        supportQrImage: true,
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
        isActive: true,
        avatarType: true,
        avatarValue: true,
        backgroundColor: true,
        pronouns: true,
        shortBio: true,
        about: true,
        coverImage: true,
        showEmail: true,
        showFollowers: true,
        showFollowing: true,
        showFavorites: true,
        showLikedPosts: true,
        supportEnabled: true,
        supportUrl: true,
        supportQrImage: true,
        staffProfile: {
          select: {
            id: true,
            employeeCode: true,
            status: true,
            title: true,
            department: {
              select: {
                name: true,
                code: true,
              },
            },
            assignments: {
              where: {
                OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }],
                effectiveFrom: {
                  lte: new Date(),
                },
              },
              orderBy: {
                effectiveFrom: 'desc',
              },
              select: {
                role: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
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

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account has been restricted. Please contact support.',
      );
    }

    const staffRoles = user.staffProfile?.assignments.map((assignment) => ({
      id: assignment.role.id,
      name: assignment.role.name,
      code: assignment.role.code,
    })) ?? [];
    const primaryStaffRole = staffRoles[0] ?? null;

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: Array.from(
        await resolveUserPermissionKeys(this.prisma, user.id),
      ),
      name: user.name,
      avatarType: user.avatarType,
      avatarValue: user.avatarValue,
      backgroundColor: user.backgroundColor,
      pronouns: user.pronouns,
      shortBio: user.shortBio,
      about: user.about,
      coverImage: user.coverImage,
      showEmail: user.showEmail,
      showFollowers: user.showFollowers,
      showFollowing: user.showFollowing,
      showFavorites: user.showFavorites,
      showLikedPosts: user.showLikedPosts,
      supportEnabled: user.supportEnabled,
      supportUrl: user.supportUrl,
      supportQrImage: user.supportQrImage,
      staffTitle: user.staffProfile?.title,
      staffDepartmentName: user.staffProfile?.department.name,
      staffDepartmentCode: user.staffProfile?.department.code,
      staffProfileId: user.staffProfile?.id,
      staffEmployeeCode: user.staffProfile?.employeeCode,
      isStaff: !!user.staffProfile?.id,
      staffStatus: user.staffProfile?.status,
      staffRoles,
      primaryStaffRoleName: primaryStaffRole?.name,
      primaryStaffRoleCode: primaryStaffRole?.code,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async getMyPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid user session. Please login again.',
      );
    }

    const permissions = Array.from(
      await resolveUserPermissionKeys(this.prisma, userId),
    ).sort();

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    console.log('UPDATE PROFILE userId:', userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.avatarType !== undefined ? { avatarType: dto.avatarType } : {}),
        ...(dto.avatarValue !== undefined
          ? { avatarValue: dto.avatarValue }
          : {}),
        ...(dto.backgroundColor !== undefined
          ? { backgroundColor: dto.backgroundColor }
          : {}),
        ...(dto.pronouns !== undefined
          ? { pronouns: dto.pronouns.trim() || null }
          : {}),
        ...(dto.shortBio !== undefined
          ? { shortBio: dto.shortBio.trim() || null }
          : {}),
        ...(dto.about !== undefined ? { about: dto.about.trim() || null } : {}),
        ...(dto.coverImage !== undefined
          ? { coverImage: dto.coverImage.trim() || null }
          : {}),
        ...(dto.showEmail !== undefined ? { showEmail: dto.showEmail } : {}),
        ...(dto.showFollowers !== undefined
          ? { showFollowers: dto.showFollowers }
          : {}),
        ...(dto.showFollowing !== undefined
          ? { showFollowing: dto.showFollowing }
          : {}),
        ...(dto.showFavorites !== undefined
          ? { showFavorites: dto.showFavorites }
          : {}),
        ...(dto.showLikedPosts !== undefined
          ? { showLikedPosts: dto.showLikedPosts }
          : {}),
        ...(dto.supportEnabled !== undefined
          ? { supportEnabled: dto.supportEnabled }
          : {}),
        ...(dto.supportUrl !== undefined
          ? { supportUrl: dto.supportUrl.trim() || null }
          : {}),
        ...(dto.supportQrImage !== undefined
          ? { supportQrImage: dto.supportQrImage.trim() || null }
          : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarType: true,
        avatarValue: true,
        backgroundColor: true,
        pronouns: true,
        shortBio: true,
        about: true,
        coverImage: true,
        showEmail: true,
        showFollowers: true,
        showFollowing: true,
        showFavorites: true,
        showLikedPosts: true,
        supportEnabled: true,
        supportUrl: true,
        supportQrImage: true,
        createdAt: true,
      },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (!user) {
      return {
        message:
          'If an account exists with this email, a reset token has been generated.',
      };
    }

    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    const token =
      randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return {
      message:
        'If an account exists with this email, a reset token has been generated.',
      resetToken: token,
      expiresAt,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (
      !resetToken ||
      resetToken.usedAt !== null ||
      resetToken.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Reset token is invalid or expired');
    }

    const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, bcryptRounds);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.user.id },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return {
      message: 'Password has been reset successfully.',
    };
  }
}
