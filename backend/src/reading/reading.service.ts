import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ReadingStatus } from '@prisma/client';
import { CreateReadingItemDto } from './dto/create-reading-item.dto';
import { UpdateReadingStatusDto } from './dto/update-reading-status.dto';
import { UpdateReadingProgressDto } from './dto/update-reading-progress.dto';
import { UpdateReadingGoalDto } from './dto/update-reading-goal.dto';
import { CreateReadingSessionDto } from './dto/create-reading-session.dto';
import { UpdateReadingSessionDto } from './dto/update-reading-session.dto';

@Injectable()
export class ReadingService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveMonthRange(month?: string) {
    if (!month) return null;
    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match) {
      throw new BadRequestException('Month must be in YYYY-MM format');
    }
    const year = Number(match[1]);
    const monthNumber = Number(match[2]);
    if (monthNumber < 1 || monthNumber > 12) {
      throw new BadRequestException('Month must be in YYYY-MM format');
    }

    const from = new Date(year, monthNumber - 1, 1);
    const to = new Date(year, monthNumber, 1);
    return { from, to };
  }

  private async ensureUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(
        'Invalid user session. Please login again.',
      );
    }
  }

  private async ensureBook(bookId: string) {
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
  }

  private withProgress<
    T extends { currentPage: number; totalPages: number | null },
  >(item: T) {
    const progressPercent = item.totalPages
      ? Math.min(100, Math.round((item.currentPage / item.totalPages) * 100))
      : 0;

    return {
      ...item,
      progressPercent,
    };
  }

  async getMyBooks(userId: string, status?: ReadingStatus, bookId?: string) {
    await this.ensureUser(userId);

    const items = await this.prisma.readingItem.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
        ...(bookId ? { bookId } : {}),
      },
      include: { book: true },
      orderBy: { updatedAt: 'desc' },
    });

    return items.map((item) => this.withProgress(item));
  }

  async getMySessions(userId: string, month?: string, bookId?: string) {
    await this.ensureUser(userId);

    const monthRange = this.resolveMonthRange(month);
    return this.prisma.readingSession.findMany({
      where: {
        userId,
        ...(bookId ? { bookId } : {}),
        ...(monthRange
          ? {
              sessionDate: {
                gte: monthRange.from,
                lt: monthRange.to,
              },
            }
          : {}),
      },
      include: { book: true },
      orderBy: [{ sessionDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async addSession(userId: string, bookId: string, dto: CreateReadingSessionDto) {
    await this.ensureUser(userId);
    await this.ensureBook(bookId);

    const tracked = await this.prisma.readingItem.findUnique({
      where: { userId_bookId: { userId, bookId } },
      select: { id: true },
    });

    const sessionDate = dto.sessionDate ? new Date(dto.sessionDate) : new Date();
    if (Number.isNaN(sessionDate.getTime())) {
      throw new BadRequestException('Invalid session date');
    }

    return this.prisma.readingSession.create({
      data: {
        userId,
        bookId,
        readingItemId: tracked?.id ?? null,
        pagesRead: dto.pagesRead,
        sessionDate,
        notes: dto.notes ?? null,
      },
      include: { book: true },
    });
  }

  async updateSession(
    userId: string,
    sessionId: string,
    dto: UpdateReadingSessionDto,
  ) {
    await this.ensureUser(userId);

    const existing = await this.prisma.readingSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!existing) {
      throw new NotFoundException('Reading session not found');
    }

    const sessionDate = dto.sessionDate ? new Date(dto.sessionDate) : undefined;
    if (sessionDate && Number.isNaN(sessionDate.getTime())) {
      throw new BadRequestException('Invalid session date');
    }

    return this.prisma.readingSession.update({
      where: { id: sessionId },
      data: {
        ...(typeof dto.pagesRead === 'number' ? { pagesRead: dto.pagesRead } : {}),
        ...(sessionDate ? { sessionDate } : {}),
        ...(typeof dto.notes === 'string' ? { notes: dto.notes } : {}),
      },
      include: { book: true },
    });
  }

  async addBook(userId: string, bookId: string, dto: CreateReadingItemDto) {
    await this.ensureUser(userId);
    await this.ensureBook(bookId);

    const totalPages = dto.totalPages ?? null;
    const currentPage = dto.currentPage ?? 0;

    if (totalPages !== null && currentPage > totalPages) {
      throw new BadRequestException('Current page cannot exceed total pages');
    }

    const status = dto.status ?? ReadingStatus.TO_READ;
    const now = new Date();

    const item = await this.prisma.readingItem.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: {
        status,
        currentPage,
        totalPages,
        dailyGoalPages: dto.dailyGoalPages,
        startedAt: status === ReadingStatus.READING ? now : undefined,
        finishedAt: status === ReadingStatus.FINISHED ? now : null,
      },
      create: {
        userId,
        bookId,
        status,
        currentPage,
        totalPages,
        dailyGoalPages: dto.dailyGoalPages,
        startedAt: status === ReadingStatus.READING ? now : null,
        finishedAt: status === ReadingStatus.FINISHED ? now : null,
      },
      include: { book: true },
    });

    return this.withProgress(item);
  }

  async updateStatus(
    userId: string,
    bookId: string,
    dto: UpdateReadingStatusDto,
  ) {
    await this.ensureUser(userId);

    const existing = await this.prisma.readingItem.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (!existing) {
      throw new NotFoundException('Tracked book not found');
    }

    const now = new Date();

    const item = await this.prisma.readingItem.update({
      where: { userId_bookId: { userId, bookId } },
      data: {
        status: dto.status,
        startedAt:
          dto.status === ReadingStatus.READING
            ? existing.startedAt || now
            : existing.startedAt,
        finishedAt: dto.status === ReadingStatus.FINISHED ? now : null,
      },
      include: { book: true },
    });

    return this.withProgress(item);
  }

  async updateProgress(
    userId: string,
    bookId: string,
    dto: UpdateReadingProgressDto,
  ) {
    await this.ensureUser(userId);

    const existing = await this.prisma.readingItem.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (!existing) {
      throw new NotFoundException('Tracked book not found');
    }

    const totalPages = dto.totalPages ?? existing.totalPages;
    if (totalPages !== null && dto.currentPage > totalPages) {
      throw new BadRequestException('Current page cannot exceed total pages');
    }

    const now = new Date();
    const currentPage = totalPages
      ? Math.min(dto.currentPage, totalPages)
      : dto.currentPage;

    const inferredStatus = totalPages
      ? currentPage >= totalPages
        ? ReadingStatus.FINISHED
        : currentPage > 0
          ? ReadingStatus.READING
          : ReadingStatus.TO_READ
      : currentPage > 0
        ? ReadingStatus.READING
        : existing.status;

    const item = await this.prisma.readingItem.update({
      where: { userId_bookId: { userId, bookId } },
      data: {
        currentPage,
        totalPages,
        status: inferredStatus,
        startedAt:
          inferredStatus === ReadingStatus.READING ||
          inferredStatus === ReadingStatus.FINISHED
            ? existing.startedAt || now
            : existing.startedAt,
        finishedAt: inferredStatus === ReadingStatus.FINISHED ? now : null,
      },
      include: { book: true },
    });

    const pagesDelta = currentPage - existing.currentPage;
    if (pagesDelta > 0) {
      await this.prisma.readingSession.create({
        data: {
          userId,
          bookId,
          readingItemId: existing.id,
          pagesRead: pagesDelta,
          sessionDate: now,
        },
      });
    }

    return this.withProgress(item);
  }

  async updateDailyGoal(
    userId: string,
    bookId: string,
    dto: UpdateReadingGoalDto,
  ) {
    await this.ensureUser(userId);

    const existing = await this.prisma.readingItem.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (!existing) {
      throw new NotFoundException('Tracked book not found');
    }

    const item = await this.prisma.readingItem.update({
      where: { userId_bookId: { userId, bookId } },
      data: {
        dailyGoalPages: dto.dailyGoalPages ?? null,
      },
      include: { book: true },
    });

    return this.withProgress(item);
  }

  async removeBook(userId: string, bookId: string) {
    await this.ensureUser(userId);

    const existing = await this.prisma.readingItem.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (!existing) {
      throw new NotFoundException('Tracked book not found');
    }

    const item = await this.prisma.readingItem.delete({
      where: { userId_bookId: { userId, bookId } },
      include: { book: true },
    });

    return this.withProgress(item);
  }
}
