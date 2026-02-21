# Implementation Plan: Bookstore Platform Enhancement

## Overview

This implementation plan breaks down the bookstore platform enhancements into discrete, incremental coding tasks. The plan builds upon the existing fully-functional backend and 60%-complete frontend. Tasks are organized into phases, with testing integrated throughout to validate correctness early. The implementation uses TypeScript for both backend (NestJS) and frontend (React).

## Tasks

### Phase 1: Complete Frontend User Experience

- [ ] 1. Implement user profile page
  - [ ] 1.1 Create ProfilePage component with user data display
    - Display user information (name, email, pronouns, bio, avatar)
    - Show user statistics (orders count, reviews count, reading progress)
    - Add navigation tabs for profile sections
    - _Requirements: 1.1_

  - [ ] 1.2 Implement profile edit functionality
    - Create ProfileEditForm with validation
    - Add avatar selection (emoji or image upload)
    - Implement profile update API integration
    - Show success/error messages
    - _Requirements: 1.1_

  - [ ]* 1.3 Write property test for profile updates (Property 1)
    - **Property 1: Password change validation**
    - **Validates: Requirements 1.2**

  - [ ] 1.4 Create password change form
    - Add PasswordChangeForm component
    - Validate old password before update
    - Enforce password strength requirements
    - Show success message on completion
    - _Requirements: 1.2_

  - [ ] 1.5 Implement wishlist functionality
    - Create WishlistSection component
    - Add "Add to Wishlist" button on book pages
    - Implement wishlist API integration
    - Show wishlist items on profile
    - _Requirements: 1.4_

  - [ ]* 1.6 Write property test for wishlist round-trip (Property 3)
    - **Property 3: Wishlist round-trip**
    - **Validates: Requirements 1.4**

  - [ ] 1.7 Create reading list component
    - Display reading items with status (TO_READ, READING, FINISHED)
    - Show reading progress bars
    - Add reading session recording
    - Display reading statistics
    - _Requirements: 1.4_

- [ ] 2. Implement book reviews and ratings
  - [ ] 2.1 Create ReviewSection component
    - Display all reviews for a book
    - Show average rating and rating distribution
    - Add pagination for reviews
    - _Requirements: 1.5_

  - [ ] 2.2 Implement review submission form
    - Create ReviewForm with rating selector (1-5 stars)
    - Add comment textarea with validation
    - Integrate with reviews API
    - Show success message after submission
    - _Requirements: 1.6_

  - [ ]* 2.3 Write property test for review validation (Property 4)
    - **Property 4: Review validation and persistence**
    - **Validates: Requirements 1.6**

- [ ] 3. Enhance book search and filtering
  - [ ] 3.1 Create FilterSidebar component
    - Add category filter with checkboxes
    - Add price range slider
    - Add rating filter
    - Show active filters with remove option
    - _Requirements: 1.7_

  - [ ] 3.2 Implement filter application logic
    - Update search query with filters
    - Integrate with books API
    - Show filtered results count
    - Add "Clear all filters" button
    - _Requirements: 1.7_

  - [ ]* 3.3 Write property test for filtering (Property 5)
    - **Property 5: Book filtering correctness**
    - **Validates: Requirements 1.7**

  - [ ] 3.4 Add related books section
    - Create RelatedBooks component
    - Fetch books by same author or category
    - Display as horizontal scrollable list
    - _Requirements: 1.8_

  - [ ]* 3.5 Write property test for related books (Property 6)
    - **Property 6: Related books criteria**
    - **Validates: Requirements 1.8**

- [ ] 4. Checkpoint - Frontend user experience complete
  - Ensure all tests pass, verify UI functionality, ask the user if questions arise.

### Phase 2: Complete Admin Dashboard

- [ ] 5. Implement admin dashboard overview
  - [ ] 5.1 Create AdminDashboard layout with sidebar
    - Create AdminLayout with navigation sidebar
    - Add admin route protection
    - Implement responsive design
    - _Requirements: 2.1_

  - [ ] 5.2 Create dashboard statistics cards
    - Create StatCard component
    - Fetch and display total books, orders, users, revenue
    - Add loading states
    - Add refresh functionality
    - _Requirements: 2.1_

  - [ ]* 5.3 Write property test for statistics accuracy (Property 7)
    - **Property 7: Dashboard statistics accuracy**
    - **Validates: Requirements 2.1**

  - [ ] 5.4 Create recent orders table
    - Display 10 most recent orders
    - Show order ID, customer, total, status, date
    - Add click to view order details
    - _Requirements: 2.2_

  - [ ]* 5.5 Write property test for recent orders ordering (Property 8)
    - **Property 8: Recent orders ordering**
    - **Validates: Requirements 2.2**

  - [ ] 5.6 Create low stock alerts section
    - Display books with stock below threshold
    - Show book title, current stock, threshold
    - Add link to update stock
    - _Requirements: 2.3_

  - [ ]* 5.7 Write property test for low stock filtering (Property 9)
    - **Property 9: Low stock alert filtering**
    - **Validates: Requirements 2.3**

