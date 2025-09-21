# Implementation Plan - CMS Integration

## Task Overview
The implementation will systematically build the CMS integration features: confirmation dialogs, dynamic radio settings management, and seamless admin-to-public content flow. Tasks are organized to build upon existing components and follow the established codebase patterns.

## Steering Document Compliance
- **Structure.md**: All tasks follow the project's directory organization with components in `/src/components/`, API routes in `/src/app/api/`, and database queries in `/src/lib/db/`
- **Tech.md**: Tasks leverage Next.js 15 App Router patterns, existing NextAuth integration, and MySQL database connections

## Atomic Task Requirements
**Each task meets these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Tasks

### Phase 1: Confirmation Dialog Infrastructure

- [x] 1. Create ConfirmDialog component extending Modal.tsx
  - File: src/components/ui/ConfirmDialog.tsx
  - Extend existing Modal component with confirmation-specific props
  - Add danger, warning, info variants with appropriate colors
  - Include loading state during async operations
  - _Leverage: src/components/ui/Modal.tsx, src/components/ui/Button.tsx_
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Create useConfirmation hook for dialog state management
  - File: src/hooks/useConfirmation.ts
  - Implement state management for confirmation dialogs
  - Add promise-based confirm method returning boolean
  - Handle loading states and error conditions
  - _Leverage: React hooks patterns_
  - _Requirements: 1.1, 1.6_

- [x] 3. Add Turkish translations for confirmation messages
  - File: src/lib/constants/messages.ts
  - Create Turkish message constants for all confirmation scenarios
  - Include delete, publish, unpublish confirmation texts
  - Add error and success notification messages
  - _Requirements: 1.1, 1.4_

### Phase 2: Database Schema Updates

- [x] 4. Create radio_settings table migration script
  - File: docker/migrations/001_add_radio_settings.sql
  - Define radio_settings table with all columns
  - Add foreign key to users table for updated_by
  - Include indexes for is_active field
  - _Leverage: docker/schema.sql structure_
  - _Requirements: 2.1, 2.2_

- [x] 5. Add audit columns to existing tables
  - File: docker/migrations/002_add_audit_columns.sql
  - Add deleted_with_confirmation to news and polls tables
  - Add confirmation_required to audit_logs table
  - Include proper default values
  - _Leverage: Existing table structures_
  - _Requirements: 1.6_

- [x] 6. Create initial radio settings seed data
  - File: docker/migrations/003_seed_radio_settings.sql
  - Insert default radio configuration from environment
  - Set initial stream and metadata URLs
  - Mark as active configuration
  - _Requirements: 2.1, 2.4_

### Phase 3: Radio Settings API

- [x] 7. Create radio settings database queries
  - File: src/lib/db/queries/radioSettings.ts
  - Implement getActiveSettings function
  - Add updateSettings with validation
  - Create testStreamConnection helper
  - _Leverage: src/lib/db/client.ts patterns_
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 8. Create GET /api/admin/settings/radio endpoint
  - File: src/app/api/admin/settings/radio/route.ts
  - Implement GET handler with auth check
  - Fetch current settings from database
  - Return formatted JSON response
  - _Leverage: NextAuth session, src/lib/db/queries/radioSettings.ts_
  - _Requirements: 2.1, 4.1_

- [x] 9. Create PUT /api/admin/settings/radio endpoint
  - File: src/app/api/admin/settings/radio/route.ts (continue)
  - Add PUT handler with validation
  - Update database with new settings
  - Invalidate radio config cache
  - _Leverage: Existing validation patterns_
  - _Requirements: 2.2, 2.4, 2.5_

- [x] 10. Create POST /api/admin/settings/radio/test endpoint
  - File: src/app/api/admin/settings/radio/test/route.ts
  - Implement stream URL connection test
  - Add 10-second timeout handling
  - Return success/failure status with details
  - _Requirements: 2.3_

- [x] 11. Update public /api/radio/config endpoint
  - File: src/app/api/radio/route.ts (modify existing)
  - Fetch configuration from database instead of env
  - Add fallback to environment variables
  - Include caching headers
  - _Leverage: Existing endpoint structure_
  - _Requirements: 2.4, 3.1_

