# Authentication System Implementation Plan

> **⚠️ IMPLEMENTATION STATUS**: Many tasks have been completed with modifications. See [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) for actual implementation details.
>
> **Key Changes:**
> - ✅ Tasks 1-19: Completed with JWT strategy instead of database sessions
> - ✅ Username-based login implemented instead of email-based
> - ✅ Middleware simplified for edge runtime compatibility
> - ⚠️ Tasks 20-37: Not yet implemented

## Task Overview
Implementation of a secure, role-based authentication system using NextAuth.js v5 with MySQL database sessions. Tasks are organized in logical groups following the atomic task requirements, with each task focusing on a single file or small set of related files that can be completed in 15-30 minutes.

## Steering Document Compliance
All tasks follow the project structure defined in structure.md, use existing patterns from tech.md (MySQL client, UI components), and maintain the "keep it basic" philosophy from product.md.

## Atomic Task Requirements
**Each task must meet these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Task Format Guidelines
- Use checkbox format: `- [ ] Task number. Task description`
- **Specify files**: Always include exact file paths to create/modify
- **Include implementation details** as bullet points
- Reference requirements using: `_Requirements: X.Y, Z.A_`
- Reference existing code to leverage using: `_Leverage: path/to/file.ts, path/to/component.tsx_`
- Focus only on coding tasks (no deployment, user testing, etc.)
- **Avoid broad terms**: No "system", "integration", "complete" in task titles

## Tasks

### Phase 1: Database Setup

- [x] 1. Create auth tables migration
  - File: src/lib/db/migrations/001_auth_tables.sql
  - Add sessions table with proper indexes
  - Add accounts table for future OAuth support
  - Modify users table to add super_admin role
  - Purpose: Establish database schema for authentication
  - _Requirements: 3.1, 3.2_

- [x] 2. Create database seed script for initial super admin
  - File: src/lib/db/seeds/auth-seed.ts
  - Read credentials from environment variables
  - Hash password using bcrypt
  - Insert super admin user if users table is empty
  - Purpose: Bootstrap initial admin access
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 3.3_

- [x] 3. Run migration and seed scripts
  - File: src/lib/db/migrate.ts
  - Execute migration SQL using database client
  - Run seed script after migration
  - Add error handling and rollback logic
  - Purpose: Apply database changes safely
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 3.1, 3.3_

### Phase 2: NextAuth Setup

- [x] 4. Install NextAuth dependencies
  - File: package.json
  - Add next-auth@5.0.0-beta.25
  - Add bcryptjs@2.4.3
  - Add @auth/mysql-adapter@1.0.0
  - Purpose: Add required authentication packages
  - _Requirements: 1.1_

- [x] 5. Create NextAuth adapter interface
  - File: src/lib/auth/adapter.ts
  - Define adapter interface matching NextAuth requirements
  - Create user CRUD method signatures
  - Create session CRUD method signatures
  - Purpose: Define adapter contract
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 1.1, 5.1_

- [x] 6. Implement adapter database methods
  - File: src/lib/auth/adapter.ts (modify)
  - Implement createUser, getUser, updateUser methods
  - Implement createSession, getSession, deleteSession methods
  - Add error handling for database operations
  - Purpose: Complete adapter implementation
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 1.1, 5.1_

- [x] 7. Create NextAuth configuration
  - File: src/lib/auth/config.ts
  - Configure credentials provider
  - Set up session strategy with database
  - Add callbacks for role enrichment
  - Purpose: Central authentication configuration
  - _Leverage: src/lib/auth/adapter.ts_
  - _Requirements: 1.1, 2.1_

- [x] 8. Create NextAuth API route handler
  - File: src/app/api/auth/[...nextauth]/route.ts
  - Export GET and POST handlers from NextAuth
  - Pass auth configuration to handlers
  - Purpose: Handle authentication API requests
  - _Leverage: src/lib/auth/config.ts_
  - _Requirements: 1.2_

### Phase 3: Authentication Utilities

- [x] 9. Create password hashing utilities
  - File: src/lib/auth/password.ts
  - Implement hashPassword function using bcrypt
  - Implement verifyPassword function
  - Add password complexity validation
  - Purpose: Secure password handling
  - _Requirements: 3.1, 3.4_

- [x] 10. Create auth helper functions
  - File: src/lib/auth/utils.ts
  - Add getServerSession helper
  - Add requireAuth helper for API routes
  - Add checkRole utility function
  - Purpose: Reusable authentication helpers
  - _Leverage: src/lib/auth/config.ts_
  - _Requirements: 2.5, 4.1_