- [ ] 6. Implement book management
  - [ ] 6.1 Create ManageBooksPage with book list
    - Display all books in table format
    - Add search and filter functionality
    - Show stock status indicators
    - Add action buttons (edit, delete)
    - _Requirements: 2.4, 2.5, 2.6_

  - [ ] 6.2 Create BookForm for create/edit
    - Add form fields for all book properties
    - Implement validation with Zod
    - Add image upload for cover
    - Handle create and update modes
    - _Requirements: 2.4_

  - [ ]* 6.3 Write property test for book creation (Property 10)
    - **Property 10: Book creation validation**
    - **Validates: Requirements 2.4**

  - [ ] 6.3 Implement stock management
    - Add stock update modal
    - Show current stock and threshold
    - Update stock via API
    - Trigger alerts if below threshold
    - _Requirements: 2.5_

  - [ ]* 6.4 Write property test for stock updates (Property 11)
    - **Property 11: Stock update and alert triggering**
    - **Validates: Requirements 2.5**

  - [ ] 6.5 Implement book deletion with confirmation
    - Add delete confirmation modal
    - Implement soft delete
    - Show success message
    - Refresh book list
    - _Requirements: 2.6_

  - [ ]* 6.6 Write property test for soft delete (Property 12)
    - **Property 12: Soft delete behavior**
    - **Validates: Requirements 2.6**

- [ ] 7. Implement order management
  - [ ] 7.1 Create ManageOrdersPage
    - Display all orders in table
    - Add filters (status, customer email, order ID, date range)
    - Show order details on click
    - Add export to CSV functionality
    - _Requirements: 2.7, 2.8_

  - [ ] 7.2 Implement order status updates
    - Add status dropdown for each order
    - Validate status transitions
    - Update via API
    - Show success/error messages
    - _Requirements: 2.7_

  - [ ]* 7.3 Write property test for status transitions (Property 13)
    - **Property 13: Order status transition validation**
    - **Validates: Requirements 2.7**

- [ ] 8. Implement user management
  - [ ] 8.1 Create ManageUsersPage
    - Display all users in table
    - Show user role, registration date, order count
    - Add search by email or name
    - Add role management actions
    - _Requirements: 2.9, 2.10_

  - [ ] 8.2 Implement role promotion
    - Add role change dropdown
    - Confirm role changes
    - Update via API
    - Show success message
    - _Requirements: 2.9_

  - [ ]* 8.3 Write property test for role promotion (Property 14)
    - **Property 14: Role promotion persistence**
    - **Validates: Requirements 2.9**

  - [ ] 8.4 Display user activity statistics
    - Show order count per user
    - Calculate total spending
    - Display last order date
    - _Requirements: 2.10_

- [ ] 9. Checkpoint - Admin dashboard complete
  - Ensure all tests pass, verify admin functionality, ask the user if questions arise.


### Phase 3: Implement Access Control System

- [ ] 10. Create access control infrastructure
  - [ ] 10.1 Add SUPER_ADMIN role to database schema
    - Update Prisma schema with SUPER_ADMIN enum value
    - Create migration
    - Update seed script to create super admin user
    - _Requirements: 3.1_

  - [ ] 10.2 Create permission matrix and scope definitions
    - Define PERMISSION_MATRIX constant with all permissions
    - Define RESTRICTED_GOVERNANCE_ACTIONS list
    - Create ScopeType enum
    - Document all permissions
    - _Requirements: 3.4, 3.6_

  - [ ] 10.3 Implement central authorization function
    - Create authorize() function with decision flow
    - Implement SUPER_ADMIN bypass logic
    - Implement governance action checks
    - Implement ADMIN operational access
    - Implement staff permission checking
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 10.4 Write property test for SUPER_ADMIN bypass (Property 15)
    - **Property 15: SUPER_ADMIN bypass**
    - **Validates: Requirements 3.1**

  - [ ]* 10.5 Write property test for ADMIN access (Property 16)
    - **Property 16: ADMIN operational access**
    - **Validates: Requirements 3.2**

  - [ ]* 10.6 Write property test for governance restrictions (Property 17)
    - **Property 17: Governance action restriction**
    - **Validates: Requirements 3.3**

