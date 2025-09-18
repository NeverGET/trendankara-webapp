# Authentication System Requirements Document

> **⚠️ IMPLEMENTATION NOTE**: The actual implementation deviates from these requirements in several key areas. See [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) for the current implementation details, including:
> - Username-based login instead of email-based
> - JWT sessions instead of database sessions
> - Simplified middleware without database calls
> - Performance optimizations

## Introduction

The Authentication System provides secure access control for the Trend Ankara Radio CMS platform. It implements a role-based authentication system using NextAuth.js with database sessions, supporting two user roles (Admin and Super Admin) and protecting administrative endpoints and pages. The system will consolidate authentication to a single login page and implement comprehensive session validation across all admin routes.

## Alignment with Product Vision

This authentication system supports the product vision of "Keep it basic, don't overcomplicate anything" by:
- Providing a simple, unified login experience (single auth page instead of multiple)
- Clear role separation between Admin (customer) and Super Admin (service provider)
- Straightforward session-based authentication without complex token management
- Essential security without over-engineering
- Enabling efficient content management for station administrators as outlined in product.md

## Requirements

### Requirement 1: User Authentication & Session Management

**User Story:** As an administrator, I want to securely log in to the admin panel using my email and password, so that I can access administrative features.

#### Acceptance Criteria

1. WHEN a user navigates to /admin/* without authentication THEN the system SHALL redirect to /auth/login
2. WHEN a user submits valid credentials on /auth/login THEN the system SHALL create a session and redirect to /admin
3. WHEN a user submits invalid credentials THEN the system SHALL display an error message without revealing whether email or password was incorrect
4. WHEN a session expires or is invalid THEN the system SHALL redirect the user to /auth/login with the original URL as a return parameter
5. IF a user is already authenticated AND navigates to /auth/login THEN the system SHALL redirect to /admin

### Requirement 2: Role-Based Access Control

**User Story:** As a Super Admin, I want to manage admin users and have access to service-level features, so that I can maintain the platform for my customers.

#### Acceptance Criteria

1. WHEN creating a user THEN the system SHALL require assignment of either 'admin' or 'super_admin' role
2. IF a user has 'admin' role THEN the system SHALL grant access to all admin features except user management
3. IF a user has 'super_admin' role THEN the system SHALL grant access to all features including user management
4. WHEN an admin user attempts to access super_admin endpoints THEN the system SHALL return 403 Forbidden
5. WHEN checking permissions THEN the system SHALL validate both authentication AND authorization

### Requirement 3: Database User Management

**User Story:** As a Super Admin, I want to create and manage admin users in the database, so that I can control who has access to the platform.

#### Acceptance Criteria

1. WHEN creating a user THEN the system SHALL hash the password using bcrypt before storing
2. WHEN storing a user THEN the system SHALL validate email uniqueness in the database
3. IF the users table is empty THEN the system SHALL seed one super_admin user with credentials from environment variables
4. WHEN updating a user password THEN the system SHALL re-hash the new password
5. WHEN soft-deleting a user THEN the system SHALL set deleted_at timestamp and prevent login

### Requirement 4: Middleware Protection

**User Story:** As a system administrator, I want all admin routes and API endpoints to be protected by authentication middleware, so that unauthorized access is prevented.

#### Acceptance Criteria

1. WHEN a request is made to /admin/* THEN the middleware SHALL verify session before proceeding
2. WHEN a request is made to /api/admin/* THEN the middleware SHALL verify session before proceeding
3. WHEN a request is made to public routes (/, /news, /polls) THEN the middleware SHALL NOT require authentication
4. WHEN a request is made to /api/mobile/* THEN the middleware SHALL NOT require authentication
5. IF middleware detects no session for protected route THEN it SHALL return appropriate HTTP status (401 for API, redirect for pages)

### Requirement 5: Session Security

**User Story:** As a platform owner, I want secure session management to prevent unauthorized access and session hijacking.

#### Acceptance Criteria

1. WHEN creating a session THEN the system SHALL store it in the database with secure session ID
2. WHEN validating a session THEN the system SHALL check both cookie presence AND database validity
3. IF a session is idle for more than 24 hours THEN the system SHALL invalidate it
4. WHEN a user logs out THEN the system SHALL delete the session from both cookie AND database
5. WHEN detecting suspicious activity THEN the system SHALL log the event and optionally invalidate the session

### Requirement 6: Authentication Page Consolidation

**User Story:** As an administrator, I want a single, clear login page instead of multiple auth pages, so that I don't get confused about where to log in.

#### Acceptance Criteria

1. WHEN implementing auth THEN the system SHALL have only one login page at /auth/login
2. IF duplicate auth pages exist in /admin/auth or /(public)/auth THEN they SHALL be removed
3. WHEN styling the login page THEN it SHALL match the dark theme (RED/BLACK/WHITE) design
4. WHEN displaying the login form THEN it SHALL show the Trend Ankara logo prominently
5. IF login is successful from /auth/login THEN the system SHALL redirect to originally requested URL or /admin

## Non-Functional Requirements

### Performance
- Session validation must complete in < 50ms
- Login process must complete in < 500ms including password verification
- Database queries for session lookup must use indexed columns
- Middleware checks must not add more than 10ms to request processing time

### Security
- All passwords must be hashed using bcrypt with minimum 10 rounds
- Session IDs must be cryptographically random with at least 128 bits of entropy
- All auth-related cookies must use httpOnly, secure (in production), and sameSite flags
- Failed login attempts must be rate-limited to prevent brute force attacks
- Database must never store plaintext passwords under any circumstance

### Reliability
- Authentication system must maintain 99.9% uptime
- Session storage must handle concurrent access without race conditions
- System must gracefully handle database connection failures
- Fallback to cached session data if database is temporarily unavailable
- Automatic session cleanup for expired sessions

### Usability
- Login form must be mobile-responsive
- Clear error messages in Turkish for end users
- Password field must support show/hide toggle
- Remember me option for extended sessions (optional)
- Loading states during authentication process