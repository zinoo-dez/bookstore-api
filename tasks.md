# Implementation Plan: Bookstore API

## Overview

This implementation plan breaks down the bookstore API into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to validate correctness early. The implementation follows NestJS best practices with Prisma for database access.

## Tasks

- [x] 1. Initialize NestJS project and configure dependencies
  - Create new NestJS project with TypeScript
  - Install dependencies: @nestjs/jwt, @nestjs/passport, passport-jwt, bcrypt, @prisma/client, prisma, class-validator, class-transformer, @nestjs/swagger, fast-check
  - Configure TypeScript with strict mode
  - Set up ESLint and Prettier
  - _Requirements: All_

- [x] 2. Set up Prisma and database schema
  - Initialize Prisma with PostgreSQL
  - Create Prisma schema with User, Book, CartItem, Order, OrderItem models
  - Define enums for Role and OrderStatus
  - Add indexes on email, isbn, title, author, userId, orderId
  - Add unique constraints and foreign key relationships
  - Generate Prisma client
  - Create initial migration
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 10.1_

- [x] 3. Create database module and Prisma service
  - Create DatabaseModule as a global module
  - Create PrismaService extending PrismaClient
  - Implement connection lifecycle hooks (onModuleInit, enableShutdownHooks)
  - Export PrismaService for use in other modules
  - _Requirements: 8.7, 10.2_

- [x] 4. Implement authentication module
  - [x] 4.1 Create AuthModule, AuthService, and AuthController
    - Create DTOs: RegisterDto, LoginDto
    - Implement user registration with bcrypt password hashing
    - Implement login with password validation
    - Implement JWT token generation
    - Create auth endpoints: POST /auth/register, POST /auth/login
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

  - [x]\* 4.2 Write property test for user registration (Property 1)
    - **Property 1: User registration creates account**
    - **Validates: Requirements 1.1**

  - [x]\* 4.3 Write property test for valid login (Property 2)
    - **Property 2: Valid login returns JWT token**
    - **Validates: Requirements 1.2**

  - [x]\* 4.4 Write property test for invalid password (Property 3)
    - **Property 3: Invalid password rejects login**
    - **Validates: Requirements 1.3**

  - [x]\* 4.5 Write property test for password hashing (Property 5)
    - **Property 5: Passwords are hashed**
    - **Validates: Requirements 1.5**

  - [x]\* 4.6 Write property test for duplicate email (Property 6)
    - **Property 6: Duplicate email registration rejected**
    - **Validates: Requirements 1.6**

  - [x]\* 4.7 Write unit tests for AuthService
    - Test registration with valid data
    - Test login with valid credentials
    - Test login with invalid credentials
    - Test duplicate email handling
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

- [x] 5. Implement JWT authentication guards
  - [x] 5.1 Create JWT strategy and guards
    - Create JwtStrategy extending PassportStrategy
    - Create JwtAuthGuard using @nestjs/passport
    - Create RolesGuard for role-based authorization
    - Create Roles decorator for marking protected routes
    - Configure JWT module with secret and expiration
    - _Requirements: 1.4, 2.6_

  - [x]\* 5.2 Write property test for JWT authorization (Property 4)
    - **Property 4: Valid JWT authorizes requests**
    - **Validates: Requirements 1.4**

  - [x]\* 5.3 Write unit tests for guards
    - Test JwtAuthGuard with valid token
    - Test JwtAuthGuard with invalid token
    - Test RolesGuard with admin role
    - Test RolesGuard with user role
    - _Requirements: 1.4, 2.6_