- [ ] 11. Implement scope-based filtering
  - [ ] 11.1 Create scope checking functions
    - Implement checkScopeAccess() for all scope types
    - Add GLOBAL scope (no filtering)
    - Add DEPARTMENT scope (filter by department)
    - Add ASSIGNED_ONLY scope (filter by assignee)
    - Add SELF_ONLY scope (filter by user)
    - _Requirements: 3.5_

  - [ ] 11.2 Create scoped query helpers
    - Add scopedInquiriesQuery() for inquiries
    - Add scopedTasksQuery() for staff tasks
    - Add scopedOrdersQuery() for orders
    - Add scopedWarehouseQuery() for warehouse operations
    - _Requirements: 3.5_

  - [ ]* 11.3 Write property test for permission checking (Property 18)
    - **Property 18: Permission and scope checking**
    - **Validates: Requirements 3.4, 3.6**

  - [ ]* 11.4 Write property test for scope filtering (Property 19)
    - **Property 19: Scope-based resource filtering**
    - **Validates: Requirements 3.5**

- [ ] 12. Implement audit logging
  - [ ] 12.1 Create AuditLog model and migration
    - Add AuditLog model to Prisma schema
    - Create migration
    - Add indexes for performance
    - _Requirements: 3.7, 3.8, 6.5_

  - [ ] 12.2 Create audit logging service
    - Implement createAuditLog() function
    - Add @Auditable decorator for automatic logging
    - Log role assignments, department changes, permission grants
    - Include actor, action, resource, changes, IP, user agent
    - _Requirements: 3.7, 3.8, 6.5_

  - [ ]* 12.3 Write property test for audit logging (Property 20)
    - **Property 20: Immutable audit logging**
    - **Validates: Requirements 3.7, 3.8, 6.5**

- [ ] 13. Implement permission versioning and SoD
  - [ ] 13.1 Add permission set versioning
    - Create PermissionSet model
    - Add version field to role assignments
    - Implement version mismatch detection
    - Require grant sync on mismatch
    - _Requirements: 3.9_

  - [ ]* 13.2 Write property test for version checking (Property 21)
    - **Property 21: Permission set version checking**
    - **Validates: Requirements 3.9**

  - [ ] 13.3 Implement separation of duties rules
    - Define SoD rules (creator cannot approve)
    - Check SoD rules in approval workflows
    - Return error if SoD violated
    - _Requirements: 3.10_

  - [ ]* 13.4 Write property test for SoD enforcement (Property 22)
    - **Property 22: Separation of duties enforcement**
    - **Validates: Requirements 3.10**

- [ ] 14. Integrate access control into existing modules
  - [ ] 14.1 Update inquiry module with access control
    - Add permission checks to inquiry endpoints
    - Apply scope filtering to inquiry queries
    - Update tests
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 14.2 Update warehouse module with access control
    - Add permission checks to warehouse endpoints
    - Apply scope filtering to warehouse queries
    - Update tests
    - _Requirements: 4.6, 4.7_

  - [ ] 14.3 Update staff module with access control
    - Add permission checks to staff endpoints
    - Apply scope filtering to staff queries
    - Update tests
    - _Requirements: 4.7, 4.8_

  - [ ] 14.4 Update blog module with access control
    - Add permission checks to moderation endpoints
    - Apply scope filtering where needed
    - Update tests
    - _Requirements: 4.3_

- [ ] 15. Checkpoint - Access control system complete
  - Ensure all tests pass, verify permission enforcement, ask the user if questions arise.

### Phase 4: Add Property-Based Testing

- [ ] 16. Set up property-based testing infrastructure
  - [ ] 16.1 Install and configure fast-check
    - Add fast-check dependency
    - Create property test file structure
    - Configure test runners for property tests
    - Set minimum 100 iterations per test
    - _Requirements: 5.1-5.10_

  - [ ] 16.2 Create test data generators
    - Create generators for User, Book, Order, Cart
    - Create generators for permissions and roles
    - Create generators for inquiries and staff
    - Create generators for warehouse data
    - _Requirements: 5.1-5.10_

