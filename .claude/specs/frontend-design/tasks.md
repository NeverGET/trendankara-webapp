# Implementation Plan - Frontend Design Tasks

## Task Overview
This implementation plan breaks down the frontend design system into atomic, executable tasks. Each task is designed to be completed in 15-30 minutes by an AI agent or developer, touching 1-3 related files with a single, testable outcome. Tasks are organized by component groups and follow a logical dependency order.

## Steering Document Compliance
All tasks follow the established project structure from structure.md, leverage existing utilities from tech.md patterns, and maintain the component organization defined in the design document. Each task specifies exact file locations and existing code to reuse.

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
- "Implement authentication system" (affects many files, multiple purposes)
- "Add user management features" (vague scope, no file specification)
- "Build complete dashboard" (too large, multiple components)

✅ **Good Examples (Atomic)**:
- "Create User model in models/user.py with email/password fields"
- "Add password hashing utility in utils/auth.py using bcrypt"
- "Create LoginForm component in components/LoginForm.tsx with email/password inputs"

## Tasks

### Phase 1: Foundation Components (UI Primitives)

- [ ] 1. Create Button component with variant and size props in src/components/ui/Button.tsx
  - File: src/components/ui/Button.tsx
  - Define ButtonProps interface with variant, size, loading, disabled props
  - Implement Tailwind classes for primary, secondary, danger, ghost variants
  - Add size classes: small (40px), medium (48px), large (56px), giant (72px)
  - Purpose: Base interactive element for all buttons
  - _Leverage: tailwind.config.ts (brand colors, animations)_
  - _Requirements: 1.1, 1.3, 1.4_

- [ ] 2. Create Button component tests in src/components/ui/__tests__/Button.test.tsx
  - File: src/components/ui/__tests__/Button.test.tsx
  - Test all variant renders with correct classes
  - Test loading and disabled states
  - Test onClick handler execution
  - Purpose: Ensure Button component reliability
  - _Leverage: existing jest configuration_
  - _Requirements: 1.5_

- [ ] 3. Create Card component for content containers in src/components/ui/Card.tsx
  - File: src/components/ui/Card.tsx
  - Define CardProps with optional title, footer, className props
  - Apply dark surface colors from Tailwind config
  - Add hover state with subtle elevation change
  - Purpose: Reusable container for news, polls, and other content
  - _Leverage: tailwind.config.ts (dark.surface colors)_
  - _Requirements: 1.1, 6.5_

- [ ] 4. Create Modal component with portal rendering in src/components/ui/Modal.tsx
  - File: src/components/ui/Modal.tsx
  - Define ModalProps with isOpen, onClose, title, size props
  - Implement React Portal for overlay rendering
  - Add ESC key handler and click-outside-to-close
  - Purpose: Overlay container for news articles and popups
  - _Leverage: React.createPortal, dark theme colors_
  - _Requirements: 1.1, 3.2, 4.1_

- [ ] 5. Create Input component with validation states in src/components/ui/Input.tsx
  - File: src/components/ui/Input.tsx
  - Define InputProps with error, label, required props
  - Style with dark theme borders and focus states
  - Add Turkish error message display below field
  - Purpose: Form input field with consistent styling
  - _Leverage: tailwind.config.ts (dark.border colors)_
  - _Requirements: 1.6, 10.5_

- [ ] 6. Create LoadingSpinner component in src/components/ui/LoadingSpinner.tsx
  - File: src/components/ui/LoadingSpinner.tsx
  - Implement animated spinner with brand red color
  - Add size variants: small, medium, large
  - Include optional loading text in Turkish
  - Purpose: Consistent loading indicator across app
  - _Leverage: tailwind animations (animate-spin)_
  - _Requirements: 1.4, 2.3_

### Phase 2: Layout Components

