# Implementation Plan

## Task Overview

This implementation creates a configurable radio streaming URL feature that enables administrators to dynamically update radio stream URLs through the admin settings interface. The approach leverages existing infrastructure including the `radio_settings` database table, `RadioPlayerContext.reloadConfiguration()` method, and ReUI components to deliver a robust administrative interface with real-time URL validation, stream connectivity testing, and seamless player updates.

The implementation follows a progressive enhancement strategy, building upon existing patterns while adding new functionality through atomic, file-specific tasks that can be executed independently by agents.

## Steering Document Compliance

### Technical Standards (tech.md)
- **Next.js 15**: Uses App Router patterns, Server Components, and async route handlers
- **ReUI Components**: Leverages existing feature flag system for Button, Input, Card, Alert components
- **MySQL 8.0**: Utilizes existing `radio_settings` table structure with proper indexing
- **TypeScript**: Implements strict typing with comprehensive interface definitions
- **Error Handling**: Uses standardized DatabaseError patterns and response formats

### Project Structure (structure.md)
- **Admin Components**: Extends existing `/src/app/admin/settings/page.tsx` structure
- **API Routes**: Populates empty `/src/app/api/mobile/v1/radio/route.ts` endpoint
- **Database Layer**: Leverages existing `/src/lib/db/queries/radioSettings.ts` CRUD operations
- **Context Integration**: Extends `/src/components/radio/RadioPlayerContext.tsx` event system
- **Utility Services**: Builds upon `/src/lib/utils/streamMetadata.ts` validation functions

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

## Good vs Bad Task Examples

❌ **Bad Examples (Too Broad)**:
- "Implement radio configuration system" (affects many files, multiple purposes)
- "Add stream testing features" (vague scope, no file specification)
- "Build complete admin interface" (too large, multiple components)

✅ **Good Examples (Atomic)**:
- "Create StreamConfigurationData interface in src/types/radioSettings.ts"
- "Add URL validation service in src/lib/utils/urlValidator.ts"
- "Create StreamUrlConfigForm component in src/components/admin/StreamUrlConfigForm.tsx"

## Tasks

### Phase 1: Core Types and Interfaces

- [x] 1. Create StreamConfigurationData interface in src/types/radioSettings.ts
  - File: src/types/radioSettings.ts (modify existing)
  - Add StreamConfigurationData interface matching database schema
  - Add StreamTestResult interface for connectivity testing
  - Add URLValidationResult interface for format validation
  - Purpose: Establish type safety for stream configuration features
  - _Leverage: existing radioSettings types, database schema_
  - _Requirements: 1.1, 2.1_

- [x] 2. Create MobileRadioConfig interface in src/types/mobile.ts
  - File: src/types/mobile.ts (create new)
  - Define MobileRadioConfig interface for API responses
  - Add connection status and testing timestamp fields
  - Include stream_url, metadata_url, station_name properties
  - Purpose: Type safety for mobile API endpoint responses
  - _Leverage: existing mobile API patterns_
  - _Requirements: 5.1, 5.2_

### Phase 2: Validation and Testing Services

- [x] 3. Create StreamUrlValidator service in src/lib/utils/streamUrlValidator.ts
  - File: src/lib/utils/streamUrlValidator.ts (create new)
  - Implement validateUrl() method with format checking
  - Add correctUrlFormat() method for auto-correction (.com/stream → .com/)
  - Include protocol validation (HTTP/HTTPS with warnings)
  - Purpose: Centralized URL validation and format correction logic
  - _Leverage: src/lib/utils/streamMetadata.ts validation patterns_
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Extend streamMetadata.ts with enhanced testing in src/lib/utils/streamMetadata.ts
  - File: src/lib/utils/streamMetadata.ts (modify existing)
  - Add testStreamConnection() method with 10-second timeout
  - Include content-type validation for audio streams
  - Add response time measurement and metadata extraction
  - Purpose: Enhanced stream connectivity testing with detailed feedback
  - _Leverage: existing parseStreamHeaders(), detectServerType() functions_
  - _Requirements: 2.1, 2.2, 2.3_

