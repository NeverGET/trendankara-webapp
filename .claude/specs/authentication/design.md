# Authentication System Design Document

## Overview

The Authentication System will provide secure, role-based access control for the Trend Ankara Radio CMS platform using NextAuth.js v5 with database sessions stored in MySQL. The system integrates with Next.js 15's App Router architecture, leveraging existing UI components and database patterns while introducing new authentication-specific modules. The design emphasizes simplicity and security, with a single unified login page and comprehensive middleware protection for all administrative routes.

## Steering Document Alignment

### Technical Standards (tech.md)
- **NextAuth.js Integration**: Implements NextAuth v5 with MySQL adapter for session storage
- **Database Design**: Extends existing `users` table with proper indexing for session queries
- **API Pattern**: Follows established `/api/*` route structure with consistent JSON responses
- **Security Implementation**: Uses bcrypt for password hashing, httpOnly cookies for sessions
- **Dark Mode Theme**: Login page follows RED/BLACK/WHITE color scheme
- **Performance**: Session validation under 50ms using indexed database queries

### Project Structure (structure.md)
- **Authentication Routes**: `/auth/login` page in root app directory
- **API Endpoints**: `/api/auth/[...nextauth]` for NextAuth handlers
- **Middleware**: `src/middleware.ts` for route protection
- **Components**: Reusable auth components in `src/components/auth/`
- **Library Functions**: Auth utilities in `src/lib/auth/`
- **Database Queries**: Auth-specific queries in `src/lib/db/auth.ts`

## Code Reuse Analysis

### Existing Components to Leverage
- **UI Components**:
  - `src/components/ui/Input.tsx` - For email/password fields with error handling
  - `src/components/ui/Button.tsx` - For login button with loading states
  - `src/components/ui/Card.tsx` - For login form container
- **Database Client**:
  - `src/lib/db/client.ts` - Existing MySQL connection pool with transaction support
- **Utilities**:
  - `src/lib/utils/logger.ts` - For authentication event logging
  - `src/lib/utils.ts` (cn function) - For className management

### Integration Points
- **Database**: Connect to existing MySQL instance using established connection pool
- **Admin Layout**: Inject session provider into `src/app/admin/layout.tsx`
- **API Routes**: Protect existing `/api/admin/*` endpoints with auth checks
- **Environment Config**: Extend existing `.env` structure with auth variables

## Architecture

The authentication system follows a layered architecture with clear separation of concerns:

```mermaid
graph TD
    A[Client Browser] -->|HTTPS| B[Next.js Middleware]
    B -->|Protected Route| C[Auth Check]
    B -->|Public Route| D[Page/API Handler]
    C -->|Has Session| D
    C -->|No Session| E[Redirect to /auth/login]

    F[Login Page] -->|Credentials| G[NextAuth API]
    G -->|Validate| H[Database]
    H -->|User Found| I[Create Session]
    H -->|Invalid| J[Return Error]
    I -->|Store| K[Session Table]
    I -->|Set Cookie| L[HTTP Response]

    M[API Request] -->|Authorization Header| N[Session Validation]
    N -->|Query| K
    N -->|Valid| O[Execute API Logic]
    N -->|Invalid| P[401 Unauthorized]
```

