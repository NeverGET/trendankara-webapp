# Implementation Tasks

## Feature Name
admin-panel

## Task Overview
Systematic implementation of admin panel functionality following atomic task principles. Each task is designed to be completed in 15-30 minutes with clear file specifications and minimal context switching.

## Steering Document Compliance
Tasks follow structure.md conventions for file organization under src/app/admin/, src/components/admin/, and src/lib/db/. All implementations use existing patterns from tech.md including Next.js App Router, MySQL integration, and MinIO storage.

## Prerequisites
- Existing MySQL database connection configured
- MinIO storage configured and accessible
- NextAuth authentication system operational
- Base UI components available (Button, Badge, Modal, etc.)
- Existing admin pages with mock data ready for database integration

## Tasks

### Database Schema Setup

- [x] 1. Create database migration script for news tables
  - File: src/lib/db/migrations/001_create_news_tables.sql
  - Create news and news_categories tables with indexes
  - Include foreign key to users table for created_by
  - Purpose: Establish news data structure
  - _Leverage: src/lib/db/schema.ts for migration patterns_
  - _Requirements: 1.2_

- [x] 2. Create database migration script for polls tables
  - File: src/lib/db/migrations/002_create_polls_tables.sql
  - Create polls, poll_items, and poll_votes tables
  - Include unique constraint on votes (poll_id, device_id, ip_address)
  - Purpose: Establish polling data structure
  - _Leverage: src/lib/db/schema.ts for migration patterns_
  - _Requirements: 2.1_

- [x] 3. Create database migration script for content and audit tables
  - File: src/lib/db/migrations/003_create_content_audit_tables.sql
  - Create content_pages and audit_log tables
  - Include JSON columns for component data and audit values
  - Purpose: Enable mobile content and audit tracking
  - _Leverage: src/lib/db/schema.ts for migration patterns_
  - _Requirements: 4.3, 7.1_

- [x] 4. Extend users table with admin fields
  - File: src/lib/db/migrations/004_extend_users_table.sql
  - Add last_login, failed_attempts, locked_until columns
  - Add super_admin role to existing enum
  - Purpose: Support user management requirements
  - _Leverage: Existing users table structure_
  - _Requirements: 5.1, 5.5_

- [x] 5. Execute database migrations
  - File: src/lib/db/migrate.ts (modify existing)
  - Add function to run migration scripts in order
  - Include rollback capability for failed migrations
  - Purpose: Apply schema changes to database
  - _Leverage: src/lib/db/client.ts for connection_
  - _Requirements: All_

### News Management Implementation

- [x] 6. Create news database query functions
  - File: src/lib/db/news.ts (extend existing)
  - Implement getAllNews, getNewsById, createNews, updateNews, deleteNews
  - Add pagination support with offset/limit
  - Purpose: Data layer for news operations
  - _Leverage: src/lib/db/client.ts for queries_
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 7. Create news categories database functions
  - File: src/lib/db/news-categories.ts
  - Implement CRUD operations for news categories
  - Include slug generation from category name
  - Purpose: Manage news categorization
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 1.7_

- [x] 8. Update news API route for database integration
  - File: src/app/api/admin/news/route.ts (modify existing)
  - Replace mock data with database queries
  - Add image upload integration with MinIO
  - Purpose: Connect news API to database
  - _Leverage: src/lib/db/news.ts, src/lib/storage/client.ts_
  - _Requirements: 1.2, 1.6_

- [x] 9. Create news form component
  - File: src/components/admin/NewsForm.tsx
  - Build form with title, content, category, image fields
  - Use React Hook Form for validation
  - Purpose: UI for creating/editing news
  - _Leverage: src/components/ui/Input.tsx, src/components/ui/Button.tsx_
  - _Requirements: 1.2_

- [x] 10. Update news page to use real data
  - File: src/app/admin/news/page.tsx (modify existing)
  - Fetch news from API instead of mock data
  - Connect CRUD operations to API endpoints
  - Purpose: Complete news management UI
  - _Leverage: src/components/admin/NewsCard.tsx_
  - _Requirements: 1.1, 1.4_

