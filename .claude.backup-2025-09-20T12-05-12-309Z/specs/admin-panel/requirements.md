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