- [ ] 17. Implement core business logic property tests
  - [ ]* 17.1 Write cart operation round-trip test (Property 23)
    - **Property 23: Cart operation round-trip**
    - **Validates: Requirements 5.1**

  - [ ]* 17.2 Write order total calculation test (Property 24)
    - **Property 24: Order total calculation**
    - **Validates: Requirements 5.2**

  - [ ]* 17.3 Write promotion code discount test (Property 25)
    - **Property 25: Promotion code discount calculation**
    - **Validates: Requirements 5.3**

  - [ ]* 17.4 Write stock transfer invariant test (Property 26)
    - **Property 26: Stock transfer invariant**
    - **Validates: Requirements 5.4**

  - [ ]* 17.5 Write permission grant round-trip test (Property 27)
    - **Property 27: Permission grant round-trip**
    - **Validates: Requirements 5.5**

  - [ ]* 17.6 Write role permission inheritance test (Property 28)
    - **Property 28: Role permission inheritance**
    - **Validates: Requirements 5.6**

  - [ ]* 17.7 Write inquiry assignment visibility test (Property 29)
    - **Property 29: Inquiry assignment visibility**
    - **Validates: Requirements 5.7**

  - [ ]* 17.8 Write blog post state preservation test (Property 30)
    - **Property 30: Blog post state preservation**
    - **Validates: Requirements 5.8**

  - [ ]* 17.9 Write reading progress accumulation test (Property 31)
    - **Property 31: Reading progress accumulation**
    - **Validates: Requirements 5.9**

  - [ ]* 17.10 Write purchase order stock increase test (Property 32)
    - **Property 32: Purchase order stock increase**
    - **Validates: Requirements 5.10**

- [ ] 18. Checkpoint - Property-based testing complete
  - Ensure all property tests pass with 100+ iterations, ask the user if questions arise.

### Phase 5: Implement Security Enhancements

- [ ] 19. Implement rate limiting
  - [ ] 19.1 Set up Redis for rate limiting
    - Install Redis client
    - Configure Redis connection
    - Create RateLimiter service
    - _Requirements: 6.1, 6.2_

  - [ ] 19.2 Create rate limiting guard
    - Implement RateLimitGuard
    - Add rate limit configurations for endpoints
    - Return 429 with Retry-After header
    - _Requirements: 6.1, 6.2, 8.9_

  - [ ]* 19.3 Write property test for rate limiting (Property 33)
    - **Property 33: Rate limiting enforcement**
    - **Validates: Requirements 6.1, 6.2, 8.9**

- [ ] 20. Implement data encryption
  - [ ] 20.1 Create encryption service
    - Implement EncryptionService with AES-256-GCM
    - Add encrypt() and decrypt() methods
    - Configure encryption key from environment
    - _Requirements: 6.3_

  - [ ] 20.2 Apply encryption to sensitive fields
    - Encrypt payment method data
    - Encrypt personal information where needed
    - Add @Transform decorators to DTOs
    - _Requirements: 6.3_

  - [ ]* 20.3 Write property test for encryption (Property 34)
    - **Property 34: Data encryption at rest**
    - **Validates: Requirements 6.3**

- [ ] 21. Enhance JWT security
  - [ ] 21.1 Implement JWT expiration enforcement
    - Configure JWT expiration time
    - Add token refresh endpoint
    - Reject expired tokens with 401
    - _Requirements: 6.6_

  - [ ]* 21.2 Write property test for JWT expiration (Property 35)
    - **Property 35: JWT expiration enforcement**
    - **Validates: Requirements 6.6**

- [ ] 22. Implement file upload validation
  - [ ] 22.1 Create file validation service
    - Validate file types (images only for covers/avatars)
    - Validate file sizes (max 5MB)
    - Scan for malware (optional: ClamAV integration)
    - _Requirements: 6.10_

  - [ ]* 22.2 Write property test for file validation (Property 38)
    - **Property 38: File upload validation**
    - **Validates: Requirements 6.10**

- [ ] 23. Checkpoint - Security enhancements complete
  - Ensure all tests pass, verify security measures, ask the user if questions arise.

### Phase 6: Implement Performance Optimizations

- [ ] 24. Set up caching infrastructure
  - [ ] 24.1 Configure Redis for caching
    - Set up Redis connection
    - Create cache configurations for different data types
    - Define TTL values
    - _Requirements: 7.1, 7.3, 7.5_

  - [ ] 24.2 Create caching decorator
    - Implement @Cacheable decorator
    - Add cache invalidation on updates
    - Handle cache misses
    - _Requirements: 7.3, 7.5_

  - [ ]* 24.3 Write property test for cache TTL (Property 39)
    - **Property 39: Cache TTL behavior**
    - **Validates: Requirements 7.3, 7.5**

- [ ] 25. Optimize database queries
  - [ ] 25.1 Add database indexes
    - Review slow query logs
    - Add indexes for frequently queried fields
    - Add composite indexes where needed
    - _Requirements: 7.2_

  - [ ] 25.2 Implement query optimization
    - Use select to limit returned fields
    - Implement cursor-based pagination
    - Add batch loading for N+1 prevention
    - _Requirements: 7.6_

  - [ ]* 25.3 Write property test for pagination (Property 40)
    - **Property 40: Pagination limit enforcement**
    - **Validates: Requirements 7.6**