- [x] 11. Create auth types and interfaces
  - File: src/types/auth.ts
  - Define User, Session, and Role types
  - Add authentication response types
  - Define permission matrices
  - Purpose: Type safety for authentication
  - _Requirements: 2.1_

### Phase 4: Middleware Implementation

- [x] 12. Create authentication middleware
  - File: src/middleware.ts
  - Configure route matchers for protected paths
  - Implement session validation logic
  - Add redirect logic for unauthenticated requests
  - Purpose: Protect admin routes and APIs
  - _Leverage: src/lib/auth/utils.ts_
  - _Requirements: 4.1, 4.2, 4.5_

- [x] 13. Create middleware configuration
  - File: src/lib/auth/middleware-config.ts
  - Define protected route patterns
  - Define public route exceptions
  - Add role-based route rules
  - Purpose: Centralize middleware configuration
  - _Requirements: 4.3, 4.4_

### Phase 5: Login Page Implementation

- [x] 14. Create login page component
  - File: src/app/auth/login/page.tsx
  - Build login form with email/password fields
  - Add form validation and error handling
  - Include redirect logic after successful login
  - Purpose: User authentication interface
  - _Leverage: src/components/ui/Input.tsx, src/components/ui/Button.tsx, src/components/ui/Card.tsx_
  - _Requirements: 6.1, 6.3, 6.4_

- [x] 15. Create login form styles
  - File: src/app/auth/login/login.module.css
  - Apply dark theme with RED/BLACK/WHITE colors
  - Add responsive mobile styles
  - Include loading state animations
  - Purpose: Style login interface
  - _Requirements: 6.3_

- [x] 16. Add logo and branding to login
  - File: src/app/auth/login/page.tsx (modify)
  - Add Trend Ankara logo prominently
  - Include station branding elements
  - Add Turkish error messages
  - Purpose: Brand consistency
  - _Requirements: 6.4_

### Phase 6: Session Provider Setup

- [x] 17. Create auth provider component
  - File: src/components/auth/AuthProvider.tsx
  - Wrap SessionProvider from next-auth/react
  - Add session refresh logic
  - Include loading states
  - Purpose: Client-side session management
  - _Requirements: 1.1_

- [x] 18. Add auth provider to root layout
  - File: src/app/layout.tsx (modify)
  - Import and wrap with AuthProvider
  - Ensure provider wraps all child components
  - Maintain existing layout structure
  - Purpose: Enable session access throughout app
  - _Leverage: src/components/auth/AuthProvider.tsx_
  - _Requirements: 1.1_

- [x] 19. Add auth check to admin layout
  - File: src/app/admin/layout.tsx (modify)
  - Add server-side session check
  - Redirect to login if not authenticated
  - Pass session data to children
  - Purpose: Protect admin panel
  - _Leverage: src/lib/auth/utils.ts_
  - _Requirements: 4.1_

### Phase 7: User Management API

- [x] 20. Create user list API endpoint
  - File: src/app/api/admin/users/route.ts
  - Implement GET handler for listing users
  - Add pagination and filtering
  - Check for super_admin role
  - Purpose: Retrieve user list
  - _Leverage: src/lib/db/client.ts, src/lib/auth/utils.ts_
  - _Requirements: 2.3, 7.1_

- [x] 21. Add create user to API
  - File: src/app/api/admin/users/route.ts (modify)
  - Implement POST handler for creating users
  - Hash password before storing
  - Validate email uniqueness
  - Purpose: Create new admin users
  - _Leverage: src/lib/auth/password.ts_
  - _Requirements: 3.1, 3.2, 7.2_

- [x] 22. Create user update API endpoint
  - File: src/app/api/admin/users/[id]/route.ts
  - Implement PUT handler for updating users
  - Handle password updates with re-hashing
  - Validate role changes
  - Purpose: Modify existing users
  - _Leverage: src/lib/auth/password.ts_
  - _Requirements: 3.4, 7.3_

- [x] 23. Add soft delete to user API
  - File: src/app/api/admin/users/[id]/route.ts (modify)
  - Implement DELETE handler
  - Set deleted_at timestamp
  - Invalidate user sessions
  - Purpose: Soft delete users
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 3.5, 7.4_

### Phase 8: Database Queries