- [ ] 7. Create Header component with navigation in src/components/common/Header.tsx
  - File: src/components/common/Header.tsx
  - Implement logo display and 3-item navigation limit
  - Add responsive hamburger menu for mobile
  - Style with dark background and red accents
  - Purpose: Site header with navigation
  - _Leverage: existing Layout.tsx patterns, brand colors_
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 8. Create MobileNavigation drawer structure in src/components/common/MobileNavigation.tsx
  - File: src/components/common/MobileNavigation.tsx
  - Create basic slide-in drawer component
  - Style with translateX animations
  - Add navigation links list
  - Purpose: Mobile navigation drawer base
  - _Leverage: dark theme colors from Tailwind_
  - _Requirements: 5.2, 7.1_

- [ ] 9. Add backdrop overlay to MobileNavigation in src/components/common/MobileNavigation.tsx
  - File: src/components/common/MobileNavigation.tsx (modify)
  - Add semi-transparent backdrop div
  - Implement click-outside-to-close handler
  - Include fade-in animation
  - Purpose: Backdrop for mobile drawer
  - _Leverage: Modal component overlay pattern_
  - _Requirements: 5.5_

- [ ] 10. Implement swipe gestures for MobileNavigation in src/components/common/MobileNavigation.tsx
  - File: src/components/common/MobileNavigation.tsx (modify)
  - Add touch event handlers
  - Calculate swipe direction and distance
  - Trigger close on right swipe
  - Purpose: Touch gesture support
  - _Leverage: React touch events_
  - _Requirements: 5.5_

- [ ] 11. Create Footer component in src/components/common/Footer.tsx
  - File: src/components/common/Footer.tsx
  - Add contact info, social links sections
  - Style with dark theme surface colors
  - Make responsive for mobile/tablet/desktop
  - Purpose: Site footer with station information
  - _Leverage: dark.surface colors from Tailwind_
  - _Requirements: 1.1, 7.1_

- [ ] 12. Update root layout with dark mode class in src/app/layout.tsx
  - File: src/app/layout.tsx (modify existing)
  - Add 'dark' class to html element
  - Import and apply Inter font family
  - Set background to dark.bg.primary
  - Purpose: Enable dark mode globally
  - _Leverage: existing layout structure_
  - _Requirements: 6.1, 6.2_

### Phase 3: Radio Player Implementation

- [ ] 13. Create RadioPlayerContext with state management in src/components/radio/RadioPlayerContext.tsx
  - File: src/components/radio/RadioPlayerContext.tsx
  - Define RadioPlayerContextValue interface
  - Implement play, pause, setVolume actions
  - Add connection status tracking
  - Purpose: Global state for radio player
  - _Leverage: React.createContext, React.useContext_
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 14. Create useRadioPlayer hook in src/hooks/useRadioPlayer.ts
  - File: src/hooks/useRadioPlayer.ts (modify existing)
  - Connect to RadioPlayerContext
  - Add localStorage for volume persistence
  - Implement reconnection logic with exponential backoff
  - Purpose: Radio player state access hook
  - _Leverage: existing hook file, localStorage API_
  - _Requirements: 2.3, 2.4_

- [ ] 15. Create IOSAudioManager class structure in src/lib/utils/iosAudioManager.ts
  - File: src/lib/utils/iosAudioManager.ts
  - Define IOSAudioManager class with properties
  - Add audioContext and audioElement properties
  - Implement constructor with reset counter
  - Purpose: iOS audio manager foundation
  - _Leverage: src/lib/utils/iosDetection.ts_
  - _Requirements: 2.5_

- [ ] 16. Implement nuclear reset method in IOSAudioManager
  - File: src/lib/utils/iosAudioManager.ts (modify)
  - Destroy audio element and context completely
  - Wait 100ms for cleanup
  - Recreate with cache-busted URL using timestamp
  - Purpose: iOS audio reset implementation
  - _Leverage: AudioContext API_
  - _Requirements: 2.5_

- [ ] 17. Create RadioPlayer component structure in src/components/radio/RadioPlayer.tsx
  - File: src/components/radio/RadioPlayer.tsx (modify existing)
  - Define component layout with flex container
  - Add play/pause button (60px minimum size)
  - Connect to useRadioPlayer hook
  - Purpose: Basic radio player UI
  - _Leverage: Button component, useRadioPlayer hook_
  - _Requirements: 2.1, 2.6_