- [ ] 26. Implement slow query logging
  - [ ] 26.1 Add query performance monitoring
    - Configure Prisma query logging
    - Log queries taking > 1 second
    - Include query details and execution time
    - _Requirements: 7.9_

  - [ ]* 26.2 Write property test for slow query logging (Property 41)
    - **Property 41: Slow query logging**
    - **Validates: Requirements 7.9**

- [ ] 27. Checkpoint - Performance optimizations complete
  - Ensure all tests pass, verify performance improvements, ask the user if questions arise.

### Phase 7: Implement API Enhancements

- [ ] 28. Implement WebSocket support
  - [ ] 28.1 Set up Socket.io server
    - Install Socket.io
    - Configure WebSocket gateway
    - Add authentication for WebSocket connections
    - _Requirements: 8.1, 8.2_

  - [ ] 28.2 Implement real-time updates
    - Add cart update events
    - Add order status change events
    - Add notification events
    - Implement subscription management
    - _Requirements: 8.1, 8.2_

  - [ ]* 28.3 Write property test for WebSocket updates (Property 42)
    - **Property 42: WebSocket real-time updates**
    - **Validates: Requirements 8.1, 8.2**

- [ ] 29. Implement webhook system
  - [ ] 29.1 Create webhook models and service
    - Add WebhookSubscription and WebhookDelivery models
    - Create migration
    - Implement webhook registration API
    - _Requirements: 8.3, 8.4_

  - [ ] 29.2 Implement webhook delivery
    - Create webhook delivery service
    - Implement retry logic with exponential backoff
    - Add signature generation for security
    - Log delivery attempts
    - _Requirements: 8.3, 8.4_

  - [ ]* 29.3 Write property test for webhook delivery (Property 43)
    - **Property 43: Webhook delivery with retry**
    - **Validates: Requirements 8.3, 8.4**

- [ ] 30. Implement GraphQL API
  - [ ] 30.1 Set up Apollo Server
    - Install Apollo Server
    - Configure GraphQL module
    - Create GraphQL schema
    - _Requirements: 8.7, 8.8_

  - [ ] 30.2 Implement GraphQL resolvers
    - Create query resolvers (books, cart, orders, user)
    - Create mutation resolvers (addToCart, createOrder, updateProfile)
    - Create subscription resolvers (cartUpdated, orderStatusChanged)
    - Add authentication and authorization
    - _Requirements: 8.7, 8.8_

  - [ ]* 30.3 Write property test for GraphQL queries (Property 44)
    - **Property 44: GraphQL query resolution**
    - **Validates: Requirements 8.7**

  - [ ]* 30.4 Write property test for GraphQL mutations (Property 45)
    - **Property 45: GraphQL mutation validation**
    - **Validates: Requirements 8.8**

- [ ] 31. Enhance error handling
  - [ ] 31.1 Standardize error responses
    - Update global exception filter
    - Ensure consistent error format
    - Add request IDs for tracking
    - _Requirements: 8.10_

  - [ ]* 31.2 Write property test for error format (Property 46)
    - **Property 46: API error format consistency**
    - **Validates: Requirements 8.10**

- [ ] 32. Checkpoint - API enhancements complete
  - Ensure all tests pass, verify API functionality, ask the user if questions arise.


### Phase 8: Implement Email Notification System

- [ ] 33. Set up email infrastructure
  - [ ] 33.1 Configure email service provider
    - Choose provider (SendGrid or AWS SES)
    - Install SDK
    - Configure API keys
    - _Requirements: 10.1-10.10_

  - [ ] 33.2 Create email templates
    - Create welcome email template
    - Create order confirmation template
    - Create order status update template
    - Create password reset template
    - Create inquiry reply template
    - Create blog notification templates
    - Create promotion email template
    - _Requirements: 10.1-10.8_

- [ ] 34. Implement email service
  - [ ] 34.1 Create email queue with Bull
    - Install Bull and Redis
    - Configure email queue
    - Create email worker process
    - _Requirements: 10.1-10.10_

  - [ ] 34.2 Implement email sending service
    - Create EmailService with sendEmail() method
    - Implement template rendering
    - Add email queueing
    - Implement retry logic
    - _Requirements: 10.1-10.10_

  - [ ]* 34.3 Write property test for email sending (Property 47)
    - **Property 47: Event-triggered email sending**
    - **Validates: Requirements 10.1-10.8**

  - [ ]* 34.4 Write property test for email retry (Property 48)
    - **Property 48: Email retry on failure**
    - **Validates: Requirements 10.9**