### Phase 3: Admin UI Components

- [x] 5. Create StreamTestIndicator component in src/components/admin/StreamTestIndicator.tsx
  - File: src/components/admin/StreamTestIndicator.tsx (create new)
  - Display test results with loading, success, and error states
  - Show response time, content type, and server metadata
  - Use ReUI Alert and Badge components for consistent styling
  - Purpose: Visual feedback for stream connectivity testing
  - _Leverage: ReUI Alert patterns, existing loading indicators_
  - _Requirements: 2.3, 2.4, 7.6_

- [x] 6. Create StreamUrlConfigForm component in src/components/admin/StreamUrlConfigForm.tsx
  - File: src/components/admin/StreamUrlConfigForm.tsx (create new)
  - Build URL input field with real-time validation
  - Add "Test Stream" button with StreamTestIndicator integration
  - Include save functionality with success/error feedback
  - Purpose: Complete admin interface for stream URL configuration
  - _Leverage: ReUI Input, Button, Card components; existing form patterns_
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 7. Update admin settings page in src/app/admin/settings/page.tsx
  - File: src/app/admin/settings/page.tsx (modify existing)
  - Replace static radio settings section with StreamUrlConfigForm
  - Maintain existing Card layout and styling patterns
  - Add proper error boundaries and loading states
  - Purpose: Integrate configurable stream URL into admin settings
  - _Leverage: existing Card layout, FiRadio icon, radio settings section_
  - _Requirements: 1.1, 1.5_

### Phase 4: Database Integration and Real-time Updates

- [x] 8. Extend radioSettings.ts with atomic update method in src/lib/db/queries/radioSettings.ts
  - File: src/lib/db/queries/radioSettings.ts (modify existing)
  - Add updateStreamUrlAtomic() method with transaction handling
  - Implement deactivate previous + activate new pattern
  - Include admin user tracking and timestamp recording
  - Purpose: Atomic database updates for stream URL changes
  - _Leverage: existing updateSettings(), activateSettings() methods_
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 9. Add configuration event broadcasting in src/lib/utils/radioEvents.ts
  - File: src/lib/utils/radioEvents.ts (create new)
  - Create broadcastSettingsUpdate() function for window events
  - Add event listener helpers for radio configuration changes
  - Include proper TypeScript typing for event payloads
  - Purpose: Real-time event system for radio configuration updates
  - _Leverage: existing RadioPlayerContext event patterns_
  - _Requirements: 4.1, 4.2_

- [x] 10. Update RadioPlayerContext with enhanced configuration loading in src/components/radio/RadioPlayerContext.tsx
  - File: src/components/radio/RadioPlayerContext.tsx (modify existing)
  - Enhance reloadConfiguration() to use database settings
  - Add fallback URL handling from environment variables
  - Include iOS-compatible cache-busting for URL transitions
  - Purpose: Real-time player updates with new stream URLs
  - _Leverage: existing reloadConfiguration(), iOS cache-busting logic_
  - _Requirements: 4.3, 4.4, 4.5, 4.6_

### Phase 5: Mobile API Implementation

- [x] 11. Implement mobile radio configuration API in src/app/api/mobile/v1/radio/route.ts
  - File: src/app/api/mobile/v1/radio/route.ts (modify existing)
  - Replace empty GET handler with active settings retrieval
  - Add fallback to environment variables when no settings exist
  - Include proper error handling and response formatting
  - Purpose: Mobile app access to current radio configuration
  - _Leverage: src/lib/db/queries/radioSettings.ts getActiveSettings()_
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 12. Add mobile API response caching in src/app/api/mobile/v1/radio/route.ts
  - File: src/app/api/mobile/v1/radio/route.ts (continue from task 11)
  - Implement 200ms response time requirement with caching
  - Add ETag headers for efficient mobile app updates
  - Include connection status and last tested timestamps
  - Purpose: High-performance mobile API with caching
  - _Leverage: Next.js 15 response caching patterns_
  - _Requirements: 5.5, 5.6_

