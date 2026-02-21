# Design Document: Bookstore Platform Enhancement

## Overview

This design document specifies enhancements to an existing full-stack bookstore platform. The system currently includes a comprehensive NestJS backend with PostgreSQL database, JWT authentication, role-based authorization (USER, ADMIN), and a React frontend that is 60% complete. The enhancements focus on:

1. **Frontend Completion**: Implementing remaining user-facing features (profile, reviews, wishlist) and admin dashboard
2. **Access Control System**: Implementing the ACCESS_CONTROL_SPEC.md with SUPER_ADMIN role, department-based permissions, and scope-based authorization
3. **Property-Based Testing**: Adding comprehensive property tests for critical business logic
4. **Performance Optimizations**: Implementing caching, query optimization, and pagination improvements
5. **Security Enhancements**: Adding rate limiting, audit logging, and data encryption
6. **API Enhancements**: Adding WebSocket support, webhooks, and GraphQL
7. **New Features**: Analytics dashboard, email notifications, payment integration, i18n, Elasticsearch, inventory forecasting, mobile API support

The existing backend is production-ready with 89 unit tests and 17 E2E tests. The frontend uses React 18, TypeScript, TailwindCSS, TanStack Query, and Zustand. The enhancements will build upon this solid foundation to create a comprehensive, enterprise-grade bookstore platform.

## Architecture

### Current Architecture

**Backend Stack:**
- NestJS framework with TypeScript
- PostgreSQL 14+ database
- Prisma ORM for type-safe database access
- JWT authentication with Passport.js
- Swagger/OpenAPI documentation
- Jest for testing

**Frontend Stack:**
- React 18 with TypeScript
- TailwindCSS for styling
- TanStack Query for server state management
- Zustand for client state management
- React Router for navigation
- Vite for build tooling

**Current Modules:**
- AuthModule: User registration, login, JWT, password reset
- UsersModule: User profiles and management
- BooksModule: Book CRUD, search, categories, ratings
- CartModule: Shopping cart operations
- OrdersModule: Order creation and management
- ReviewsModule: Book reviews and ratings
- BlogsModule: Author blog platform with comments, likes, follows
- ReadingModule: Reading list, progress tracking, sessions, goals
- LibraryModule: User's personal book library
- InquiriesModule: Customer support system with departments, assignments, escalation
- NotificationsModule: In-app notifications and announcements
- PromotionsModule: Discount codes and promotions
- WarehousesModule: Multi-warehouse inventory, stock transfers, alerts, purchase requests/orders
- StaffModule: Staff profiles, departments, roles, permissions, tasks
- ContactModule: Contact form submissions

### Enhanced Architecture


**New Architectural Components:**

1. **Access Control Layer**: Centralized permission checking with scope-based filtering
2. **Caching Layer**: Redis for session data, API responses, and frequently accessed data
3. **Search Layer**: Elasticsearch for advanced full-text search and aggregations
4. **Real-time Layer**: WebSocket server for live updates (cart, orders, notifications)
5. **Email Service**: Integration with SendGrid/AWS SES for transactional and promotional emails
6. **Payment Gateway**: Stripe integration for credit card and PayPal payments
7. **Analytics Engine**: Data aggregation and reporting for business intelligence
8. **Webhook System**: Event-driven notifications to external systems
9. **GraphQL API**: Alternative API interface alongside REST
10. **Mobile API**: Enhanced endpoints optimized for mobile applications

**Architecture Diagram:**

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ React Web App│  │ Admin Portal │  │ Mobile Apps  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                    API Gateway / Load Balancer                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                      Application Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  REST API    │  │  GraphQL API │  │  WebSocket   │          │
│  │  (NestJS)    │  │  (NestJS)    │  │  Server      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│  ┌──────┴──────────────────┴──────────────────┴───────┐         │
│  │         Access Control & Permission Layer          │         │
│  └──────┬──────────────────┬──────────────────┬───────┘         │
│         │                  │                  │                   │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐          │
│  │   Business   │  │   Business   │  │   Business   │          │
│  │   Services   │  │   Services   │  │   Services   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼──────────────────┐
│                      Data Layer                                  │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐          │
│  │  PostgreSQL  │  │    Redis     │  │ Elasticsearch│          │
│  │   (Primary)  │  │   (Cache)    │  │   (Search)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────────────────────────────────────────────────────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼──────────────────┐
│                    External Services                             │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐          │
│  │    Stripe    │  │   SendGrid   │  │   AWS S3     │          │
│  │   (Payment)  │  │   (Email)    │  │  (Storage)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

### Technology Additions

**Backend:**
- Redis for caching and session management
- Elasticsearch for advanced search
- Socket.io for WebSocket connections
- Apollo Server for GraphQL
- Stripe SDK for payment processing
- SendGrid/AWS SES for email
- fast-check for property-based testing
- Bull for job queues

**Frontend:**
- React Query DevTools for debugging
- Recharts for analytics visualization
- React Hook Form for complex forms
- Zod for runtime validation
- i18next for internationalization
- Socket.io client for real-time updates

## Components and Interfaces

### Access Control System

The access control system implements the ACCESS_CONTROL_SPEC.md with three-tier authorization:

**Authorization Decision Flow:**

```typescript
function authorize(actor: User, action: string, resource?: any): boolean {
  // Step 1: SUPER_ADMIN bypass
  if (actor.role === Role.SUPER_ADMIN) {
    return true;
  }

  // Step 2: Check if action is restricted governance action
  if (isRestrictedGovernanceAction(action)) {
    return false; // Only SUPER_ADMIN allowed
  }

  // Step 3: ADMIN operational access
  if (actor.role === Role.ADMIN) {
    return true; // Allow all non-governance actions
  }

  // Step 4: Staff permission and scope check
  if (actor.staffProfile) {
    return checkStaffPermission(actor, action, resource);
  }

  // Step 5: Default deny
  return false;
}
```


**Permission Checking with Scope:**

```typescript
interface PermissionCheck {
  key: string; // e.g., "support.tickets.view"
  scope: ScopeType; // GLOBAL, DEPARTMENT, ASSIGNED_ONLY, SELF_ONLY
  resource?: any; // The resource being accessed
}

enum ScopeType {
  GLOBAL = "GLOBAL",
  DEPARTMENT = "DEPARTMENT",
  ASSIGNED_ONLY = "ASSIGNED_ONLY",
  SELF_ONLY = "SELF_ONLY",
}

function checkStaffPermission(
  actor: User,
  action: string,
  resource?: any,
): boolean {
  // Get permission key from action
  const permissionKey = actionToPermissionKey(action);

  // Check if actor has permission
  const hasPermission = actorHasPermission(actor, permissionKey);
  if (!hasPermission) {
    return false;
  }

  // Get scope for this permission
  const scope = getPermissionScope(permissionKey);

  // Apply scope filter
  return checkScopeAccess(actor, scope, resource);
}

function checkScopeAccess(
  actor: User,
  scope: ScopeType,
  resource?: any,
): boolean {
  switch (scope) {
    case ScopeType.GLOBAL:
      return true;

    case ScopeType.DEPARTMENT:
      return resource.departmentId === actor.staffProfile.departmentId;

    case ScopeType.ASSIGNED_ONLY:
      return resource.assignedToStaffId === actor.staffProfile.id;

    case ScopeType.SELF_ONLY:
      return resource.userId === actor.id;

    default:
      return false;
  }
}
```

