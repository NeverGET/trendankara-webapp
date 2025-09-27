# Implementation Plan - Mobile API & Manager

## Task Overview
This implementation plan breaks down the Mobile API & Manager feature into atomic, executable tasks. Each task is designed to be completed in 15-30 minutes by focusing on specific files and clear objectives. The plan follows a bottom-up approach, starting with database schema, then services, APIs, and finally the admin interface.

## Steering Document Compliance
All tasks follow structure.md conventions for file organization and tech.md patterns for implementation. Tasks leverage existing code patterns from the current polls, news, and radio systems to maintain consistency.

## Atomic Task Requirements
**Each task meets these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Tasks

### Database Layer Tasks

- [x] 1. Create database migration for mobile_cards table
  - File: src/lib/db/migrations/001_create_mobile_cards.sql
  - Create SQL migration file with mobile_cards table schema
  - Include columns: id, title, description, image_url, redirect_url, is_featured, display_order, is_active, timestamps, created_by
  - Add indexes for featured/order queries and active status
  - _Leverage: existing migration patterns_
  - _Requirements: 2.1, 5.1, 5.5_

- [x] 2. Create database migration for mobile_settings table
  - File: src/lib/db/migrations/002_create_mobile_settings.sql
  - Create SQL migration file with mobile_settings table schema
  - Include columns: id, setting_key (unique), setting_value (JSON), description, updated_at, updated_by
  - Add index on setting_key for fast lookups
  - _Leverage: existing migration patterns_
  - _Requirements: 3.1, 5.2_

- [x] 3. Create migration to insert default mobile settings
  - File: src/lib/db/migrations/003_insert_default_mobile_settings.sql
  - Insert default settings for polls_config, news_config, app_config, player_config
  - Set reasonable defaults: showOnlyLastActivePoll=false, maxNewsCount=50, enablePolls=true, enableNews=true
  - _Requirements: 3.7, 5.2_

- [x] 4. Execute database migration files
  - File: src/lib/db/migrate.ts (modify existing)
  - Run the three migration SQL files in sequence
  - Handle errors with proper rollback
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 5.1, 5.2_

- [x] 5. Verify database tables creation
  - File: src/test/db/verify-mobile-tables.ts
  - Query information_schema to verify tables exist
  - Check that all indexes are created correctly
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 5.3_

- [x] 6. Test database with sample data
  - File: src/test/db/mobile-sample-data.ts
  - Insert sample cards and settings
  - Verify data integrity and constraints
  - _Requirements: 5.4_

### Type Definitions

- [x] 7. Extend mobile types with new interfaces
  - File: src/types/mobile.ts (modify existing)
  - Add MobileCard, MobileSettings, CardInput interfaces
  - Add MobileApiResponse generic type with cache support
  - Extend existing types for enhanced mobile features
  - _Leverage: existing mobile.ts structure_
  - _Requirements: 1.1, 2.1, 3.1_

### Cache Manager

- [x] 8. Create mobile cache manager utility
  - File: src/lib/cache/MobileCacheManager.ts
  - Implement memory cache with TTL support
  - Add generateETag method using crypto
  - Include cache invalidation by pattern
  - _Leverage: src/app/api/mobile/v1/radio/route.ts caching patterns_
  - _Requirements: 1.7, NFR-Performance_

### Service Layer

- [x] 9. Create mobile poll service
  - File: src/services/mobile/PollService.ts
  - Implement getActivePoll method with settings support
  - Add logic for showOnlyLastActivePoll setting
  - Include URL fixing for poll item images
  - _Leverage: src/app/api/polls/active/route.ts, src/lib/utils/url-fixer.ts_
  - _Requirements: 1.1, 1.2, 3.2_

- [x] 10. Add vote submission to poll service
  - File: src/services/mobile/PollService.ts (continue from task 9)
  - Implement submitVote method with device validation
  - Add duplicate vote prevention using device_id and IP
  - Return updated vote counts after submission
  - _Leverage: src/app/api/polls/vote/route.ts_
  - _Requirements: 1.1_