### Poll Management Implementation

- [ ] 11. Create poll database query functions
  - File: src/lib/db/polls.ts (extend existing)
  - Implement getAllPolls, getPollById, createPoll, updatePoll
  - Include functions for poll items management
  - Purpose: Data layer for poll operations
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 2.1, 2.2_

- [ ] 12. Create poll voting database functions
  - File: src/lib/db/poll-votes.ts
  - Implement vote recording with device/IP uniqueness check
  - Add function to get vote counts and percentages
  - Purpose: Handle voting logic and results
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 2.3, 2.4_

- [ ] 13. Update polls API route for database
  - File: src/app/api/admin/polls/route.ts (modify existing)
  - Replace mock data with database queries
  - Add poll activation/deactivation logic
  - Purpose: Connect polls API to database
  - _Leverage: src/lib/db/polls.ts_
  - _Requirements: 2.1, 2.4_

- [ ] 14. Create poll items management component
  - File: src/components/admin/PollItemsManager.tsx
  - Drag-drop reordering of poll items
  - Image upload for each item
  - Purpose: Manage poll options
  - _Leverage: src/components/ui/Button.tsx, MediaPicker_
  - _Requirements: 2.2_

- [ ] 15. Create poll results export function
  - File: src/lib/utils/poll-export.ts
  - Generate CSV with poll results data
  - Include voter statistics and timestamps
  - Purpose: Enable results export
  - _Leverage: Existing export patterns_
  - _Requirements: 2.6_

- [ ] 16. Update polls page with database integration
  - File: src/app/admin/polls/page.tsx (modify existing)
  - Connect to real API endpoints
  - Display actual vote counts
  - Purpose: Complete poll management UI
  - _Leverage: src/components/admin/PollCard.tsx_
  - _Requirements: 2.3, 2.5_

### Media Management Implementation

- [ ] 17. Enhance media upload with thumbnails
  - File: src/lib/storage/media-processor.ts
  - Generate multiple thumbnail sizes on upload
  - Store thumbnail URLs in media table
  - Purpose: Optimize media display
  - _Leverage: src/lib/storage/client.ts, sharp library_
  - _Requirements: 3.1_

- [ ] 18. Create media usage checker
  - File: src/lib/db/media-usage.ts
  - Check if media is referenced in news, polls, or content
  - Return usage locations for warning display
  - Purpose: Prevent accidental deletion
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 3.4_

- [ ] 19. Create media picker dialog component
  - File: src/components/admin/MediaPickerDialog.tsx
  - Grid view of media with search
  - Selection mode for embedding in editors
  - Purpose: Reusable media selection
  - _Leverage: src/components/ui/Modal.tsx_
  - _Requirements: 3.3_

- [ ] 20. Update media page with enhanced features
  - File: src/app/admin/media/page.tsx (modify existing)
  - Add grid/list view toggle
  - Implement search and filters
  - Purpose: Complete media management
  - _Leverage: Existing MediaManager component_
  - _Requirements: 3.2, 3.6_

### Mobile Content Builder Implementation

- [ ] 21. Create content page database functions
  - File: src/lib/db/content-pages.ts
  - CRUD operations for content pages
  - JSON storage for component structure
  - Purpose: Store mobile page configurations
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 4.3_

- [ ] 22. Create content builder API routes
  - File: src/app/api/admin/content/route.ts
  - Endpoints for page CRUD operations
  - Publish/unpublish functionality
  - Purpose: API for content management
  - _Leverage: src/lib/db/content-pages.ts_
  - _Requirements: 4.3, 4.5_

- [ ] 23. Create component palette for builder
  - File: src/components/admin/ComponentPalette.tsx
  - List of draggable component types
  - Component property editors
  - Purpose: UI for adding page components
  - _Leverage: Existing ContentEditor component_
  - _Requirements: 4.1_