**Permission Matrix:**

```typescript
interface PermissionDefinition {
  key: string;
  description: string;
  defaultScope: ScopeType;
  department?: string;
}

const PERMISSION_MATRIX: PermissionDefinition[] = [
  // Customer Support
  {
    key: "support.tickets.view",
    description: "View support tickets",
    defaultScope: ScopeType.DEPARTMENT,
    department: "Customer Support",
  },
  {
    key: "support.tickets.reply",
    description: "Reply to support tickets",
    defaultScope: ScopeType.ASSIGNED_ONLY,
    department: "Customer Support",
  },
  {
    key: "support.tickets.assign",
    description: "Assign tickets to staff",
    defaultScope: ScopeType.DEPARTMENT,
    department: "Customer Support",
  },

  // Authors & Creators
  {
    key: "author.verify",
    description: "Verify author accounts",
    defaultScope: ScopeType.DEPARTMENT,
    department: "Authors & Creators",
  },
  {
    key: "blogs.moderate",
    description: "Moderate blog posts",
    defaultScope: ScopeType.DEPARTMENT,
    department: "Authors & Creators",
  },

  // Warehouse
  {
    key: "warehouse.stock.update",
    description: "Update warehouse stock",
    defaultScope: ScopeType.DEPARTMENT,
    department: "Warehouse",
  },
  {
    key: "warehouse.transfer",
    description: "Transfer stock between warehouses",
    defaultScope: ScopeType.DEPARTMENT,
    department: "Warehouse",
  },

  // Finance
  {
    key: "finance.reports.view",
    description: "View financial reports",
    defaultScope: ScopeType.GLOBAL,
    department: "Finance",
  },
  {
    key: "finance.payout.manage",
    description: "Manage payouts",
    defaultScope: ScopeType.GLOBAL,
    department: "Finance",
  },

  // HR
  {
    key: "hr.staff.create",
    description: "Create staff accounts",
    defaultScope: ScopeType.DEPARTMENT,
    department: "HR",
  },
  {
    key: "hr.role.assign",
    description: "Assign roles to staff",
    defaultScope: ScopeType.DEPARTMENT,
    department: "HR",
  },
];
```

**Restricted Governance Actions:**

```typescript
const RESTRICTED_GOVERNANCE_ACTIONS = [
  "admin.create", // Create admin accounts
  "super_admin.create", // Create super admin accounts
  "permission.matrix.edit", // Edit permission definitions
  "permission.version.update", // Update permission set version
  "role.permission.override", // Override role permissions globally
  "audit.export", // Export immutable audit logs
  "impersonation.enable", // Enable user impersonation
];

function isRestrictedGovernanceAction(action: string): boolean {
  return RESTRICTED_GOVERNANCE_ACTIONS.includes(action);
}
```

### Frontend Components

**Admin Dashboard Components:**

```typescript
// Dashboard Overview
interface DashboardStats {
  totalBooks: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders: Order[];
  lowStockAlerts: Book[];
}

// Admin Sidebar Navigation
interface AdminNavItem {
  label: string;
  icon: string;
  path: string;
  permission?: string;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", icon: "dashboard", path: "/admin" },
  { label: "Books", icon: "book", path: "/admin/books" },
  { label: "Orders", icon: "shopping-cart", path: "/admin/orders" },
  { label: "Users", icon: "users", path: "/admin/users" },
  { label: "Inventory", icon: "warehouse", path: "/admin/inventory" },
  { label: "Analytics", icon: "chart", path: "/admin/analytics" },
  { label: "Staff", icon: "badge", path: "/admin/staff", permission: "hr.staff.view" },
];

// Book Management
interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  description: string;
  price: number;
  stock: number;
  categories: string[];
  genres: string[];
  coverImage?: File;
}

// Order Management
interface OrderFilters {
  status?: OrderStatus;
  customerEmail?: string;
  orderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
```

**User Profile Components:**

```typescript
// Profile Form
interface ProfileFormData {
  name: string;
  email: string;
  pronouns?: string;
  shortBio?: string;
  about?: string;
  avatarType: "emoji" | "image";
  avatarValue: string;
  backgroundColor: string;
}

// Password Change
interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Wishlist
interface WishlistItem {
  id: string;
  book: Book;
  addedAt: Date;
}

// Reading List
interface ReadingItem {
  id: string;
  book: Book;
  status: ReadingStatus;
  currentPage: number;
  totalPages?: number;
  progress: number; // percentage
  startedAt?: Date;
  finishedAt?: Date;
}
```

### API Enhancements

**WebSocket Events:**

```typescript
// Server -> Client events
interface ServerToClientEvents {
  "cart:updated": (cart: Cart) => void;
  "order:status_changed": (order: Order) => void;
  "notification:new": (notification: Notification) => void;
  "inquiry:reply": (inquiry: Inquiry) => void;
  "blog:new_comment": (comment: BlogComment) => void;
}

// Client -> Server events
interface ClientToServerEvents {
  "cart:subscribe": () => void;
  "cart:unsubscribe": () => void;
  "orders:subscribe": () => void;
  "orders:unsubscribe": () => void;
  "notifications:subscribe": () => void;
}
```

**GraphQL Schema:**

```graphql
type Query {
  books(
    search: String
    category: String
    page: Int
    limit: Int
  ): BookConnection!
  book(id: ID!): Book
  cart: Cart!
  orders(page: Int, limit: Int): OrderConnection!
  order(id: ID!): Order
  user: User!
  analytics: Analytics!
}

type Mutation {
  addToCart(bookId: ID!, quantity: Int!): CartItem!
  updateCartItem(bookId: ID!, quantity: Int!): CartItem!
  removeFromCart(bookId: ID!): Boolean!
  createOrder(input: CreateOrderInput!): Order!
  updateProfile(input: UpdateProfileInput!): User!
  createReview(bookId: ID!, rating: Int!, comment: String): Review!
}

type Subscription {
  cartUpdated: Cart!
  orderStatusChanged(orderId: ID!): Order!
  newNotification: Notification!
}

type Book {
  id: ID!
  title: String!
  author: String!
  isbn: String!
  description: String
  price: Float!
  stock: Int!
  categories: [String!]!
  rating: Float
  reviews: [Review!]!
  inStock: Boolean!
}

type Cart {
  items: [CartItem!]!
  totalPrice: Float!
  itemCount: Int!
}

type Order {
  id: ID!
  status: OrderStatus!
  items: [OrderItem!]!
  totalPrice: Float!
  shippingAddress: String!
  createdAt: DateTime!
}
```

**Webhook System:**