- [ ] 18. Add volume control to RadioPlayer in src/components/radio/RadioPlayer.tsx
  - File: src/components/radio/RadioPlayer.tsx (modify)
  - Create volume slider input element
  - Connect to setVolume action
  - Style with brand colors
  - Purpose: Volume control implementation
  - _Leverage: RadioPlayerContext_
  - _Requirements: 2.1_

- [ ] 19. Add metadata display to RadioPlayer in src/components/radio/RadioPlayer.tsx
  - File: src/components/radio/RadioPlayer.tsx (modify)
  - Display current song from context
  - Add text truncation for long titles
  - Include loading state text
  - Purpose: Song metadata display
  - _Leverage: useRadioPlayer hook_
  - _Requirements: 2.7_

- [ ] 20. Create PlayerControls component in src/components/radio/PlayerControls.tsx
  - File: src/components/radio/PlayerControls.tsx (modify existing)
  - Implement play/pause toggle logic
  - Add loading state during connection
  - Show connection status indicator
  - Purpose: Radio control buttons
  - _Leverage: RadioPlayerContext, Button component_
  - _Requirements: 2.3, 2.4_

- [ ] 21. Add RadioPlayer to Header for desktop in src/components/common/Header.tsx
  - File: src/components/common/Header.tsx (modify)
  - Import and embed RadioPlayer component
  - Show only on desktop (hidden sm:block)
  - Position in header right section
  - Purpose: Desktop radio player placement
  - _Leverage: RadioPlayer component_
  - _Requirements: 2.1, 7.1_

- [ ] 22. Create BottomRadioPlayer for mobile in src/components/radio/BottomRadioPlayer.tsx
  - File: src/components/radio/BottomRadioPlayer.tsx
  - Implement fixed bottom bar (80px height)
  - Add horizontal layout for controls
  - Include song info with truncation
  - Purpose: Mobile radio player bar
  - _Leverage: RadioPlayer components, useRadioPlayer_
  - _Requirements: 2.6, 7.1_

### Phase 4: News Components

- [ ] 23. Define news TypeScript interfaces in src/types/news.ts
  - File: src/types/news.ts
  - Create NewsArticle, NewsCategory interfaces
  - Add MediaFile type for images
  - Define API response types
  - Purpose: Type safety for news data
  - _Leverage: existing types/index.ts patterns_
  - _Requirements: 3.1, 3.4_

- [ ] 24. Create NewsCard component in src/components/news/NewsCard.tsx
  - File: src/components/news/NewsCard.tsx (modify existing)
  - Implement 16:9 image ratio with Next/Image
  - Add category badge with colors
  - Show hot/breaking indicators
  - Purpose: Individual news article card
  - _Leverage: Card component, Next/Image_
  - _Requirements: 3.4, 3.5, 3.6_

- [ ] 25. Add NewsCard hover and click handlers in src/components/news/NewsCard.tsx
  - File: src/components/news/NewsCard.tsx (continue)
  - Implement scale(1.02) hover effect
  - Add onClick handler for modal trigger
  - Include ripple effect for mobile touch
  - Purpose: News card interactions
  - _Leverage: Tailwind hover utilities_
  - _Requirements: 3.2, 1.4_

- [ ] 26. Create NewsModal for article display in src/components/news/NewsModal.tsx
  - File: src/components/news/NewsModal.tsx (modify existing)
  - Use Modal component as base
  - Render article content with HTML sanitization
  - Add image gallery if multiple images
  - Purpose: Full article reader modal
  - _Leverage: Modal component, DOMPurify_
  - _Requirements: 3.2_

- [ ] 27. Create NewsCarousel structure in src/components/news/NewsCarousel.tsx
  - File: src/components/news/NewsCarousel.tsx (modify existing)
  - Build basic carousel container
  - Add slide wrapper with overflow hidden
  - Create navigation buttons
  - Purpose: Carousel foundation
  - _Leverage: NewsCard component_
  - _Requirements: 3.1_

