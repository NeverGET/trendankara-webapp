# Implementation Plan: Responsive Design System

## Task Overview
Implement a mobile-first responsive design system that transforms the current large UI elements into optimized, touch-friendly components. The implementation will be atomic and incremental, allowing each task to be completed independently while maintaining backward compatibility.

## Steering Document Compliance
- Tasks follow `/src/` component organization from structure.md
- Utilize existing Tailwind CSS v4 configuration approach from tech.md
- Maintain TypeScript patterns and naming conventions
- Preserve RED/BLACK/WHITE color scheme throughout

## Atomic Task Requirements
**Each task meets these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Exact file paths specified
- **Agent-Friendly**: Clear input/output with minimal context switching

## Tasks

### Phase 1: Foundation (Design Tokens)

- [x] 1. Extend Tailwind config with responsive text scale
  - File: `/tailwind.config.ts`
  - Add fontSize scale with mobile-first sizes (14px base, scaling up)
  - Define lineHeight multipliers (1.5 for body text)
  - Add custom text utilities for statistics (text-stat-primary, text-stat-label)
  - _Leverage: existing colors and fontFamily in config_
  - _Requirements: 1.1, 1.2, 1.4, 7.1, 7.3_

- [x] 2. Add spacing scale and touch target definitions to Tailwind
  - File: `/tailwind.config.ts`
  - Define 8px base spacing unit scale
  - Add minHeight utilities for touch targets (min-h-touch-44, min-h-touch-40)
  - Create gap utilities for touch spacing (gap-touch)
  - _Leverage: existing spacing object_
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2_

- [x] 3. Create responsive sizing type definitions
  - File: `/src/types/responsive.ts`
  - Define ResponsiveSize, ResponsiveValue, and Breakpoint interfaces
  - Add SizeToken and ComponentSize types
  - Export size constants (TOUCH_TARGET_STANDARD = 44, etc.)
  - _Leverage: existing types structure_
  - _Requirements: 1.3, 2.1, 9.1_

- [x] 4. Implement responsive utility functions
  - File: `/src/lib/utils/responsive.ts`
  - Create getResponsiveSize() function
  - Add calculateTouchTarget() helper
  - Implement breakpoint detection utilities
  - _Leverage: cn() utility from /src/lib/utils_
  - _Requirements: 1.3, 2.4, 9.1_

### Phase 2: Core Component Updates

- [x] 5. Update Button component with responsive sizing
  - File: `/src/components/ui/Button.tsx`
  - Modify sizeClasses to use responsive height (min-h-[44px] sm:min-h-[40px])
  - Adjust padding for mobile-first approach
  - Ensure loading spinner scales appropriately
  - _Leverage: existing variantClasses and Button structure_
  - _Requirements: 2.1, 2.5, 8.2_

- [x] 6. Enhance Input component for touch optimization
  - File: `/src/components/ui/Input.tsx`
  - Set minimum height to 44px on all devices
  - Adjust font size for mobile (min 16px to prevent zoom)
  - Update padding for comfortable touch interaction
  - _Leverage: existing Input component props_
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 7. Update Card component responsive padding
  - File: `/src/components/ui/Card.tsx`
  - Change padding to responsive (p-4 md:p-6)
  - Add mobile-optimized shadow variations
  - Ensure nested padding follows hierarchy
  - _Leverage: existing Card variants_
  - _Requirements: 4.1, 4.2, 4.5, 6.1_

- [x] 8. Optimize Modal component for mobile fullscreen
  - File: `/src/components/ui/Modal.tsx`
  - Update sizeClasses with mobile-first breakpoints
  - Add fullscreen mobile variant with proper margins (16px)
  - Adjust close button for touch targets
  - _Leverage: existing sizeClasses object_
  - _Requirements: 6.5, 2.1_

### Phase 3: Navigation & Layout Components

- [x] 9. Update Header component with responsive height constraints
  - File: `/src/components/common/Header.tsx`
  - Limit height to max-h-14 (56px) on mobile
  - Set max-h-[72px] for desktop
  - Scale logo responsively
  - _Leverage: existing Header structure and MobileNavigation_
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 10. Enhance AdminSidebar responsive behavior
  - File: `/src/components/admin/AdminSidebar.tsx`
  - Set max width to 240px on desktop
  - Update icon sizes responsively (w-4 h-4 md:w-5 md:h-5)
  - Ensure mobile overlay works with new spacing
  - _Leverage: existing mobile toggle functionality_
  - _Requirements: 5.5, 3.4_

- [x] 11. Create ResponsiveGrid layout component
  - File: `/src/components/layout/ResponsiveGrid.tsx`
  - Implement grid with mobile-first column definitions
  - Add responsive gap utilities
  - Support admin dashboard 2-column tablet layout
  - _Leverage: Tailwind grid utilities_
  - _Requirements: 3.1, 3.2_

- [x] 12. Update MobileNavigation touch targets
  - File: `/src/components/common/MobileNavigation.tsx`
  - Ensure all nav items meet 44px minimum height
  - Add proper spacing between items (gap-2)
  - Update close button size for easy tapping
  - _Leverage: existing navigation structure_
  - _Requirements: 2.1, 2.3, 5.4_

### Phase 4: Statistics & Data Components

- [x] 13. Transform StatsCard with prominent number display
  - File: `/src/components/admin/StatsCard.tsx`
  - Update value text size to text-2xl md:text-4xl
  - Change label to uppercase text-xs
  - Adjust card padding responsively
  - _Leverage: existing StatsCard structure and animations_
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [x] 14. Update Badge component for touch optimization
  - File: `/src/components/ui/Badge.tsx`
  - Adjust sizeClasses for better touch targets
  - Ensure minimum clickable area when interactive
  - Update text sizes for mobile readability
  - _Leverage: existing variantClasses_
  - _Requirements: 2.1, 1.1_