```typescript
interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  data: any;
  timestamp: Date;
}

enum WebhookEventType {
  ORDER_CREATED = "order.created",
  ORDER_STATUS_CHANGED = "order.status_changed",
  PAYMENT_SUCCEEDED = "payment.succeeded",
  PAYMENT_FAILED = "payment.failed",
  BOOK_OUT_OF_STOCK = "book.out_of_stock",
  USER_REGISTERED = "user.registered",
}

interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  active: boolean;
}

// Webhook delivery with retry logic
async function deliverWebhook(
  subscription: WebhookSubscription,
  event: WebhookEvent,
): Promise<void> {
  const maxRetries = 3;
  const backoffMs = [1000, 5000, 15000]; // Exponential backoff

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const signature = generateHMAC(subscription.secret, event);
      await axios.post(subscription.url, event, {
        headers: {
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event.type,
        },
        timeout: 5000,
      });
      return; // Success
    } catch (error) {
      if (attempt < maxRetries - 1) {
        await sleep(backoffMs[attempt]);
      } else {
        // Log failure after all retries
        logger.error("Webhook delivery failed", { subscription, event, error });
      }
    }
  }
}
```


### Performance Optimizations

**Caching Strategy:**

```typescript
// Redis cache configuration
interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
  invalidateOn?: string[]; // Events that invalidate this cache
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  books_list: {
    ttl: 300, // 5 minutes
    key: "books:list:{query}",
    invalidateOn: ["book.created", "book.updated", "book.deleted"],
  },
  book_detail: {
    ttl: 600, // 10 minutes
    key: "book:{id}",
    invalidateOn: ["book.updated", "book.deleted"],
  },
  user_cart: {
    ttl: 60, // 1 minute
    key: "cart:{userId}",
    invalidateOn: ["cart.updated"],
  },
  dashboard_stats: {
    ttl: 60, // 1 minute
    key: "dashboard:stats",
    invalidateOn: ["order.created", "book.created", "user.registered"],
  },
};

// Cache decorator for service methods
function Cacheable(config: CacheConfig) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = interpolateKey(config.key, args);
      const cached = await redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const result = await originalMethod.apply(this, args);
      await redis.setex(cacheKey, config.ttl, JSON.stringify(result));

      return result;
    };

    return descriptor;
  };
}

// Usage example
class BooksService {
  @Cacheable(CACHE_CONFIGS.books_list)
  async findAll(query: SearchBooksDto) {
    return this.prisma.book.findMany(/* ... */);
  }

  @Cacheable(CACHE_CONFIGS.book_detail)
  async findOne(id: string) {
    return this.prisma.book.findUnique({ where: { id } });
  }
}
```

**Database Query Optimization:**

```typescript
// Optimized book search with indexes
async function searchBooks(query: SearchBooksDto) {
  return prisma.book.findMany({
    where: {
      AND: [
        query.title
          ? {
              title: {
                contains: query.title,
                mode: "insensitive", // Uses gin_trgm_ops index
              },
            }
          : {},
        query.author
          ? {
              author: {
                contains: query.author,
                mode: "insensitive",
              },
            }
          : {},
        query.category ? { categories: { has: query.category } } : {},
      ],
    },
    select: {
      id: true,
      title: true,
      author: true,
      price: true,
      coverImage: true,
      rating: true,
      stock: true,
      // Exclude large fields for list view
    },
    orderBy: query.sortBy ? { [query.sortBy]: query.sortOrder } : undefined,
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  });
}

// Connection pooling configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ["query", "error", "warn"],
  // Connection pool settings
  __internal: {
    engine: {
      connection_limit: 20,
      pool_timeout: 10,
    },
  },
});

// Batch loading for N+1 prevention
class DataLoader {
  private batchLoadFn: (keys: string[]) => Promise<any[]>;
  private cache: Map<string, any>;

  constructor(batchLoadFn: (keys: string[]) => Promise<any[]>) {
    this.batchLoadFn = batchLoadFn;
    this.cache = new Map();
  }

  async load(key: string): Promise<any> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Batch multiple load calls within same tick
    const results = await this.batchLoadFn([key]);
    results.forEach((result, index) => {
      this.cache.set(key, result);
    });

    return this.cache.get(key);
  }
}
```

**Pagination Optimization:**

```typescript
// Cursor-based pagination for large datasets
interface CursorPaginationInput {
  cursor?: string; // Last item ID from previous page
  limit: number;
}

interface CursorPaginationResult<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

async function paginateWithCursor<T>(
  query: any,
  input: CursorPaginationInput,
): Promise<CursorPaginationResult<T>> {
  const items = await prisma.book.findMany({
    ...query,
    take: input.limit + 1, // Fetch one extra to check if there are more
    cursor: input.cursor ? { id: input.cursor } : undefined,
    orderBy: { id: "asc" },
  });

  const hasMore = items.length > input.limit;
  const resultItems = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore ? resultItems[resultItems.length - 1].id : undefined;

  return {
    items: resultItems,
    nextCursor,
    hasMore,
  };
}
```

### Security Enhancements

**Rate Limiting:**

```typescript
// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  keyGenerator?: (req: Request) => string;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    keyGenerator: (req) => req.body.email,
  },
  api_general: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests
    keyGenerator: (req) => req.user?.id || req.ip,
  },
  api_authenticated: {
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 requests
    keyGenerator: (req) => req.user.id,
  },
};

// Rate limiter using Redis
class RateLimiter {
  async checkLimit(key: string, config: RateLimitConfig): Promise<boolean> {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, Math.ceil(config.windowMs / 1000));
    }

    return current <= config.max;
  }

  async getRemainingRequests(
    key: string,
    config: RateLimitConfig,
  ): Promise<number> {
    const current = await redis.get(key);
    return Math.max(0, config.max - (parseInt(current) || 0));
  }
}

// Rate limit guard
@Injectable()
class RateLimitGuard implements CanActivate {
  constructor(private rateLimiter: RateLimiter) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const config = this.getConfigForRoute(request.route.path);
    const key = `ratelimit:${config.keyGenerator(request)}`;

    const allowed = await this.rateLimiter.checkLimit(key, config);

    if (!allowed) {
      const ttl = await redis.ttl(key);
      throw new HttpException(
        {
          statusCode: 429,
          message: "Too many requests",
          retryAfter: ttl,
        },
        429,
      );
    }

    return true;
  }
}
```

**Audit Logging:**

```typescript
// Immutable audit log
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  actorUserId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  ipAddress: string;
  userAgent: string;
}

// Audit decorator for sensitive operations
function Auditable(action: string, resource: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context = args[0]; // Assume first arg is execution context
      const request = context.switchToHttp().getRequest();

      const result = await originalMethod.apply(this, args);

      // Log after successful operation
      await auditLog.create({
        actorUserId: request.user.id,
        action,
        resource,
        resourceId: result?.id,
        changes: args[1], // Assume second arg is DTO
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
      });

      return result;
    };

    return descriptor;
  };
}

// Usage example
class StaffService {
  @Auditable("role.assign", "staff")
  async assignRole(staffId: string, roleId: string) {
    // Implementation
  }

  @Auditable("permission.grant", "staff")
  async grantPermission(staffId: string, permissionId: string) {
    // Implementation
  }
}
```

**Data Encryption:**

