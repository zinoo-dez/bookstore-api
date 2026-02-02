# Bookstore API

A comprehensive bookstore API built with NestJS, featuring authentication, book management, shopping cart functionality, and order processing.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with role-based access control
- 📚 **Book Management**: CRUD operations for books with search, pagination, and sorting
- 🛒 **Shopping Cart**: Add, update, and remove items from cart with stock validation
- 📦 **Order Processing**: Complete order workflow with stock management and transaction safety
- 📊 **Inventory Management**: Stock status tracking with low stock and out-of-stock alerts
- 📖 **API Documentation**: Comprehensive Swagger/OpenAPI documentation
- 🛡️ **Error Handling**: Global exception handling with consistent error responses
- ✅ **Testing**: Comprehensive unit tests and property-based testing

## Technology Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest with fast-check for property-based testing
- **Validation**: class-validator and class-transformer

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bookstore-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Copy the example environment file and configure your settings:
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/bookstore"
   
   # JWT Configuration
   JWT_SECRET="your-super-secret-jwt-key-here"
   JWT_EXPIRES_IN="24h"
   
   # Server Configuration
   PORT=3000
   NODE_ENV="development"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate deploy
   
   # Seed the database with sample data
   npm run db:seed
   ```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | - | ✅ |
| `JWT_EXPIRES_IN` | JWT token expiration time | `24h` | ❌ |
| `PORT` | Server port number | `3000` | ❌ |
| `NODE_ENV` | Environment mode | `development` | ❌ |
| `CORS_ORIGIN` | CORS allowed origin | - | ❌ |
| `BCRYPT_ROUNDS` | Bcrypt hash rounds (8-15) | `10` | ❌ |
| `SWAGGER_TITLE` | API documentation title | `Bookstore API` | ❌ |
| `SWAGGER_DESCRIPTION` | API documentation description | - | ❌ |
| `SWAGGER_VERSION` | API version | `1.0` | ❌ |
| `SWAGGER_PATH` | Swagger UI path | `api/docs` | ❌ |

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The application will be available at:
- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api/docs

## Database Management

```bash
# Reset database and reseed
npm run db:reset

# Seed database with sample data
npm run db:seed

# Generate Prisma client after schema changes
npx prisma generate

# Create and apply new migration
npx prisma migrate dev --name migration_name
```

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login

### Books
- `GET /books` - Get all books (with search, pagination, sorting)
- `GET /books/:id` - Get book by ID
- `GET /books/:id/stock-availability` - Check stock availability
- `GET /books/inventory/out-of-stock` - Get out-of-stock books (Admin)
- `GET /books/inventory/low-stock` - Get low-stock books (Admin)
- `POST /books` - Create book (Admin)
- `PATCH /books/:id` - Update book (Admin)
- `DELETE /books/:id` - Delete book (Admin)

### Cart
- `GET /cart` - Get user's cart
- `POST /cart` - Add item to cart
- `PATCH /cart/:bookId` - Update cart item quantity
- `DELETE /cart/:bookId` - Remove item from cart

### Orders
- `GET /orders` - Get user's order history
- `GET /orders/:id` - Get specific order
- `POST /orders` - Create order (checkout)

## Sample Data

The seed script creates:
- **1 Admin user**: `admin@bookstore.com` / `admin123`
- **3 Regular users**: `john.doe@example.com` / `user123` (and others)
- **15 Books**: Various categories with different stock levels
- **Sample cart items** and **orders** for testing

## Stock Management

The system includes intelligent stock management:
- **IN_STOCK**: Stock > 5
- **LOW_STOCK**: Stock 1-5
- **OUT_OF_STOCK**: Stock = 0

## Error Handling

The API provides consistent error responses:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.