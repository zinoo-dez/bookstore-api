import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../database/prisma.service';
import { CartService } from '../cart/cart.service';
import * as fc from 'fast-check';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: any;
  let cartService: jest.Mocked<CartService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            orderItem: {
              create: jest.fn(),
            },
            book: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            cartItem: {
              deleteMany: jest.fn(),
            },
            $transaction: jest.fn(),
          } as any,
        },
        {
          provide: CartService,
          useValue: {
            getCart: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get(PrismaService);
    cartService = module.get(CartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create order with valid cart', async () => {
      const userId = 'user1';
      const mockCart = {
        items: [
          {
            bookId: 'book1',
            quantity: 2,
            book: { id: 'book1', title: 'Test Book', price: 10.99, stock: 5 },
          },
        ],
        totalPrice: 21.98,
      };
      const mockOrder = {
        id: 'order1',
        userId,
        totalPrice: 21.98,
        status: 'COMPLETED',
        orderItems: [
          {
            id: 'item1',
            orderId: 'order1',
            bookId: 'book1',
            quantity: 2,
            price: 10.99,
          },
        ],
      };

      cartService.getCart.mockResolvedValue(mockCart as any);
      prismaService.book.findUnique.mockResolvedValue({
        id: 'book1',
        stock: 5,
        title: 'Test Book',
      } as any);
      prismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          order: {
            create: jest.fn().mockResolvedValue({
              id: 'order1',
              userId,
              totalPrice: 21.98,
              status: 'PENDING',
            }),
            update: jest.fn().mockResolvedValue(mockOrder),
          },
          orderItem: {
            create: jest.fn().mockResolvedValue({
              id: 'item1',
              orderId: 'order1',
              bookId: 'book1',
              quantity: 2,
              price: 10.99,
            }),
          },
          book: {
            update: jest.fn(),
          },
          cartItem: {
            deleteMany: jest.fn(),
          },
        } as any);
      });

      const result = await service.create(userId);

      expect(result).toEqual(mockOrder);
      expect(cartService.getCart).toHaveBeenCalledWith(userId);
    });

    it('should throw BadRequestException for empty cart', async () => {
      const userId = 'user1';
      cartService.getCart.mockResolvedValue({
        items: [],
        totalPrice: 0,
      } as any);

      await expect(service.create(userId)).rejects.toThrow(BadRequestException);
      expect(cartService.getCart).toHaveBeenCalledWith(userId);
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      const userId = 'user1';
      const mockCart = {
        items: [
          {
            bookId: 'book1',
            quantity: 10,
            book: { id: 'book1', title: 'Test Book', price: 10.99 },
          },
        ],
        totalPrice: 109.9,
      };

      cartService.getCart.mockResolvedValue(mockCart as any);
      prismaService.book.findUnique.mockResolvedValue({
        id: 'book1',
        stock: 5,
        title: 'Test Book',
      } as any);

      await expect(service.create(userId)).rejects.toThrow(BadRequestException);
      expect(prismaService.book.findUnique).toHaveBeenCalledWith({
        where: { id: 'book1' },
      });
    });

    it('should throw BadRequestException for non-existent book', async () => {
      const userId = 'user1';
      const mockCart = {
        items: [
          {
            bookId: 'nonexistent',
            quantity: 1,
            book: { id: 'nonexistent', title: 'Test Book', price: 10.99 },
          },
        ],
        totalPrice: 10.99,
      };

      cartService.getCart.mockResolvedValue(mockCart as any);
      prismaService.book.findUnique.mockResolvedValue(null);

      await expect(service.create(userId)).rejects.toThrow(BadRequestException);
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
          createdAt: new Date(),
          orderItems: [],
        },
      ];

      prismaService.order.findMany.mockResolvedValue(mockOrders as any);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockOrders);
      expect(prismaService.order.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          orderItems: {
            include: {
              book: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return specific order for user', async () => {
      const userId = 'user1';
      const orderId = 'order1';
      const mockOrder = {
        id: orderId,
        userId,
        totalPrice: 21.98,
        status: 'COMPLETED',
        orderItems: [],
      };

      prismaService.order.findFirst.mockResolvedValue(mockOrder as any);

      const result = await service.findOne(userId, orderId);

      expect(result).toEqual(mockOrder);
      expect(prismaService.order.findFirst).toHaveBeenCalledWith({
        where: {
          id: orderId,
          userId,
        },
        include: {
          orderItems: {
            include: {
              book: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException for non-existent order', async () => {
      const userId = 'user1';
      const orderId = 'nonexistent';

      prismaService.order.findFirst.mockResolvedValue(null);

      await expect(service.findOne(userId, orderId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // Property-Based Tests
  describe('Property-Based Tests', () => {
    describe('Property 21: Valid checkout creates order', () => {
      it('**Validates: Requirements 5.1**', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }),
            fc.array(
              fc.record({
                bookId: fc.string({ minLength: 1 }),
                quantity: fc.integer({ min: 1, max: 10 }),
                book: fc.record({
                  id: fc.string({ minLength: 1 }),
                  title: fc.string({ minLength: 1 }),
                  price: fc.float({
                    min: Math.fround(0.01),
                    max: Math.fround(100),
                  }),
                  stock: fc.integer({ min: 10, max: 100 }),
                }),
              }),
              { minLength: 1, maxLength: 5 },
            ),
            async (userId, cartItems) => {
              const totalPrice = cartItems.reduce(
                (sum, item) => sum + item.book.price * item.quantity,
                0,
              );
              const mockCart = { items: cartItems, totalPrice };
              const mockOrder = {
                id: 'order1',
                userId,
                totalPrice,
                status: 'COMPLETED',
                orderItems: cartItems.map((item, index) => ({
                  id: `item${index}`,
                  orderId: 'order1',
                  bookId: item.bookId,
                  quantity: item.quantity,
                  price: item.book.price,
                })),
              };

              cartService.getCart.mockResolvedValue(mockCart as any);

              // Mock book stock validation
              for (const item of cartItems) {
                prismaService.book.findUnique.mockResolvedValueOnce({
                  id: item.bookId,
                  stock: item.book.stock,
                  title: item.book.title,
                } as any);
              }

              prismaService.$transaction.mockImplementation(
                async (callback: any) => {
                  return callback({
                    order: {
                      create: jest.fn().mockResolvedValue({
                        id: 'order1',
                        userId,
                        totalPrice,
                        status: 'PENDING',
                      }),
                      update: jest.fn().mockResolvedValue(mockOrder),
                    },
                    orderItem: {
                      create: jest.fn().mockImplementation((data) => ({
                        id: `item${Math.random()}`,
                        ...data.data,
                      })),
                    },
                    book: { update: jest.fn() },
                    cartItem: { deleteMany: jest.fn() },
                  } as any);
                },
              );

              const result = await service.create(userId);
              expect(result.userId).toBe(userId);
              expect(result.status).toBe('COMPLETED');
              expect(result.totalPrice).toBe(totalPrice);
            },
          ),
          { numRuns: 20 },
        );
      });
    });

    describe('Property 24: Order history returns all orders', () => {
      it('**Validates: Requirements 5.4**', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }),
            fc.array(
              fc.record({
                id: fc.string({ minLength: 1 }),
                totalPrice: fc.float({
                  min: Math.fround(0.01),
                  max: Math.fround(1000),
                }),
                status: fc.constantFrom('PENDING', 'COMPLETED', 'CANCELLED'),
                createdAt: fc.date(),
              }),
              { maxLength: 10 },
            ),
            async (userId, orders) => {
              const userOrders = orders.map((order) => ({
                ...order,
                userId,
                orderItems: [],
              }));
              prismaService.order.findMany.mockResolvedValue(userOrders as any);

              const result = await service.findAll(userId);

              expect(result).toHaveLength(userOrders.length);
              expect(result.every((order) => order.userId === userId)).toBe(
                true,
              );
            },
          ),
          { numRuns: 20 },
        );
      });
    });

    describe('Property 25: Order retrieval round-trip', () => {
      it('**Validates: Requirements 5.5**', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }),
            fc.string({ minLength: 1 }),
            fc.record({
              totalPrice: fc.float({
                min: Math.fround(0.01),
                max: Math.fround(1000),
              }),
              status: fc.constantFrom('PENDING', 'COMPLETED', 'CANCELLED'),
              orderItems: fc.array(
                fc.record({
                  bookId: fc.string({ minLength: 1 }),
                  quantity: fc.integer({ min: 1, max: 10 }),
                  price: fc.float({
                    min: Math.fround(0.01),
                    max: Math.fround(100),
                  }),
                }),
                { maxLength: 5 },
              ),
            }),
            async (userId, orderId, orderData) => {
              const mockOrder = {
                id: orderId,
                userId,
                ...orderData,
              };

              prismaService.order.findFirst.mockResolvedValue(mockOrder as any);

              const result = await service.findOne(userId, orderId);

              expect(result.id).toBe(orderId);
              expect(result.userId).toBe(userId);
              expect(result.totalPrice).toBe(orderData.totalPrice);
              expect(result.status).toBe(orderData.status);
            },
          ),
          { numRuns: 20 },
        );
      });
    });

    describe('Property 26: Insufficient stock rejects checkout', () => {
      it('**Validates: Requirements 5.6, 6.5**', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }),
            fc.array(
              fc.record({
                bookId: fc.string({ minLength: 1 }),
                quantity: fc.integer({ min: 5, max: 20 }),
                book: fc.record({
                  id: fc.string({ minLength: 1 }),
                  title: fc.string({ minLength: 1 }),
                  price: fc.float({
                    min: Math.fround(0.01),
                    max: Math.fround(100),
                  }),
                  stock: fc.integer({ min: 1, max: 4 }), // Less than quantity
                }),
              }),
              { minLength: 1, maxLength: 3 },
            ),
            async (userId, cartItems) => {
              const totalPrice = cartItems.reduce(
                (sum, item) => sum + item.book.price * item.quantity,
                0,
              );
              const mockCart = { items: cartItems, totalPrice };

              cartService.getCart.mockResolvedValue(mockCart as any);

              // Mock insufficient stock
              for (const item of cartItems) {
                prismaService.book.findUnique.mockResolvedValueOnce({
                  id: item.bookId,
                  stock: item.book.stock, // Less than requested quantity
                  title: item.book.title,
                } as any);
              }

              await expect(service.create(userId)).rejects.toThrow(
                BadRequestException,
              );
            },
          ),
          { numRuns: 20 },
        );
      });
    });

    describe('Property 22: Order creation reduces stock', () => {
      it('**Validates: Requirements 5.2**', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }),
            fc.array(
              fc.record({
                bookId: fc.string({ minLength: 1 }),
                quantity: fc.integer({ min: 1, max: 5 }),
                book: fc.record({
                  id: fc.string({ minLength: 1 }),
                  title: fc.string({ minLength: 1 }),
                  price: fc.float({
                    min: Math.fround(0.01),
                    max: Math.fround(100),
                  }),
                  stock: fc.integer({ min: 10, max: 100 }),
                }),
              }),
              { minLength: 1, maxLength: 3 },
            ),
            async (userId, cartItems) => {
              const totalPrice = cartItems.reduce(
                (sum, item) => sum + item.book.price * item.quantity,
                0,
              );
              const mockCart = { items: cartItems, totalPrice };
              const mockOrder = {
                id: 'order1',
                userId,
                totalPrice,
                status: 'COMPLETED',
                orderItems: [],
              };

              cartService.getCart.mockResolvedValue(mockCart as any);

              // Mock book stock validation
              for (const item of cartItems) {
                prismaService.book.findUnique.mockResolvedValueOnce({
                  id: item.bookId,
                  stock: item.book.stock,
                  title: item.book.title,
                } as any);
              }

              const mockBookUpdate = jest.fn();
              prismaService.$transaction.mockImplementation(
                async (callback: any) => {
                  return callback({
                    order: {
                      create: jest.fn().mockResolvedValue({
                        id: 'order1',
                        userId,
                        totalPrice,
                        status: 'PENDING',
                      }),
                      update: jest.fn().mockResolvedValue(mockOrder),
                    },
                    orderItem: {
                      create: jest.fn().mockImplementation((data) => ({
                        id: `item${Math.random()}`,
                        ...data.data,
                      })),
                    },
                    book: { update: mockBookUpdate },
                    cartItem: { deleteMany: jest.fn() },
                  } as any);
                },
              );

              await service.create(userId);

              // Verify stock was reduced for each item
              expect(mockBookUpdate).toHaveBeenCalledTimes(cartItems.length);
              cartItems.forEach((item) => {
                expect(mockBookUpdate).toHaveBeenCalledWith({
                  where: { id: item.bookId },
                  data: { stock: { decrement: item.quantity } },
                });
              });
            },
          ),
          { numRuns: 20 },
        );
      });
    });

    describe('Property 23: Order creation clears cart', () => {
      it('**Validates: Requirements 5.3**', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }),
            fc.array(
              fc.record({
                bookId: fc.string({ minLength: 1 }),
                quantity: fc.integer({ min: 1, max: 5 }),
                book: fc.record({
                  id: fc.string({ minLength: 1 }),
                  title: fc.string({ minLength: 1 }),
                  price: fc.float({
                    min: Math.fround(0.01),
                    max: Math.fround(100),
                  }),
                  stock: fc.integer({ min: 10, max: 100 }),
                }),
              }),
              { minLength: 1, maxLength: 3 },
            ),
            async (userId, cartItems) => {
              const totalPrice = cartItems.reduce(
                (sum, item) => sum + item.book.price * item.quantity,
                0,
              );
              const mockCart = { items: cartItems, totalPrice };
              const mockOrder = {
                id: 'order1',
                userId,
                totalPrice,
                status: 'COMPLETED',
                orderItems: [],
              };

              cartService.getCart.mockResolvedValue(mockCart as any);

              // Mock book stock validation
              for (const item of cartItems) {
                prismaService.book.findUnique.mockResolvedValueOnce({
                  id: item.bookId,
                  stock: item.book.stock,
                  title: item.book.title,
                } as any);
              }

              const mockCartClear = jest.fn();
              prismaService.$transaction.mockImplementation(
                async (callback: any) => {
                  return callback({
                    order: {
                      create: jest.fn().mockResolvedValue({
                        id: 'order1',
                        userId,
                        totalPrice,
                        status: 'PENDING',
                      }),
                      update: jest.fn().mockResolvedValue(mockOrder),
                    },
                    orderItem: {
                      create: jest.fn().mockImplementation((data) => ({
                        id: `item${Math.random()}`,
                        ...data.data,
                      })),
                    },
                    book: { update: jest.fn() },
                    cartItem: { deleteMany: mockCartClear },
                  } as any);
                },
              );

              await service.create(userId);

              // Verify cart was cleared
              expect(mockCartClear).toHaveBeenCalledWith({
                where: { userId },
              });
            },
          ),
          { numRuns: 20 },
        );
      });
    });

    describe('Property 28: Stock changes are atomic', () => {
      it('**Validates: Requirements 6.2, 10.3**', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }),
            fc.array(
              fc.record({
                bookId: fc.string({ minLength: 1 }),
                quantity: fc.integer({ min: 1, max: 5 }),
                book: fc.record({
                  id: fc.string({ minLength: 1 }),
                  title: fc.string({ minLength: 1 }),
                  price: fc.float({
                    min: Math.fround(0.01),
                    max: Math.fround(100),
                  }),
                  stock: fc.integer({ min: 10, max: 100 }),
                }),
              }),
              { minLength: 1, maxLength: 3 },
            ),
            async (userId, cartItems) => {
              const totalPrice = cartItems.reduce(
                (sum, item) => sum + item.book.price * item.quantity,
                0,
              );
              const mockCart = { items: cartItems, totalPrice };

              cartService.getCart.mockResolvedValue(mockCart as any);

              // Mock book stock validation
              for (const item of cartItems) {
                prismaService.book.findUnique.mockResolvedValueOnce({
                  id: item.bookId,
                  stock: item.book.stock,
                  title: item.book.title,
                } as any);
              }

              // Verify that $transaction is called, ensuring atomicity
              prismaService.$transaction.mockImplementation(
                async (callback: any) => {
                  return callback({
                    order: {
                      create: jest.fn().mockResolvedValue({
                        id: 'order1',
                        userId,
                        totalPrice,
                        status: 'PENDING',
                      }),
                      update: jest.fn().mockResolvedValue({
                        id: 'order1',
                        userId,
                        totalPrice,
                        status: 'COMPLETED',
                        orderItems: [],
                      }),
                    },
                    orderItem: {
                      create: jest.fn().mockImplementation((data) => ({
                        id: `item${Math.random()}`,
                        ...data.data,
                      })),
                    },
                    book: { update: jest.fn() },
                    cartItem: { deleteMany: jest.fn() },
                  } as any);
                },
              );

              await service.create(userId);

              // Verify transaction was used for atomicity
              expect(prismaService.$transaction).toHaveBeenCalled();
            },
          ),
          { numRuns: 20 },
        );
      });
    });
  });
});