### Component Interaction Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant M as Middleware
    participant A as NextAuth
    participant D as Database
    participant S as Session Store

    U->>M: Request /admin/*
    M->>S: Check Session Cookie
    alt No Session
        M->>U: Redirect to /auth/login
        U->>A: Submit Credentials
        A->>D: Validate User
        D-->>A: User Data
        A->>S: Create Session
        A->>U: Set Cookie + Redirect
    else Valid Session
        S-->>M: Session Valid
        M->>U: Allow Access
    end
```

### Database Schema Diagram

```mermaid
erDiagram
    users ||--o{ sessions : "has"
    users ||--o{ accounts : "has"

    users {
        int id PK
        string email UK
        string password
        string name
        enum role
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    sessions {
        string id PK
        int user_id FK
        string session_token UK
        datetime expires
        string ip_address
        text user_agent
        timestamp created_at
        timestamp updated_at
    }

    accounts {
        string id PK
        int user_id FK
        string provider
        string provider_account_id
        text access_token
        text refresh_token
        timestamp created_at
    }
```

## Components and Interfaces

### Component 1: NextAuth Configuration (`src/lib/auth/config.ts`)
- **Purpose:** Central configuration for NextAuth with providers and callbacks
- **Interfaces:**
  - `authOptions`: NextAuth configuration object
  - Session callbacks for role enrichment
  - JWT callbacks for token customization
- **Dependencies:** NextAuth core, bcrypt, database adapter
- **Reuses:** Database client from `src/lib/db/client.ts`

### Component 2: Database Adapter (`src/lib/auth/adapter.ts`)
- **Purpose:** Custom MySQL adapter for NextAuth session storage
- **Interfaces:**
  - CRUD operations for users, sessions, and accounts
  - Session validation and cleanup methods
- **Dependencies:** MySQL client, NextAuth adapter interface
- **Reuses:** Transaction support from database client

### Component 3: Middleware (`src/middleware.ts`)
- **Purpose:** Route protection and session validation for all requests
- **Interfaces:**
  - `matcher` configuration for protected routes
  - Session validation logic
  - Redirect handling for unauthorized access
- **Dependencies:** NextAuth middleware helpers, Next.js middleware
- **Reuses:** None (new component)

### Component 4: Login Page Component (`src/app/auth/login/page.tsx`)
- **Purpose:** Unified authentication interface for all users
- **Interfaces:**
  - Form submission handler
  - Error display logic
  - Redirect after successful login
- **Dependencies:** NextAuth signIn, Next.js router
- **Reuses:** Input, Button, Card components from UI library

### Component 5: Auth Provider (`src/components/auth/AuthProvider.tsx`)
- **Purpose:** Client-side session provider wrapper
- **Interfaces:**
  - SessionProvider wrapper for client components
  - Session refresh logic
- **Dependencies:** NextAuth React provider
- **Reuses:** None (thin wrapper component)

### Component 6: Auth Utilities (`src/lib/auth/utils.ts`)
- **Purpose:** Helper functions for authentication operations
- **Interfaces:**
  - Password hashing/verification
  - Session helpers
  - Role checking utilities
- **Dependencies:** bcrypt, database client
- **Reuses:** Logger utilities for audit trail

### Component 7: User Management API (`src/app/api/admin/users/route.ts`)
- **Purpose:** CRUD operations for user management (Super Admin only)
- **Interfaces:**
  - GET: List users
  - POST: Create user
  - PUT: Update user
  - DELETE: Soft delete user
- **Dependencies:** NextAuth session, database client
- **Reuses:** Database transaction support, error handling patterns

## Data Models

### Extended User Model
```typescript
interface User {
  id: number;
  email: string;
  password: string; // bcrypt hashed
  name: string;
  role: 'admin' | 'super_admin' | 'editor'; // Extended ENUM (editor kept for compatibility)
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
```

### Session Model
```typescript
interface Session {
  id: string; // UUID
  user_id: number;
  session_token: string; // Unique token
  expires: Date;
  created_at: Date;
  updated_at: Date;
  ip_address?: string;
  user_agent?: string;
}
```

### Database Migrations
```sql
-- Modify users table for super_admin role (keeping 'editor' for backward compatibility)
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'super_admin', 'editor') DEFAULT 'editor';

-- Create sessions table for NextAuth
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INT NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_session_token (session_token),
  INDEX idx_user_sessions (user_id, expires),
  INDEX idx_expires (expires)
);

-- Create accounts table for NextAuth (future OAuth support)
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(255) PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INT,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_provider (provider, provider_account_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Error Handling

### Error Scenarios

1. **Invalid Credentials**
   - **Handling:** Return generic "Invalid email or password" message
   - **User Impact:** Error message displayed on login form in Turkish
   - **Logging:** Log failed attempt with IP address for security monitoring

2. **Session Expired**
   - **Handling:** Clear invalid session, redirect to login with return URL
   - **User Impact:** Seamless redirect to login, returns to original page after auth
   - **Logging:** Log session expiration event

3. **Database Connection Failed**
   - **Handling:** Return 503 Service Unavailable for APIs, error page for UI
   - **User Impact:** "Service temporarily unavailable" message
   - **Logging:** Critical error logged, alert operations team

4. **Rate Limit Exceeded**
   - **Handling:** Return 429 Too Many Requests, block IP temporarily
   - **User Impact:** "Too many login attempts, please try again later"
   - **Logging:** Log potential brute force attempt

5. **Unauthorized Role Access**
   - **Handling:** Return 403 Forbidden, log security event
   - **User Impact:** "You don't have permission to access this resource"
   - **Logging:** Log authorization failure with user details

## Session Management Strategy

### Session Cleanup
- **Automatic Cleanup Job**: Cron job runs every 24 hours to delete expired sessions
- **Implementation**: Server action or API endpoint triggered by external scheduler
- **Query**: `DELETE FROM sessions WHERE expires < NOW()`
- **Logging**: Log number of sessions cleaned up for monitoring

### Session Security
- **Token Generation**: Use crypto.randomBytes(32) for session tokens
- **Cookie Settings**: httpOnly=true, secure=true (production), sameSite='lax'
- **Session Rotation**: On privilege escalation (role change), invalidate old sessions
- **Concurrent Sessions**: Allow max 3 concurrent sessions per user

## Package Dependencies

### Required NPM Packages
```json
{
  "dependencies": {
    "next-auth": "^5.0.0-beta.25",
    "bcryptjs": "^2.4.3",
    "@auth/mysql-adapter": "^1.0.0"
  }
}
```

## Middleware Configuration

### Route Protection Rules
```typescript
// src/middleware.ts
export const config = {
  matcher: [
    '/admin/:path*',        // All admin pages
    '/api/admin/:path*',    // Admin API endpoints
    '/auth/logout',         // Logout endpoint
    // Exclude public routes
    '/((?!api/mobile|api/radio|api/polls/vote|_next/static|favicon.ico).*)',
  ]
}
```

## API Response Schemas

### Login Endpoint
```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  error?: string;
}
```

### User Management Endpoints
```typescript
// GET /api/admin/users
interface GetUsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// POST /api/admin/users
interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'super_admin';
}

// PUT /api/admin/users/:id
interface UpdateUserRequest {
  email?: string;
  password?: string;
  name?: string;
  role?: 'admin' | 'super_admin';
  is_active?: boolean;
}
```

## Testing Strategy

### Unit Testing
- **Auth Utilities**: Test password hashing, verification, role checks
  - Test bcrypt rounds configuration
  - Test password complexity validation
  - Test role permission matrices
- **Database Adapter**: Mock database calls, test CRUD operations
  - Mock mysql2 connection pool
  - Test transaction rollback scenarios
  - Test connection failure handling
- **Middleware Logic**: Test route matching, session validation logic
  - Test protected vs public route detection
  - Test session cookie parsing
  - Test redirect URL preservation

### Integration Testing
- **Authentication Flow**: Full login/logout cycle with database
  - Test with real MySQL instance
  - Verify session creation in database
  - Test cookie setting and clearing
- **Session Management**: Creation, validation, expiration handling
  - Test session timeout after 24 hours
  - Test concurrent session limits
  - Test session cleanup job
- **Role-Based Access**: Test admin vs super_admin permissions
  - Verify user management restricted to super_admin
  - Test API endpoint authorization
  - Test UI component visibility
- **API Protection**: Verify middleware blocks unauthorized requests
  - Test 401 responses for missing sessions
  - Test 403 responses for insufficient permissions
  - Test rate limiting on login attempts

### End-to-End Testing
- **User Login Journey**: Complete flow from login to accessing admin panel
  - Test form submission with valid credentials
  - Verify redirect to originally requested page
  - Test session persistence across navigation
- **Session Persistence**: Verify sessions survive page refreshes
  - Test cookie persistence
  - Test session validation on each request
  - Test remember me functionality (if implemented)
- **Logout Flow**: Ensure complete session cleanup
  - Verify session removed from database
  - Verify cookie cleared
  - Test redirect to login page
- **Error Scenarios**: Test invalid credentials, expired sessions
  - Test wrong password error message
  - Test non-existent user handling
  - Test expired session redirect
- **Mobile Responsiveness**: Verify login page works on all devices
  - Test on iOS Safari
  - Test on Android Chrome
  - Test responsive layout breakpoints

## Performance Monitoring

### Metrics to Track
- Session validation time (target < 50ms)
- Login request processing time (target < 500ms)
- Database query performance (indexed queries)
- Failed login attempt rate (detect attacks)
- Session cleanup job duration
- Concurrent session count per user