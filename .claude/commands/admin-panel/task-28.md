# admin-panel - Task 28

Execute task 28 for the admin-panel specification.

## Task Description
Implement login attempt tracking

## Code Reuse
**Leverage existing code**: src/lib/db/client.ts

## Requirements Reference
**Requirements**: 5.5

## Usage
```
/Task:28-admin-panel
```

## Instructions

Execute with @spec-task-executor agent the following task: "Implement login attempt tracking"

```
Use the @spec-task-executor agent to implement task 28: "Implement login attempt tracking" for the admin-panel specification and include all the below context.

# Steering Context
## Steering Documents Context

No steering documents found or all are empty.

# Specification Context
## Specification Context (Pre-loaded): admin-panel

### Requirements
# Requirements Document

## Feature Name
admin-panel

## Introduction
Complete admin panel functionality for managing the radio station CMS platform, providing administrators with comprehensive tools to manage news, polls, media, mobile content, settings, and users through a database-connected interface.

## Alignment with Product Vision
This feature directly supports the product vision by:
- Providing station administrators with efficient content management tools
- Maintaining "keep it basic, don't overcomplicate" philosophy with clear, intuitive interfaces
- Enabling Turkish interface with English codebase standards
- Supporting mobile app content management through dynamic content builder
- Ensuring professional web presence through streamlined admin operations

## Requirements

### Requirement 1: News Management

**User Story:** As an admin, I want to manage news articles, so that I can keep the website content fresh and relevant.

#### Acceptance Criteria

1. WHEN admin navigates to news management THEN the system SHALL display all news articles with pagination
2. WHEN admin creates a new news article THEN the system SHALL save it to the database with all fields (title, content, category, images, status)
3. WHEN admin updates an existing article THEN the system SHALL update the database and preserve version history
4. WHEN admin sets a news article as HOT/Breaking THEN the system SHALL display appropriate badges on the public site
5. WHEN admin deletes a news article THEN the system SHALL perform soft delete (set deleted_at timestamp)
6. IF admin uploads images for news THEN the system SHALL store them in MinIO and generate thumbnails
7. WHEN admin searches for news THEN the system SHALL filter by title, content, or category

### Requirement 2: Poll Management

**User Story:** As an admin, I want to create and manage polls, so that I can engage with our audience.

#### Acceptance Criteria

1. WHEN admin creates a poll THEN the system SHALL save poll configuration with start/end dates
2. WHEN admin adds poll items THEN the system SHALL allow image uploads for each item
3. WHEN admin views poll results THEN the system SHALL display real-time vote counts and percentages
4. WHEN admin activates a poll THEN the system SHALL make it available on public site and mobile app
5. IF poll end date passes THEN the system SHALL automatically close voting
6. WHEN admin exports poll results THEN the system SHALL generate CSV/Excel format report
7. WHEN admin duplicates a poll THEN the system SHALL create a copy with new dates

### Requirement 3: Media Management

**User Story:** As an admin, I want to manage all media files centrally, so that I can reuse them across different content types.

#### Acceptance Criteria

1. WHEN admin uploads media THEN the system SHALL store files in MinIO with automatic thumbnail generation
2. WHEN admin searches media THEN the system SHALL filter by filename, type, or upload date
3. WHEN admin selects media in content editors THEN the system SHALL provide a media picker dialog
4. WHEN admin deletes media THEN the system SHALL check for usage and warn if referenced
5. IF media upload exceeds size limit THEN the system SHALL display error message
6. WHEN admin views media library THEN the system SHALL display grid/list view with thumbnails

### Requirement 4: Mobile Content Builder

**User Story:** As an admin, I want to create dynamic content pages for the mobile app, so that I can manage sponsorships and promotional content.

#### Acceptance Criteria

1. WHEN admin creates mobile page THEN the system SHALL provide drag-drop component builder
2. WHEN admin adds components THEN the system SHALL show real-time preview in mobile simulator
3. WHEN admin saves page THEN the system SHALL store JSON structure in database
4. WHEN mobile app requests page THEN the API SHALL return JSON component structure
5. IF admin publishes page THEN the system SHALL make it immediately available to mobile users
6. WHEN admin duplicates page THEN the system SHALL create copy with all components

### Requirement 5: User Management

**User Story:** As a super admin, I want to manage admin users, so that I can control access to the admin panel.

#### Acceptance Criteria

1. WHEN super admin creates user THEN the system SHALL hash password and store in users table
2. WHEN super admin updates user role THEN the system SHALL update permissions immediately
3. WHEN super admin deactivates user THEN the system SHALL prevent login but preserve data
4. WHEN admin changes own password THEN the system SHALL require current password verification
5. IF user fails login 5 times THEN the system SHALL block account for 15 minutes
6. WHEN super admin views users THEN the system SHALL display last login and activity status

### Requirement 6: Settings Management

**User Story:** As an admin, I want to manage site and radio settings, so that I can configure the platform behavior.

#### Acceptance Criteria

1. WHEN admin updates radio stream URL THEN the system SHALL update all players immediately
2. WHEN admin configures metadata URL THEN the system SHALL validate connection
3. WHEN admin sets site maintenance mode THEN the system SHALL display maintenance page to visitors
4. WHEN admin updates SEO settings THEN the system SHALL update meta tags site-wide
5. IF admin changes critical settings THEN the system SHALL require confirmation
6. WHEN admin saves settings THEN the system SHALL log change with timestamp and user

### Requirement 7: Dashboard Analytics

**User Story:** As an admin, I want to see dashboard statistics, so that I can monitor platform performance.

#### Acceptance Criteria

1. WHEN admin views dashboard THEN the system SHALL display real-time statistics
2. WHEN dashboard loads THEN the system SHALL show total news, polls, media counts
3. WHEN radio stats update THEN the system SHALL display current/peak listeners
4. IF database queries are slow THEN the system SHALL cache dashboard stats for 5 minutes
5. WHEN admin clicks quick actions THEN the system SHALL navigate to respective sections

## Non-Functional Requirements

### Performance
- Dashboard shall load within 2 seconds
- Database queries shall complete within 100ms
- Image uploads shall process thumbnails within 3 seconds
- Pagination shall handle 10,000+ records efficiently
- Search operations shall return results within 500ms

### Security
- All admin routes shall require authentication
- Super admin role required for user management
- Password hashing using bcrypt with salt rounds >= 10
- Session timeout after 30 minutes of inactivity
- CSRF protection on all forms
- Input sanitization for all user inputs

### Reliability
- Database transactions for critical operations
- Automatic backup of settings changes
- Graceful error handling with user-friendly messages
- Rollback capability for failed operations
- Audit logging for all admin actions

### Usability
- Turkish interface language throughout
- Responsive design for tablet/desktop use
- Keyboard shortcuts for common actions
- Auto-save drafts every 30 seconds
- Bulk operations for efficiency
- Clear success/error notifications

## Technical Constraints

- Must use existing MySQL database structure
- Must integrate with MinIO for media storage
- Must follow Next.js App Router patterns
- Must use existing authentication system (NextAuth)
- Must maintain dark theme (RED/BLACK/WHITE)
- Must support concurrent admin users
- Must provide API endpoints for mobile app

## Out of Scope

- Public user management (only admin users)
- Comment moderation system
- Advanced analytics/reporting
- Email notifications
- Multi-language support (Turkish only)
- File types beyond images (no video/audio yet)
- Complex workflow approvals
- Third-party integrations

---

### Design
# Design Document

## Feature Name
admin-panel

## Overview
Comprehensive design for the admin panel system that provides full content management capabilities while maintaining simplicity and leveraging existing infrastructure. The design follows Next.js App Router patterns, integrates with MySQL database, and provides real-time updates through server components and client-side state management.

## Steering Document Alignment

### Technical Standards (tech.md)
- Follows Next.js 15.5.3 App Router architecture with server/client components
- Uses existing MySQL 8.0 database with optimized indexes
- Integrates MinIO for S3-compatible media storage
- Implements NextAuth.js for authentication with role-based access
- Maintains Tailwind CSS v4 for styling with dark theme

### Project Structure (structure.md)
- Admin pages under `src/app/admin/` with protected layouts
- API routes in `src/app/api/admin/` for data operations
- Reusable components in `src/components/admin/`
- Database queries in `src/lib/db/` modules
- Type definitions in `src/types/` for type safety

## Code Reuse Analysis

### Existing Components to Leverage
- **StatsCard**: Dashboard statistics display component
- **Button/Badge/Modal**: UI primitives for consistent styling
- **MediaManager**: Existing media upload and management system
- **RadioPlayerContext**: For real-time radio statistics

### Services/Utilities to Extend
- **db/client.ts**: MySQL connection pooling and query execution
- **auth/utils.ts**: Session management and role checking
- **storage/client.ts**: MinIO integration for file operations
- **utils/logger.ts**: Structured logging for audit trails

### Integration Points
- **NextAuth**: Extend existing authentication for admin operations
- **Database Schema**: Extend existing tables (users, media, settings)
- **API Routes**: Follow existing RESTful patterns for consistency
- **Mobile API**: Extend `/api/mobile/v1/` for content delivery

## Architecture

```mermaid
graph TB
    subgraph Client
        A[Admin Dashboard] --> B[Page Components]
        B --> C[Admin Components]
        C --> D[UI Components]
    end

    subgraph Server
        E[API Routes] --> F[Auth Middleware]
        F --> G[Business Logic]
        G --> H[Database Layer]
        G --> I[Storage Layer]
    end

    subgraph External
        H --> J[(MySQL)]
        I --> K[MinIO]
        L[Mobile App] --> M[Mobile API]
    end

    A --> E
    M --> G
