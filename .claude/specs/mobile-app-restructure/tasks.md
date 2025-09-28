# Implementation Plan - Mobile App Restructure

## Task Overview
This implementation leverages 95% of existing infrastructure to transform the complex dynamic content system into three simple static pages. Most components already exist - we only need minor additions for logo upload functionality and verify existing card management works as intended. This is a simplification project that removes complexity rather than adding it.

## Steering Document Compliance
Tasks follow structure.md conventions by reusing existing `/src/app/admin/mobile/` components and `/api/mobile/v1/` endpoints. Design leverages tech.md patterns by maintaining current authentication, caching, and database patterns without changes.

## Atomic Task Requirements
**Each task meets these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Tasks

### Phase 1: Backend Infrastructure (Minimal New Code)

- [x] 1. Test mobile_cards database table functionality
  - File: Create src/test/db/test-mobile-cards.ts
  - Query mobile_cards table for active cards with proper ordering
  - Verify table indexes work for sub-100ms queries
  - Purpose: Confirm database layer works for card operations
  - _Leverage: Existing database connection patterns from src/lib/db/client.ts_
  - _Requirements: 5.1, 5.3, 5.6_

- [x] 2. Test existing mobile cards API endpoint
  - File: Create src/test/api/test-mobile-cards-api.ts
  - Call GET /api/mobile/v1/content/cards and verify JSON response format
  - Test response includes proper MobileCard interface fields
  - Purpose: Confirm cards API works for mobile app consumption
  - _Leverage: Existing API test patterns, MobileCard interface_
  - _Requirements: 3.1, 7.4, 7.7_

- [x] 3. Test existing cards admin interface loads correctly
  - File: Verify src/app/admin/mobile/cards/page.tsx functionality
  - Load admin page and confirm card list displays
  - Test card creation/editing forms work
  - Purpose: Confirm admin interface is functional for card management
  - _Leverage: Existing admin layout, MobileCardForm, MobileCardList components_
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Add playerLogoUrl field to mobile radio config API response
  - File: src/app/api/mobile/v1/radio/route.ts
  - Extend existing radio config response with optional playerLogoUrl field from settings
  - Query mobile_settings table for logo URL, add to JSON response
  - Purpose: Enable mobile app to display custom player logo
  - _Leverage: Existing radio config API, mobile_settings table JSON column_
  - _Requirements: 6.3, 7.1_

- [x] 5. Add logo upload field to existing mobile settings form
  - File: src/components/admin/mobile/MobileSettingsForm.tsx
  - Add single image upload field using existing MediaPickerDialog component
  - Store logo URL in mobile_settings JSON column under 'playerLogoUrl' key
  - Purpose: Allow admin to upload custom player logo through simple interface
  - _Leverage: Existing MediaPickerDialog, MobileSettingsForm, settings save logic_
  - _Requirements: 6.1, 6.2, 6.7_

- [x] 6. Update mobile settings TypeScript interface for logo
  - File: src/types/mobile.ts
  - Add playerLogoUrl?: string field to MobileSettings interface
  - Add playerLogoUrl?: string field to MobileRadioConfig interface
  - Purpose: Provide type safety for new logo functionality
  - _Leverage: Existing mobile.ts type definitions_
  - _Requirements: 6.3_

### Phase 2: Mobile App Documentation and Guidance

- [x] 7. Create polls page implementation guide for mobile app
  - File: ../mobile/docs/static-pages/polls-page-guide.md
  - Document how to consume existing polls API for static polls page
  - Include code examples for handling no active polls scenario
  - Purpose: Guide mobile developers in implementing polls page
  - _Leverage: Existing polls API documentation patterns_
  - _Requirements: 1.1, 1.2_

- [x] 8. Create news page implementation guide for mobile app
  - File: ../mobile/docs/static-pages/news-page-guide.md
  - Document how to consume existing news API with pagination and categories
  - Include code examples for article detail view and image galleries
  - Purpose: Guide mobile developers in implementing news page
  - _Leverage: Existing news API documentation patterns_
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 9. Create sponsorship cards page implementation guide for mobile app
  - File: ../mobile/docs/static-pages/cards-page-guide.md
  - Document how to consume cards API and display cards with modal
  - Include code examples for card tap handling and redirect functionality
  - Purpose: Guide mobile developers in implementing sponsorship cards page
  - _Leverage: Existing cards API patterns_
  - _Requirements: 3.3, 3.4_

