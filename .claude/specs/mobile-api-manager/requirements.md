# Requirements Document - Mobile API & Manager

## Introduction

This feature provides a comprehensive mobile API system and simplified admin management interface for the TrendAnkara mobile application. It includes REST endpoints for polls, news, and radio streaming, along with a streamlined card-based content management system and mobile app settings configuration. The goal is to simplify the current complex admin interface while providing robust API endpoints that mobile apps can consume efficiently.

## Alignment with Product Vision

This feature directly supports the product vision outlined in product.md:
- **"Keep it basic, don't overcomplicate anything"** - Simplifies the complex content management system into a card-based approach
- **Mobile App Support** - Provides dedicated, optimized API endpoints for React Native iOS/Android apps
- **Audience Engagement** - Enables mobile users to participate in polls and access news content
- **Admin Efficiency** - Streamlines content management with a focused mobile-first admin interface
- **Performance Focus** - Ensures sub-200ms API response times for optimal mobile experience

## Requirements

### Requirement 1: Mobile API Endpoints

**User Story:** As a mobile app developer, I want RESTful API endpoints for polls, news, and radio configuration, so that the mobile app can display content and handle user interactions efficiently.

#### Acceptance Criteria

1. WHEN a mobile app requests active polls THEN the API SHALL return the current active poll with items, images, vote counts, and time remaining
2. IF no active poll exists THEN the API SHALL return an appropriate empty state response with success=true and empty data
3. WHEN a mobile app requests news list THEN the API SHALL return paginated news with thumbnails, categories, and metadata for infinite scroll
4. WHEN a mobile app requests detailed news THEN the API SHALL return full article content with image gallery and related metadata
5. WHEN a mobile app requests radio configuration THEN the API SHALL return streaming URL, metadata URL, and current playing information
6. IF the streaming URL changes in settings THEN the radio endpoint SHALL immediately reflect the new URL without requiring app updates
7. WHEN any mobile endpoint is called THEN the response time SHALL be less than 200ms for optimal user experience
8. IF MinIO URLs are present in responses THEN they SHALL be automatically converted to HTTPS proxy URLs

### Requirement 2: Card-Based Content Management

**User Story:** As an admin, I want a simplified card-based content management system, so that I can easily create and manage mobile app content without complexity.

#### Acceptance Criteria

1. WHEN an admin creates content THEN they SHALL only work with card components (image, title, description, redirect URL)
2. IF a card is marked as featured THEN it SHALL appear at the top of the content list in the mobile app
3. WHEN cards are displayed THEN featured cards SHALL be visually distinct from normal cards
4. IF an admin clicks on a card in the mobile app THEN it SHALL display a modal with full description and optional redirect
5. WHEN managing cards THEN the admin SHALL be able to reorder them using drag-and-drop or order controls
6. IF content is created THEN it SHALL support both featured and normal card types with clear visual distinction
7. WHEN cards include images THEN they SHALL be automatically optimized for mobile display

### Requirement 3: Mobile App Settings Management

**User Story:** As an admin, I want to configure mobile app behavior and limits through the admin panel, so that I can control the app experience without requiring app updates.

#### Acceptance Criteria

1. WHEN an admin accesses mobile settings THEN they SHALL see options to configure endpoint behaviors
2. IF "Show only last active poll" is enabled THEN the polls endpoint SHALL return only the most recent active poll
3. WHEN "Maximum news count" is set THEN the news endpoint SHALL limit results to that number regardless of pagination
4. IF endpoint toggles are disabled THEN the corresponding mobile endpoints SHALL return configured empty states
5. WHEN player logo is updated THEN the mobile app SHALL receive the new logo URL through the radio configuration endpoint
6. IF any mobile setting is changed THEN it SHALL take effect immediately without requiring server restart
7. WHEN mobile settings are saved THEN they SHALL persist in the database and survive server restarts

### Requirement 4: Simplified Admin Interface

**User Story:** As an admin, I want a dedicated, simplified mobile content management interface, so that I can manage mobile-specific content without navigating complex systems.

#### Acceptance Criteria

1. WHEN accessing mobile management THEN the admin SHALL see a dedicated "Mobile App Manager" section
2. IF the admin needs to manage cards THEN they SHALL have a simple interface showing all cards in a grid view
3. WHEN creating a new card THEN the form SHALL only include essential fields (title, image, description, URL, featured status)
4. IF validation fails THEN the system SHALL provide clear Turkish language error messages
5. WHEN viewing the mobile manager THEN admins SHALL see live preview of how content appears in the mobile app
6. IF bulk operations are needed THEN the admin SHALL be able to select multiple cards and perform batch actions
7. WHEN mobile content is modified THEN changes SHALL be reflected in the mobile API responses within 5 seconds

### Requirement 5: Database Structure Optimization

**User Story:** As a system architect, I want optimized database structures for mobile content and settings, so that the system can efficiently serve mobile API requests.

#### Acceptance Criteria

1. WHEN mobile content is stored THEN it SHALL use a simplified schema optimized for card-based content
2. IF mobile settings are configured THEN they SHALL be stored in a dedicated configuration table
3. WHEN database queries are executed for mobile endpoints THEN they SHALL use appropriate indexes for sub-100ms query times
4. IF soft deletes are used THEN deleted content SHALL not appear in mobile API responses
5. WHEN featured content is queried THEN the database SHALL efficiently sort by featured status and order
6. IF content has date ranges THEN expired content SHALL be automatically excluded from API responses

## Non-Functional Requirements

### Performance
- All mobile API endpoints must respond within 200ms under normal load
- Database queries for mobile content must execute in under 100ms
- Image optimization must reduce file sizes by at least 50% for mobile delivery
- API responses must use gzip compression for bandwidth optimization
- Caching strategy must reduce database load by 70% for frequently accessed content

### Security
- All mobile API endpoints must validate request origins
- Admin interfaces must require authentication and authorization
- File uploads must validate file types and scan for malicious content
- API rate limiting must prevent abuse (100 requests/minute per IP)
- Sensitive configuration must never be exposed in API responses

### Reliability
- Mobile APIs must maintain 99.9% uptime
- Failed image uploads must not break the content creation flow
- Database connections must automatically reconnect on failure
- API errors must be logged for monitoring and debugging
- Graceful degradation when external services are unavailable

### Usability
- Admin interface must be intuitive without requiring documentation
- All admin interface text must be in Turkish
- Mobile preview must accurately represent app appearance
- Drag-and-drop operations must work on touch devices
- Form validation must provide immediate, clear feedback
- Bulk operations must complete within 3 seconds for up to 100 items