```

## Components and Interfaces

### Component 1: AdminLayout
- **Purpose:** Protected layout wrapper with navigation and auth check
- **Interfaces:**
  - Props: `{ children: React.ReactNode }`
  - Uses: `getServerSession()` for auth verification
- **Dependencies:** NextAuth, AdminSidebar, AdminHeader
- **Reuses:** Existing Layout component structure

### Component 2: NewsManager
- **Purpose:** CRUD operations for news articles with rich editor
- **Interfaces:**
  - Props: `{ initialData?: News[], categories: Category[] }`
  - Events: `onSave`, `onDelete`, `onPublish`
- **Dependencies:** RichTextEditor, MediaPicker, CategorySelector
- **Reuses:** Existing NewsCard component, media picker dialog

### Component 3: PollBuilder
- **Purpose:** Create and manage polls with drag-drop item ordering
- **Interfaces:**
  - Props: `{ poll?: Poll, onSave: (poll: PollData) => void }`
  - State: Poll configuration, items, validation errors
- **Dependencies:** DatePicker, ImageUpload, SortableList
- **Reuses:** Existing PollCard display component

### Component 4: MediaLibrary
- **Purpose:** Central media management with upload and organization
- **Interfaces:**
  - Props: `{ onSelect?: (media: Media) => void, selectionMode?: boolean }`
  - API: Upload, delete, search, get thumbnails
- **Dependencies:** MinIO client, image processing
- **Reuses:** Existing MediaManager base implementation

### Component 5: ContentBuilder
- **Purpose:** Visual builder for mobile app dynamic pages
- **Interfaces:**
  - Props: `{ page?: ContentPage, components: ComponentType[] }`
  - Output: JSON structure for mobile rendering
- **Dependencies:** DragDropContext, ComponentPalette, MobilePreview
- **Reuses:** Existing MobilePreview component

### Component 6: UserManagement
- **Purpose:** Admin user CRUD with role management
- **Interfaces:**
  - Props: `{ currentUser: User }`
  - Actions: Create, update, deactivate, reset password
- **Dependencies:** bcrypt for password hashing, role checker
- **Reuses:** Existing auth utilities and user type definitions

## Data Models

### Extended Database Tables

```sql
-- Extend existing users table (already exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  last_login TIMESTAMP NULL,
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL;

-- News table
CREATE TABLE IF NOT EXISTS news (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  featured_image VARCHAR(500),
  category_id INT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_breaking BOOLEAN DEFAULT FALSE,
  is_hot BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0,
  published_at TIMESTAMP NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_news_slug (slug),
  INDEX idx_news_published (published_at),
  INDEX idx_news_category (category_id)
);

-- News categories
CREATE TABLE IF NOT EXISTS news_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Polls table
CREATE TABLE IF NOT EXISTS polls (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('TOP_50', 'TOP_10', 'BEST_OF_MONTH', 'LISTENER_CHOICE', 'SPECIAL'),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_polls_dates (start_date, end_date),
  INDEX idx_polls_active (is_active)
);

-- Poll items
CREATE TABLE IF NOT EXISTS poll_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  poll_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  INDEX idx_poll_items_poll (poll_id)
);