- [x] 11. Create mobile news service with list functionality
  - File: src/services/mobile/NewsService.ts
  - Implement getNewsList with pagination support
  - Apply maxNewsCount setting limit
  - Include URL fixing for featured images
  - _Leverage: src/app/api/news/route.ts, src/lib/utils/url-fixer.ts_
  - _Requirements: 1.3, 3.3_

- [x] 12. Add news detail retrieval to news service
  - File: src/services/mobile/NewsService.ts (continue from task 11)
  - Implement getNewsDetail method by slug
  - Include full content with image galleries
  - Apply URL fixing recursively to content
  - _Leverage: src/app/api/news/[slug]/route.ts_
  - _Requirements: 1.4_

- [x] 13. Create mobile card service
  - File: src/services/mobile/CardService.ts
  - Implement getCards method with featured/normal filtering
  - Add proper ordering by is_featured and display_order
  - Include URL fixing for card images
  - _Leverage: src/lib/utils/url-fixer.ts_
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 14. Add card management methods to card service
  - File: src/services/mobile/CardService.ts (continue from task 13)
  - Implement createCard, updateCard, deleteCard methods
  - Add reorderCards method for display_order updates
  - Include validation for required fields
  - _Requirements: 2.5, 4.3_

- [x] 15. Create mobile config service
  - File: src/services/mobile/ConfigService.ts
  - Implement getSettings method with caching
  - Add updateSettings with immediate effect
  - Include getPlayerLogo helper method
  - _Leverage: src/app/api/admin/radio-settings patterns_
  - _Requirements: 3.1, 3.5, 3.6, 3.7_

### Error Handling Implementation

- [ ] 16. Create mobile error handler utility
  - File: src/lib/utils/mobile-error-handler.ts
  - Implement error types for database, validation, rate limit errors
  - Add Turkish error messages for user-facing errors
  - Include error logging with stack traces
  - _Leverage: existing error handling patterns_
  - _Requirements: 4.4, NFR-Reliability_

### Security Implementation

- [ ] 17. Create rate limiting middleware for mobile APIs
  - File: src/lib/middleware/mobile-rate-limit.ts
  - Implement IP-based rate limiting (100 req/min)
  - Add retry-after header for 429 responses
  - Store rate limit data in memory with TTL
  - _Requirements: NFR-Security_

- [ ] 18. Add input validation utility for mobile APIs
  - File: src/lib/utils/mobile-validation.ts
  - Implement sanitization for user inputs
  - Add SQL injection prevention helpers
  - Include XSS prevention for rich content
  - _Requirements: NFR-Security_

### API Endpoints - Polls

- [x] 19. Implement mobile polls endpoint
  - File: src/app/api/mobile/v1/polls/route.ts (modify existing stub)
  - Replace stub with actual implementation using PollService
  - Add caching with 1-minute TTL
  - Include proper error handling and response format
  - _Leverage: src/services/mobile/PollService.ts, src/lib/cache/MobileCacheManager.ts_
  - _Requirements: 1.1, 1.2, 1.7_

- [x] 20. Create mobile poll voting endpoint
  - File: src/app/api/mobile/v1/polls/[id]/vote/route.ts
  - Implement POST handler for vote submission
  - Extract device info from request headers
  - Return updated vote counts on success
  - _Leverage: src/services/mobile/PollService.ts, src/lib/middleware/mobile-rate-limit.ts_
  - _Requirements: 1.1_

### API Endpoints - News

- [x] 21. Implement mobile news list endpoint
  - File: src/app/api/mobile/v1/news/route.ts (modify existing stub)
  - Replace stub with NewsService implementation
  - Add pagination with page and limit parameters
  - Include caching with 2-minute TTL
  - _Leverage: src/services/mobile/NewsService.ts, src/lib/cache/MobileCacheManager.ts_
  - _Requirements: 1.3, 1.7_

- [x] 22. Create mobile news detail endpoint
  - File: src/app/api/mobile/v1/news/[slug]/route.ts
  - Implement GET handler for individual news articles
  - Include view count increment
  - Add caching with 5-minute TTL
  - _Leverage: src/services/mobile/NewsService.ts_
  - _Requirements: 1.4_

### API Endpoints - Radio

