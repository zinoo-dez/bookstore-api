import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ReadingStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ReadingService } from './reading.service';

describe('ReadingService', () => {
  let service: ReadingService;
  let prisma: any;

  const userId = 'user-1';
  const bookId = 'book-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            book: {
              findUnique: jest.fn(),
            },
            readingItem: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              upsert: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            readingSession: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReadingService>(ReadingService);
    prisma = module.get(PrismaService);

    prisma.user.findUnique.mockResolvedValue({ id: userId });
    prisma.book.findUnique.mockResolvedValue({ id: bookId });
    prisma.readingSession.create.mockResolvedValue({
      id: 'session-1',
      userId,
      bookId,
      readingItemId: 'ri-1',
      pagesRead: 1,
      sessionDate: new Date(),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyBooks', () => {
    it('returns items with computed progress', async () => {
      prisma.readingItem.findMany.mockResolvedValue([
        {
          id: 'ri-1',
          userId,
          bookId,
          status: ReadingStatus.READING,
          currentPage: 40,
          totalPages: 200,
          dailyGoalPages: 10,
          startedAt: new Date(),
          finishedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          book: { id: bookId, title: 'Book A' },
        },
      ]);

      const result = await service.getMyBooks(
        userId,
        ReadingStatus.READING,
        bookId,
      );

      expect(prisma.readingItem.findMany).toHaveBeenCalledWith({
        where: { userId, status: ReadingStatus.READING, bookId },
        include: { book: true },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result[0].progressPercent).toBe(20);
    });

    it('throws when user is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getMyBooks(userId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('addBook', () => {
    it('upserts reading item for valid payload', async () => {
      const now = new Date();
      prisma.readingItem.upsert.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.TO_READ,
        currentPage: 0,
        totalPages: 300,
        dailyGoalPages: 20,
        startedAt: null,
        finishedAt: null,
        createdAt: now,
        updatedAt: now,
        book: { id: bookId, title: 'Book A' },
      });

      const result = await service.addBook(userId, bookId, {
        status: ReadingStatus.TO_READ,
        currentPage: 0,
        totalPages: 300,
        dailyGoalPages: 20,
      });

      expect(prisma.readingItem.upsert).toHaveBeenCalled();
      expect(result.progressPercent).toBe(0);
    });

    it('throws when current page exceeds total pages', async () => {
      await expect(
        service.addBook(userId, bookId, {
          currentPage: 301,
          totalPages: 300,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when book is missing', async () => {
      prisma.book.findUnique.mockResolvedValue(null);
      await expect(service.addBook(userId, bookId, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('updates status and sets finishedAt for FINISHED', async () => {
      const now = new Date();
      prisma.readingItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.READING,
        startedAt: now,
        finishedAt: null,
      });
      prisma.readingItem.update.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.FINISHED,
        currentPage: 100,
        totalPages: 100,
        dailyGoalPages: 10,
        startedAt: now,
        finishedAt: now,
        createdAt: now,
        updatedAt: now,
        book: { id: bookId, title: 'Book A' },
      });

      const result = await service.updateStatus(userId, bookId, {
        status: ReadingStatus.FINISHED,
      });

      expect(prisma.readingItem.update).toHaveBeenCalled();
      expect(result.status).toBe(ReadingStatus.FINISHED);
      expect(result.finishedAt).toBeTruthy();
    });

    it('throws when tracked item is missing', async () => {
      prisma.readingItem.findUnique.mockResolvedValue(null);
      await expect(
        service.updateStatus(userId, bookId, { status: ReadingStatus.READING }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProgress', () => {
    it('infers FINISHED when current page reaches total pages', async () => {
      const now = new Date();
      prisma.readingItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.READING,
        currentPage: 20,
        totalPages: 100,
        startedAt: now,
        finishedAt: null,
      });
      prisma.readingItem.update.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.FINISHED,
        currentPage: 100,
        totalPages: 100,
        dailyGoalPages: 10,
        startedAt: now,
        finishedAt: now,
        createdAt: now,
        updatedAt: now,
        book: { id: bookId, title: 'Book A' },
      });

      const result = await service.updateProgress(userId, bookId, {
        currentPage: 100,
        totalPages: 100,
      });

      expect(result.status).toBe(ReadingStatus.FINISHED);
      expect(result.progressPercent).toBe(100);
    });

    it('throws when current page exceeds total pages', async () => {
      prisma.readingItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.READING,
        currentPage: 20,
        totalPages: 200,
        startedAt: new Date(),
        finishedAt: null,
      });

      await expect(
        service.updateProgress(userId, bookId, {
          currentPage: 201,
          totalPages: 200,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateDailyGoal', () => {
    it('updates daily goal and supports clearing it', async () => {
      const now = new Date();
      prisma.readingItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
      });
      prisma.readingItem.update.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.READING,
        currentPage: 10,
        totalPages: 100,
        dailyGoalPages: null,
        startedAt: now,
        finishedAt: null,
        createdAt: now,
        updatedAt: now,
        book: { id: bookId, title: 'Book A' },
      });

      const result = await service.updateDailyGoal(userId, bookId, {});

      expect(prisma.readingItem.update).toHaveBeenCalledWith({
        where: { userId_bookId: { userId, bookId } },
        data: { dailyGoalPages: null },
        include: { book: true },
      });
      expect(result.dailyGoalPages).toBeNull();
    });
  });

  describe('removeBook', () => {
    it('deletes tracked item', async () => {
      const now = new Date();
      prisma.readingItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
      });
      prisma.readingItem.delete.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.TO_READ,
        currentPage: 0,
        totalPages: null,
        dailyGoalPages: null,
        startedAt: null,
        finishedAt: null,
        createdAt: now,
        updatedAt: now,
        book: { id: bookId, title: 'Book A' },
      });

      const result = await service.removeBook(userId, bookId);

      expect(prisma.readingItem.delete).toHaveBeenCalledWith({
        where: { userId_bookId: { userId, bookId } },
        include: { book: true },
      });
      expect(result.bookId).toBe(bookId);
    });
  });
});