```typescript
// Encryption for sensitive fields
class EncryptionService {
  private algorithm = "aes-256-gcm";
  private key: Buffer;

  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}

// Encrypt sensitive fields in DTOs
class CreatePaymentMethodDto {
  @Transform(({ value }) => encryptionService.encrypt(value))
  cardNumber: string;

  @Transform(({ value }) => encryptionService.encrypt(value))
  cvv: string;

  expiryMonth: number;
  expiryYear: number;
}
```


### Email Notification System

**Email Service Architecture:**

```typescript
// Email templates
interface EmailTemplate {
  id: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: string[];
}

enum EmailType {
  WELCOME = "welcome",
  ORDER_CONFIRMATION = "order_confirmation",
  ORDER_STATUS_UPDATE = "order_status_update",
  PASSWORD_RESET = "password_reset",
  INQUIRY_REPLY = "inquiry_reply",
  BLOG_COMMENT = "blog_comment",
  AUTHOR_FOLLOW = "author_follow",
  PROMOTION = "promotion",
}

// Email queue for async processing
interface EmailJob {
  to: string;
  type: EmailType;
  data: any;
  priority?: number;
}

class EmailService {
  private queue: Bull.Queue;
  private templates: Map<EmailType, EmailTemplate>;

  async sendEmail(job: EmailJob): Promise<void> {
    const template = this.templates.get(job.type);
    const rendered = this.renderTemplate(template, job.data);

    await this.queue.add(
      {
        to: job.to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      },
      {
        priority: job.priority || 5,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    );
  }

  private renderTemplate(
    template: EmailTemplate,
    data: any,
  ): { subject: string; html: string; text: string } {
    return {
      subject: this.interpolate(template.subject, data),
      html: this.interpolate(template.htmlBody, data),
      text: this.interpolate(template.textBody, data),
    };
  }

  private interpolate(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || "");
  }
}

// Email worker process
async function processEmailJob(job: Bull.Job): Promise<void> {
  const { to, subject, html, text } = job.data;

  try {
    await sendgrid.send({
      to,
      from: process.env.EMAIL_FROM,
      subject,
      html,
      text,
    });

    logger.info("Email sent successfully", { to, subject });
  } catch (error) {
    logger.error("Email sending failed", { to, subject, error });
    throw error; // Will trigger retry
  }
}
```

### Payment Gateway Integration

**Stripe Integration:**

```typescript
// Payment service
class PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: any,
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  async confirmPayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async createRefund(
    paymentIntentId: string,
    amount?: number,
  ): Promise<Stripe.Refund> {
    return this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
  }

  async handleWebhook(
    payload: string,
    signature: string,
  ): Promise<Stripe.Event> {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  }
}

// Checkout flow
async function processCheckout(userId: string, dto: CreateOrderDto) {
  // 1. Get cart items
  const cart = await cartService.getCart(userId);

  // 2. Calculate total
  const total = cart.totalPrice;

  // 3. Create payment intent
  const paymentIntent = await paymentService.createPaymentIntent(
    total,
    "usd",
    {
      userId,
      cartId: cart.id,
    },
  );

  // 4. Return client secret for frontend
  return {
    clientSecret: paymentIntent.client_secret,
    amount: total,
  };
}

// Webhook handler
async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await createOrderFromPayment(paymentIntent);
      break;

    case "payment_intent.payment_failed":
      const failedIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailure(failedIntent);
      break;

    case "charge.refunded":
      const refund = event.data.object as Stripe.Charge;
      await handleRefund(refund);
      break;
  }
}
```

### Elasticsearch Integration

**Search Service:**

```typescript
// Elasticsearch configuration
class SearchService {
  private client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL,
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
      },
    });
  }

  async indexBook(book: Book): Promise<void> {
    await this.client.index({
      index: "books",
      id: book.id,
      document: {
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        description: book.description,
        categories: book.categories,
        genres: book.genres,
        price: book.price,
        rating: book.rating,
        stock: book.stock,
      },
    });
  }

  async searchBooks(query: string, filters?: any): Promise<Book[]> {
    const result = await this.client.search({
      index: "books",
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ["title^3", "author^2", "description", "isbn"],
                  fuzziness: "AUTO",
                },
              },
            ],
            filter: this.buildFilters(filters),
          },
        },
        highlight: {
          fields: {
            title: {},
            description: {},
          },
        },
        aggs: {
          categories: {
            terms: { field: "categories.keyword" },
          },
          price_ranges: {
            range: {
              field: "price",
              ranges: [
                { to: 10 },
                { from: 10, to: 20 },
                { from: 20, to: 50 },
                { from: 50 },
              ],
            },
          },
        },
      },
    });

    return result.hits.hits.map((hit) => ({
      ...hit._source,
      id: hit._id,
      highlights: hit.highlight,
    }));
  }

  async autocomplete(query: string): Promise<string[]> {
    const result = await this.client.search({
      index: "books",
      body: {
        suggest: {
          title_suggest: {
            prefix: query,
            completion: {
              field: "title.suggest",
              size: 10,
            },
          },
        },
      },
    });

    return result.suggest.title_suggest[0].options.map((opt) => opt.text);
  }

  private buildFilters(filters: any): any[] {
    const filterClauses = [];

    if (filters.categories?.length) {
      filterClauses.push({
        terms: { "categories.keyword": filters.categories },
      });
    }

    if (filters.priceMin || filters.priceMax) {
      filterClauses.push({
        range: {
          price: {
            gte: filters.priceMin,
            lte: filters.priceMax,
          },
        },
      });
    }

    if (filters.rating) {
      filterClauses.push({
        range: {
          rating: { gte: filters.rating },
        },
      });
    }

    return filterClauses;
  }
}

// Sync books to Elasticsearch
async function syncBooksToElasticsearch(): Promise<void> {
  const books = await prisma.book.findMany();

  for (const book of books) {
    await searchService.indexBook(book);
  }

  logger.info(`Synced ${books.length} books to Elasticsearch`);
}
```

### Analytics Engine

**Analytics Service:**

