import { Test, TestingModule } from '@nestjs/testing';
import { ReadingStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ReadingController } from './reading.controller';
import { ReadingService } from './reading.service';

describe('ReadingController', () => {
  let controller: ReadingController;
  let service: jest.Mocked<ReadingService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReadingController],
      providers: [
        {
          provide: ReadingService,
          useValue: {
            getMyBooks: jest.fn(),
            addBook: jest.fn(),
            updateStatus: jest.fn(),
            updateProgress: jest.fn(),
            updateDailyGoal: jest.fn(),
            removeBook: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ReadingController>(ReadingController);
    service = module.get(ReadingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates getMyBooks', async () => {
    const req = { user: { sub: 'user-1' } };
    service.getMyBooks.mockResolvedValue([] as any);

    const result = await controller.getMyBooks(
      req,
      ReadingStatus.READING,
      'book-1',
    );

    expect(service.getMyBooks).toHaveBeenCalledWith(
      'user-1',
      ReadingStatus.READING,
      'book-1',
    );
    expect(result).toEqual([]);
  });

  it('delegates addBook', async () => {
    const req = { user: { sub: 'user-1' } };
    const dto = { status: ReadingStatus.TO_READ };
    const payload = { id: 'ri-1' };
    service.addBook.mockResolvedValue(payload as any);

    const result = await controller.addBook(req, 'book-1', dto);

    expect(service.addBook).toHaveBeenCalledWith('user-1', 'book-1', dto);
    expect(result).toEqual(payload);
  });

  it('delegates updateStatus', async () => {
    const req = { user: { sub: 'user-1' } };
    const dto = { status: ReadingStatus.FINISHED };
    const payload = { id: 'ri-1', status: ReadingStatus.FINISHED };
    service.updateStatus.mockResolvedValue(payload as any);

    const result = await controller.updateStatus(req, 'book-1', dto);

    expect(service.updateStatus).toHaveBeenCalledWith('user-1', 'book-1', dto);
    expect(result).toEqual(payload);
  });

  it('delegates updateProgress', async () => {
    const req = { user: { sub: 'user-1' } };
    const dto = { currentPage: 22, totalPages: 200 };
    const payload = { id: 'ri-1', currentPage: 22 };
    service.updateProgress.mockResolvedValue(payload as any);

    const result = await controller.updateProgress(req, 'book-1', dto);

    expect(service.updateProgress).toHaveBeenCalledWith(
      'user-1',
      'book-1',
      dto,
    );
    expect(result).toEqual(payload);
  });

  it('delegates updateDailyGoal', async () => {
    const req = { user: { sub: 'user-1' } };
    const dto = { dailyGoalPages: 15 };
    const payload = { id: 'ri-1', dailyGoalPages: 15 };
    service.updateDailyGoal.mockResolvedValue(payload as any);

    const result = await controller.updateDailyGoal(req, 'book-1', dto);

    expect(service.updateDailyGoal).toHaveBeenCalledWith(
      'user-1',
      'book-1',
      dto,
    );
    expect(result).toEqual(payload);
  });

  it('delegates removeBook', async () => {
    const req = { user: { sub: 'user-1' } };
    const payload = { id: 'ri-1' };
    service.removeBook.mockResolvedValue(payload as any);

    const result = await controller.removeBook(req, 'book-1');

    expect(service.removeBook).toHaveBeenCalledWith('user-1', 'book-1');
    expect(result).toEqual(payload);
  });
});
