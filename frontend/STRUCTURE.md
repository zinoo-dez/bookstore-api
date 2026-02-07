# Frontend Folder Structure

```
frontend/
└─ src/
   ├─ components/
   │  ├─ layout/
   │  │  ├─ Layout.tsx          # Main layout wrapper with Navbar and Footer
   │  │  ├─ Navbar.tsx          # Navigation bar with auth state
   │  │  └─ Footer.tsx          # Footer component
   │  ├─ ui/
   │  │  ├─ Button.tsx          # Reusable button with variants
   │  │  ├─ Input.tsx           # Form input with label and error
   │  │  ├─ Loader.tsx          # Loading spinner
   │  │  └─ EmptyState.tsx      # Empty state placeholder
   │  └─ guards/
   │     ├─ ProtectedRoute.tsx  # Auth guard for protected routes
   │     └─ AdminRoute.tsx      # Admin-only route guard
   │
   ├─ pages/
   │  ├─ HomePage.tsx           # Landing page
   │  ├─ BooksPage.tsx          # Books listing with search
   │  ├─ BookDetailPage.tsx     # Single book details
   │  ├─ CartPage.tsx           # Shopping cart
   │  ├─ OrdersPage.tsx         # Order history
   │  ├─ LoginPage.tsx          # Login form
   │  ├─ RegisterPage.tsx       # Registration form
   │  └─ AdminPage.tsx          # Admin dashboard
   │
   ├─ services/
   │  ├─ auth.ts                # Authentication API calls
   │  ├─ books.ts               # Books API calls
   │  ├─ cart.ts                # Cart API calls
   │  └─ orders.ts              # Orders API calls
   │
   ├─ store/
   │  ├─ auth.store.ts          # Auth state (Zustand)
   │  └─ cart.store.ts          # Cart state (Zustand)
   │
   ├─ lib/
   │  ├─ api.ts                 # Axios instance with interceptors
   │  └─ schemas.ts             # Zod validation schemas
   │
   ├─ App.tsx                   # Main app with routing
   ├─ main.tsx                  # Entry point
   ├─ index.css                 # Global styles
   └─ vite-env.d.ts             # TypeScript environment types
```

## Component Organization

### Layout Components (`components/layout/`)
- **Layout.tsx**: Main wrapper that includes Navbar and Footer
- **Navbar.tsx**: Top navigation with cart badge and user menu
- **Footer.tsx**: Site footer with links and info

### UI Components (`components/ui/`)
Reusable UI components with consistent styling:
- **Button**: Multiple variants (primary, secondary, danger, outline) and sizes
- **Input**: Form input with label and error message support
- **Loader**: Animated loading spinner
- **EmptyState**: Placeholder for empty lists/carts

### Guards (`components/guards/`)
Route protection components:
- **ProtectedRoute**: Requires authentication
- **AdminRoute**: Requires admin role

## State Management

### Zustand Stores (`store/`)
- **auth.store.ts**: User authentication state with persistence
- **cart.store.ts**: Shopping cart state with persistence

### TanStack Query (`services/`)
Server state management for API calls:
- **auth.ts**: Login, register, logout
- **books.ts**: CRUD operations for books
- **cart.ts**: Cart operations
- **orders.ts**: Order management

## Key Features

- ✅ Modular component structure
- ✅ Separation of concerns (UI, logic, state)
- ✅ Reusable UI components
- ✅ Type-safe with TypeScript
- ✅ Persistent state with Zustand
- ✅ Server state caching with TanStack Query
- ✅ Route guards for authentication
- ✅ Responsive design with TailwindCSS
- ✅ Smooth animations with Framer Motion