- [ ] 23. Update mobile radio endpoint with config support
  - File: src/app/api/mobile/v1/radio/route.ts (modify existing)
  - Add player logo URL from mobile settings
  - Include streaming URL from radio settings
  - Maintain existing caching strategy
  - _Leverage: src/services/mobile/ConfigService.ts_
  - _Requirements: 1.5, 1.6, 3.5_

### API Endpoints - Cards

- [x] 24. Implement mobile cards endpoint
  - File: src/app/api/mobile/v1/content/cards/route.ts
  - Implement GET handler using CardService
  - Support type filter query parameter
  - Add caching with 3-minute TTL
  - _Leverage: src/services/mobile/CardService.ts, src/lib/cache/MobileCacheManager.ts_
  - _Requirements: 2.1, 2.2, 2.3_

### API Endpoints - Configuration

- [x] 25. Create mobile config endpoint
  - File: src/app/api/mobile/v1/config/route.ts
  - Implement GET handler for app configuration
  - Include player logo URL in response
  - Add caching with 5-minute TTL
  - _Leverage: src/services/mobile/ConfigService.ts_
  - _Requirements: 3.1, 3.5, 1.5_

### Performance Optimization

- [x] 26. Add gzip compression middleware
  - File: src/lib/middleware/mobile-compression.ts
  - Implement gzip compression for JSON responses
  - Set appropriate compression headers
  - Exclude already compressed content
  - _Requirements: NFR-Performance_

- [x] 27. Implement image optimization utility
  - File: src/lib/utils/mobile-image-optimizer.ts
  - Generate thumbnails (150x150, 300x300, 600x600)
  - Add WebP conversion with JPEG fallback
  - Include lazy loading hints
  - _Leverage: existing image processing patterns_
  - _Requirements: 2.7, NFR-Performance_

### Admin Interface - Database Queries

- [x] 28. Create card database queries module
  - File: src/lib/db/queries/mobile/cards.ts
  - Implement CRUD queries for mobile_cards table
  - Add batch update for reordering
  - Include soft delete support
  - _Leverage: src/lib/db/client.ts, existing query patterns_
  - _Requirements: 2.1, 2.5, 5.4_

- [x] 29. Create settings database queries module
  - File: src/lib/db/queries/mobile/settings.ts
  - Implement get and update queries for mobile_settings
  - Add JSON parsing/stringifying helpers
  - Include transaction support for atomic updates
  - _Leverage: src/lib/db/client.ts, existing query patterns_
  - _Requirements: 3.1, 3.7_

### Admin Interface - Components

- [x] 30. Create card editor component
  - File: src/components/mobile/CardEditor.tsx
  - Build form with title, description, image, URL fields
  - Add featured toggle and image upload integration
  - Include Turkish validation messages
  - _Leverage: src/components/ui/Button.tsx, src/components/ui/Input.tsx_
  - _Requirements: 2.1, 4.3, 4.4_

- [x] 31. Create card list component with grid view
  - File: src/components/mobile/CardList.tsx
  - Display cards in responsive grid layout
  - Show featured badge on featured cards
  - Add edit and delete action buttons
  - _Leverage: src/components/ui/Card.tsx_
  - _Requirements: 2.2, 2.3, 4.2_

- [x] 32. Implement drag-and-drop reordering for cards
  - File: src/components/mobile/CardList.tsx (modify from task 31)
  - Add framer-motion drag handlers
  - Update display_order on drop
  - Show visual feedback during drag
  - _Leverage: framer-motion library_
  - _Requirements: 2.5_

- [x] 33. Create live preview component
  - File: src/components/mobile/LivePreview.tsx
  - Build mobile phone frame with scaled content
  - Display cards as they would appear in app
  - Update in real-time as cards change
  - _Leverage: src/components/content/preview patterns_
  - _Requirements: 4.5_

- [x] 34. Create mobile settings panel
  - File: src/components/mobile/SettingsPanel.tsx
  - Build form for poll, news, and app settings
  - Add player logo upload field
  - Include save button with loading state
  - _Leverage: src/components/ui/Switch.tsx, src/components/ui/Input.tsx_
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

### Admin Interface - Pages

- [x] 35. Create mobile manager main page
  - File: src/app/admin/mobile/page.tsx
  - Build tab interface for Cards and Settings
  - Add authentication check using requireAuth
  - Include page title and description in Turkish
  - _Leverage: src/app/admin/layout.tsx, requireAuth()_
  - _Requirements: 4.1_