- [ ] 35. Integrate email notifications
  - [ ] 35.1 Add email triggers to user registration
    - Send welcome email on registration
    - _Requirements: 10.1_

  - [ ] 35.2 Add email triggers to order flow
    - Send confirmation email on order creation
    - Send status update email on status change
    - _Requirements: 10.2, 10.3_

  - [ ] 35.3 Add email triggers to inquiry system
    - Send email on inquiry reply
    - _Requirements: 10.5_

  - [ ] 35.4 Add email triggers to blog system
    - Send email on new comment
    - Send email on new follower
    - _Requirements: 10.6, 10.7_

  - [ ] 35.5 Implement email preferences
    - Add marketingOptIn field to User model
    - Check preferences before sending promotional emails
    - Always send transactional emails
    - _Requirements: 10.10_

  - [ ]* 35.6 Write property test for email preferences (Property 49)
    - **Property 49: Email preference enforcement**
    - **Validates: Requirements 10.10**

- [ ] 36. Checkpoint - Email notification system complete
  - Ensure all tests pass, verify email delivery, ask the user if questions arise.

### Phase 9: Implement Payment Gateway Integration

- [ ] 37. Set up Stripe integration
  - [ ] 37.1 Configure Stripe
    - Install Stripe SDK
    - Configure API keys (test and production)
    - Set up webhook endpoint
    - _Requirements: 11.1-11.10_

  - [ ] 37.2 Create payment service
    - Implement createPaymentIntent()
    - Implement confirmPayment()
    - Implement createRefund()
    - Implement handleWebhook()
    - _Requirements: 11.1, 11.3, 11.8, 11.9_

  - [ ]* 37.3 Write property test for payment intent (Property 50)
    - **Property 50: Payment intent creation**
    - **Validates: Requirements 11.1, 11.3**

- [ ] 38. Integrate payment into checkout flow
  - [ ] 38.1 Update checkout API
    - Create payment intent on checkout
    - Return client secret to frontend
    - Store payment intent ID with order
    - _Requirements: 11.1, 11.3_

  - [ ] 38.2 Implement payment webhook handler
    - Handle payment_intent.succeeded event
    - Handle payment_intent.payment_failed event
    - Handle charge.refunded event
    - Verify webhook signatures
    - _Requirements: 11.4, 11.5, 11.8, 11.9_

  - [ ]* 38.3 Write property test for order creation on success (Property 51)
    - **Property 51: Order creation on payment success**
    - **Validates: Requirements 11.4**

  - [ ]* 38.4 Write property test for cart preservation on failure (Property 52)
    - **Property 52: Cart preservation on payment failure**
    - **Validates: Requirements 11.5**

  - [ ]* 38.5 Write property test for webhook signature (Property 54)
    - **Property 54: Webhook signature verification**
    - **Validates: Requirements 11.9**

- [ ] 39. Implement refund functionality
  - [ ] 39.1 Create refund API endpoint
    - Add refund endpoint for admins
    - Process refund through Stripe
    - Update order with refund details
    - _Requirements: 11.8_

  - [ ]* 39.2 Write property test for refund processing (Property 53)
    - **Property 53: Refund processing**
    - **Validates: Requirements 11.8**

- [ ] 40. Implement PCI compliance
  - [ ] 40.1 Ensure card data security
    - Never store full card numbers
    - Store only last 4 digits
    - Use Stripe.js for tokenization on frontend
    - _Requirements: 11.2, 11.10_

  - [ ]* 40.2 Write property test for PCI compliance (Property 55)
    - **Property 55: PCI compliance for card data**
    - **Validates: Requirements 11.10**

- [ ] 41. Implement frontend payment integration
  - [ ] 41.1 Add Stripe Elements to checkout
    - Install @stripe/stripe-js and @stripe/react-stripe-js
    - Create PaymentForm component
    - Integrate Stripe Elements
    - Handle payment confirmation
    - _Requirements: 11.2_

  - [ ] 41.2 Handle payment success/failure
    - Redirect to order confirmation on success
    - Show error message on failure
    - Keep cart intact on failure
    - _Requirements: 11.4, 11.5_

- [ ] 42. Checkpoint - Payment integration complete
  - Ensure all tests pass, verify payment flow, ask the user if questions arise.

### Phase 10: Implement Elasticsearch Integration