- [ ] 24. Enhance mobile preview with interactions
  - File: src/components/admin/MobilePreview.tsx (modify existing)
  - Add component selection highlighting
  - Enable in-preview editing
  - Purpose: Improve builder UX
  - _Leverage: Existing MobilePreview_
  - _Requirements: 4.2_

- [ ] 25. Create mobile API endpoints
  - File: src/app/api/mobile/v1/content/pages/route.ts
  - List published pages endpoint
  - Get page by slug endpoint
  - Purpose: Serve content to mobile app
  - _Leverage: src/lib/db/content-pages.ts_
  - _Requirements: 4.4_

- [ ] 26. Update content page with database
  - File: src/app/admin/content/page.tsx (modify existing)
  - Save/load pages from database
  - Add page management (list, duplicate, delete)
  - Purpose: Complete content builder
  - _Leverage: Existing builder components_
  - _Requirements: 4.1, 4.6_

### User Management Implementation

- [ ] 27. Create user management database functions
  - File: src/lib/db/users.ts
  - Add createUser, updateUser, deactivateUser
  - Include password hashing with bcrypt
  - Purpose: User CRUD operations
  - _Leverage: src/lib/db/auth.ts patterns_
  - _Requirements: 5.1, 5.2_

- [ ] 28. Implement login attempt tracking
  - File: src/lib/auth/login-tracker.ts
  - Track failed attempts per user
  - Implement account locking after 5 failures
  - Purpose: Security against brute force
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 5.5_

- [ ] 29. Create user management API routes
  - File: src/app/api/admin/users/route.ts (modify existing)
  - Super admin only endpoints
  - Password reset functionality
  - Purpose: User management API
  - _Leverage: src/lib/auth/utils.ts for role checking_
  - _Requirements: 5.1, 5.3_

- [ ] 30. Create user form component
  - File: src/components/admin/UserForm.tsx
  - Form for creating/editing users
  - Role selection (admin/super_admin)
  - Purpose: User creation/edit UI
  - _Leverage: src/components/ui/Input.tsx_
  - _Requirements: 5.1, 5.2_

- [ ] 31. Create password change modal
  - File: src/components/admin/PasswordChangeModal.tsx
  - Current password verification
  - New password with confirmation
  - Purpose: Secure password changes
  - _Leverage: src/components/ui/Modal.tsx_
  - _Requirements: 5.4_

- [ ] 32. Create users management page
  - File: src/app/admin/users/page.tsx
  - List users with status and last login
  - Actions for edit, deactivate, reset password
  - Purpose: Complete user management UI
  - _Leverage: UI components_
  - _Requirements: 5.6_

### Settings Management Implementation

- [ ] 33. Create settings database functions
  - File: src/lib/db/settings.ts
  - Get/update settings by key
  - Type conversion for different setting types
  - Purpose: Settings persistence
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 6.1_

- [ ] 34. Create settings validation utilities
  - File: src/lib/utils/settings-validator.ts
  - Validate stream URLs
  - Test connections to external services
  - Purpose: Ensure valid configurations
  - _Leverage: fetch for connection tests_
  - _Requirements: 6.2_

- [ ] 35. Update settings API with database
  - File: src/app/api/admin/settings/route.ts
  - Save settings to database
  - Add confirmation for critical changes
  - Purpose: Settings persistence API
  - _Leverage: src/lib/db/settings.ts_
  - _Requirements: 6.5, 6.6_

- [ ] 36. Create maintenance mode component
  - File: src/components/admin/MaintenanceModeToggle.tsx
  - Toggle switch for maintenance mode
  - Custom maintenance message input
  - Purpose: Control site availability
  - _Leverage: src/components/ui/Button.tsx_
  - _Requirements: 6.3_

- [ ] 37. Update settings page with forms
  - File: src/app/admin/settings/page.tsx (modify existing)
  - Radio settings form
  - SEO settings form
  - Purpose: Complete settings management
  - _Leverage: Existing page structure_
  - _Requirements: 6.1, 6.4_