```typescript
// Analytics data models
interface SalesAnalytics {
  period: "day" | "week" | "month";
  data: {
    date: Date;
    revenue: number;
    orderCount: number;
    averageOrderValue: number;
  }[];
}

interface PopularBooks {
  book: Book;
  salesCount: number;
  revenue: number;
}

interface CustomerAnalytics {
  newCustomers: number;
  returningCustomers: number;
  customerLifetimeValue: number;
  conversionRate: number;
}

// Analytics queries
class AnalyticsService {
  async getSalesAnalytics(
    period: "day" | "week" | "month",
    startDate: Date,
    endDate: Date,
  ): Promise<SalesAnalytics> {
    const groupBy = this.getGroupByClause(period);

    const results = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${groupBy}, "createdAt") as date,
        SUM("totalPrice") as revenue,
        COUNT(*) as "orderCount",
        AVG("totalPrice") as "averageOrderValue"
      FROM "Order"
      WHERE "createdAt" BETWEEN ${startDate} AND ${endDate}
        AND status != 'CANCELLED'
      GROUP BY DATE_TRUNC(${groupBy}, "createdAt")
      ORDER BY date ASC
    `;

    return {
      period,
      data: results,
    };
  }

  async getPopularBooks(limit: number = 10): Promise<PopularBooks[]> {
    const results = await prisma.$queryRaw`
      SELECT 
        b.*,
        COUNT(oi."id") as "salesCount",
        SUM(oi."price" * oi."quantity") as revenue
      FROM "Book" b
      JOIN "OrderItem" oi ON oi."bookId" = b.id
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE o.status != 'CANCELLED'
      GROUP BY b.id
      ORDER BY "salesCount" DESC
      LIMIT ${limit}
    `;

    return results;
  }

  async getCustomerAnalytics(
    startDate: Date,
    endDate: Date,
  ): Promise<CustomerAnalytics> {
    const [newCustomers, returningCustomers, ltv, conversion] =
      await Promise.all([
        this.getNewCustomers(startDate, endDate),
        this.getReturningCustomers(startDate, endDate),
        this.getCustomerLifetimeValue(),
        this.getConversionRate(startDate, endDate),
      ]);

    return {
      newCustomers,
      returningCustomers,
      customerLifetimeValue: ltv,
      conversionRate: conversion,
    };
  }

  async getInventoryAnalytics(): Promise<any> {
    return prisma.$queryRaw`
      SELECT 
        w.name as warehouse,
        COUNT(ws.id) as "totalBooks",
        SUM(ws.stock) as "totalStock",
        COUNT(CASE WHEN ws.stock < ws."lowStockThreshold" THEN 1 END) as "lowStockCount"
      FROM "Warehouse" w
      LEFT JOIN "WarehouseStock" ws ON ws."warehouseId" = w.id
      WHERE w."isActive" = true
      GROUP BY w.id, w.name
    `;
  }

  private getGroupByClause(period: string): string {
    switch (period) {
      case "day":
        return "day";
      case "week":
        return "week";
      case "month":
        return "month";
      default:
        return "day";
    }
  }
}
```

## Data Models

The existing data models are comprehensive and well-designed. The enhancements add the following new models and modifications:

### New Models

**PermissionSet (for versioning):**

```prisma
model PermissionSet {
  id        String   @id @default(uuid())
  version   Int      @unique
  isActive  Boolean  @default(false)
  createdAt DateTime @default(now())
  
  permissions StaffPermission[]
}
```

**AuditLog (immutable):**

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  timestamp   DateTime @default(now())
  actorUserId String
  action      String
  resource    String
  resourceId  String?
  changes     Json?
  ipAddress   String
  userAgent   String
  
  actor User @relation(fields: [actorUserId], references: [id])
  
  @@index([actorUserId])
  @@index([resource])
  @@index([timestamp])
}
```

**WebhookSubscription:**

```prisma
model WebhookSubscription {
  id        String   @id @default(uuid())
  url       String
  events    String[]
  secret    String
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  deliveries WebhookDelivery[]
}

model WebhookDelivery {
  id             String   @id @default(uuid())
  subscriptionId String
  eventType      String
  payload        Json
  status         String   // pending, success, failed
  attempts       Int      @default(0)
  lastAttemptAt  DateTime?
  createdAt      DateTime @default(now())
  
  subscription WebhookSubscription @relation(fields: [subscriptionId], references: [id])
  
  @@index([subscriptionId])
  @@index([status])
}
```

### Modified Models

**User model additions:**

```prisma
model User {
  // ... existing fields
  
  // New fields
  emailVerified     Boolean   @default(false)
  emailVerifiedAt   DateTime?
  locale            String    @default("en")
  timezone          String    @default("UTC")
  marketingOptIn    Boolean   @default(false)
  lastLoginAt       DateTime?
  lastLoginIp       String?
  
  // New relations
  auditLogs         AuditLog[]
  paymentMethods    PaymentMethod[]
}
```

**Order model additions:**

```prisma
model Order {
  // ... existing fields
  
  // New fields
  paymentIntentId   String?   @unique
  paymentStatus     String?   // pending, succeeded, failed
  refundedAmount    Decimal?  @db.Decimal(10, 2)
  refundedAt        DateTime?
  trackingNumber    String?
  estimatedDelivery DateTime?
}
```



## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Frontend and User Experience Properties

**Property 1: Password change validation**
*For any* user with a valid current password and new password, changing the password should validate the old password, update to the new password, and allow login with the new password.
**Validates: Requirements 1.2**

**Property 2: Order history completeness**
*For any* user with orders, retrieving order history should return all orders with complete data (status, items, totals, shipping address).
**Validates: Requirements 1.3**

**Property 3: Wishlist round-trip**
*For any* user and book, adding a book to the wishlist then retrieving the wishlist should include that book.
**Validates: Requirements 1.4**

**Property 4: Review validation and persistence**
*For any* book review with rating between 1-5, submitting the review should persist it and make it visible in the book's reviews.
**Validates: Requirements 1.6**

**Property 5: Book filtering correctness**
*For any* combination of filters (category, price range, rating), all returned books should match all applied filter criteria.
**Validates: Requirements 1.7**

**Property 6: Related books criteria**
*For any* book, all related books should either share a category with the book or have the same author.
**Validates: Requirements 1.8**

### Admin Dashboard Properties

**Property 7: Dashboard statistics accuracy**
*For any* point in time, dashboard statistics (total books, orders, users, revenue) should match the actual counts and sums in the database.
**Validates: Requirements 2.1**

**Property 8: Recent orders ordering**
*For any* set of orders, the recent orders list should return the 10 most recent orders sorted by creation date descending.
**Validates: Requirements 2.2**

**Property 9: Low stock alert filtering**
*For any* set of books, low stock alerts should include only books where stock is below the threshold.
**Validates: Requirements 2.3**

**Property 10: Book creation validation**
*For any* book data with all required fields, creating the book should persist it with all provided values.
**Validates: Requirements 2.4**

**Property 11: Stock update and alert triggering**
*For any* book stock update, if the new stock is below the threshold, a low stock alert should be created.
**Validates: Requirements 2.5**

**Property 12: Soft delete behavior**
*For any* book deletion, the book should be marked as deleted but remain in the database and be excluded from normal queries.
**Validates: Requirements 2.6**

**Property 13: Order status transition validation**
*For any* order status update, only valid state transitions should be allowed (e.g., PENDING → CONFIRMED → COMPLETED).
**Validates: Requirements 2.7**

**Property 14: Role promotion persistence**
*For any* user promoted to admin, the user's role should be updated to ADMIN and subsequent permission checks should grant admin access.
**Validates: Requirements 2.9**

### Access Control Properties

**Property 15: SUPER_ADMIN bypass**
*For any* action and SUPER_ADMIN user, the action should be allowed without permission checks.
**Validates: Requirements 3.1**

**Property 16: ADMIN operational access**
*For any* non-governance action and ADMIN user, the action should be allowed.
**Validates: Requirements 3.2**

**Property 17: Governance action restriction**
*For any* restricted governance action and ADMIN user, the action should be denied.
**Validates: Requirements 3.3**

**Property 18: Permission and scope checking**
*For any* staff member and action, the system should check both permission key existence and scope rules before allowing access.
**Validates: Requirements 3.4, 3.6**

**Property 19: Scope-based resource filtering**
*For any* staff member with DEPARTMENT scope permission, only resources in their department should be accessible.
**Validates: Requirements 3.5**

