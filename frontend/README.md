# Bookstore Frontend

A modern React frontend for the Bookstore API built with:

- **React 18** with TypeScript
- **TailwindCSS v4** for styling
- **TanStack Query** for server state management
- **Framer Motion** for animations
- **Zod** for schema validation
- **Zustand** for client state management
- **React Hook Form** for form handling
- **Vite** for fast development

## Features

- 🔐 Authentication (Login/Register)
- 📚 Book browsing with search and filters
- 🛒 Shopping cart functionality
- 📦 Order management
- 👨‍💼 Admin panel for book management
- 📱 Responsive design
- ✨ Smooth animations
- 🎨 Modern UI with TailwindCSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on http://localhost:3000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:3001

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── services/           # API services with TanStack Query
├── store/              # Zustand stores
├── lib/                # Utilities and configurations
└── main.tsx           # Application entry point
```

## State Management

- **Authentication**: Zustand store with persistence
- **Shopping Cart**: Zustand store with persistence  
- **Server State**: TanStack Query for API data
- **Forms**: React Hook Form with Zod validation

## API Integration

The frontend communicates with the NestJS backend API:

- Authentication endpoints
- Book CRUD operations
- Cart management
- Order processing
- Admin functionality

## Styling

Uses TailwindCSS v4 with:
- Custom color palette
- Responsive design utilities
- Custom animations
- Component-based styling