- [ ] 43. Set up Elasticsearch
  - [ ] 43.1 Configure Elasticsearch
    - Install Elasticsearch client
    - Configure connection
    - Create books index with mappings
    - _Requirements: 13.1-13.10_

  - [ ] 43.2 Create search service
    - Implement indexBook()
    - Implement searchBooks()
    - Implement autocomplete()
    - Implement buildFilters()
    - _Requirements: 13.1-13.10_

  - [ ]* 43.3 Write property test for Elasticsearch search (Property 56)
    - **Property 56: Elasticsearch full-text search**
    - **Validates: Requirements 13.1**

- [ ] 44. Implement search features
  - [ ] 44.1 Implement autocomplete
    - Add autocomplete endpoint
    - Return suggestions based on prefix
    - _Requirements: 13.2_

  - [ ]* 44.2 Write property test for autocomplete (Property 57)
    - **Property 57: Autocomplete suggestions**
    - **Validates: Requirements 13.2**

  - [ ] 44.3 Implement fuzzy matching
    - Configure fuzziness in search queries
    - Test with typos
    - _Requirements: 13.3_

  - [ ]* 44.4 Write property test for fuzzy matching (Property 58)
    - **Property 58: Fuzzy matching for typos**
    - **Validates: Requirements 13.3**

  - [ ] 44.5 Implement aggregations
    - Add category aggregations
    - Add price range aggregations
    - Return facets with search results
    - _Requirements: 13.4, 13.5_

  - [ ]* 44.6 Write property test for aggregations (Property 59)
    - **Property 59: Search aggregations**
    - **Validates: Requirements 13.4**

  - [ ] 44.7 Implement result highlighting
    - Configure highlighting in search queries
    - Return highlighted snippets
    - _Requirements: 13.7_

  - [ ]* 44.8 Write property test for highlighting (Property 60)
    - **Property 60: Search result highlighting**
    - **Validates: Requirements 13.7**

  - [ ] 44.9 Implement ISBN exact match boosting
    - Boost ISBN matches in search
    - Prioritize exact matches
    - _Requirements: 13.8_

  - [ ]* 44.10 Write property test for ISBN priority (Property 61)
    - **Property 61: ISBN exact match priority**
    - **Validates: Requirements 13.8**

- [ ] 45. Implement index synchronization
  - [ ] 45.1 Add index sync on book changes
    - Sync on book create
    - Sync on book update
    - Sync on book delete
    - Use queue for async sync
    - _Requirements: 13.9_

  - [ ]* 45.2 Write property test for index sync (Property 62)
    - **Property 62: Search index synchronization**
    - **Validates: Requirements 13.9**

- [ ] 46. Implement fallback to PostgreSQL
  - [ ] 46.1 Add fallback search logic
    - Detect Elasticsearch unavailability
    - Fall back to PostgreSQL full-text search
    - Log fallback events
    - _Requirements: 13.10_

  - [ ]* 46.2 Write property test for fallback (Property 63)
    - **Property 63: Search fallback behavior**
    - **Validates: Requirements 13.10**

- [ ] 47. Checkpoint - Elasticsearch integration complete
  - Ensure all tests pass, verify search functionality, ask the user if questions arise.

### Phase 11: Implement Analytics and Reporting

- [ ] 48. Create analytics service
  - [ ] 48.1 Implement sales analytics
    - Create getSalesAnalytics() method
    - Support day, week, month grouping
    - Calculate revenue, order count, average order value
    - _Requirements: 9.1_

  - [ ] 48.2 Implement popular books analytics
    - Create getPopularBooks() method
    - Calculate sales count and revenue per book
    - Return top 10 books
    - _Requirements: 9.2_

  - [ ] 48.3 Implement customer analytics
    - Create getCustomerAnalytics() method
    - Calculate new vs returning customers
    - Calculate customer lifetime value
    - Calculate conversion rate
    - _Requirements: 9.3, 9.8, 9.9_

  - [ ] 48.4 Implement inventory analytics
    - Create getInventoryAnalytics() method
    - Show stock levels by warehouse
    - Show low stock counts
    - _Requirements: 9.5_

- [ ] 49. Create analytics dashboard
  - [ ] 49.1 Create AnalyticsPage component
    - Add sales chart (line chart with Recharts)
    - Add popular books table
    - Add customer metrics cards
    - Add inventory overview
    - _Requirements: 9.1-9.9_

  - [ ] 49.2 Implement report export
    - Add export to CSV functionality
    - Support different report types
    - _Requirements: 9.4_

- [ ] 50. Checkpoint - Analytics complete
  - Ensure all tests pass, verify analytics accuracy, ask the user if questions arise.

### Phase 12: Implement Internationalization

- [ ] 51. Set up i18n infrastructure
  - [ ] 51.1 Configure i18next
    - Install i18next and react-i18next
    - Configure supported languages (en, es, fr, de)
    - Set up translation files
    - _Requirements: 12.1-12.10_

  - [ ] 51.2 Create translation files
    - Create en.json with all UI strings
    - Create es.json, fr.json, de.json (initial translations)
    - Organize by feature/page
    - _Requirements: 12.1_