### Dashboard and Analytics Implementation

- [ ] 38. Create dashboard statistics queries
  - File: src/lib/db/dashboard-stats.ts
  - Count queries for news, polls, media
  - Active polls and recent activity
  - Purpose: Dashboard data aggregation
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 7.2_

- [ ] 39. Implement statistics caching
  - File: src/lib/cache/stats-cache.ts
  - In-memory cache with 5-minute TTL
  - Cache invalidation on data changes
  - Purpose: Optimize dashboard performance
  - _Leverage: Node.js Map for simple caching_
  - _Requirements: 7.4_

- [ ] 40. Update dashboard stats API
  - File: src/app/api/admin/dashboard/stats/route.ts (modify existing)
  - Use cached statistics
  - Include radio listener counts
  - Purpose: Serve dashboard data
  - _Leverage: src/lib/cache/stats-cache.ts_
  - _Requirements: 7.1, 7.3_

- [ ] 41. Create activity feed component
  - File: src/components/admin/ActivityFeed.tsx
  - Display recent admin actions
  - Show user, action, and timestamp
  - Purpose: Activity monitoring
  - _Leverage: src/lib/db/audit.ts_
  - _Requirements: 7.1_

- [ ] 42. Update dashboard page with real data
  - File: src/app/admin/page.tsx (modify existing)
  - Fetch real statistics from API
  - Add activity feed section
  - Purpose: Complete dashboard
  - _Leverage: Existing StatsCard components_
  - _Requirements: 7.1, 7.5_

### Audit and Security Implementation

- [ ] 43. Create audit logging functions
  - File: src/lib/db/audit.ts
  - Log admin actions with old/new values
  - Include user ID and IP address
  - Purpose: Track all admin activities
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: NFR-Security_

- [ ] 44. Create audit middleware
  - File: src/lib/middleware/audit.ts
  - Intercept admin API calls
  - Log actions to audit table
  - Purpose: Automatic audit trailing
  - _Leverage: Next.js middleware patterns_
  - _Requirements: NFR-Reliability_

- [ ] 45. Implement rate limiting
  - File: src/lib/middleware/rate-limit.ts
  - Track requests per user/IP
  - Return 429 when limit exceeded
  - Purpose: Prevent API abuse
  - _Leverage: In-memory store_
  - _Requirements: NFR-Security_

- [ ] 46. Add CSRF protection to forms
  - File: src/lib/security/csrf.ts
  - Generate and validate CSRF tokens
  - Add to all mutation endpoints
  - Purpose: Prevent CSRF attacks
  - _Leverage: crypto for token generation_
  - _Requirements: NFR-Security_

### Integration and Polish

- [ ] 47. Add Turkish translations file
  - File: src/lib/translations/tr.ts
  - All UI text in Turkish using JSX expressions
  - Error messages and notifications
  - Purpose: Turkish interface requirement
  - _Leverage: JSX string interpolation_
  - _Requirements: NFR-Usability_

- [ ] 48. Create keyboard shortcuts handler
  - File: src/lib/hooks/useKeyboardShortcuts.ts
  - Common admin shortcuts (save, new, search)
  - Customizable per component
  - Purpose: Improve admin efficiency
  - _Leverage: React hooks_
  - _Requirements: NFR-Usability_

- [ ] 49. Implement auto-save for forms
  - File: src/lib/hooks/useAutoSave.ts
  - Save drafts to localStorage
  - Restore on page reload
  - Purpose: Prevent data loss
  - _Leverage: localStorage API_
  - _Requirements: NFR-Usability_

- [ ] 50. Add success/error notifications
  - File: src/components/ui/Toast.tsx
  - Toast notifications for actions
  - Auto-dismiss with action buttons
  - Purpose: User feedback
  - _Leverage: React context for global state_
  - _Requirements: NFR-Usability_