- [ ] 28. Add slide transitions to NewsCarousel in src/components/news/NewsCarousel.tsx
  - File: src/components/news/NewsCarousel.tsx (modify)
  - Implement slide transition logic
  - Add transform translateX animations
  - Handle active slide state
  - Purpose: Carousel slide animations
  - _Leverage: React useState, Tailwind transitions_
  - _Requirements: 3.1_

- [ ] 29. Add touch support to NewsCarousel in src/components/news/NewsCarousel.tsx
  - File: src/components/news/NewsCarousel.tsx (modify)
  - Implement touch start/move/end handlers
  - Calculate swipe direction
  - Trigger slide change on swipe
  - Purpose: Mobile touch gestures
  - _Leverage: React touch events_
  - _Requirements: 3.1_

- [ ] 30. Add auto-play to NewsCarousel in src/components/news/NewsCarousel.tsx
  - File: src/components/news/NewsCarousel.tsx (modify)
  - Implement auto-advance timer
  - Pause on hover/focus
  - Resume on mouse leave
  - Purpose: Automatic slide rotation
  - _Leverage: useEffect, setInterval_
  - _Requirements: 3.1_

- [ ] 31. Create NewsGrid component in src/components/news/NewsGrid.tsx
  - File: src/components/news/NewsGrid.tsx
  - Implement responsive grid (1/2/3 columns)
  - Add lazy loading with Intersection Observer
  - Include loading skeleton states
  - Purpose: News listing grid layout
  - _Leverage: NewsCard, LoadingSpinner_
  - _Requirements: 3.3, 3.7, 7.1_

### Phase 5: Polling Components

- [ ] 32. Define poll TypeScript interfaces in src/types/polls.ts
  - File: src/types/polls.ts
  - Create Poll, PollOption, PollVote interfaces
  - Add vote submission types
  - Define API response formats
  - Purpose: Type safety for poll data
  - _Leverage: existing types structure_
  - _Requirements: 4.1, 4.2_

- [ ] 33. Create PollCard component structure in src/components/polls/PollCard.tsx
  - File: src/components/polls/PollCard.tsx (modify existing)
  - Build question display with title
  - List options with radio buttons
  - Add 60px thumbnail images
  - Purpose: Poll voting interface
  - _Leverage: Card component, Input component_
  - _Requirements: 4.2, 4.5, 4.7_

- [ ] 34. Implement PollCard voting logic in src/components/polls/PollCard.tsx
  - File: src/components/polls/PollCard.tsx (continue)
  - Add option selection handler
  - Enable vote button on selection
  - Store pending vote in localStorage
  - Purpose: Poll interaction logic
  - _Leverage: localStorage API_
  - _Requirements: 4.2, 4.3_

- [ ] 35. Create VoteModal for poll popup in src/components/polls/VoteModal.tsx
  - File: src/components/polls/VoteModal.tsx (modify existing)
  - Use Modal component as base
  - Display poll with larger layout
  - Add vote submission handler
  - Purpose: Homepage poll popup
  - _Leverage: Modal, PollCard components_
  - _Requirements: 4.1_

- [ ] 36. Create PollResults component in src/components/polls/PollResults.tsx
  - File: src/components/polls/PollResults.tsx (modify existing)
  - Display percentage bars with animation
  - Show vote counts and percentages
  - Style with brand colors
  - Purpose: Poll results visualization
  - _Leverage: Tailwind animations_
  - _Requirements: 4.3, 4.4, 4.6_

- [ ] 37. Create poll API client functions in src/lib/api/polls.ts
  - File: src/lib/api/polls.ts
  - Implement getActivePolls async function
  - Return typed Poll array from /api/polls/active
  - Add try-catch with error logging
  - Purpose: Fetch active polls
  - _Leverage: existing /api/polls endpoints, logger_
  - _Requirements: 4.1_

- [ ] 38. Add vote submission to poll API client in src/lib/api/polls.ts
  - File: src/lib/api/polls.ts (modify)
  - Create submitVote function with pollId, optionId params
  - Include device fingerprinting in request body
  - Handle success/error responses
  - Purpose: Submit poll votes
  - _Leverage: /api/polls/vote endpoint_
  - _Requirements: 4.2, 4.3_