**Property 20: Immutable audit logging**
*For any* privileged action (role assignment, department change, permission grant), an audit log entry should be created and never modified.
**Validates: Requirements 3.7, 3.8, 6.5**

**Property 21: Permission set version checking**
*For any* user with mismatched permission set version, privileged actions should be blocked until grant sync occurs.
**Validates: Requirements 3.9**

**Property 22: Separation of duties enforcement**
*For any* approval action, the same user who created the request should not be able to approve it.
**Validates: Requirements 3.10**

### Core Business Logic Properties

**Property 23: Cart operation round-trip**
*For any* cart state, adding an item then removing the same item should restore the original cart state.
**Validates: Requirements 5.1**

**Property 24: Order total calculation**
*For any* order, the total price should equal the sum of (item price × quantity) for all items, minus discount amount, plus tax.
**Validates: Requirements 5.2**

**Property 25: Promotion code discount calculation**
*For any* valid promotion code, applying it to an order should reduce the total by the correct amount based on discount type (PERCENT or FIXED).
**Validates: Requirements 5.3**

**Property 26: Stock transfer invariant**
*For any* stock transfer between warehouses, the total stock across all warehouses should remain constant.
**Validates: Requirements 5.4**

**Property 27: Permission grant round-trip**
*For any* permission granted to a user, checking that permission should return true.
**Validates: Requirements 5.5**

**Property 28: Role permission inheritance**
*For any* role assigned to a user, querying the user's permissions should include all permissions assigned to that role.
**Validates: Requirements 5.6**

**Property 29: Inquiry assignment visibility**
*For any* inquiry assigned to a staff member, the inquiry should appear in that staff member's inquiry list.
**Validates: Requirements 5.7**

**Property 30: Blog post state preservation**
*For any* blog post, publishing then unpublishing should preserve all post content (title, body, tags).
**Validates: Requirements 5.8**

**Property 31: Reading progress accumulation**
*For any* reading item, recording a reading session with N pages should increase the total pages read by N.
**Validates: Requirements 5.9**

**Property 32: Purchase order stock increase**
*For any* purchase order, receiving items should increase the warehouse stock by the received quantity.
**Validates: Requirements 5.10**

### Security Properties

**Property 33: Rate limiting enforcement**
*For any* endpoint with rate limit configuration, exceeding the limit should return 429 status with Retry-After header.
**Validates: Requirements 6.1, 6.2, 8.9**

**Property 34: Data encryption at rest**
*For any* sensitive field (payment data, personal information), the stored value should be encrypted and not equal to the plaintext.
**Validates: Requirements 6.3**

**Property 35: JWT expiration enforcement**
*For any* expired JWT token, requests using that token should be rejected with 401 status.
**Validates: Requirements 6.6**

**Property 36: Password hashing**
*For any* password stored in the database, the stored value should be a bcrypt hash and not equal to the plaintext password.
**Validates: Requirements 6.7**

**Property 37: Password reset token expiration**
*For any* password reset token, the token should expire after 1 hour and be rejected if used after expiration.
**Validates: Requirements 6.8**

**Property 38: File upload validation**
*For any* file upload, files with invalid types should be rejected before processing.
**Validates: Requirements 6.10**

### Performance Properties

**Property 39: Cache TTL behavior**
*For any* cached data with TTL, retrieving the data within TTL should return cached value, and after TTL should fetch fresh data.
**Validates: Requirements 7.3, 7.5**

**Property 40: Pagination limit enforcement**
*For any* paginated query without explicit limit, the result should contain at most 20 items.
**Validates: Requirements 7.6**

**Property 41: Slow query logging**
*For any* database query taking longer than 1 second, a log entry should be created with query details.
**Validates: Requirements 7.9**

### API Enhancement Properties

**Property 42: WebSocket real-time updates**
*For any* subscribed client, when a subscribed resource changes (cart, order), a WebSocket event should be sent to the client.
**Validates: Requirements 8.1, 8.2**

**Property 43: Webhook delivery with retry**
*For any* webhook subscription and event, the webhook should be called, and if it fails, retried up to 3 times with exponential backoff.
**Validates: Requirements 8.3, 8.4**

**Property 44: GraphQL query resolution**
*For any* valid GraphQL query, the system should resolve the query and return data matching the requested schema.
**Validates: Requirements 8.7**

**Property 45: GraphQL mutation validation**
*For any* GraphQL mutation with invalid input, the system should return validation errors before executing the mutation.
**Validates: Requirements 8.8**

**Property 46: API error format consistency**
*For any* API error, the response should include statusCode, message, error, timestamp, and path fields.
**Validates: Requirements 8.10**

### Email Notification Properties

**Property 47: Event-triggered email sending**
*For any* system event that triggers email (registration, order, inquiry reply, blog comment, follow), an email should be queued for delivery.
**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8**

**Property 48: Email retry on failure**
*For any* failed email delivery, the system should retry up to 3 times before marking as failed.
**Validates: Requirements 10.9**

**Property 49: Email preference enforcement**
*For any* user who unsubscribes, promotional emails should not be sent, but transactional emails should continue.
**Validates: Requirements 10.10**

### Payment Integration Properties

**Property 50: Payment intent creation**
*For any* checkout request, a Stripe payment intent should be created with the correct amount and metadata.
**Validates: Requirements 11.1, 11.3**

**Property 51: Order creation on payment success**
*For any* successful payment, an order should be created and the cart should be cleared.
**Validates: Requirements 11.4**

**Property 52: Cart preservation on payment failure**
*For any* failed payment, the cart should remain unchanged and an error should be returned.
**Validates: Requirements 11.5**

**Property 53: Refund processing**
*For any* refund request, the refund should be processed through Stripe and the order should be updated with refund details.
**Validates: Requirements 11.8**

**Property 54: Webhook signature verification**
*For any* payment webhook, the signature should be verified before processing the event.
**Validates: Requirements 11.9**

**Property 55: PCI compliance for card data**
*For any* payment method stored, only the last 4 digits should be stored, never the full card number.
**Validates: Requirements 11.10**

### Search Properties

**Property 56: Elasticsearch full-text search**
*For any* search query, results should be retrieved from Elasticsearch and match the query terms.
**Validates: Requirements 13.1**

**Property 57: Autocomplete suggestions**
*For any* partial search query, autocomplete should return relevant book titles starting with or containing the query.
**Validates: Requirements 13.2**

**Property 58: Fuzzy matching for typos**
*For any* search query with typos, fuzzy matching should return relevant results despite the typos.
**Validates: Requirements 13.3**

**Property 59: Search aggregations**
*For any* search with category filter, Elasticsearch aggregations should be used to count results per category.
**Validates: Requirements 13.4**

**Property 60: Search result highlighting**
*For any* search results, matching terms in titles and descriptions should be highlighted.
**Validates: Requirements 13.7**

**Property 61: ISBN exact match priority**
*For any* search by ISBN, exact ISBN matches should appear first in results with highest relevance score.
**Validates: Requirements 13.8**

**Property 62: Search index synchronization**
*For any* book change (create, update, delete), the Elasticsearch index should be updated within 1 minute.
**Validates: Requirements 13.9**