- [x] 36. Create cards management tab content
  - File: src/app/admin/mobile/cards/page.tsx
  - Integrate CardList and CardEditor components
  - Add create new card button
  - Implement edit/delete handlers
  - _Leverage: src/components/mobile/CardList.tsx, src/components/mobile/CardEditor.tsx_
  - _Requirements: 4.2, 4.3, 4.6_

- [x] 37. Create settings management tab content
  - File: src/app/admin/mobile/settings/page.tsx
  - Integrate SettingsPanel component
  - Load current settings on mount
  - Implement save handler with success feedback
  - _Leverage: src/components/mobile/SettingsPanel.tsx_
  - _Requirements: 3.1, 3.6_

- [x] 38. Add mobile preview integration
  - File: src/app/admin/mobile/page.tsx (modify from task 35)
  - Add LivePreview component to layout
  - Connect preview to current cards and settings
  - Update preview on any changes
  - _Leverage: src/components/mobile/LivePreview.tsx_
  - _Requirements: 4.5_

### Admin API Endpoints

- [x] 39. Create admin cards API for CRUD operations
  - File: src/app/api/admin/mobile/cards/route.ts
  - Implement GET for list, POST for create
  - Add authentication middleware check
  - Return formatted response with URL fixing
  - _Leverage: src/lib/db/queries/mobile/cards.ts, requireAuth()_
  - _Requirements: 2.1, 4.3_

- [x] 40. Create admin card detail API
  - File: src/app/api/admin/mobile/cards/[id]/route.ts
  - Implement GET, PUT, DELETE handlers
  - Include soft delete for DELETE
  - Add validation for required fields
  - _Leverage: src/lib/db/queries/mobile/cards.ts_
  - _Requirements: 2.1, 5.4_

- [x] 41. Create admin cards reorder API
  - File: src/app/api/admin/mobile/cards/reorder/route.ts
  - Implement POST handler for batch order updates
  - Accept array of card IDs in new order
  - Update display_order for all affected cards
  - _Leverage: src/lib/db/queries/mobile/cards.ts_
  - _Requirements: 2.5_

- [x] 42. Create admin settings API
  - File: src/app/api/admin/mobile/settings/route.ts
  - Implement GET for current settings, PUT for updates
  - Merge partial updates with existing settings
  - Clear cache after settings change
  - _Leverage: src/lib/db/queries/mobile/settings.ts, MobileCacheManager_
  - _Requirements: 3.1, 3.6, 3.7_

### Integration and Polish

- [x] 43. Add mobile manager link to admin navigation
  - File: src/app/admin/layout.tsx (verify exists, then modify)
  - Add "Mobil Uygulama" menu item
  - Include mobile icon from react-icons
  - Place after existing admin menu items
  - _Requirements: 4.1_

- [x] 44. Integrate media picker with card editor
  - File: src/components/mobile/CardEditor.tsx (modify from task 30)
  - Add media picker dialog integration
  - Handle image upload to MinIO
  - Show upload progress indicator
  - _Leverage: src/components/media/MediaPicker.tsx_
  - _Requirements: 2.7, 4.3_

- [x] 45. Add bulk delete for cards
  - File: src/components/mobile/CardList.tsx (modify from tasks 31-32)
  - Add checkbox selection for multiple cards
  - Implement bulk delete with confirmation
  - Show success feedback after deletion
  - _Requirements: 4.6_

- [x] 46. Add bulk active toggle for cards
  - File: src/components/mobile/CardList.tsx (modify from task 45)
  - Add bulk active/inactive toggle
  - Update UI immediately after toggle
  - Show count of affected cards
  - _Requirements: 4.6_

- [x] 47. Implement cache invalidation on card changes
  - File: src/services/mobile/CardService.ts (modify from tasks 13-14)
  - Clear card cache after create/update/delete
  - Invalidate pattern-based cache keys
  - Log cache invalidation for debugging
  - _Leverage: src/lib/cache/MobileCacheManager.ts_
  - _Requirements: 4.7_

