# Requirements Document - Mobile App Restructure

## Introduction

This feature restructures the mobile app content management system by simplifying the complex dynamic content builder into three dedicated static pages (polls, news, and a simple sponsorship page). The sponsorship page will be the only editable page through a streamlined card-based admin interface, while polls and news pages will consume existing API data without dynamic editing capabilities. Additionally, it provides simple logo management for the player screen. This approach follows the core principle of "keep it basic, don't overcomplicate anything" - designed to be so simple that anyone can use it effectively.

## Alignment with Product Vision

This feature directly supports the product vision outlined in product.md:
- **"Keep it basic, don't overcomplicate anything"** - Eliminates complex dynamic page builder in favor of simple, purpose-built pages
- **Mobile App Support** - Maintains robust API endpoints for React Native app while simplifying content management
- **Admin Efficiency** - Provides focused, easy-to-use sponsorship card management and simple logo updates instead of complex page builder
- **Performance Focus** - Static pages load faster than dynamically generated content, existing streaming endpoint unchanged
- **Audience Engagement** - Preserves polls and news functionality with improved user experience
- **Monkey-Proof Design** - Interface so simple and intuitive that anyone can manage it without training

## Requirements

### Requirement 1: Static Polls Page

**User Story:** As a mobile app user, I want a dedicated polls page that displays current active polls and allows voting, so that I can participate in station polls without complex navigation.

#### Acceptance Criteria

1. WHEN a user navigates to the polls page THEN the system SHALL display the current active poll with items, images, and vote counts
2. IF no active poll exists THEN the system SHALL display an appropriate message indicating no polls are available
3. WHEN a user votes on a poll THEN the system SHALL cache the vote locally and submit via POST request
4. IF a user has already voted THEN the system SHALL display vote results instead of voting interface
5. WHEN poll data is loaded THEN the system SHALL cache results for 1 minute to improve performance
6. IF the poll endpoint is disabled in settings THEN the page SHALL display a maintenance message

### Requirement 2: Static News Page

**User Story:** As a mobile app user, I want a dedicated news page that displays latest news articles with categories, so that I can browse station news content efficiently.

#### Acceptance Criteria

1. WHEN a user navigates to the news page THEN the system SHALL display paginated news articles with thumbnails
2. IF news articles have categories THEN they SHALL be displayed with appropriate category labels
3. WHEN a user taps on a news article THEN the system SHALL display the full article in a modal or detail view
4. IF an article has image galleries THEN all images SHALL be accessible in the detail view
5. WHEN loading more news THEN the system SHALL support infinite scroll pagination
6. IF the news endpoint is disabled in settings THEN the page SHALL display a maintenance message
7. WHEN news is marked as breaking or featured THEN it SHALL be visually highlighted

### Requirement 3: Simple Sponsorship Page with Admin Management

**User Story:** As an admin, I want to manage simple sponsorship cards through an easy interface, so that I can create promotional content for the mobile app without complexity.

#### Acceptance Criteria

1. WHEN an admin accesses sponsorship management THEN they SHALL see a simple interface for creating cards
2. IF a card is created THEN it SHALL contain only image, title, description, and redirect URL fields
3. WHEN a card is displayed in the mobile app THEN it SHALL show image and title prominently
4. IF a user taps on a card THEN the system SHALL display a modal with full description and optional redirect
5. WHEN an admin saves a card THEN it SHALL immediately appear in the mobile app within 5 seconds
6. IF cards are reordered THEN the mobile app SHALL reflect the new order immediately
7. WHEN cards have featured status THEN they SHALL appear at the top with distinct styling

### Requirement 4: Simplified Admin Interface

**User Story:** As an admin, I want a focused sponsorship card management interface, so that I can manage mobile content without navigating complex page builders.

#### Acceptance Criteria

1. WHEN accessing sponsorship management THEN the admin SHALL see only card management tools
2. IF creating a new card THEN the form SHALL have only essential fields (title, description, image, URL)
3. WHEN viewing existing cards THEN they SHALL be displayed in a clear grid or list format
4. IF editing a card THEN the admin SHALL be able to modify all fields and see live preview
5. WHEN validation fails THEN clear Turkish error messages SHALL be displayed
6. IF bulk operations are needed THEN multiple cards can be selected for batch actions
7. WHEN cards are saved THEN success confirmation SHALL be shown