**Property 63: Search fallback behavior**
*For any* search when Elasticsearch is unavailable, the system should fall back to PostgreSQL full-text search.
**Validates: Requirements 13.10**



## Error Handling

### Error Categories

**Validation Errors (400 Bad Request):**
- Invalid input data (missing required fields, wrong types, out of range values)
- Business rule violations (insufficient stock, invalid state transitions)
- Format errors (invalid email, invalid ISBN, invalid date)

**Authentication Errors (401 Unauthorized):**
- Missing JWT token
- Invalid JWT token
- Expired JWT token
- Invalid credentials

**Authorization Errors (403 Forbidden):**
- Insufficient permissions
- Scope violations (accessing resources outside scope)
- Governance action restrictions
- Separation of duties violations

**Not Found Errors (404 Not Found):**
- Resource does not exist
- Deleted resources (soft-deleted)
- Invalid resource IDs

**Conflict Errors (409 Conflict):**
- Duplicate unique values (email, ISBN, code)
- Concurrent modification conflicts
- State conflicts (already processed, already exists)

**Rate Limit Errors (429 Too Many Requests):**
- Exceeded request rate limit
- Exceeded login attempt limit
- Includes Retry-After header

**Server Errors (500 Internal Server Error):**
- Unhandled exceptions
- Database connection failures
- External service failures (Stripe, SendGrid, Elasticsearch)
- Generic error message to client, detailed logging server-side

### Error Response Format

All errors follow a consistent format:

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
  details?: any;
}
```

Example responses:

```json
{
  "statusCode": 400,
  "message": ["price must be a positive number", "stock must not be less than 0"],
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/books",
  "requestId": "req_abc123"
}

{
  "statusCode": 403,
  "message": "Insufficient permissions to perform this action",
  "error": "Forbidden",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/admin/users",
  "requestId": "req_def456",
  "details": {
    "required": "hr.staff.create",
    "scope": "DEPARTMENT"
  }
}

{
  "statusCode": 429,
  "message": "Too many requests. Please try again later.",
  "error": "Too Many Requests",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/auth/login",
  "requestId": "req_ghi789",
  "retryAfter": 300
}
```

### Error Handling Strategy

**Global Exception Filter:**
- Catches all unhandled exceptions
- Logs errors with full context (user, request, stack trace)
- Sanitizes error messages for client responses
- Prevents sensitive information leakage
- Generates unique request IDs for error tracking

**Validation Pipeline:**
- Uses class-validator for DTO validation
- Validates all inputs before processing
- Returns detailed validation errors
- Supports custom validation rules

**Transaction Rollback:**
- Uses database transactions for multi-step operations
- Rolls back on any error to maintain consistency
- Logs transaction failures for debugging

**Circuit Breaker Pattern:**
- Protects against cascading failures from external services
- Opens circuit after threshold of failures
- Allows recovery time before retrying
- Falls back to degraded functionality when possible

**Graceful Degradation:**
- Elasticsearch unavailable → Fall back to PostgreSQL search
- Redis unavailable → Skip caching, query database directly
- Email service unavailable → Queue for later retry
- Payment gateway unavailable → Return clear error, preserve cart

### Logging Strategy

**Log Levels:**
- ERROR: Unhandled exceptions, critical failures
- WARN: Handled errors, degraded functionality, slow queries
- INFO: Important business events (orders, payments, role changes)
- DEBUG: Detailed execution flow (development only)

**Structured Logging:**
```typescript
logger.error("Payment processing failed", {
  userId: user.id,
  orderId: order.id,
  amount: order.totalPrice,
  error: error.message,
  stack: error.stack,
  requestId: req.id,
  timestamp: new Date().toISOString(),
});
```

**Log Aggregation:**
- Centralized logging with ELK stack (Elasticsearch, Logstash, Kibana)
- Log correlation using request IDs
- Alerting on error rate thresholds
- Log retention policies (30 days for INFO, 90 days for ERROR)

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property-based tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property-based tests verify general correctness across a wide range of inputs. Together, they provide comprehensive coverage that neither approach can achieve alone.

### Property-Based Testing

**Library**: fast-check (TypeScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with format: **Feature: bookstore-platform-enhancement, Property {number}: {property_text}**
- Each correctness property implemented by a single property-based test
- Increased iterations in CI (500+) for more thorough testing

**Test Organization:**

```
backend/src/
  auth/
    auth.service.spec.ts (unit tests)
    auth.properties.spec.ts (property tests)
  access-control/
    access-control.service.spec.ts (unit tests)
    access-control.properties.spec.ts (property tests)
  cart/
    cart.service.spec.ts (unit tests)
    cart.properties.spec.ts (property tests)
  orders/
    orders.service.spec.ts (unit tests)
    orders.properties.spec.ts (property tests)
  payments/
    payments.service.spec.ts (unit tests)
    payments.properties.spec.ts (property tests)
  search/
    search.service.spec.ts (unit tests)
    search.properties.spec.ts (property tests)
