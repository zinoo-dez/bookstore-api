import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ReadingStatus } from '@prisma/client';
import { existsSync } from 'fs';
import { basename, extname, resolve } from 'path';
import { PrismaService } from '../database/prisma.service';
import { CreateEbookBookmarkDto } from './dto/create-ebook-bookmark.dto';
import { CreateEbookHighlightDto } from './dto/create-ebook-highlight.dto';
import { CreateEbookNoteDto } from './dto/create-ebook-note.dto';
import { CreateReadingItemDto } from './dto/create-reading-item.dto';
import { CreateReadingSessionDto } from './dto/create-reading-session.dto';
import { UpdateEbookNoteDto } from './dto/update-ebook-note.dto';
import { UpdateEbookProgressDto } from './dto/update-ebook-progress.dto';
import { UpdateReadingGoalDto } from './dto/update-reading-goal.dto';
import { UpdateReadingProgressDto } from './dto/update-reading-progress.dto';
import { UpdateReadingSessionDto } from './dto/update-reading-session.dto';
import { UpdateReadingStatusDto } from './dto/update-reading-status.dto';

const EBOOK_TOKEN_TTL_SECONDS = 15 * 60;
const EBOOK_UPLOADS_DIR_CANDIDATES = [
  resolve(process.cwd(), 'uploads', 'ebooks'),
  resolve(process.cwd(), 'backend', 'uploads', 'ebooks'),
];

type EbookTokenPayload = {
  sub: string;
  bookId: string;
  purpose: 'ebook-read';
};

