# Bookstore Application

A full-stack bookstore application with NestJS backend and React frontend.

## Project Structure

```
bookstore-api/
├── backend/          # NestJS API server
│   ├── src/         # Source code
│   ├── prisma/      # Database schema and migrations
│   ├── test/        # E2E tests
│   └── ...          # Configuration files
├── frontend/        # React frontend application
│   ├── src/         # Source code
│   └── ...          # Configuration files
├── README.md        # This file
└── .gitignore       # Git ignore rules
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Seed the database:
```bash
npm run db:seed
```

6. Start the backend server:
```bash
npm run start:dev
```

Backend will be available at http://localhost:3000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm run dev
```

Frontend will be available at http://localhost:3001

## Features

### Backend (NestJS)
- 🔐 JWT Authentication with role-based access
- 📚 Book CRUD operations with search and pagination
- 🛒 Shopping cart management
- 📦 Order processing with transactions
- 👨‍💼 Admin panel for inventory management
- 📊 Comprehensive testing (unit + e2e)
- 📖 Swagger API documentation
- 🗄️ PostgreSQL with Prisma ORM

### Frontend (React)
- ⚛️ React 18 with TypeScript
- 🎨 TailwindCSS for styling
- 🔄 TanStack Query for server state
- 🏪 Zustand for client state
- ✨ Framer Motion animations
- 📱 Responsive design
- 🔐 JWT authentication
- 🛒 Shopping cart functionality

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:3000/api/docs

## Development

### Running Tests

Backend tests:
```bash
cd backend
npm run test        # Unit tests
npm run test:e2e    # E2E tests
```

### Database Management

```bash
cd backend
npx prisma studio   # Database GUI
npx prisma migrate dev  # Run migrations
npm run db:seed     # Seed database
npm run db:reset    # Reset and seed
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://username:password@localhost:5432/bookstore"
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters"
BCRYPT_ROUNDS=10
PORT=3000
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

## Tech Stack

### Backend
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Jest Testing
- Swagger/OpenAPI

### Frontend
- React 18
- TypeScript
- TailwindCSS
- TanStack Query
- Zustand
- Framer Motion
- React Hook Form
- Zod Validation
- Vite

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.