-- Poll votes
CREATE TABLE IF NOT EXISTS poll_votes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  poll_id INT NOT NULL,
  item_id INT NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES poll_items(id) ON DELETE CASCADE,
  UNIQUE KEY unique_vote (poll_id, device_id, ip_address),
  INDEX idx_votes_poll (poll_id),
  INDEX idx_votes_item (item_id)
);

-- Content pages for mobile
CREATE TABLE IF NOT EXISTS content_pages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  components JSON NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_pages_slug (slug),
  INDEX idx_pages_published (is_published)
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_created (created_at)
);
```

## API Design

### RESTful Admin API Endpoints

```typescript
// News Management
GET    /api/admin/news           // List with pagination
GET    /api/admin/news/:id       // Get single article
POST   /api/admin/news           // Create article
PUT    /api/admin/news/:id       // Update article
DELETE /api/admin/news/:id       // Soft delete
POST   /api/admin/news/:id/publish // Publish/unpublish

// Poll Management
GET    /api/admin/polls          // List all polls
GET    /api/admin/polls/:id      // Get poll with results
POST   /api/admin/polls          // Create poll
PUT    /api/admin/polls/:id      // Update poll
DELETE /api/admin/polls/:id      // Delete poll
GET    /api/admin/polls/:id/export // Export results

