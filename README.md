# Bookstore Application

Full-stack bookstore platform with a NestJS backend and React frontend in an npm workspace monorepo.

## Project Structure

```text
bookstore-api/
├── backend/      # NestJS API + Prisma
├── frontend/     # React + Vite app
├── package.json  # Workspace scripts
└── README.md
```

## Prerequisites

- Node.js 22 LTS recommended
- PostgreSQL
- npm

## Quick Start

From the repo root:

```bash
npm install
cp backend/.env.example backend/.env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Local URLs

- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`

## Common Scripts

From repo root:

```bash
npm run dev
npm run build
npm run lint
npm run lint:fix
npm run test
npm run test:e2e
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:reset
npm run db:studio
```

## Environment Variables

Backend env file: `backend/.env`

```env
DATABASE_URL="postgresql://username:password@localhost:5432/bookstore"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3001"
BCRYPT_ROUNDS=10
SWAGGER_TITLE="Bookstore API"
SWAGGER_DESCRIPTION="A comprehensive bookstore API with authentication, inventory management, and order processing"
SWAGGER_VERSION="1.0"
SWAGGER_PATH="api/docs"
```

Frontend env (optional): `frontend/.env`

```env
VITE_API_URL=http://localhost:3000
```

## Tech Stack

- Backend: NestJS, TypeScript, Prisma, PostgreSQL, JWT, Swagger, Jest
- Frontend: React 18, TypeScript, Vite, TailwindCSS, TanStack Query, Zustand, React Hook Form, Zod

## License

MIT