```

**Property Test Examples:**

```typescript
// Feature: bookstore-platform-enhancement, Property 23: Cart operation round-trip
describe("Property 23: Cart operation round-trip", () => {
  it("should restore original cart state after add then remove", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          bookId: fc.uuid(),
          quantity: fc.integer({ min: 1, max: 10 }),
        }),
        async ({ userId, bookId, quantity }) => {
          // Get initial cart state
          const initialCart = await cartService.getCart(userId);
          const initialItemCount = initialCart.items.length;

          // Add item
          await cartService.addItem(userId, { bookId, quantity });

          // Remove item
          await cartService.removeItem(userId, bookId);

          // Verify cart restored
          const finalCart = await cartService.getCart(userId);
          expect(finalCart.items.length).toBe(initialItemCount);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: bookstore-platform-enhancement, Property 24: Order total calculation
describe("Property 24: Order total calculation", () => {
  it("should calculate order total correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            price: fc.float({ min: 0.01, max: 1000, noNaN: true }),
            quantity: fc.integer({ min: 1, max: 10 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        fc.float({ min: 0, max: 0.5, noNaN: true }), // discount percentage
        async (items, discountPercent) => {
          const subtotal = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          );
          const discount = subtotal * discountPercent;
          const expectedTotal = subtotal - discount;

          // Create order with items
          const order = await createTestOrder(items, discountPercent);

          // Verify total
          expect(order.totalPrice).toBeCloseTo(expectedTotal, 2);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: bookstore-platform-enhancement, Property 33: Rate limiting enforcement
describe("Property 33: Rate limiting enforcement", () => {
  it("should enforce rate limits and return 429", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // rate limit
        fc.integer({ min: 6, max: 20 }), // number of requests (exceeds limit)
        async (limit, requestCount) => {
          const endpoint = "/api/test";
          const config = { windowMs: 60000, max: limit };

          // Make requests up to limit
          for (let i = 0; i < limit; i++) {
            const response = await request(app).get(endpoint);
            expect(response.status).not.toBe(429);
          }

          // Next request should be rate limited
          const response = await request(app).get(endpoint);
          expect(response.status).toBe(429);
          expect(response.headers["retry-after"]).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});
```

### Unit Testing

**Framework**: Jest

**Coverage Goals:**
- Service methods: 90%+ coverage
- Controllers: 85%+ coverage
- Guards and middleware: 100% coverage
- Utilities: 95%+ coverage

**Test Categories:**

1. **Happy Path Tests**: Verify correct behavior with valid inputs
2. **Edge Case Tests**: Empty arrays, boundary values, special characters, null/undefined
3. **Error Condition Tests**: Invalid inputs, missing resources, authorization failures
4. **Integration Tests**: Test interactions between services and modules

**Unit Test Examples:**

```typescript
describe("AccessControlService", () => {
  describe("authorize", () => {
    it("should allow SUPER_ADMIN to perform any action", async () => {
      const user = createTestUser({ role: Role.SUPER_ADMIN });
      const result = await service.authorize(user, "any.action");
      expect(result).toBe(true);
    });

    it("should deny ADMIN from performing governance actions", async () => {
      const user = createTestUser({ role: Role.ADMIN });
      const result = await service.authorize(user, "admin.create");
      expect(result).toBe(false);
    });

    it("should check staff permissions and scope", async () => {
      const user = createTestUser({
        role: Role.USER,
        staffProfile: {
          departmentId: "dept-1",
          permissions: ["support.tickets.view"],
        },
      });
      const resource = { departmentId: "dept-1" };
      const result = await service.authorize(
        user,
        "support.tickets.view",
        resource,
      );
      expect(result).toBe(true);
    });

    it("should deny access to resources outside scope", async () => {
      const user = createTestUser({
        role: Role.USER,
        staffProfile: {
          departmentId: "dept-1",
          permissions: ["support.tickets.view"],
        },
      });
      const resource = { departmentId: "dept-2" };
      const result = await service.authorize(
        user,
        "support.tickets.view",
        resource,
      );
      expect(result).toBe(false);
    });
  });
});

describe("PaymentService", () => {
  describe("createPaymentIntent", () => {
    it("should create Stripe payment intent with correct amount", async () => {
      const amount = 99.99;
      const result = await service.createPaymentIntent(amount, "usd", {});
      expect(result.amount).toBe(9999); // Stripe uses cents
      expect(result.currency).toBe("usd");
    });

    it("should include metadata in payment intent", async () => {
      const metadata = { userId: "user-1", orderId: "order-1" };
      const result = await service.createPaymentIntent(50, "usd", metadata);
      expect(result.metadata).toEqual(metadata);
    });

    it("should handle Stripe API errors", async () => {
      stripeMock.paymentIntents.create.mockRejectedValue(
        new Error("Card declined"),
      );
      await expect(service.createPaymentIntent(100, "usd", {})).rejects.toThrow(
        "Card declined",
      );
    });
  });
});
```

### Frontend Testing

**Framework**: Vitest + React Testing Library

**Test Types:**
- Component tests: Render, user interactions, state changes
- Hook tests: Custom hooks behavior
- Integration tests: Component interactions, API calls
- E2E tests: Playwright for critical user flows

**Coverage Goals:**
- Components: 80%+ coverage
- Hooks: 90%+ coverage
- Utilities: 95%+ coverage

**Frontend Test Examples:**

```typescript
describe("AdminDashboard", () => {
  it("should display dashboard statistics", async () => {
    const stats = {
      totalBooks: 100,
      totalOrders: 50,
      totalUsers: 200,
      totalRevenue: 5000,
    };
    mockApi.getDashboardStats.mockResolvedValue(stats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.getByText("200")).toBeInTheDocument();
      expect(screen.getByText("$5,000")).toBeInTheDocument();
    });
  });

  it("should handle loading state", () => {
    mockApi.getDashboardStats.mockReturnValue(new Promise(() => {}));
    render(<AdminDashboard />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("should handle error state", async () => {
    mockApi.getDashboardStats.mockRejectedValue(new Error("Failed to load"));
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Testing

**Framework**: Playwright

**Critical User Flows:**
1. User registration → Login → Browse books → Add to cart → Checkout → Payment → Order confirmation
2. Admin login → Create book → Update stock → View orders → Update order status
3. Staff login → View inquiries → Reply to inquiry → Escalate inquiry
4. User login → Add to wishlist → Add to reading list → Record reading session
5. Author login → Create blog post → Publish → View comments

**E2E Test Example:**

```typescript
test("complete checkout flow", async ({ page }) => {
  // Login
  await page.goto("/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');

  // Browse and add to cart
  await page.goto("/books");
  await page.click('text="Add to Cart"').first();
  await expect(page.locator(".cart-count")).toHaveText("1");

  // Checkout
  await page.goto("/cart");
  await page.click('text="Proceed to Checkout"');

  // Fill shipping info
  await page.fill('input[name="fullName"]', "John Doe");
  await page.fill('input[name="address"]', "123 Main St");
  await page.fill('input[name="city"]', "New York");
  await page.fill('input[name="zipCode"]', "10001");

  // Complete payment (using Stripe test mode)
  await page.fill('input[name="cardNumber"]', "4242424242424242");
  await page.fill('input[name="expiry"]', "12/25");
  await page.fill('input[name="cvc"]', "123");
  await page.click('button:has-text("Place Order")');

  // Verify order confirmation
  await expect(page).toHaveURL(/\/orders\/[a-z0-9-]+/);
  await expect(page.locator("h1")).toContainText("Order Confirmed");
});
```

### Test Database

**Strategy:**
- Use separate test database or Docker container
- Reset database state between test suites
- Use Prisma migrations for test database schema
- Seed minimal test data as needed
- Use transactions for test isolation where possible

**Test Data Factories:**

```typescript
// Test data factories for consistent test data generation
const createTestUser = (overrides?: Partial<User>): User => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: Role.USER,
  ...overrides,
});

const createTestBook = (overrides?: Partial<Book>): Book => ({
  id: faker.string.uuid(),
  title: faker.commerce.productName(),
  author: faker.person.fullName(),
  isbn: faker.string.numeric(13),
  price: parseFloat(faker.commerce.price()),
  stock: faker.number.int({ min: 0, max: 100 }),
  ...overrides,
});
```

### Continuous Integration

**CI Pipeline:**
1. Lint and format check
2. Type checking (TypeScript)
3. Unit tests with coverage report
4. Property tests with 500 iterations
5. Integration tests
6. E2E tests (critical flows only)
7. Build verification
8. Security scanning (npm audit, Snyk)

**Quality Gates:**
- Minimum 85% code coverage
- All tests must pass
- No high-severity security vulnerabilities
- No TypeScript errors
- Linting passes

**Performance Testing:**
- Load testing with k6 or Artillery
- Database query performance monitoring
- API response time benchmarks
- Frontend bundle size limits

### Monitoring and Observability

**Metrics to Track:**
- API response times (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- Cache hit rates
- WebSocket connection count
- Email delivery success rate
- Payment success rate
- Search query latency

**Alerting:**
- Error rate > 5% for 5 minutes
- API response time p95 > 1 second
- Database connection pool exhaustion
- Cache unavailable
- Payment gateway failures
- Email delivery failures > 10%

**Distributed Tracing:**
- Use OpenTelemetry for request tracing
- Trace requests across services
- Identify performance bottlenecks
- Correlate logs with traces