// Media Management
GET    /api/admin/media          // List with pagination
POST   /api/admin/media/upload   // Upload files
DELETE /api/admin/media/:id      // Delete file
GET    /api/admin/media/usage/:id // Check usage

// User Management
GET    /api/admin/users          // List users (super admin)
POST   /api/admin/users          // Create user
PUT    /api/admin/users/:id      // Update user
DELETE /api/admin/users/:id      // Deactivate user
POST   /api/admin/users/password // Change password

// Settings
GET    /api/admin/settings       // Get all settings
PUT    /api/admin/settings       // Update settings
POST   /api/admin/settings/test  // Test connections

// Content Builder
GET    /api/admin/content        // List pages
POST   /api/admin/content        // Create page
PUT    /api/admin/content/:id    // Update page
DELETE /api/admin/content/:id    // Delete page
POST   /api/admin/content/:id/publish // Publish

// Dashboard
GET    /api/admin/dashboard/stats // Get statistics
GET    /api/admin/dashboard/activity // Recent activity
```

### Mobile API Extensions

```typescript
// Mobile content endpoints
GET /api/mobile/v1/content/pages        // List available pages
GET /api/mobile/v1/content/pages/:slug  // Get page JSON
```

## State Management

### Server State
- **Database queries**: Direct MySQL queries with connection pooling
- **Caching**: Redis-style caching for dashboard stats (5 min TTL)
- **Session management**: NextAuth server sessions with JWT

### Client State
- **Form state**: React Hook Form for complex forms
- **Optimistic updates**: Update UI before server confirmation
- **Real-time updates**: Polling for dashboard stats
- **Draft auto-save**: LocalStorage for form drafts

### State Flow
```mermaid
sequenceDiagram
    participant UI as Admin UI
    participant API as API Route
    participant Auth as Auth Middleware
    participant DB as Database
    participant Cache as Cache Layer

    UI->>API: Request with session
    API->>Auth: Verify session & role
    Auth-->>API: Authorized
    API->>Cache: Check cache
    Cache-->>API: Cache miss
    API->>DB: Query data
    DB-->>API: Return results
    API->>Cache: Update cache
    API-->>UI: JSON response
    UI->>UI: Update local state