@Injectable()
export class ReadingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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

  private resolveEbookAbsolutePath(ebookFilePath: string) {
    for (const baseDir of EBOOK_UPLOADS_DIR_CANDIDATES) {
      const absolutePath = resolve(baseDir, ebookFilePath);
      if (!absolutePath.startsWith(baseDir)) {
        continue;
      }
      if (existsSync(absolutePath)) {
        return absolutePath;
      }
    }

    throw new NotFoundException(
      `eBook file not found on server for path "${ebookFilePath}".`,
    );
  }

  private getEbookMimeType(filePath: string) {
    const extension = extname(filePath).toLowerCase();
    if (extension === '.epub') return 'application/epub+zip';
    if (extension === '.pdf') return 'application/pdf';
    return 'application/octet-stream';
  }

  private async ensureEbookAccess(userId: string, bookId: string) {
    await this.ensureUser(userId);

    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        isDigital: true,
        ebookFormat: true,
        ebookFilePath: true,
        totalPages: true,
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (!book.isDigital || !book.ebookFilePath) {
      throw new BadRequestException('This title is not available as an eBook.');
    }

    const existingAccess = await this.prisma.userBookAccess.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });

    if (existingAccess) {
      return { book, access: existingAccess };
    }

    const paidOrderItem = await this.prisma.orderItem.findFirst({
      where: {
        bookId,
        format: 'EBOOK',
        order: {
          userId,
          status: {
            in: ['CONFIRMED', 'COMPLETED'],
          },
        },
      },
      select: {
        orderId: true,
      },
    });

    if (!paidOrderItem) {
      throw new ForbiddenException(
        'You must purchase this eBook first.',
      );
    }

    const access = await this.prisma.userBookAccess.upsert({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
      update: {
        sourceOrderId: paidOrderItem.orderId,
      },
      create: {
        userId,
        bookId,
        sourceOrderId: paidOrderItem.orderId,
      },
    });

    return { book, access };
  }

  private async ensurePurchasedEbooksTracked(userId: string) {
    const paidOrderItems = await this.prisma.orderItem.findMany({
      where: {
        format: 'EBOOK',
        order: {
          userId,
          status: {
            in: ['CONFIRMED', 'COMPLETED'],
          },
        },
      },
      select: {
        bookId: true,
        book: {
          select: {
            isDigital: true,
            totalPages: true,
          },
        },
      },
      distinct: ['bookId'],
    });

    const digitalItems = paidOrderItems.filter((item) => item.book?.isDigital);
    if (digitalItems.length === 0) return;

    await Promise.all(
      digitalItems.map((item) =>
        this.prisma.readingItem.upsert({
          where: {
            userId_bookId: {
              userId,
              bookId: item.bookId,
            },
          },
          update: {},
          create: {
            userId,
            bookId: item.bookId,
            status: ReadingStatus.TO_READ,
            currentPage: 0,
            totalPages: item.book?.totalPages ?? null,
          },
        }),
      ),
    );
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
    await this.ensurePurchasedEbooksTracked(userId);

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

  async getMyEbooks(userId: string) {
    await this.ensureUser(userId);

    const paidOrderItems = await this.prisma.orderItem.findMany({
      where: {
        format: 'EBOOK',
        order: {
          userId,
          status: {
            in: ['CONFIRMED', 'COMPLETED'],
          },
        },
      },
      select: {
        bookId: true,
        orderId: true,
      },
      distinct: ['bookId'],
    });

    if (paidOrderItems.length > 0) {
      await Promise.all(
        paidOrderItems.map((item) =>
          this.prisma.userBookAccess.upsert({
            where: {
              userId_bookId: {
                userId,
                bookId: item.bookId,
              },
            },
            update: {
              sourceOrderId: item.orderId,
            },
            create: {
              userId,
              bookId: item.bookId,
              sourceOrderId: item.orderId,
            },
          }),
        ),
      );

      await this.ensurePurchasedEbooksTracked(userId);
    }

    const accesses = await this.prisma.userBookAccess.findMany({
      where: { userId },
      include: {
        book: true,
      },
      orderBy: { grantedAt: 'desc' },
    });

    const progressByBookId = new Map(
      (
        await this.prisma.ebookProgress.findMany({
          where: {
            userId,
            bookId: { in: accesses.map((item) => item.bookId) },
          },
        })
      ).map((item) => [item.bookId, item]),
    );

    return accesses.map((access) => ({
      ...access,
      progress: progressByBookId.get(access.bookId) ?? null,
    }));
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

  async addSession(
    userId: string,
    bookId: string,
    dto: CreateReadingSessionDto,
  ) {
    await this.ensureUser(userId);
    await this.ensureBook(bookId);

    const tracked = await this.prisma.readingItem.findUnique({
      where: { userId_bookId: { userId, bookId } },
      select: { id: true },
    });

    const sessionDate = dto.sessionDate
      ? new Date(dto.sessionDate)
      : new Date();
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
        ...(typeof dto.pagesRead === 'number'
          ? { pagesRead: dto.pagesRead }
          : {}),
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

  async openEbook(userId: string, bookId: string) {
    const { book } = await this.ensureEbookAccess(userId, bookId);
    const progress = await this.prisma.ebookProgress.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });

    const token = await this.jwtService.signAsync(
      {
        sub: userId,
        bookId,
        purpose: 'ebook-read',
      } satisfies EbookTokenPayload,
      {
        expiresIn: `${EBOOK_TOKEN_TTL_SECONDS}s`,
      },
    );

    const expiresAt = new Date(Date.now() + EBOOK_TOKEN_TTL_SECONDS * 1000);

    return {
      bookId: book.id,
      title: book.title,
      ebookFormat: book.ebookFormat,
      totalPages: book.totalPages,
      progress,
      token,
      contentUrl: `/reading/assets/${token}`,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async resolveEbookAssetFromToken(token: string) {
    let payload: EbookTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<EbookTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired eBook access token.');
    }

    if (payload.purpose !== 'ebook-read') {
      throw new UnauthorizedException('Invalid eBook access token purpose.');
    }

    const { book } = await this.ensureEbookAccess(payload.sub, payload.bookId);
    const absolutePath = this.resolveEbookAbsolutePath(
      book.ebookFilePath as string,
    );

    return {
      absolutePath,
      fileName: basename(absolutePath),
      mimeType: this.getEbookMimeType(absolutePath),
    };
  }

  async getEbookState(userId: string, bookId: string) {
    const { book } = await this.ensureEbookAccess(userId, bookId);

    const [progress, bookmarks, notes, highlights] = await Promise.all([
      this.prisma.ebookProgress.findUnique({
        where: {
          userId_bookId: { userId, bookId },
        },
      }),
      this.prisma.ebookBookmark.findMany({
        where: { userId, bookId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ebookNote.findMany({
        where: { userId, bookId },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.ebookHighlight.findMany({
        where: { userId, bookId },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return {
      book,
      progress,
      bookmarks,
      notes,
      highlights,
    };
  }

  async updateEbookProgress(
    userId: string,
    bookId: string,
    dto: UpdateEbookProgressDto,
  ) {
    const { book } = await this.ensureEbookAccess(userId, bookId);
    const existing = await this.prisma.ebookProgress.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });

    const targetPage = dto.page ?? existing?.page ?? 1;
    if (book.totalPages && targetPage > book.totalPages) {
      throw new BadRequestException(
        'Page cannot exceed total pages for this eBook.',
      );
    }

    const targetPercent =
      typeof dto.percent === 'number'
        ? dto.percent
        : book.totalPages
          ? Math.min(
              100,
              Number(((targetPage / book.totalPages) * 100).toFixed(2)),
            )
          : (existing?.percent ?? 0);

    const progress = await this.prisma.ebookProgress.upsert({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
      update: {
        page: targetPage,
        locationCfi: dto.locationCfi ?? existing?.locationCfi ?? null,
        percent: targetPercent,
      },
      create: {
        userId,
        bookId,
        page: targetPage,
        locationCfi: dto.locationCfi ?? null,
        percent: targetPercent,
      },
    });

    await this.prisma.readingItem.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: {
        currentPage: targetPage,
        totalPages: book.totalPages ?? null,
        status:
          book.totalPages && targetPage >= book.totalPages
            ? ReadingStatus.FINISHED
            : targetPage > 0
              ? ReadingStatus.READING
              : ReadingStatus.TO_READ,
      },
      create: {
        userId,
        bookId,
        currentPage: targetPage,
        totalPages: book.totalPages ?? null,
        status:
          book.totalPages && targetPage >= book.totalPages
            ? ReadingStatus.FINISHED
            : targetPage > 0
              ? ReadingStatus.READING
              : ReadingStatus.TO_READ,
      },
    });

    return progress;
  }

  async createEbookBookmark(
    userId: string,
    bookId: string,
    dto: CreateEbookBookmarkDto,
  ) {
    await this.ensureEbookAccess(userId, bookId);
    return this.prisma.ebookBookmark.create({
      data: {
        userId,
        bookId,
        page: dto.page,
        locationCfi: dto.locationCfi ?? null,
        label: dto.label?.trim() || null,
      },
    });
  }

  async deleteEbookBookmark(userId: string, bookmarkId: string) {
    const bookmark = await this.prisma.ebookBookmark.findFirst({
      where: { id: bookmarkId, userId },
      select: { id: true },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    return this.prisma.ebookBookmark.delete({ where: { id: bookmarkId } });
  }

  async createEbookNote(
    userId: string,
    bookId: string,
    dto: CreateEbookNoteDto,
  ) {
    await this.ensureEbookAccess(userId, bookId);
    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('Note content cannot be empty.');
    }

    return this.prisma.ebookNote.create({
      data: {
        userId,
        bookId,
        page: dto.page ?? null,
        locationCfi: dto.locationCfi ?? null,
        content,
      },
    });
  }

  async updateEbookNote(
    userId: string,
    noteId: string,
    dto: UpdateEbookNoteDto,
  ) {
    const existing = await this.prisma.ebookNote.findFirst({
      where: { id: noteId, userId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Note not found');
    }

    const content =
      typeof dto.content === 'string' ? dto.content.trim() : undefined;
    if (typeof content === 'string' && !content) {
      throw new BadRequestException('Note content cannot be empty.');
    }

    return this.prisma.ebookNote.update({
      where: { id: noteId },
      data: {
        ...(typeof dto.page === 'number' ? { page: dto.page } : {}),
        ...(typeof dto.locationCfi === 'string'
          ? { locationCfi: dto.locationCfi }
          : {}),
        ...(typeof content === 'string' ? { content } : {}),
      },
    });
  }

  async deleteEbookNote(userId: string, noteId: string) {
    const existing = await this.prisma.ebookNote.findFirst({
      where: { id: noteId, userId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Note not found');
    }

    return this.prisma.ebookNote.delete({ where: { id: noteId } });
  }

  async createEbookHighlight(
    userId: string,
    bookId: string,
    dto: CreateEbookHighlightDto,
  ) {
    await this.ensureEbookAccess(userId, bookId);

    return this.prisma.ebookHighlight.create({
      data: {
        userId,
        bookId,
        page: dto.page ?? null,
        startCfi: dto.startCfi,
        endCfi: dto.endCfi ?? null,
        textSnippet: dto.textSnippet ?? null,
        color: dto.color || 'yellow',
      },
    });
  }

  async deleteEbookHighlight(userId: string, highlightId: string) {
    const existing = await this.prisma.ebookHighlight.findFirst({
      where: { id: highlightId, userId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Highlight not found');
    }

    return this.prisma.ebookHighlight.delete({ where: { id: highlightId } });
  }
}
