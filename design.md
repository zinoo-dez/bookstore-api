# Design Document: Bookstore API

## Overview

The Bookstore API is a RESTful web service built with NestJS, PostgreSQL, and Prisma that provides comprehensive e-commerce functionality for a bookstore. The system implements secure authentication, book catalog management, shopping cart operations, order processing, and inventory management with a focus on data integrity, performance, and scalability.

The architecture follows NestJS best practices with a modular structure, dependency injection, and clear separation of concerns. Prisma provides type-safe database access with automatic migrations, while PostgreSQL ensures ACID compliance for critical operations like order processing and inventory updates.

## Architecture

### Technology Stack

- **Framework**: NestJS (Node.js framework with TypeScript)
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5.x
- **Authentication**: JWT (JSON Web Tokens) with Passport.js
- **Validation**: class-validator and class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest for unit tests, property-based testing library for correctness properties

### Module Structure

The application is organized into the following NestJS modules:

1. **AuthModule**: Handles user registration, login, JWT generation and validation
2. **UsersModule**: Manages user data and profiles
3. **BooksModule**: Provides book CRUD operations and search functionality
4. **CartModule**: Manages shopping cart operations
5. **OrdersModule**: Handles order creation and retrieval
6. **DatabaseModule**: Configures Prisma client as a global service

### Request Flow

```
Client Request
    ↓
Guards (JWT Authentication)
    ↓
Controllers (Route handlers)
    ↓
DTOs (Validation)
    ↓
Services (Business logic)
    ↓
Prisma Client (Database access)
    ↓
PostgreSQL Database
```

### Security Model

- **Authentication**: JWT tokens with configurable expiration
- **Authorization**: Role-based access control (RBAC) with User and Admin roles
- **Password Security**: bcrypt hashing with salt rounds
- **Input Validation**: All inputs validated using DTOs with class-validator
- **SQL Injection Prevention**: Prisma's parameterized queries

## Components and Interfaces

### Database Schema (Prisma)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(USER)
  cartItems CartItem[]
  orders    Order[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

enum Role {
  USER
  ADMIN
}

model Book {
  id          String   @id @default(uuid())
  title       String
  author      String
  isbn        String   @unique
  description String?
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  category    String?
  cartItems   CartItem[]
  orderItems  OrderItem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isbn])
  @@index([title])
  @@index([author])
}

model CartItem {
  id        String   @id @default(uuid())
  userId    String
  bookId    String
  quantity  Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, bookId])
  @@index([userId])
}