- [x] 48. Implement cache invalidation on settings changes
  - File: src/services/mobile/ConfigService.ts (modify from task 15)
  - Clear config cache after settings update
  - Invalidate related endpoint caches
  - Ensure immediate effect in APIs
  - _Leverage: src/lib/cache/MobileCacheManager.ts_
  - _Requirements: 3.6, 4.7_

- [x] 49. Add error handling to card editor
  - File: src/components/mobile/CardEditor.tsx (modify from tasks 30, 44)
  - Add try-catch with Turkish error messages
  - Show validation errors inline
  - Display save errors as toast
  - _Leverage: src/lib/utils/mobile-error-handler.ts_
  - _Requirements: 4.4, NFR-Usability_

- [x] 50. Add error handling to settings panel
  - File: src/components/mobile/SettingsPanel.tsx (modify from task 34)
  - Add try-catch for save operations
  - Show Turkish error messages
  - Include retry mechanism for failures
  - _Leverage: src/lib/utils/mobile-error-handler.ts_
  - _Requirements: 4.4, NFR-Reliability_

- [x] 51. Add loading states to card list
  - File: src/components/mobile/CardList.tsx (modify from tasks 31-32, 45-46)
  - Show skeleton loaders during fetch
  - Add spinner for save operations
  - Disable interactions during loading
  - _Requirements: NFR-Usability_

- [x] 52. Add loading states to settings panel
  - File: src/components/mobile/SettingsPanel.tsx (modify from tasks 34, 50)
  - Show loading spinner during fetch
  - Disable form during save
  - Show progress indicator
  - _Requirements: NFR-Usability_

- [x] 53. Make card editor responsive
  - File: src/components/mobile/CardEditor.tsx (modify from tasks 30, 44, 49)
  - Stack fields on mobile screens
  - Adjust button sizes for touch
  - Test on 320px minimum width
  - _Requirements: NFR-Usability_

- [x] 54. Make card list responsive
  - File: src/components/mobile/CardList.tsx (modify from tasks 31-32, 45-46, 51)
  - Adjust grid columns for screen size
  - Make cards stack on mobile
  - Ensure touch-friendly interactions
  - _Requirements: NFR-Usability_

- [x] 55. Make settings panel responsive
  - File: src/components/mobile/SettingsPanel.tsx (modify from tasks 34, 50, 52)
  - Stack form sections on mobile
  - Adjust input sizes for small screens
  - Test on tablet and mobile viewports
  - _Requirements: NFR-Usability_

### Testing and Validation

- [x] 56. Create API response time test
  - File: src/test/mobile/api-performance.test.ts
  - Test all mobile endpoints response times
  - Verify sub-200ms requirement
  - Include load testing with concurrent requests
  - _Requirements: 1.7, NFR-Performance_

- [x] 57. Create URL fixing validation test
  - File: src/test/mobile/url-fixing.test.ts
  - Test MinIO URL conversion in all endpoints
  - Verify nested object URL fixing
  - Check HTML content URL replacement
  - _Requirements: 1.8_

- [x] 58. Create settings behavior test
  - File: src/test/mobile/settings-behavior.test.ts
  - Test showOnlyLastActivePoll effect
  - Verify maxNewsCount limit enforcement
  - Check endpoint enable/disable toggles
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 59. Create database performance test
  - File: src/test/mobile/db-performance.test.ts
  - Measure query execution times
  - Verify sub-100ms requirement
  - Check index usage with EXPLAIN
  - _Requirements: 5.3, NFR-Performance_

- [x] 60. Create end-to-end card flow test
  - File: src/test/mobile/e2e-card-flow.test.ts
  - Test card creation through admin
  - Verify card appears in API
  - Check featured card ordering
  - _Requirements: 2.1, 2.2, 2.3, 4.3_

- [x] 61. Create end-to-end settings flow test
  - File: src/test/mobile/e2e-settings-flow.test.ts
  - Test settings update through admin
  - Verify immediate effect in APIs
  - Check settings persistence
  - _Requirements: 3.1, 3.6, 3.7_

- [x] 62. Create security validation test
  - File: src/test/mobile/security.test.ts
  - Test rate limiting enforcement
  - Verify input sanitization
  - Check SQL injection prevention
  - _Requirements: NFR-Security_