### Phase 6: Admin Components

- [ ] 39. Create AdminLayout component in src/app/admin/layout.tsx
  - File: src/app/admin/layout.tsx (modify existing)
  - Add sidebar navigation for desktop
  - Implement collapsible menu for mobile
  - Include user info display
  - Purpose: Admin panel layout wrapper
  - _Leverage: existing layout patterns_
  - _Requirements: 10.1, 10.2, 10.6_

- [ ] 40. Create AdminSidebar component in src/components/admin/AdminSidebar.tsx
  - File: src/components/admin/AdminSidebar.tsx
  - Build navigation menu with icons
  - Add active route highlighting
  - Style with dark theme colors
  - Purpose: Admin navigation sidebar
  - _Leverage: Link component from Next.js_
  - _Requirements: 10.2_

- [ ] 41. Create DataTable structure in src/components/admin/DataTable.tsx
  - File: src/components/admin/DataTable.tsx
  - Define DataTableProps with generic type
  - Create table element with headers
  - Map data rows to table rows
  - Purpose: Basic data table structure
  - _Leverage: dark theme colors_
  - _Requirements: 10.3_

- [ ] 42. Add sorting to DataTable in src/components/admin/DataTable.tsx
  - File: src/components/admin/DataTable.tsx (modify)
  - Add sortable column headers with icons
  - Implement sort state management
  - Handle sort direction toggle
  - Purpose: Column sorting functionality
  - _Leverage: React useState_
  - _Requirements: 10.3_

- [ ] 43. Add pagination to DataTable in src/components/admin/DataTable.tsx
  - File: src/components/admin/DataTable.tsx (modify)
  - Add pagination controls component
  - Calculate page numbers and ranges
  - Handle page change events
  - Purpose: Table pagination
  - _Leverage: usePagination hook_
  - _Requirements: 10.3_

- [ ] 44. Add row selection to DataTable in src/components/admin/DataTable.tsx
  - File: src/components/admin/DataTable.tsx (modify)
  - Add checkbox column for selection
  - Implement select all functionality
  - Track selected row IDs
  - Purpose: Row selection feature
  - _Leverage: Input component_
  - _Requirements: 10.3_

- [ ] 45. Create MediaUpload component in src/components/media/MediaUpload.tsx
  - File: src/components/media/MediaUpload.tsx
  - Build drag-and-drop zone
  - Add file type validation
  - Show upload progress bar
  - Purpose: Media file upload interface
  - _Leverage: src/lib/storage/upload.ts_
  - _Requirements: 10.4_

- [ ] 46. Update MediaManager with upload dialog in src/components/media/MediaManager.tsx
  - File: src/components/media/MediaManager.tsx (modify existing)
  - Import MediaUpload component
  - Add modal for upload interface
  - Include uploaded files grid view
  - Purpose: Complete media management
  - _Leverage: Modal, MediaUpload components_
  - _Requirements: 10.4_

- [ ] 47. Create MediaPicker dialog component in src/components/media/MediaPicker.tsx
  - File: src/components/media/MediaPicker.tsx (modify existing)
  - Build searchable media grid
  - Add selection handling
  - Include preview on hover
  - Purpose: Media selection interface
  - _Leverage: Modal component, /api/media endpoint_
  - _Requirements: 10.4_

### Phase 7: Page Implementations

- [ ] 48. Update homepage with components in src/app/(public)/page.tsx
  - File: src/app/(public)/page.tsx (modify existing)
  - Add HeroSection with giant play button
  - Import NewsCarousel for featured news
  - Include NewsGrid for recent articles
  - Purpose: Complete homepage layout
  - _Leverage: NewsCarousel, NewsGrid, RadioPlayer_
  - _Requirements: 2.1, 3.1, 3.7, 4.1_

- [ ] 49. Implement news listing page in src/app/(public)/news/page.tsx
  - File: src/app/(public)/news/page.tsx (modify existing)
  - Add category filter buttons
  - Implement NewsGrid with pagination
  - Include loading states
  - Purpose: News browse page
  - _Leverage: NewsGrid, Button components_
  - _Requirements: 3.7, 1.1_