### Requirement 5: Database Schema Simplification

**User Story:** As a system architect, I want simplified database structures that support only the sponsorship cards, so that the system is easier to maintain and performs better.

#### Acceptance Criteria

1. WHEN storing sponsorship cards THEN only essential fields SHALL be included in the schema
2. IF complex content types exist THEN they SHALL be removed in favor of simple card structure
3. WHEN querying cards THEN indexes SHALL ensure sub-100ms response times
4. IF cards are deleted THEN soft delete SHALL be used to allow recovery
5. WHEN card order changes THEN display_order field SHALL be updated atomically
6. IF featured cards are queried THEN they SHALL sort by featured status first, then by order

### Requirement 6: Radio Player Configuration (Keep Simple)

**User Story:** As an admin, I want to change the player screen company logo through a simple interface, so that branding can be updated without technical complexity.

#### Acceptance Criteria

1. WHEN admin accesses player settings THEN they SHALL see a simple logo upload interface
2. IF a new logo is uploaded THEN it SHALL immediately appear in the mobile app player screen
3. WHEN logo is changed THEN the mobile radio endpoint SHALL return the new logo URL
4. IF no logo is set THEN the mobile app SHALL use a default placeholder
5. WHEN logo upload fails THEN clear error message SHALL be shown in Turkish
6. IF logo is too large THEN the system SHALL automatically resize it
7. WHEN logo is saved THEN admin SHALL see immediate confirmation

### Requirement 7: API Endpoint Optimization (Keep Existing)

**User Story:** As a mobile app developer, I want to keep existing API endpoints unchanged, so that the mobile app continues to work without any modifications.

#### Acceptance Criteria

1. WHEN mobile app requests radio config THEN the existing `/api/mobile/v1/radio` endpoint SHALL remain unchanged
2. IF polls data is requested THEN the existing polls API SHALL be used without modification
3. WHEN news data is requested THEN the existing news API SHALL provide paginated results exactly as before
4. IF sponsorship cards are requested THEN a new simple cards API SHALL return only active cards
5. WHEN streaming URL is needed THEN it SHALL come from existing radio settings (no changes)
6. IF any API request fails THEN appropriate fallback content SHALL be provided
7. WHEN APIs are called THEN response times SHALL remain under 200ms

### Requirement 8: Remove Complex Dynamic Content System (Monkey-Proof Simplicity)

**User Story:** As a system maintainer, I want to remove the complex dynamic content builder, so that the system is simpler to maintain and has fewer potential failure points.

#### Acceptance Criteria

1. WHEN the system is updated THEN dynamic page builder components SHALL be removed
2. IF content pages exist THEN they SHALL be migrated to simple card format where applicable
3. WHEN admin interface is accessed THEN complex content management tools SHALL no longer be available
4. IF database tables for dynamic content exist THEN they SHALL be deprecated safely
5. WHEN mobile app requests content THEN only simple card-based content SHALL be returned
6. IF existing dynamic pages are referenced THEN they SHALL redirect to appropriate static pages

## Non-Functional Requirements

### Performance
- Static page loading must be faster than current dynamic content (target: 50% improvement)
- Sponsorship card API must respond within 100ms under normal load
- Image loading must use existing optimization and proxy patterns
- Cache invalidation must update mobile content within 5 seconds of admin changes
- Database queries for cards must execute in under 50ms

### Security
- All existing authentication and authorization patterns must be maintained
- Card management must require admin authentication
- Image uploads must use existing validation and security measures
- API endpoints must maintain existing rate limiting and security headers
- No sensitive data must be exposed in mobile API responses

### Reliability
- Static pages must maintain 99.9% uptime (same as current system)
- Failed card operations must not break the admin interface
- Mobile app must gracefully handle missing or disabled content
- Database operations must use transactions for data consistency
- System must gracefully degrade when external services are unavailable

### Usability
- Admin interface must be intuitive without requiring documentation
- All admin interface text must remain in Turkish
- Card creation form must validate inputs with immediate feedback
- Mobile pages must work seamlessly on both iOS and Android
- Transition from old system must be transparent to mobile users
- Drag-and-drop card reordering must work on touch devices