- [x] 15. Optimize admin dashboard page layout
  - File: `/src/app/admin/page.tsx`
  - Implement responsive grid (1 col mobile, 2 col tablet, 3-4 col desktop)
  - Update spacing between dashboard cards
  - Ensure statistics display prominently
  - _Leverage: ResponsiveGrid component from task 11_
  - _Requirements: 3.1, 3.2, 3.3_

### Phase 5: Content Components

- [x] 16. Update NewsCard responsive layout
  - File: `/src/components/news/NewsCard.tsx`
  - Set full width on mobile with px-4 container padding
  - Ensure images maintain aspect ratio
  - Update text sizes for mobile readability
  - _Leverage: existing NewsCard props and structure_
  - _Requirements: 6.1, 6.2, 1.1_

- [x] 17. Optimize NewsCarousel for single-item mobile
  - File: `/src/components/news/NewsCarousel.tsx`
  - Show single item on mobile with swipe navigation
  - Update carousel controls for touch interaction
  - Adjust spacing between items
  - _Leverage: existing carousel logic_
  - _Requirements: 6.4, 2.1_

- [x] 18. Enhance PollCard touch interactions
  - File: `/src/components/polls/PollCard.tsx`
  - Increase voting button sizes for easy tapping
  - Update option spacing for touch targets
  - Ensure results display clearly on mobile
  - _Leverage: existing PollCard voting logic_
  - _Requirements: 6.3, 2.1, 2.3_

- [x] 19. Update PollResults responsive display
  - File: `/src/components/polls/PollResults.tsx`
  - Optimize bar chart for mobile viewing
  - Update text sizes for statistics
  - Ensure percentage labels are prominent
  - _Leverage: existing results calculation logic_
  - _Requirements: 7.1, 7.2, 7.4_

### Phase 6: Form Components

- [ ] 20. Update NewsForm with responsive inputs
  - File: `/src/components/admin/NewsForm.tsx`
  - Apply 44px minimum height to all inputs
  - Use single column layout on mobile
  - Update button sizes for touch
  - _Leverage: enhanced Input and Button components_
  - _Requirements: 8.1, 8.5, 2.1_

- [ ] 21. Optimize RadioSettingsForm for mobile
  - File: `/src/components/admin/RadioSettingsForm.tsx`
  - Update form layout for mobile screens
  - Ensure inputs meet touch requirements
  - Adjust label spacing and sizes
  - _Leverage: responsive Input component_
  - _Requirements: 8.1, 8.3, 8.4_

- [x] 22. Create responsive table wrapper component
  - File: `/src/components/ui/ResponsiveTable.tsx`
  - Add horizontal scroll for mobile
  - Implement sticky first column option
  - Ensure touch-friendly row heights
  - _Leverage: existing table patterns in admin_
  - _Requirements: 3.5, 2.1_

### Phase 7: Migration & Compatibility

- [x] 23. Create migration compatibility utilities
  - File: `/src/lib/utils/migration.ts`
  - Implement mapLegacySize() function
  - Add warnDeprecatedSizing() helper
  - Create size conversion mappings
  - _Leverage: existing component prop types_
  - _Requirements: 9.1, 9.2, 9.5_

- [x] 24. Add development-only size validation
  - File: `/src/lib/utils/sizeValidator.ts`
  - Create validation for hardcoded pixel values
  - Add WCAG touch target compliance checks
  - Implement console warnings for development
  - _Leverage: existing dev tools patterns_
  - _Requirements: 2.1, 9.2_

- [x] 25. Update RadioPlayer with size preservation
  - File: `/src/components/radio/RadioPlayer.tsx`
  - Apply responsive sizing to controls
  - Ensure audio functionality unchanged
  - Update visual elements only
  - _Leverage: existing RadioPlayer audio logic_
  - _Requirements: 9.3, 9.4_

### Phase 8: Polish & Documentation

- [x] 26. Add CSS custom properties for runtime values
  - File: `/src/app/globals.css`
  - Define CSS variables for touch targets, headers
  - Add responsive font size variables
  - Include spacing unit variables
  - _Leverage: existing global styles_
  - _Requirements: 1.1, 2.1, 5.1_

- [x] 27. Create useResponsiveSize custom hook
  - File: `/src/hooks/useResponsiveSize.ts`
  - Implement breakpoint detection hook
  - Add size calculation logic
  - Provide responsive size utilities
  - _Leverage: existing hooks patterns_
  - _Requirements: 1.3, 9.1_

- [x] 28. Update Footer with responsive spacing
  - File: `/src/components/common/Footer.tsx`
  - Apply responsive padding
  - Update text sizes for mobile
  - Ensure links meet touch targets
  - _Leverage: existing Footer structure_
  - _Requirements: 4.1, 2.1, 1.1_

- [x] 29. Final responsive adjustments for VoteModal
  - File: `/src/components/polls/VoteModal.tsx`
  - Update modal size for mobile
  - Ensure vote buttons are touch-friendly
  - Adjust spacing and padding
  - _Leverage: enhanced Modal component_
  - _Requirements: 6.5, 2.1, 6.3_

- [x] 30. Add responsive loading states
  - File: `/src/components/ui/LoadingSpinner.tsx`
  - Create size variants for loading indicators
  - Ensure visibility on all screen sizes
  - Add responsive animations
  - _Leverage: existing LoadingSpinner_
  - _Requirements: 1.1, 1.3_