- [x] 24. Create auth database queries
  - File: src/lib/db/auth.ts
  - Add getUserByEmail function
  - Add getUserById function
  - Add session CRUD operations
  - Purpose: Database operations for auth
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 1.1, 5.1_

- [x] 25. Add session cleanup query
  - File: src/lib/db/auth.ts (modify)
  - Create cleanupExpiredSessions function
  - Add query to delete expired sessions
  - Include logging for cleanup results
  - Purpose: Remove expired sessions
  - _Leverage: src/lib/db/client.ts, src/lib/utils/logger.ts_
  - _Requirements: 5.3_

### Phase 9: API Protection

- [x] 26. Create admin polls API with auth
  - File: src/app/api/admin/polls/route.ts (create)
  - Add requireAuth check at start of handlers
  - Implement GET/POST/PUT/DELETE handlers
  - Check role permissions for each operation
  - Purpose: Protected poll management API
  - _Leverage: src/lib/auth/utils.ts, src/lib/db/polls.ts_
  - _Requirements: 4.2, 2.4_

- [x] 27. Create admin news API with auth
  - File: src/app/api/admin/news/route.ts (create)
  - Add session validation at handler start
  - Implement CRUD operations for news
  - Return 401 for unauthenticated requests
  - Purpose: Protected news management API
  - _Leverage: src/lib/auth/utils.ts_
  - _Requirements: 4.2, 2.4_

- [x] 28. Secure media upload endpoints
  - File: src/app/api/media/upload/route.ts (modify)
  - Add authentication check
  - Validate user permissions
  - Log upload attempts
  - Purpose: Protect media uploads
  - _Leverage: src/lib/auth/utils.ts_
  - _Requirements: 4.2_

### Phase 10: Environment Configuration

- [x] 29. Add auth env variables
  - File: .env.example (create or modify)
  - Add NEXTAUTH_URL
  - Add NEXTAUTH_SECRET
  - Add SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD
  - Purpose: Document required environment variables
  - _Requirements: 3.3_

- [x] 30. Create auth env validation
  - File: src/lib/auth/env-check.ts
  - Validate required auth environment variables
  - Throw errors if missing in production
  - Provide helpful error messages
  - Purpose: Ensure proper configuration
  - _Requirements: 3.3_

### Phase 11: Cleanup and Optimization

- [x] 31. Remove public auth directory
  - File: src/app/(public)/auth (delete entire directory)
  - Remove directory and all contents
  - Verify no components import from this path
  - Purpose: Consolidate to single auth page
  - _Requirements: 6.1, 6.2_

- [x] 32. Remove admin auth directory
  - File: src/app/admin/auth (delete entire directory)
  - Remove directory and all contents
  - Update any imports that reference this path
  - Purpose: Consolidate to single auth page
  - _Requirements: 6.1, 6.2_

- [x] 33. Create session cleanup API endpoint
  - File: src/app/api/admin/sessions/cleanup/route.ts
  - Implement POST handler for manual cleanup
  - Call cleanupExpiredSessions function
  - Return cleanup statistics
  - Purpose: Manual session cleanup trigger
  - _Leverage: src/lib/db/auth.ts_
  - _Requirements: 5.3_

- [x] 34. Add rate limiting to login
  - File: src/lib/auth/rate-limit.ts
  - Implement simple in-memory rate limiter
  - Track failed attempts by IP
  - Block after threshold reached
  - Purpose: Prevent brute force attacks
  - _Requirements: Security NFR_

### Phase 12: Testing Setup

- [x] 35. Create auth utility tests
  - File: src/lib/auth/__tests__/password.test.ts
  - Test password hashing and verification
  - Test password complexity validation
  - Test bcrypt rounds configuration
  - Purpose: Ensure password security
  - _Leverage: src/lib/auth/password.ts_
  - _Requirements: 3.1_

- [x] 36. Create middleware tests
  - File: src/__tests__/middleware.test.ts
  - Test route matching logic
  - Test redirect behavior
  - Test public route exceptions
  - Purpose: Verify middleware protection
  - _Leverage: src/middleware.ts_
  - _Requirements: 4.1, 4.3_

- [x] 37. Create auth API integration test
  - File: src/app/api/auth/__tests__/login.test.ts
  - Test successful login flow
  - Test invalid credentials
  - Test session creation
  - Purpose: Verify authentication flow
  - _Leverage: src/app/api/auth/[...nextauth]/route.ts_
  - _Requirements: 1.2, 1.3_