- [ ] 50. Implement polls page in src/app/(public)/polls/page.tsx
  - File: src/app/(public)/polls/page.tsx (modify existing)
  - Display active poll prominently
  - Show past polls with results
  - Add responsive layout
  - Purpose: Polls listing page
  - _Leverage: PollCard, PollResults components_
  - _Requirements: 4.1, 4.4, 4.6_

### Phase 8: Responsive & Accessibility

- [ ] 51. Add responsive utilities in src/lib/hooks/useMediaQuery.ts
  - File: src/lib/hooks/useMediaQuery.ts
  - Create useMediaQuery hook
  - Define breakpoint constants
  - Add SSR-safe implementation
  - Purpose: Responsive behavior detection
  - _Leverage: window.matchMedia API_
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 52. Implement keyboard navigation in Modal component
  - File: src/components/ui/Modal.tsx (modify)
  - Add focus trap implementation
  - Handle Tab key cycling
  - Restore focus on close
  - Purpose: Accessibility for modals
  - _Leverage: React.useRef, useEffect_
  - _Requirements: 9.1, 9.2_

- [ ] 53. Add ARIA labels to Button and Input components
  - File: src/components/ui/Button.tsx, src/components/ui/Input.tsx
  - Add Turkish aria-label attributes
  - Include role="button" where needed
  - Add disabled aria state
  - Purpose: Screen reader support for UI primitives
  - _Leverage: Component props_
  - _Requirements: 9.3_

- [ ] 54. Add ARIA labels to RadioPlayer components
  - File: src/components/radio/RadioPlayer.tsx, src/components/radio/PlayerControls.tsx
  - Add aria-label for play/pause button
  - Label volume slider with Turkish text
  - Add aria-live for song updates
  - Purpose: Radio player accessibility
  - _Leverage: RadioPlayerContext state_
  - _Requirements: 9.3, 9.4_

- [ ] 55. Add ARIA labels to News and Poll components
  - File: src/components/news/NewsCard.tsx, src/components/polls/PollCard.tsx
  - Add article role for news cards
  - Label poll options clearly
  - Include aria-describedby for results
  - Purpose: Content component accessibility
  - _Leverage: Component props_
  - _Requirements: 9.3, 9.4_

- [ ] 56. Create SkipToContent component in src/components/a11y/SkipToContent.tsx
  - File: src/components/a11y/SkipToContent.tsx
  - Build skip navigation link
  - Style as visually hidden until focused
  - Add to root layout
  - Purpose: Keyboard navigation enhancement
  - _Leverage: Tailwind sr-only utilities_
  - _Requirements: 9.1_

### Phase 9: Performance Optimization

- [ ] 57. Add prefers-reduced-motion support in src/app/globals.css
  - File: src/app/globals.css (modify)
  - Add @media (prefers-reduced-motion: reduce) query
  - Set animation-duration to 0.01ms
  - Set transition-duration to 0.01ms
  - Purpose: Respect user motion preferences
  - _Leverage: existing globals.css_
  - _Requirements: 9.5_

- [ ] 58. Configure webpack bundle optimization in next.config.mjs
  - File: next.config.mjs (modify)
  - Configure splitChunks for vendor bundles
  - Set chunk size limits to 100KB
  - Enable tree shaking for Tailwind
  - Purpose: Optimize JavaScript bundle size
  - _Leverage: Next.js webpack config_
  - _Requirements: 8.3_

- [ ] 59. Add LCP measurement utility in src/lib/utils/performance.ts
  - File: src/lib/utils/performance.ts
  - Create measureLCP function
  - Use PerformanceObserver API
  - Log results to console in dev
  - Purpose: Monitor Largest Contentful Paint
  - _Leverage: Web Performance API_
  - _Requirements: 8.1_

- [ ] 60. Add FID measurement utility in src/lib/utils/performance.ts
  - File: src/lib/utils/performance.ts (modify)
  - Create measureFID function
  - Track first user interaction delay
  - Report if exceeds 100ms threshold
  - Purpose: Monitor First Input Delay
  - _Leverage: PerformanceObserver API_
  - _Requirements: 8.4_