- [x] 6. Checkpoint - Ensure authentication tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement books module
  - [x] 7.1 Create BooksModule, BooksService, and BooksController
    - Create DTOs: CreateBookDto, UpdateBookDto, SearchBooksDto
    - Implement CRUD operations: create, findAll, findOne, update, remove
    - Implement search with filters (title, author, category, ISBN)
    - Implement pagination and sorting
    - Protect admin routes with RolesGuard
    - Create endpoints: POST /books, GET /books, GET /books/:id, PATCH /books/:id, DELETE /books/:id
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]\* 7.2 Write property test for book creation (Property 7)
    - **Property 7: Admin can create books**
    - **Validates: Requirements 2.1**

  - [ ]\* 7.3 Write property test for book updates (Property 8)
    - **Property 8: Admin can update books**
    - **Validates: Requirements 2.2, 6.4**

  - [ ]\* 7.4 Write property test for book deletion (Property 9)
    - **Property 9: Admin can delete books**
    - **Validates: Requirements 2.3**

  - [ ]\* 7.5 Write property test for book retrieval (Property 10)
    - **Property 10: Book retrieval round-trip**
    - **Validates: Requirements 2.4**

  - [ ]\* 7.6 Write property test for search (Property 11)
    - **Property 11: Search returns matching books**
    - **Validates: Requirements 2.5, 3.2, 3.3, 3.4**

  - [ ]\* 7.7 Write property test for authorization (Property 12)
    - **Property 12: Non-admin users cannot manage books**
    - **Validates: Requirements 2.6, 7.4**

  - [ ]\* 7.8 Write property test for pagination (Property 13)
    - **Property 13: Pagination returns correct subset**
    - **Validates: Requirements 3.1, 3.6**

  - [ ]\* 7.9 Write property test for sorting (Property 14)
    - **Property 14: Sorting produces correct order**
    - **Validates: Requirements 3.5**

  - [ ]\* 7.10 Write property test for negative stock validation (Property 27)
    - **Property 27: Negative stock is rejected**
    - **Validates: Requirements 6.1**

  - [ ]\* 7.11 Write unit tests for BooksService
    - Test book creation with valid data
    - Test book update with partial data
    - Test book deletion
    - Test search with various filters
    - Test pagination edge cases (empty results, last page)
    - Test sorting by different fields
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.5_

- [ ] 8. Checkpoint - Ensure books module tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement cart module
  - [ ] 9.1 Create CartModule, CartService, and CartController
    - Create DTOs: AddToCartDto, UpdateCartItemDto
    - Implement addItem with stock validation
    - Implement updateItem for quantity changes
    - Implement removeItem for cart item deletion
    - Implement getCart with total price calculation
    - Implement clearCart for order processing
    - Protect all routes with JwtAuthGuard
    - Create endpoints: POST /cart, PATCH /cart/:bookId, DELETE /cart/:bookId, GET /cart
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]\* 9.2 Write property test for adding to cart (Property 15)
    - **Property 15: Adding to cart creates or updates item**
    - **Validates: Requirements 4.1**

  - [ ]\* 9.3 Write property test for updating cart item (Property 16)
    - **Property 16: Updating cart item changes quantity**
    - **Validates: Requirements 4.2**

  - [ ]\* 9.4 Write property test for removing from cart (Property 17)
    - **Property 17: Removing from cart deletes item**
    - **Validates: Requirements 4.3**

  - [ ]\* 9.5 Write property test for cart retrieval (Property 18)
    - **Property 18: Cart retrieval returns correct items and total**
    - **Validates: Requirements 4.4**

  - [ ]\* 9.6 Write property test for insufficient stock (Property 19)
    - **Property 19: Insufficient stock rejects cart addition**
    - **Validates: Requirements 4.5**

  - [ ]\* 9.7 Write property test for cart isolation (Property 20)
    - **Property 20: Cart items are user-isolated**
    - **Validates: Requirements 4.6**

  - [ ]\* 9.8 Write unit tests for CartService
    - Test adding item to empty cart
    - Test adding duplicate item (quantity update)
    - Test updating cart item quantity
    - Test removing cart item
    - Test getting cart with multiple items
    - Test total price calculation
    - Test stock validation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 10. Checkpoint - Ensure cart module tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement orders module
  - [ ] 11.1 Create OrdersModule, OrdersService, and OrdersController
    - Create DTOs: CreateOrderDto
    - Implement create order with transaction (create order, create order items, reduce stock, clear cart)
    - Implement stock validation before order creation
    - Implement findAll for user's order history
    - Implement findOne for specific order retrieval
    - Protect all routes with JwtAuthGuard
    - Create endpoints: POST /orders, GET /orders, GET /orders/:id
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.2, 10.3_

  - [ ]\* 11.2 Write property test for order creation (Property 21)
    - **Property 21: Valid checkout creates order**
    - **Validates: Requirements 5.1**

  - [ ]\* 11.3 Write property test for stock reduction (Property 22)
    - **Property 22: Order creation reduces stock**
    - **Validates: Requirements 5.2**

  - [ ]\* 11.4 Write property test for cart clearing (Property 23)
    - **Property 23: Order creation clears cart**
    - **Validates: Requirements 5.3**

  - [ ]\* 11.5 Write property test for order history (Property 24)
    - **Property 24: Order history returns all orders**
    - **Validates: Requirements 5.4**

  - [ ]\* 11.6 Write property test for order retrieval (Property 25)
    - **Property 25: Order retrieval round-trip**
    - **Validates: Requirements 5.5**

  - [ ]\* 11.7 Write property test for checkout validation (Property 26)
    - **Property 26: Insufficient stock rejects checkout**
    - **Validates: Requirements 5.6, 6.5**

  - [ ]\* 11.8 Write property test for atomic stock changes (Property 28)
    - **Property 28: Stock changes are atomic**
    - **Validates: Requirements 6.2, 10.3**

  - [ ]\* 11.9 Write unit tests for OrdersService
    - Test order creation with valid cart
    - Test order creation with empty cart
    - Test order creation with insufficient stock
    - Test stock reduction after order
    - Test cart clearing after order
    - Test order history retrieval
    - Test specific order retrieval
    - Test transaction rollback on error
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 12. Checkpoint - Ensure orders module tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement global error handling and validation
  - [ ] 13.1 Create global exception filter and validation pipe
    - Create AllExceptionsFilter to catch and format all errors
    - Configure ValidationPipe globally with transform and whitelist options
    - Add error logging with timestamps and request details
    - Implement custom error response format
    - _Requirements: 7.1, 7.2, 7.5, 7.6_

  - [ ]\* 13.2 Write property test for validation errors (Property 30)
    - **Property 30: Invalid input returns 400 error**
    - **Validates: Requirements 7.1, 7.6**

  - [ ]\* 13.3 Write property test for not found errors (Property 31)
    - **Property 31: Missing resource returns 404 error**
    - **Validates: Requirements 7.2**

  - [ ]\* 13.4 Write unit tests for error handling
    - Test validation errors with invalid DTOs
    - Test 404 errors for missing resources
    - Test 401 errors for missing auth
    - Test 403 errors for insufficient permissions
    - Test error response format
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 14. Implement Swagger API documentation
  - [ ] 14.1 Configure Swagger module
    - Install @nestjs/swagger
    - Configure SwaggerModule in main.ts
    - Add API decorators to all controllers (@ApiTags, @ApiOperation, @ApiResponse)
    - Add DTO decorators (@ApiProperty)
    - Add authentication decorators (@ApiBearerAuth)
    - Expose documentation at /api/docs
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]\* 14.2 Write test for Swagger endpoint (Property 32)
    - **Property 32: Swagger documentation is accessible**
    - **Validates: Requirements 9.1**