### Phase 4: Radio Settings UI Components

- [x] 12. Create RadioSettingsForm component structure
  - File: src/components/admin/RadioSettingsForm.tsx
  - Build form with Input components for URLs
  - Add station name and description fields
  - Include test button and save button
  - _Leverage: src/components/ui/Input.tsx, src/components/ui/Button.tsx_
  - _Requirements: 2.1, 2.2_

- [x] 13. Add form validation to RadioSettingsForm
  - File: src/components/admin/RadioSettingsForm.tsx (continue)
  - Validate URL format before submission
  - Add debounced validation on input
  - Show inline error messages
  - _Leverage: Existing validation utilities_
  - _Requirements: 2.2, 2.5_

- [x] 14. Implement stream test functionality
  - File: src/components/admin/RadioSettingsForm.tsx (continue)
  - Add test connection button handler
  - Show loading state during test
  - Display success/error results
  - _Requirements: 2.3_

- [x] 15. Create radio settings page in admin
  - File: src/app/admin/settings/radio/page.tsx
  - Create page component with RadioSettingsForm
  - Add page header and description
  - Include proper layout wrapper
  - _Leverage: src/components/ui/Card.tsx, admin layout_
  - _Requirements: 2.1_

### Phase 5: Integrate Confirmation Dialogs

- [x] 16. Add delete confirmation to news admin
  - File: src/app/admin/news/page.tsx (modify existing)
  - Import useConfirmation hook
  - Wrap delete actions with confirmation
  - Show item title in confirmation message
  - _Leverage: src/hooks/useConfirmation.ts_
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 17. Add delete confirmation to polls admin
  - File: src/app/admin/polls/page.tsx (modify existing)
  - Add confirmation for poll deletion
  - Include poll title in warning message
  - Handle batch deletions with item count
  - _Leverage: src/hooks/useConfirmation.ts_
  - _Requirements: 1.1, 1.5_

- [x] 18. Add delete confirmation to media manager
  - File: src/app/admin/media/page.tsx (modify existing)
  - Implement confirmation for media deletion
  - Show thumbnail preview in confirmation
  - Support batch delete confirmations
  - _Leverage: src/hooks/useConfirmation.ts_
  - _Requirements: 1.1, 1.5_

- [x] 19. Add publish/unpublish confirmations
  - File: src/components/admin/ContentActions.tsx (create new)
  - Create reusable component for publish actions
  - Include confirmation with content preview
  - Show success notifications after action
  - _Leverage: src/hooks/useConfirmation.ts_
  - _Requirements: 1.4_

### Phase 6: Content Synchronization

- [x] 20. Create cache invalidation utility
  - File: src/lib/cache/invalidation.ts
  - Implement cache key generation for entities
  - Add invalidation methods for each content type
  - Include batch invalidation support
  - _Requirements: 3.6_

- [x] 21. Update news API to invalidate cache
  - File: src/app/api/admin/news/route.ts (modify existing)
  - Add cache invalidation on create/update/delete
  - Ensure public endpoints reflect changes
  - Include timestamp in cache keys
  - _Leverage: src/lib/cache/invalidation.ts_
  - _Requirements: 3.1, 3.6_

- [x] 22. Update polls API to invalidate cache
  - File: src/app/api/admin/polls/route.ts (modify existing)
  - Invalidate cache on poll activation
  - Clear voting cache on poll update
  - Handle featured poll changes
  - _Leverage: src/lib/cache/invalidation.ts_
  - _Requirements: 3.2, 3.6_

- [x] 23. Add real-time sync for radio player
  - File: src/components/radio/RadioPlayerContext.tsx (modify existing)
  - Add method to reload configuration
  - Listen for settings update events
  - Reconnect with new stream URL
  - _Leverage: Existing player context_
  - _Requirements: 2.4, 3.1_

### Phase 7: Authentication & Authorization

