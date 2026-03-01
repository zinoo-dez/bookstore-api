import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as fc from 'fast-check';
import { BookPurchaseFormat } from '@prisma/client';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

describe('CartService', () => {
  let service: CartService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            book: {
              findUnique: jest.fn(),
            },
            cartItem: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findMany: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
    (prismaService.user.findUnique as jest.Mock).mockImplementation(
      async ({ where }: { where: { id: string } }) => ({
        id: where.id,
      }),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Property Tests', () => {
    /**
     * **Property 15: Adding to cart creates or updates item**
     * **Validates: Requirements 4.1**
     */
    it('Property 15: Adding to cart creates or updates item', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            bookId: fc.uuid(),
            quantity: fc.integer({ min: 1, max: 10 }),
            bookStock: fc.integer({ min: 10, max: 100 }),
          }),
          async (testData) => {
            // Arrange: Mock book with sufficient stock
            const mockBook = {
              id: testData.bookId,
              title: 'Test Book',
              author: 'Test Author',
              isbn: '1234567890',
              price: 19.99,
              stock: testData.bookStock,
              description: 'Test description',
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const addToCartDto: AddToCartDto = {
              bookId: testData.bookId,
              quantity: testData.quantity,
            };

            const mockCartItem = {
              id: 'cart-item-id',
              userId: testData.userId,
              bookId: testData.bookId,
              quantity: testData.quantity,
              createdAt: new Date(),
              updatedAt: new Date(),
              book: mockBook,
            };

            (prismaService.book.findUnique as jest.Mock).mockResolvedValue(
              mockBook,
            );
            (prismaService.cartItem.findUnique as jest.Mock).mockResolvedValue(
              null,
            ); // No existing item
            (prismaService.cartItem.create as jest.Mock).mockResolvedValue(
              mockCartItem,
            );

            // Act: Add item to cart
            const result = await service.addItem(testData.userId, addToCartDto);

            // Assert: Item is added to cart
            expect(prismaService.book.findUnique).toHaveBeenCalledWith({
              where: { id: testData.bookId },
            });
            expect(prismaService.cartItem.create).toHaveBeenCalledWith({
              data: {
                userId: testData.userId,
                bookId: testData.bookId,
                format: BookPurchaseFormat.PHYSICAL,
                quantity: testData.quantity,
              },
              include: { book: true },
            });
            expect(result).toEqual(mockCartItem);
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);

    /**
     * **Property 16: Updating cart item changes quantity**
     * **Validates: Requirements 4.2**
     */
    it('Property 16: Updating cart item changes quantity', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            bookId: fc.uuid(),
            oldQuantity: fc.integer({ min: 1, max: 5 }),
            newQuantity: fc.integer({ min: 1, max: 10 }),
            bookStock: fc.integer({ min: 15, max: 100 }),
          }),
          async (testData) => {
            // Arrange: Mock existing cart item and book
            const mockBook = {
              id: testData.bookId,
              title: 'Test Book',
              author: 'Test Author',
              isbn: '1234567890',
              price: 19.99,
              stock: testData.bookStock,
              description: 'Test description',
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const existingCartItem = {
              id: 'cart-item-id',
              userId: testData.userId,
              bookId: testData.bookId,
              quantity: testData.oldQuantity,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const updatedCartItem = {
              ...existingCartItem,
              quantity: testData.newQuantity,
              book: mockBook,
            };

            const updateDto: UpdateCartItemDto = {
              quantity: testData.newQuantity,
            };

            (prismaService.book.findUnique as jest.Mock).mockResolvedValue(
              mockBook,
            );
            (prismaService.cartItem.findUnique as jest.Mock).mockResolvedValue(
              existingCartItem,
            );
            (prismaService.cartItem.update as jest.Mock).mockResolvedValue(
              updatedCartItem,
            );

            // Act: Update cart item
            const result = await service.updateItem(
              testData.userId,
              testData.bookId,
              BookPurchaseFormat.PHYSICAL,
              updateDto,
            );

            // Assert: Cart item quantity is updated
            expect(prismaService.cartItem.update).toHaveBeenCalledWith({
              where: { id: existingCartItem.id },
              data: { quantity: testData.newQuantity },
              include: { book: true },
            });
            expect(result.quantity).toBe(testData.newQuantity);
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);

    /**
     * **Property 17: Removing from cart deletes item**
     * **Validates: Requirements 4.3**
     */
    it('Property 17: Removing from cart deletes item', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            bookId: fc.uuid(),
          }),
          async (testData) => {
            // Arrange: Mock existing cart item
            const mockBook = {
              id: testData.bookId,
              title: 'Test Book',
              author: 'Test Author',
              isbn: '1234567890',
              price: 19.99,
              stock: 10,
              description: 'Test description',
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const existingCartItem = {
              id: 'cart-item-id',
              userId: testData.userId,
              bookId: testData.bookId,
              quantity: 2,
              createdAt: new Date(),
              updatedAt: new Date(),
              book: mockBook,
            };

            (prismaService.cartItem.findUnique as jest.Mock).mockResolvedValue(
              existingCartItem,
            );
            (prismaService.cartItem.delete as jest.Mock).mockResolvedValue(
              existingCartItem,
            );

            // Act: Remove item from cart
            const result = await service.removeItem(
              testData.userId,
              testData.bookId,
              BookPurchaseFormat.PHYSICAL,
            );

            // Assert: Cart item is deleted
            expect(prismaService.cartItem.delete).toHaveBeenCalledWith({
              where: { id: existingCartItem.id },
              include: { book: true },
            });
            expect(result).toEqual(existingCartItem);
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);

    /**
     * **Property 18: Cart retrieval returns correct items and total**
     * **Validates: Requirements 4.4**
     */
    it('Property 18: Cart retrieval returns correct items and total', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            itemCount: fc.integer({ min: 1, max: 5 }),
          }),
          async (testData) => {
            // Arrange: Mock cart items with books
            const mockCartItems = Array.from(
              { length: testData.itemCount },
              (_, i) => ({
                id: `cart-item-${i}`,
                userId: testData.userId,
                bookId: `book-${i}`,
                format: BookPurchaseFormat.PHYSICAL,
                quantity: i + 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                book: {
                  id: `book-${i}`,
                  title: `Book ${i}`,
                  author: 'Test Author',
                  isbn: `123456789${i}`,
                  price: 10.0 + i,
                  stock: 10,
                  description: `Description ${i}`,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              }),
            );

            // Calculate expected total
            const expectedTotal = mockCartItems.reduce((total, item) => {
              return total + Number(item.book.price) * item.quantity;
            }, 0);

            (prismaService.cartItem.findMany as jest.Mock).mockResolvedValue(
              mockCartItems,
            );

            // Act: Get cart
            const result = await service.getCart(testData.userId);

            // Assert: Cart contains correct items and total
            expect(result.items).toEqual(
              mockCartItems.map((item) => ({
                ...item,
                unitPrice: Number(item.book.price),
              })),
            );
            expect(result.totalPrice).toBe(Number(expectedTotal.toFixed(2)));
            expect(prismaService.cartItem.findMany).toHaveBeenCalledWith({
              where: { userId: testData.userId },
              include: { book: true },
            });
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);

    /**
     * **Property 19: Insufficient stock rejects cart addition**
     * **Validates: Requirements 4.5**
     */
    it('Property 19: Insufficient stock rejects cart addition', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            bookId: fc.uuid(),
            requestedQuantity: fc.integer({ min: 10, max: 20 }),
            availableStock: fc.integer({ min: 1, max: 9 }),
          }),
          async (testData) => {
            // Arrange: Mock book with insufficient stock
            const mockBook = {
              id: testData.bookId,
              title: 'Test Book',
              author: 'Test Author',
              isbn: '1234567890',
              price: 19.99,
              stock: testData.availableStock,
              description: 'Test description',
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const addToCartDto: AddToCartDto = {
              bookId: testData.bookId,
              quantity: testData.requestedQuantity,
            };

            (prismaService.book.findUnique as jest.Mock).mockResolvedValue(
              mockBook,
            );

            // Act & Assert: Adding item should be rejected due to insufficient stock
            await expect(
              service.addItem(testData.userId, addToCartDto),
            ).rejects.toThrow('Insufficient stock available');

            expect(prismaService.cartItem.create).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);

    /**
     * **Property 20: Cart items are user-isolated**
     * **Validates: Requirements 4.6**
     */
    it('Property 20: Cart items are user-isolated', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            user1Id: fc.uuid(),
            user2Id: fc.uuid(),
          }),
          async (testData) => {
            // Ensure different user IDs
            fc.pre(testData.user1Id !== testData.user2Id);

            // Arrange: Mock cart items for user1 only
            const user1CartItems = [
              {
                id: 'cart-item-1',
                userId: testData.user1Id,
                bookId: 'book-1',
                quantity: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                book: {
                  id: 'book-1',
                  title: 'User 1 Book',
                  author: 'Test Author',
                  isbn: '1234567890',
                  price: 19.99,
                  stock: 10,
                  description: 'Test description',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            ];

            (prismaService.cartItem.findMany as jest.Mock).mockImplementation(
              ({ where }) => {
                if (where.userId === testData.user1Id) {
                  return Promise.resolve(user1CartItems);
                }
                return Promise.resolve([]);
              },
            );

            // Act: Get carts for both users
            const user1Cart = await service.getCart(testData.user1Id);
            const user2Cart = await service.getCart(testData.user2Id);

            // Assert: Users see only their own cart items
            expect(user1Cart.items).toHaveLength(1);
            expect(user1Cart.items[0].userId).toBe(testData.user1Id);
            expect(user2Cart.items).toHaveLength(0);
            expect(user2Cart.totalPrice).toBe(0);
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);
  });

  describe('Unit Tests', () => {
    describe('addItem', () => {
      it('should add new item to cart', async () => {
        // Arrange
        const userId = 'user-id';
        const addToCartDto: AddToCartDto = {
          bookId: 'book-id',
          quantity: 2,
        };

        const mockBook = {
          id: 'book-id',
          title: 'Test Book',
          author: 'Test Author',
          isbn: '1234567890',
          price: 19.99,
          stock: 10,
          description: 'Test description',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const mockCartItem = {
          id: 'cart-item-id',
          userId,
          bookId: 'book-id',
          format: BookPurchaseFormat.PHYSICAL,
          quantity: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          book: mockBook,
        };

        (prismaService.book.findUnique as jest.Mock).mockResolvedValue(
          mockBook,
        );
        (prismaService.cartItem.findUnique as jest.Mock).mockResolvedValue(
          null,
        );
        (prismaService.cartItem.create as jest.Mock).mockResolvedValue(
          mockCartItem,
        );

        // Act
        const result = await service.addItem(userId, addToCartDto);

        // Assert
        expect(result).toEqual(mockCartItem);
        expect(prismaService.cartItem.create).toHaveBeenCalledWith({
          data: {
            userId,
            bookId: 'book-id',
            format: BookPurchaseFormat.PHYSICAL,
            quantity: 2,
          },
          include: { book: true },
        });
      });

      it('should update existing cart item quantity', async () => {
        // Arrange
        const userId = 'user-id';
        const addToCartDto: AddToCartDto = {
          bookId: 'book-id',
          quantity: 3,
        };

        const mockBook = {
          id: 'book-id',
          stock: 10,
          price: 19.99,
        };

        const existingCartItem = {
          id: 'cart-item-id',
          userId,
          bookId: 'book-id',
          format: BookPurchaseFormat.PHYSICAL,
          quantity: 2,
        };

        const updatedCartItem = {
          ...existingCartItem,
          quantity: 5, // 2 + 3
          book: mockBook,
        };

        (prismaService.book.findUnique as jest.Mock).mockResolvedValue(
          mockBook,
        );
        (prismaService.cartItem.findUnique as jest.Mock).mockResolvedValue(
          existingCartItem,
        );
        (prismaService.cartItem.update as jest.Mock).mockResolvedValue(
          updatedCartItem,
        );

        // Act
        const result = await service.addItem(userId, addToCartDto);

        // Assert
        expect(result.quantity).toBe(5);
        expect(prismaService.cartItem.update).toHaveBeenCalledWith({
          where: { id: existingCartItem.id },
          data: { quantity: 5 },
          include: { book: true },
        });
      });

      it('should throw NotFoundException when book not found', async () => {
        // Arrange
        const userId = 'user-id';
        const addToCartDto: AddToCartDto = {
          bookId: 'non-existent-book',
          quantity: 1,
        };

        (prismaService.book.findUnique as jest.Mock).mockResolvedValue(null);

        // Act & Assert
        await expect(service.addItem(userId, addToCartDto)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw BadRequestException when insufficient stock', async () => {
        // Arrange
        const userId = 'user-id';
        const addToCartDto: AddToCartDto = {
          bookId: 'book-id',
          quantity: 10,
        };

        const mockBook = {
          id: 'book-id',
          stock: 5, // Less than requested quantity
        };

        (prismaService.book.findUnique as jest.Mock).mockResolvedValue(
          mockBook,
        );

        // Act & Assert
        await expect(service.addItem(userId, addToCartDto)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('getCart', () => {
      it('should return cart with correct total price', async () => {
        // Arrange
        const userId = 'user-id';
        const mockCartItems = [
          {
            id: 'item-1',
            userId,
            bookId: 'book-1',
            format: BookPurchaseFormat.PHYSICAL,
            quantity: 2,
            book: { price: 10.5 },
          },
          {
            id: 'item-2',
            userId,
            bookId: 'book-2',
            format: BookPurchaseFormat.PHYSICAL,
            quantity: 1,
            book: { price: 15.99 },
          },
        ];

        (prismaService.cartItem.findMany as jest.Mock).mockResolvedValue(
          mockCartItems,
        );

        // Act
        const result = await service.getCart(userId);

        // Assert
        expect(result.items).toEqual(
          mockCartItems.map((item) => ({
            ...item,
            unitPrice: Number(item.book.price),
          })),
        );
        expect(result.totalPrice).toBe(36.99); // (10.50 * 2) + (15.99 * 1)
      });
    });

    describe('clearCart', () => {
      it('should delete all cart items for user', async () => {
        // Arrange
        const userId = 'user-id';
        (prismaService.cartItem.deleteMany as jest.Mock).mockResolvedValue({
          count: 3,
        });

        // Act
        await service.clearCart(userId);

        // Assert
        expect(prismaService.cartItem.deleteMany).toHaveBeenCalledWith({
          where: { userId },
        });
      });
    });
  });
});