- [ ] 52. Implement language switching
  - [ ] 52.1 Add language selector component
    - Create LanguageSelector dropdown
    - Store preference in localStorage
    - Reload content on language change
    - _Requirements: 12.1, 12.5_

  - [ ] 52.2 Implement locale-specific formatting
    - Format prices by locale
    - Format dates by locale
    - Format numbers by locale
    - _Requirements: 12.2, 12.3, 12.4_

  - [ ] 52.3 Implement fallback to English
    - Configure fallback language
    - Show English text if translation missing
    - _Requirements: 12.6_

- [ ] 53. Checkpoint - Internationalization complete
  - Ensure all tests pass, verify translations, ask the user if questions arise.

### Phase 13: Final Integration and Testing

- [ ] 54. Integration testing
  - [ ] 54.1 Write E2E tests for critical flows
    - Test complete user registration → checkout → payment flow
    - Test admin book management flow
    - Test staff inquiry management flow
    - Test access control enforcement
    - _Requirements: All_

  - [ ] 54.2 Write integration tests for new features
    - Test WebSocket real-time updates
    - Test webhook delivery
    - Test email sending
    - Test payment processing
    - Test Elasticsearch search
    - _Requirements: 8.1-8.4, 10.1-10.10, 11.1-11.10, 13.1-13.10_

- [ ] 55. Performance testing
  - [ ] 55.1 Run load tests
    - Test API endpoints under load
    - Test database query performance
    - Test cache effectiveness
    - Identify bottlenecks
    - _Requirements: 7.1-7.10_

  - [ ] 55.2 Optimize based on results
    - Add indexes where needed
    - Optimize slow queries
    - Adjust cache TTLs
    - _Requirements: 7.1-7.10_

- [ ] 56. Security testing
  - [ ] 56.1 Run security scans
    - Run npm audit
    - Run Snyk scan
    - Test rate limiting
    - Test authentication/authorization
    - _Requirements: 6.1-6.10_

  - [ ] 56.2 Fix security issues
    - Update vulnerable dependencies
    - Fix identified security issues
    - _Requirements: 6.1-6.10_

- [ ] 57. Documentation
  - [ ] 57.1 Update API documentation
    - Update Swagger/OpenAPI spec
    - Document new endpoints
    - Document GraphQL schema
    - Add examples
    - _Requirements: 8.6_

  - [ ] 57.2 Update README and guides
    - Update setup instructions
    - Document new features
    - Add deployment guide
    - Add troubleshooting guide
    - _Requirements: All_

- [ ] 58. Final checkpoint - Complete implementation
  - Ensure all tests pass, verify all features work, prepare for deployment, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout development
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The implementation builds upon the existing fully-functional backend
- Frontend tasks use React 18, TypeScript, and TailwindCSS
- Backend tasks use NestJS, TypeScript, and Prisma
- All new features maintain backward compatibility
- All new features include comprehensive error handling
- Testing is integrated throughout, not left to the end
- Each phase can be deployed independently for incremental rollout

## Estimated Timeline

- Phase 1 (Frontend UX): 2-3 weeks
- Phase 2 (Admin Dashboard): 2-3 weeks
- Phase 3 (Access Control): 2-3 weeks
- Phase 4 (Property Testing): 1-2 weeks
- Phase 5 (Security): 1-2 weeks
- Phase 6 (Performance): 1-2 weeks
- Phase 7 (API Enhancements): 2-3 weeks
- Phase 8 (Email): 1 week
- Phase 9 (Payment): 2 weeks
- Phase 10 (Elasticsearch): 2 weeks
- Phase 11 (Analytics): 1-2 weeks
- Phase 12 (i18n): 1 week
- Phase 13 (Integration): 2 weeks

Total: 20-30 weeks (5-7 months) for complete implementation

## Priority Recommendations

**High Priority (MVP):**
- Phase 1: Complete Frontend UX
- Phase 2: Complete Admin Dashboard
- Phase 3: Implement Access Control
- Phase 9: Payment Integration

**Medium Priority:**
- Phase 5: Security Enhancements
- Phase 6: Performance Optimizations
- Phase 8: Email Notifications
- Phase 10: Elasticsearch

**Lower Priority (Can be deferred):**
- Phase 4: Property-Based Testing (can be added incrementally)
- Phase 7: API Enhancements (WebSocket, GraphQL, Webhooks)
- Phase 11: Analytics
- Phase 12: Internationalization