- [x] 10. Document radio config API logo field addition
  - File: ../mobile/docs/endpoints/radio-config-api.md
  - Add playerLogoUrl field documentation to radio config endpoint spec
  - Include example JSON response with logo URL field and default handling
  - Purpose: Guide mobile app integration of custom player logo
  - _Leverage: Existing API documentation format_
  - _Requirements: 6.3, 6.4, 7.1_

### Phase 3: Testing and Build Verification

- [x] 11. Test logo upload functionality in admin settings
  - File: Create src/test/admin/test-logo-upload.ts
  - Upload test logo through MediaPickerDialog in settings form
  - Verify logo URL is saved to mobile_settings JSON column
  - Purpose: Confirm admin can successfully upload and save player logo
  - _Leverage: Existing admin interface testing, media upload testing_
  - _Requirements: 6.1, 6.5, 6.6, 6.7_

- [x] 12. Test radio config API returns logo URL correctly
  - File: Create src/test/api/test-radio-config-logo.ts
  - Test API returns logo URL when set in settings
  - Test API returns proper response when no logo is configured
  - Purpose: Ensure mobile app receives logo URL correctly
  - _Leverage: Existing radio config testing patterns_
  - _Requirements: 6.3, 6.4_

### Phase 4: Build and Deployment Verification

- [x] 13. Run TypeScript build and verify no errors
  - File: Run npm run build in webapp directory
  - Check for TypeScript compilation errors after interface changes
  - Verify all existing functionality compiles correctly
  - Purpose: Ensure type safety after mobile.ts interface changes
  - _Leverage: Existing build scripts and TypeScript configuration_
  - _Requirements: 6.3, All type safety requirements_

- [x] 14. Test admin interface accessibility and Turkish language
  - Files: Test src/app/admin/mobile/cards/page.tsx and settings page
  - Verify all interface text remains in Turkish language
  - Test card management interface works on touch devices
  - Purpose: Maintain monkey-proof usability standards
  - _Leverage: Existing Turkish language validation, accessibility testing_
  - _Requirements: 4.5, 6.5, Usability requirements_

### Phase 5: Optional Cleanup (When Ready)

- [x] 15. Document complex dynamic content system for removal
  - File: Create docs/cleanup/dynamic-content-removal-plan.md
  - Identify which components can be safely removed after mobile app update
  - Create backup/migration strategy for any existing dynamic content
  - Purpose: Prepare for future simplification once mobile app is updated
  - _Leverage: Existing content system analysis_
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 16. Create database cleanup migration for dynamic content tables
  - File: Create src/lib/db/migrations/cleanup-dynamic-content.sql
  - Document which tables are safe to remove after mobile app deployment
  - Ensure migration can be safely rolled back if needed
  - Purpose: Complete system simplification once mobile app uses static pages
  - _Leverage: Existing database migration patterns_
  - _Requirements: 8.4, 8.5_

## Implementation Notes

### Monkey-Proof Simplicity Achieved ✅
- **95% code reuse**: Only tasks 4-6 add new functionality (~60 lines total)
- **No breaking changes**: All existing APIs and interfaces preserved
- **Admin interface exists**: Card management already fully functional (tasks 1-3 verify)
- **Database ready**: mobile_cards table and APIs already implemented
- **Comprehensive coverage**: All requirements mapped to specific atomic tasks

### Critical Success Factors
1. **Verify before building**: Tasks 1-3 confirm existing infrastructure works
2. **Minimal new code**: Tasks 4-6 add only essential logo functionality
3. **Mobile app guidance**: Tasks 7-10 provide complete implementation guides
4. **Thorough testing**: Tasks 11-12 ensure quality before deployment
5. **Safe deployment**: Tasks 13-14 prevent regressions

### Mobile App Team Coordination
- Tasks 7-10 provide complete implementation guidance
- No backend changes required for mobile team to start development
- Static pages can be implemented using existing API endpoints
- Logo functionality is additive - mobile app works without it

### Risk Mitigation
- All changes are additive (no breaking changes)
- Existing functionality preserved throughout
- Cleanup tasks (15-16) are optional and can be deferred
- Full build verification ensures deployment safety

This task breakdown achieves maximum simplification with minimal implementation effort - truly monkey-proof! 🐒