model Order {
  id              String      @id @default(uuid())
  userId          String
  status          OrderStatus @default(PENDING)
  totalPrice      Decimal     @db.Decimal(10, 2)
  shippingAddress String
  user            User        @relation(fields: [userId], references: [id])
  orderItems      OrderItem[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([userId])
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

model OrderItem {
  id       String  @id @default(uuid())
  orderId  String
  bookId   String
  quantity Int
  price    Decimal @db.Decimal(10, 2)
  order    Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  book     Book    @relation(fields: [bookId], references: [id])

  @@index([orderId])
}
```

### Core DTOs

**Authentication DTOs:**

```typescript
class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

**Book DTOs:**

```typescript
class CreateBookDto {
  @IsString()
  title: string;

  @IsString()
  author: string;

  @IsString()
  isbn: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsString()
  @IsOptional()
  category?: string;
}

class UpdateBookDto extends PartialType(CreateBookDto) {}

class SearchBooksDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(["price", "title", "createdAt"])
  sortBy?: string;

  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: string = "asc";
}
```

**Cart DTOs:**

```typescript
class AddToCartDto {
  @IsString()
  bookId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity: number;
}
```

**Order DTOs:**

```typescript
class CreateOrderDto {
  @IsString()
  @MinLength(10)
  shippingAddress: string;
}
```

### Service Interfaces

**AuthService:**

```typescript
interface AuthService {
  register(dto: RegisterDto): Promise<{ user: User; token: string }>;
  login(dto: LoginDto): Promise<{ user: User; token: string }>;
  validateUser(email: string, password: string): Promise<User | null>;
  generateToken(user: User): string;
}
```

**BooksService:**

```typescript
interface BooksService {
  create(dto: CreateBookDto): Promise<Book>;
  findAll(query: SearchBooksDto): Promise<{ books: Book[]; total: number }>;
  findOne(id: string): Promise<Book>;
  update(id: string, dto: UpdateBookDto): Promise<Book>;
  remove(id: string): Promise<void>;
  search(query: SearchBooksDto): Promise<{ books: Book[]; total: number }>;
}
```

**CartService:**

```typescript
interface CartService {
  addItem(userId: string, dto: AddToCartDto): Promise<CartItem>;
  updateItem(
    userId: string,
    bookId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartItem>;
  removeItem(userId: string, bookId: string): Promise<void>;
  getCart(userId: string): Promise<{ items: CartItem[]; totalPrice: number }>;
  clearCart(userId: string): Promise<void>;
}
```

**OrdersService:**

```typescript
interface OrdersService {
  create(userId: string, dto: CreateOrderDto): Promise<Order>;
  findAll(userId: string): Promise<Order[]>;
  findOne(userId: string, orderId: string): Promise<Order>;
}
```

## Data Models

### User Model

- **id**: UUID primary key
- **email**: Unique email address (indexed)
- **password**: bcrypt hashed password
- **name**: User's full name
- **role**: Enum (USER, ADMIN)
- **Relationships**: One-to-many with CartItem and Order

### Book Model

- **id**: UUID primary key
- **title**: Book title (indexed)
- **author**: Author name (indexed)
- **isbn**: Unique ISBN identifier (indexed)
- **description**: Optional book description
- **price**: Decimal with 2 decimal places
- **stock**: Integer quantity available
- **category**: Optional category classification
- **Relationships**: One-to-many with CartItem and OrderItem

### CartItem Model

- **id**: UUID primary key
- **userId**: Foreign key to User
- **bookId**: Foreign key to Book
- **quantity**: Integer quantity
- **Unique constraint**: (userId, bookId) - one cart item per book per user
- **Relationships**: Many-to-one with User and Book

### Order Model

- **id**: UUID primary key
- **userId**: Foreign key to User (indexed)
- **status**: Enum (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- **totalPrice**: Decimal with 2 decimal places
- **shippingAddress**: Delivery address
- **Relationships**: Many-to-one with User, one-to-many with OrderItem

### OrderItem Model

- **id**: UUID primary key
- **orderId**: Foreign key to Order (indexed)
- **bookId**: Foreign key to Book
- **quantity**: Integer quantity ordered
- **price**: Decimal price at time of order
- **Relationships**: Many-to-one with Order and Book

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Authentication and Authorization Properties

**Property 1: User registration creates account**
_For any_ valid registration data (email, password, name), registering a user should create a user account in the database with the provided details.
**Validates: Requirements 1.1**

**Property 2: Valid login returns JWT token**
_For any_ registered user with valid credentials, logging in should return a valid JWT token that can be used for authentication.
**Validates: Requirements 1.2**

**Property 3: Invalid password rejects login**
_For any_ registered user and incorrect password, login attempts should be rejected with an appropriate error.
**Validates: Requirements 1.3**

**Property 4: Valid JWT authorizes requests**
_For any_ valid JWT token, requests to protected endpoints should be authorized and processed successfully.
**Validates: Requirements 1.4**

**Property 5: Passwords are hashed**
_For any_ user registration, the password stored in the database should be hashed (not equal to the plaintext password).
**Validates: Requirements 1.5**

**Property 6: Duplicate email registration rejected**
_For any_ existing user email, attempting to register a new user with the same email should be rejected with an error.
**Validates: Requirements 1.6**

### Book Management Properties

**Property 7: Admin can create books**
_For any_ valid book data and admin user, creating a book should add it to the database with all provided details.
**Validates: Requirements 2.1**

**Property 8: Admin can update books**
_For any_ existing book and valid update data, updating the book should modify the database record with the new values.
**Validates: Requirements 2.2, 6.4**

**Property 9: Admin can delete books**
_For any_ existing book, deleting it should remove the book from the database.
**Validates: Requirements 2.3**

**Property 10: Book retrieval round-trip**
_For any_ created book, retrieving it by ID should return a book with all the same field values.
**Validates: Requirements 2.4**

**Property 11: Search returns matching books**
_For any_ search query (by title, author, ISBN, or category), all returned books should match the search criteria.
**Validates: Requirements 2.5, 3.2, 3.3, 3.4**

**Property 12: Non-admin users cannot manage books**
_For any_ non-admin user, attempts to create, update, or delete books should be rejected with a 403 authorization error.
**Validates: Requirements 2.6, 7.4**

### Book Browsing Properties

**Property 13: Pagination returns correct subset**
_For any_ page number and page size, the returned books should be the correct subset of all books, and the total count should match the actual number of books.
**Validates: Requirements 3.1, 3.6**

**Property 14: Sorting produces correct order**
_For any_ sort field (price, title, createdAt) and sort direction (asc, desc), the returned books should be in the correct order according to that field.
**Validates: Requirements 3.5**

### Shopping Cart Properties

**Property 15: Adding to cart creates or updates item**
_For any_ user and book, adding the book to the cart should create a new cart item or update the quantity if it already exists.
**Validates: Requirements 4.1**

**Property 16: Updating cart item changes quantity**
_For any_ existing cart item, updating its quantity should modify the cart item's quantity in the database.
**Validates: Requirements 4.2**

**Property 17: Removing from cart deletes item**
_For any_ existing cart item, removing it should delete the cart item from the database.
**Validates: Requirements 4.3**

**Property 18: Cart retrieval returns correct items and total**
_For any_ user with cart items, retrieving the cart should return all cart items with book details and the correct total price (sum of item prices × quantities).
**Validates: Requirements 4.4**

**Property 19: Insufficient stock rejects cart addition**
_For any_ book and quantity exceeding available stock, attempting to add that quantity to the cart should be rejected with an error.
**Validates: Requirements 4.5**

**Property 20: Cart items are user-isolated**
_For any_ two different users, each user's cart should only contain their own cart items and not items from other users.
**Validates: Requirements 4.6**

### Order Processing Properties

**Property 21: Valid checkout creates order**
_For any_ user with valid cart items and shipping address, placing an order should create an order record with all cart items as order items.
**Validates: Requirements 5.1**

**Property 22: Order creation reduces stock**
_For any_ order, the stock quantity of each ordered book should decrease by the ordered quantity after the order is created.
**Validates: Requirements 5.2**

**Property 23: Order creation clears cart**
_For any_ user, after successfully placing an order, the user's cart should be empty.
**Validates: Requirements 5.3**

**Property 24: Order history returns all orders**
_For any_ user with orders, retrieving order history should return all orders belonging to that user.
**Validates: Requirements 5.4**

**Property 25: Order retrieval round-trip**
_For any_ created order, retrieving it by ID should return an order with all the same field values and order items.
**Validates: Requirements 5.5**

**Property 26: Insufficient stock rejects checkout**
_For any_ cart with items where any item's quantity exceeds available stock, attempting to place an order should be rejected with an error.
**Validates: Requirements 5.6, 6.5**

### Inventory Management Properties

**Property 27: Negative stock is rejected**
_For any_ book creation or update with negative stock quantity, the operation should be rejected with a validation error.
**Validates: Requirements 6.1**

**Property 28: Stock changes are atomic**
_For any_ order placement, if the operation fails at any point, stock quantities should remain unchanged (transaction rollback).
**Validates: Requirements 6.2, 10.3**

**Property 29: Zero stock marks book unavailable**
_For any_ book, when its stock reaches zero, the book should be marked as out of stock or unavailable for purchase.
**Validates: Requirements 6.3**

### Error Handling Properties

**Property 30: Invalid input returns 400 error**
_For any_ endpoint and invalid input data (violating DTO validation rules), the API should return a 400 Bad Request error with descriptive messages.
**Validates: Requirements 7.1, 7.6**

**Property 31: Missing resource returns 404 error**
_For any_ resource lookup with a non-existent ID, the API should return a 404 Not Found error.
**Validates: Requirements 7.2**

### API Documentation Properties

**Property 32: Swagger documentation is accessible**
_When_ accessing the /api/docs endpoint, the API should return Swagger/OpenAPI documentation.
**Validates: Requirements 9.1**

## Error Handling

### Validation Errors

- All DTOs use class-validator decorators for input validation
- Validation errors return 400 status with detailed error messages
- Each field error includes the field name, value, and constraint violated

### Business Logic Errors

- Insufficient stock: 400 Bad Request with stock availability details
- Duplicate email: 409 Conflict with message indicating email already exists
- Unauthorized access: 401 Unauthorized for missing/invalid tokens
- Forbidden access: 403 Forbidden for insufficient permissions

### Database Errors

- Unique constraint violations: 409 Conflict
- Foreign key violations: 400 Bad Request
- Connection errors: 500 Internal Server Error with generic message (details logged)

### Error Response Format

```typescript
{
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

### Global Exception Filter

- Catches all unhandled exceptions
- Logs error details with stack traces
- Returns sanitized error responses to clients
- Prevents sensitive information leakage

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property-based tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property-based tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Library**: fast-check (TypeScript property-based testing library)

**Configuration**:

- Minimum 100 iterations per property test
- Each test tagged with format: **Feature: bookstore-api, Property {number}: {property_text}**
- Each correctness property implemented by a single property-based test

**Test Organization**:

```
src/
  auth/
    auth.service.spec.ts (unit tests)
    auth.properties.spec.ts (property tests)
  books/
    books.service.spec.ts (unit tests)
    books.properties.spec.ts (property tests)
  cart/
    cart.service.spec.ts (unit tests)
    cart.properties.spec.ts (property tests)
  orders/
    orders.service.spec.ts (unit tests)
    orders.properties.spec.ts (property tests)
```

**Property Test Examples**:

```typescript
// Feature: bookstore-api, Property 1: User registration creates account
describe("Property 1: User registration creates account", () => {
  it("should create account for any valid registration data", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8 }),
          name: fc.string({ minLength: 2 }),
        }),
        async (userData) => {
          const result = await authService.register(userData);
          expect(result.user.email).toBe(userData.email);
          expect(result.user.name).toBe(userData.name);
          expect(result.token).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: bookstore-api, Property 11: Search returns matching books
describe("Property 11: Search returns matching books", () => {
  it("should return only books matching search criteria", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (searchTerm) => {
        const results = await booksService.search({ title: searchTerm });
        results.books.forEach((book) => {
          expect(book.title.toLowerCase()).toContain(searchTerm.toLowerCase());
        });
      }),
      { numRuns: 100 },
    );
  });
});
```

### Unit Testing

**Framework**: Jest

**Coverage Goals**:

- Service methods: 90%+ coverage
- Controllers: 80%+ coverage
- Guards and middleware: 100% coverage

**Test Categories**:

1. **Happy path tests**: Verify correct behavior with valid inputs
2. **Edge case tests**: Empty arrays, boundary values, special characters
3. **Error condition tests**: Invalid inputs, missing resources, authorization failures
4. **Integration tests**: Test interactions between services

**Unit Test Examples**:

```typescript
describe("BooksService", () => {
  describe("create", () => {
    it("should create a book with valid data", async () => {
      const dto = {
        title: "Test Book",
        author: "Test Author",
        isbn: "1234567890",
        price: 29.99,
        stock: 10,
      };
      const book = await service.create(dto);
      expect(book.title).toBe(dto.title);
      expect(book.author).toBe(dto.author);
    });

    it("should reject book with duplicate ISBN", async () => {
      const dto = { isbn: "1234567890" /* ... */ };
      await service.create(dto);
      await expect(service.create(dto)).rejects.toThrow();
    });
  });
});
```

### Test Database

- Use separate test database or in-memory SQLite for tests
- Reset database state between tests
- Use Prisma migrations for test database schema
- Seed test data as needed for specific tests

### E2E Testing

- Test complete request/response cycles
- Use supertest for HTTP request testing
- Test authentication flows end-to-end
- Verify database state after operations

### Continuous Integration

- Run all tests on every commit
- Enforce minimum coverage thresholds
- Run property tests with increased iterations in CI (500+)
- Fail builds on test failures or coverage drops