- [ ] 61. Implement lazy loading for routes in src/app/(public)/layout.tsx
  - File: src/app/(public)/layout.tsx (modify existing)
  - Add React.lazy for heavy components
  - Implement Suspense boundaries
  - Add loading fallbacks
  - Purpose: Code splitting for performance
  - _Leverage: React.lazy, React.Suspense_
  - _Requirements: 8.6_

- [ ] 62. Add image optimization in NewsCard component
  - File: src/components/news/NewsCard.tsx (modify)
  - Configure Next/Image sizes prop
  - Add blur placeholder generation
  - Implement lazy loading
  - Purpose: Optimize image loading
  - _Leverage: Next/Image component_
  - _Requirements: 8.2, 8.5_

- [ ] 63. Create useIntersectionObserver hook in src/hooks/useIntersectionObserver.ts
  - File: src/hooks/useIntersectionObserver.ts
  - Implement Intersection Observer wrapper
  - Set threshold to 0.1, margin to 200px
  - Include cleanup on unmount
  - Purpose: Lazy loading support
  - _Leverage: Intersection Observer API_
  - _Requirements: 8.2_

### Phase 10: Error Handling & Polish

- [ ] 64. Create ErrorBoundary component in src/components/ErrorBoundary.tsx
  - File: src/components/ErrorBoundary.tsx
  - Implement React Error Boundary
  - Add Turkish error messages
  - Include retry functionality
  - Purpose: Graceful error handling
  - _Leverage: React.Component.getDerivedStateFromError_
  - _Requirements: 1.6_

- [ ] 65. Add error states to RadioPlayer component
  - File: src/components/radio/RadioPlayer.tsx (modify)
  - Display connection error message
  - Add retry button on failure
  - Show reconnection attempts
  - Purpose: Radio error handling
  - _Leverage: existing RadioPlayer, logger utility_
  - _Requirements: 2.4_

- [ ] 66. Create form validation for news forms in src/components/admin/forms/NewsForm.tsx
  - File: src/components/admin/forms/NewsForm.tsx
  - Add title required validation
  - Validate content minimum length
  - Display Turkish error messages
  - Purpose: News form validation
  - _Leverage: src/lib/utils/validation.ts_
  - _Requirements: 10.5, 1.6_

- [ ] 67. Create form validation for poll forms in src/components/admin/forms/PollForm.tsx
  - File: src/components/admin/forms/PollForm.tsx
  - Validate question required field
  - Check minimum 2 options
  - Validate date range logic
  - Purpose: Poll form validation
  - _Leverage: src/lib/utils/validation.ts_
  - _Requirements: 10.5, 1.6_

- [ ] 68. Add loading skeletons for NewsGrid
  - File: src/components/news/NewsGridSkeleton.tsx
  - Create skeleton card components
  - Match NewsCard dimensions
  - Add shimmer animation
  - Purpose: Loading state improvement
  - _Leverage: Tailwind animations_
  - _Requirements: 1.4, 3.5_

- [ ] 69. Implement 404 and error pages
  - File: src/app/not-found.tsx, src/app/error.tsx
  - Create custom 404 page with navigation
  - Add error page with reload option
  - Style with dark theme
  - Purpose: Error page handling
  - _Leverage: Button component, dark theme_
  - _Requirements: 1.1, 6.1_

- [ ] 70. Add mobile responsiveness to admin panel in src/app/admin/layout.tsx
  - File: src/app/admin/layout.tsx (modify)
  - Hide sidebar on mobile by default
  - Add hamburger menu toggle
  - Make tables horizontally scrollable
  - Purpose: Admin mobile support
  - _Leverage: useMediaQuery hook_
  - _Requirements: 10.6_
  - File: src/app/not-found.tsx, src/app/error.tsx
  - Create custom 404 page with navigation
  - Add error page with reload option
  - Style with dark theme
  - Purpose: Error page handling
  - _Leverage: Button component, dark theme_
  - _Requirements: 1.1, 6.1_