```

## Security Considerations

### Authentication & Authorization
- All admin routes require valid session
- Role-based access control (admin, super_admin)
- Session timeout after 30 minutes inactivity
- Secure cookie settings in production

### Input Validation
- Server-side validation for all inputs
- SQL injection prevention via parameterized queries
- XSS prevention through React's JSX escaping
- File upload restrictions (type, size)

### Audit Trail
- Log all admin actions to audit_log table
- Track IP addresses and user agents
- Store old/new values for changes
- Retention policy: 90 days

### Rate Limiting
- Admin API: 100 requests/minute per user
- File uploads: 10 uploads/minute
- Password attempts: 5 attempts before 15-min lockout

## Error Handling

### Error Scenarios

1. **Database Connection Error**
   - **Handling:** Retry with exponential backoff
   - **User Impact:** "Veritabanı bağlantısı kurulamadı. Lütfen tekrar deneyin."

2. **File Upload Failure**
   - **Handling:** Cleanup partial uploads, return specific error
   - **User Impact:** "Dosya yüklenemedi: [specific reason]"

3. **Validation Errors**
   - **Handling:** Return field-specific errors
   - **User Impact:** Inline form validation messages in Turkish

4. **Permission Denied**
   - **Handling:** Log attempt, redirect to dashboard
   - **User Impact:** "Bu işlem için yetkiniz bulunmamaktadır."

5. **Concurrent Edit Conflict**
   - **Handling:** Show diff, ask user to resolve
   - **User Impact:** "Bu içerik başka bir kullanıcı tarafından değiştirildi."

## Performance Considerations

### Database Optimization
- Composite indexes for common queries
- Pagination for all list endpoints (20 items default)
- Lazy loading for related data
- Query result caching for stats

### Frontend Optimization
- Server components for initial render
- Image optimization with next/image
- Lazy load heavy components (rich editor)
- Virtual scrolling for long lists

### API Optimization
- Response compression (gzip)
- Partial responses with field selection
- Batch operations for bulk updates
- Background jobs for heavy operations

### Caching Strategy
- Dashboard stats: 5 minutes
- User permissions: Session lifetime
- Media thumbnails: 30 days
- Static content: 1 hour

## Testing Strategy

### Unit Testing
- Database query functions
- Validation utilities
- Permission checking logic
- Data transformation functions

### Integration Testing
- API endpoint responses
- Database transactions
- File upload/deletion flow
- Authentication flow

### End-to-End Testing
- Complete CRUD workflows
- Role-based access scenarios
- Mobile content preview
- Error recovery paths

**Note**: Specification documents have been pre-loaded. Do not use get-content to fetch them again.

## Task Details
- Task ID: 28
- Description: Implement login attempt tracking
- Leverage: src/lib/db/client.ts
- Requirements: 5.5

## Instructions
- Implement ONLY task 28: "Implement login attempt tracking"
- Follow all project conventions and leverage existing code
- Mark the task as complete using: claude-code-spec-workflow get-tasks admin-panel 28 --mode complete
- Provide a completion summary
```

## Task Completion
When the task is complete, mark it as done:
```bash
claude-code-spec-workflow get-tasks admin-panel 28 --mode complete
```

## Next Steps
After task completion, you can:
- Execute the next task using /admin-panel-task-[next-id]
- Check overall progress with /spec-status admin-panel