- [ ] 15. Implement inventory management features
  - [ ] 15.1 Add stock status tracking
    - Add computed field or method to check if book is in stock
    - Update book responses to include stock status
    - Implement logic to mark books as out of stock when stock reaches zero
    - _Requirements: 6.3_

  - [ ]\* 15.2 Write property test for zero stock (Property 29)
    - **Property 29: Zero stock marks book unavailable**
    - **Validates: Requirements 6.3**

  - [ ]\* 15.3 Write unit tests for inventory features
    - Test stock status calculation
    - Test out of stock marking
    - Test stock availability checks
    - _Requirements: 6.3_

- [ ] 16. Create database seed script
  - Create seed.ts script to populate database with sample data
  - Add sample users (admin and regular users)
  - Add sample books across different categories
  - Add script to package.json
  - _Requirements: All (for testing and demo)_

- [ ] 17. Set up environment configuration
  - Create .env.example with all required variables
  - Configure ConfigModule for environment variables
  - Add validation for required environment variables
  - Document environment variables in README
  - _Requirements: All_

- [ ] 18. Final integration and E2E tests
  - [ ] 18.1 Write E2E tests for complete user flows
    - Test complete registration → login → browse books → add to cart → checkout flow
    - Test admin book management flow
    - Test error scenarios across modules
    - _Requirements: All_

  - [ ] 18.2 Run all tests and verify coverage
    - Run unit tests and verify 80%+ coverage
    - Run property tests with 100+ iterations
    - Run E2E tests
    - Fix any failing tests
    - _Requirements: All_

- [ ] 19. Final checkpoint - Complete implementation
  - Ensure all tests pass, verify API documentation is complete, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout development
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- All database operations use Prisma for type safety
- Transactions ensure data consistency for multi-step operations