### Phase 6: Error Handling and Validation

- [x] 13. Create comprehensive error handling in src/lib/utils/radioErrorHandler.ts
  - File: src/lib/utils/radioErrorHandler.ts (create new)
  - Add specific error types for timeout, network, and validation failures
  - Include user-friendly error message mapping
  - Add error logging with admin user context
  - Purpose: Centralized error handling for radio configuration features
  - _Leverage: existing DatabaseError patterns_
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 14. Add server action for form submission in src/app/admin/settings/actions.ts
  - File: src/app/admin/settings/actions.ts (create new)
  - Create updateStreamUrl server action with validation
  - Include authentication check for super_admin role
  - Add proper error handling and success response formatting
  - Purpose: Secure server-side stream URL update processing
  - _Leverage: Next.js 15 server actions, existing auth patterns_
  - _Requirements: 1.4, 1.5, 6.5, 7.7_

### Phase 7: Testing and Integration

- [x] 15. Create unit tests for StreamUrlValidator in tests/lib/utils/streamUrlValidator.test.ts
  - File: tests/lib/utils/streamUrlValidator.test.ts (create new)
  - Test URL format validation with valid/invalid URLs
  - Test auto-correction logic (.com/stream → .com/, index.html removal)
  - Test protocol validation and security warnings
  - Purpose: Ensure URL validation reliability and edge case handling
  - _Leverage: existing test patterns, Jest setup_
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 16. Create integration tests for admin form in tests/components/admin/StreamUrlConfigForm.test.tsx
  - File: tests/components/admin/StreamUrlConfigForm.test.tsx (create new)
  - Test complete form submission from validation to database
  - Test stream testing functionality with mocked responses
  - Test error handling and success feedback display
  - Purpose: Ensure admin interface reliability and user experience
  - _Leverage: React Testing Library, existing component test patterns_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

- [x] 17. Create end-to-end tests for radio configuration flow in tests/e2e/radioConfiguration.test.ts
  - File: tests/e2e/radioConfiguration.test.ts (create new)
  - Test complete workflow: admin login → settings → URL change → player update
  - Test mobile API reflects changes immediately after admin update
  - Test fallback mechanisms when primary URL fails
  - Purpose: Ensure complete feature functionality across all platforms
  - _Leverage: existing E2E test setup, Playwright configuration_
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 6.3_

### Phase 8: Performance and Fallback Systems

- [x] 18. Add fallback URL management in src/lib/utils/radioFallback.ts
  - File: src/lib/utils/radioFallback.ts (create new)
  - Implement getFallbackUrl() with environment variable priority
  - Add automatic fallback testing and selection logic
  - Include fallback URL rotation for redundancy
  - Purpose: Robust fallback system for stream URL failures
  - _Leverage: src/lib/db/queries/radioSettings.ts getFallbackUrl() patterns_
  - _Requirements: 6.3, 6.4, 7.7_

- [x] 19. Add radio configuration health monitoring in src/lib/utils/radioHealthMonitor.ts
  - File: src/lib/utils/radioHealthMonitor.ts (create new)
  - Create periodic stream URL health checking
  - Add automatic failover to backup URLs on failure
  - Include health status reporting for admin dashboard
  - Purpose: Proactive monitoring and automatic recovery
  - _Leverage: existing stream testing functions, database queries_
  - _Requirements: 4.5, 6.3, 7.7_

- [x] 20. Add radio settings audit logging in src/lib/db/queries/radioSettingsAudit.ts
  - File: src/lib/db/queries/radioSettingsAudit.ts (create new)
  - Create audit trail for all radio configuration changes
  - Add admin user tracking and change reason logging
  - Include rollback capability for configuration changes
  - Purpose: Complete audit trail and change management
  - _Leverage: existing database patterns, admin user context_
  - _Requirements: 6.5, 7.7_