- [x] 24. Add role checks to radio settings API
  - File: src/app/api/admin/settings/radio/route.ts (modify)
  - Verify admin role for settings access
  - Add super_admin check for critical changes
  - Return 403 for insufficient permissions
  - _Leverage: NextAuth session roles_
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 25. Implement rate limiting for test endpoint
  - File: src/lib/middleware/rateLimit.ts
  - Create rate limiting middleware
  - Allow 10 tests per minute per user
  - Store attempts in memory or database
  - _Requirements: 4.6_

- [x] 26. Add rate limit to stream test endpoint
  - File: src/app/api/admin/settings/radio/test/route.ts (modify)
  - Apply rate limiting middleware
  - Return 429 when limit exceeded
  - Include retry-after header
  - _Leverage: src/lib/middleware/rateLimit.ts_
  - _Requirements: 4.6_

### Phase 8: Error Handling & Recovery

- [x] 27. Add stream URL fallback mechanism
  - File: src/lib/db/queries/radioSettings.ts (modify)
  - Implement getFallbackUrl function
  - Add automatic fallback on main URL failure
  - Log fallback usage for monitoring
  - _Requirements: 2.5_

- [x] 28. Create error recovery for failed deletions
  - File: src/hooks/useConfirmation.ts (modify)
  - Add retry logic for failed operations
  - Show specific error messages
  - Provide manual retry option
  - _Requirements: 1.6_

- [x] 29. Add connection timeout handling
  - File: src/components/radio/RadioPlayer.tsx (modify existing)
  - Handle stream URL change gracefully
  - Implement reconnection with new URL
  - Show buffering state during transition
  - _Leverage: Existing player component_
  - _Requirements: 2.4_

### Phase 9: Testing Implementation

- [x] 30. Create ConfirmDialog component tests
  - File: src/components/ui/__tests__/ConfirmDialog.test.tsx
  - Test all interaction paths (confirm/cancel)
  - Verify variant styling
  - Test loading states
  - _Leverage: Existing test utilities_
  - _Requirements: 5.1, 5.2_

- [x] 31. Create useConfirmation hook tests
  - File: src/hooks/__tests__/useConfirmation.test.ts
  - Test state management
  - Verify promise resolution
  - Test error handling
  - _Requirements: 5.2_

- [x] 32. Create radio settings API tests
  - File: src/app/api/admin/settings/radio/__tests__/route.test.ts
  - Test GET/PUT endpoints
  - Verify validation logic
  - Test auth requirements
  - _Requirements: 5.3, 5.4_

- [x] 33. Create integration test for content flow
  - File: tests/integration/adminToPublic.test.ts
  - Test news publication flow
  - Verify poll activation
  - Check cache invalidation
  - _Requirements: 5.1, 3.1, 3.2_

- [x] 34. Create E2E test for radio settings update
  - File: tests/e2e/radioSettings.test.ts
  - Test complete settings update flow
  - Verify player reconnection
  - Test fallback mechanism
  - _Requirements: 5.3_

- [x] 35. Create E2E test for deletion with confirmation
  - File: tests/e2e/confirmDelete.test.ts
  - Test news deletion with confirmation
  - Verify cancel path
  - Test batch operations
  - _Requirements: 5.2_

### Phase 10: Documentation & Polish

- [x] 36. Add JSDoc to ConfirmDialog component
  - File: src/components/ui/ConfirmDialog.tsx (modify)
  - Document all props and methods
  - Add usage examples in comments
  - Include variant descriptions
  - _Requirements: Component documentation_

- [x] 37. Document radio settings API endpoints
  - File: docs/api/radio-settings.md
  - Document request/response formats
  - Include authentication requirements
  - Add curl examples
  - _Requirements: API documentation_

- [x] 38. Create admin user guide for radio settings
  - File: docs/admin/radio-settings-guide.md
  - Write step-by-step instructions
  - Include troubleshooting section
  - Add screenshots placeholders
  - _Requirements: User documentation_

- [x] 39. Update environment variables documentation
  - File: .env.example (modify existing)
  - Add new environment variables
  - Document fallback behavior
  - Include migration notes
  - _Requirements: Configuration documentation_

- [x] 40. Add feature flags configuration
  - File: src/lib/config/features.ts
  - Implement feature flag checks
  - Add environment variable parsing
  - Document flag usage
  - _Requirements: Rollback strategy_