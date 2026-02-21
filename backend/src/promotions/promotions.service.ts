import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PromotionDiscountType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { assertUserPermission } from '../auth/permission-resolution';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private validateDiscountRules(
    type: PromotionDiscountType,
    discountValue: number,
    maxDiscountAmount?: number,
  ) {
    if (type === PromotionDiscountType.PERCENT && discountValue > 100) {
      throw new BadRequestException(
        'Percent discount cannot exceed 100.',
      );
    }

    if (
      maxDiscountAmount !== undefined
      && maxDiscountAmount <= 0
    ) {
      throw new BadRequestException('maxDiscountAmount must be greater than 0.');
    }
  }

  private validateDateRange(startsAt?: string, endsAt?: string) {
    if (!startsAt || !endsAt) {
      return;
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);
    if (endDate < startDate) {
      throw new BadRequestException('endsAt must be after startsAt.');
    }
  }

  async list(actorUserId: string, activeOnly?: boolean) {
    await assertUserPermission(this.prisma, actorUserId, 'finance.reports.view');

    return this.prisma.promotionCode.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(actorUserId: string, dto: CreatePromotionDto) {
    await assertUserPermission(this.prisma, actorUserId, 'finance.payout.manage');

    this.validateDateRange(dto.startsAt, dto.endsAt);
    this.validateDiscountRules(
      dto.discountType,
      dto.discountValue,
      dto.maxDiscountAmount,
    );

    return this.prisma.promotionCode.create({
      data: {
        code: this.normalizeCode(dto.code),
        name: dto.name.trim(),
        description: dto.description?.trim(),
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minSubtotal: dto.minSubtotal ?? 0,
        maxDiscountAmount: dto.maxDiscountAmount,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        maxRedemptions: dto.maxRedemptions,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(actorUserId: string, id: string, dto: UpdatePromotionDto) {
    await assertUserPermission(this.prisma, actorUserId, 'finance.payout.manage');

    const existing = await this.prisma.promotionCode.findUnique({
      where: { id },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        discountType: true,
        discountValue: true,
        maxDiscountAmount: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Promotion not found');
    }

    const mergedStartsAt = dto.startsAt ?? existing.startsAt?.toISOString();
    const mergedEndsAt = dto.endsAt ?? existing.endsAt?.toISOString();
    this.validateDateRange(mergedStartsAt, mergedEndsAt);

    this.validateDiscountRules(
      dto.discountType ?? existing.discountType,
      dto.discountValue ?? Number(existing.discountValue),
      dto.maxDiscountAmount ?? (existing.maxDiscountAmount !== null ? Number(existing.maxDiscountAmount) : undefined),
    );

    return this.prisma.promotionCode.update({
      where: { id },
      data: {
        code: dto.code ? this.normalizeCode(dto.code) : undefined,
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minSubtotal: dto.minSubtotal,
        maxDiscountAmount: dto.maxDiscountAmount,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        maxRedemptions: dto.maxRedemptions,
        isActive: dto.isActive,
      },
    });
  }

  async remove(actorUserId: string, id: string) {
    await assertUserPermission(this.prisma, actorUserId, 'finance.payout.manage');

    const existing = await this.prisma.promotionCode.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException('Promotion not found');
    }

    return this.prisma.promotionCode.delete({ where: { id } });
  }
}
