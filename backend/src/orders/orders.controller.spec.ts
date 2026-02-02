import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: jest.Mocked<OrdersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<OrdersController>(OrdersController);
    ordersService = module.get(OrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create order', async () => {
      const userId = 'user1';
      const mockOrder = {
        id: 'order1',
        userId,
        totalPrice: 21.98,
        status: 'COMPLETED',
        orderItems: [],
      };
      const req = { user: { sub: userId } };

      ordersService.create.mockResolvedValue(mockOrder as any);

      const result = await controller.create(req);

      expect(result).toEqual(mockOrder);
      expect(ordersService.create).toHaveBeenCalledWith(userId);
    });
  });

  describe('findAll', () => {
    it('should return user orders', async () => {
      const userId = 'user1';
      const mockOrders = [
        {
          id: 'order1',
          userId,
          totalPrice: 21.98,
          status: 'COMPLETED',
          orderItems: [],
        },
      ];
      const req = { user: { sub: userId } };

      ordersService.findAll.mockResolvedValue(mockOrders as any);

      const result = await controller.findAll(req);

      expect(result).toEqual(mockOrders);
      expect(ordersService.findAll).toHaveBeenCalledWith(userId);
    });
  });

  describe('findOne', () => {
    it('should return specific order', async () => {
      const userId = 'user1';
      const orderId = 'order1';
      const mockOrder = {
        id: orderId,
        userId,
        totalPrice: 21.98,
        status: 'COMPLETED',
        orderItems: [],
      };
      const req = { user: { sub: userId } };

      ordersService.findOne.mockResolvedValue(mockOrder as any);

      const result = await controller.findOne(req, orderId);

      expect(result).toEqual(mockOrder);
      expect(ordersService.findOne).toHaveBeenCalledWith(userId, orderId);
    });
  });
});