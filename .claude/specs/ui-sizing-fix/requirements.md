# Requirements Document: UI Sizing Fix

## Introduction

This feature aims to establish consistent, compact sizing rules across all UI components in the admin panel. The current implementation has inconsistent padding, margin, and component sizes which creates a disorganized appearance. This specification will standardize all UI elements to use the compact button sizing pattern from PollScheduler as the baseline, ensuring a professional, space-efficient interface that works well on both desktop and mobile devices.

## Alignment with Product Vision

This feature directly supports the product's core motto: "Keep it basic, don't overcomplicate anything". By establishing consistent, compact sizing rules:
- Simplifies the visual hierarchy and reduces cognitive load for administrators
- Improves content density allowing more information on screen without scrolling
- Ensures professional appearance matching the RED/BLACK/WHITE brand aesthetic
- Optimizes for mobile usage with slightly larger touch targets on smaller screens

## Requirements

### Requirement 1: Establish Compact Sizing Standards

**User Story:** As an administrator, I want consistent, compact UI elements, so that I can see more content on screen and navigate efficiently.

#### Acceptance Criteria

1. WHEN viewing any button in the admin panel THEN it SHALL use the compact sizing: `px-3 py-1 text-xs` on desktop
2. WHEN viewing any button on mobile THEN it SHALL be slightly larger for touch: `px-3.5 py-1.5 text-sm`
3. WHEN any component has borders THEN it SHALL use `border-dark-border-secondary` for subtle visibility
4. IF a button lacks an outline THEN it SHALL have a dark shade background for visibility
5. WHEN icons are displayed with text THEN they SHALL maintain minimum size of `w-4 h-4` regardless of text size

### Requirement 2: Standardize Input and Form Elements

**User Story:** As an administrator, I want form elements to have consistent, compact sizing, so that forms don't take excessive vertical space.

#### Acceptance Criteria

1. WHEN viewing input fields THEN they SHALL use compact padding: `px-3 py-1.5` on desktop
2. WHEN viewing labels THEN they SHALL use `text-xs font-medium` with minimal margin `mb-1`
3. WHEN viewing textareas THEN they SHALL start with minimal height and grow as needed
4. WHEN viewing form descriptions THEN they SHALL use `text-xs text-dark-text-secondary` with minimal spacing
5. IF on mobile THEN padding SHALL increase slightly to `px-3.5 py-2` for better touch targets

### Requirement 3: Optimize Card and Container Spacing

**User Story:** As an administrator, I want cards and containers to use space efficiently, so that I can view more content without excessive scrolling.

#### Acceptance Criteria

1. WHEN viewing cards THEN padding SHALL be reduced to `p-3` on desktop and `p-4` on mobile
2. WHEN cards have headers THEN header padding SHALL be `px-3 py-2` on desktop
3. WHEN gaps exist between elements THEN they SHALL use `gap-2` for compact spacing
4. WHEN margins separate sections THEN they SHALL use `space-y-3` maximum
5. IF cards contain multiple sections THEN internal spacing SHALL use `space-y-2`

### Requirement 4: Fix Sidebar Navigation Sizing

**User Story:** As an administrator, I want the sidebar buttons to be compact and consistent, so that all navigation options are visible without scrolling.

#### Acceptance Criteria

1. WHEN viewing sidebar buttons THEN they SHALL use compact sizing matching other buttons
2. WHEN sidebar icons are displayed THEN they SHALL maintain consistent `w-4 h-4` size
3. WHEN sidebar text is displayed THEN it SHALL use `text-xs` for labels
4. IF sidebar width changes THEN button content SHALL not wrap or overflow
5. WHEN on mobile THEN sidebar SHALL use slightly larger touch targets

### Requirement 5: Handle Flex Wrapping and Overflow

**User Story:** As an administrator, I want content to handle limited space gracefully, so that the interface remains usable on smaller screens.

#### Acceptance Criteria

1. WHEN flex containers lack space THEN they SHALL group related items and allow horizontal scrolling
2. IF individual elements would wrap THEN they SHALL be grouped logically first
3. WHEN content overflows THEN it SHALL use horizontal scroll with fade indicators
4. WHEN tables are displayed on mobile THEN they SHALL use horizontal scroll or card view
5. IF buttons are grouped THEN they SHALL maintain minimum sizes without shrinking

### Requirement 6: Maintain Visual Hierarchy with Badges

**User Story:** As an administrator, I want badges and status indicators to be compact but readable, so that they don't dominate the interface.

#### Acceptance Criteria

1. WHEN badges are displayed THEN they SHALL use `text-xs px-2 py-0.5` for non-interactive
2. WHEN badges are interactive THEN they SHALL use `text-xs px-2.5 py-1` with hover states
3. IF badges contain icons THEN icons SHALL be `w-3 h-3` maximum
4. WHEN multiple badges are shown THEN spacing SHALL be `gap-1` between them
5. IF on mobile THEN interactive badges SHALL increase to `px-3 py-1.5` for touch

### Requirement 7: Ensure Icon Consistency

**User Story:** As an administrator, I want icons to maintain consistent sizes, so that the interface looks professional and organized.

#### Acceptance Criteria

1. WHEN icons are displayed alone THEN they SHALL be `w-4 h-4` on desktop
2. WHEN icons accompany text THEN they SHALL not shrink below `w-4 h-4`
3. IF text content changes THEN icons SHALL maintain their size
4. WHEN icons are in buttons THEN they SHALL have `mr-1.5` spacing from text
5. IF on mobile THEN standalone icons SHALL be `w-5 h-5` for better visibility

### Requirement 8: Improve Button Visibility

**User Story:** As an administrator, I want all buttons to be clearly visible, so that I can identify interactive elements easily.

#### Acceptance Criteria

1. WHEN buttons lack borders THEN they SHALL have `bg-dark-surface-secondary` minimum
2. WHEN ghost buttons are used THEN they SHALL have hover state with `bg-dark-surface-primary/50`
3. IF buttons are disabled THEN opacity SHALL be `opacity-60` for better visibility
4. WHEN buttons are primary actions THEN they SHALL maintain the red gradient styling
5. IF buttons are grouped THEN they SHALL have clear visual separation

## Non-Functional Requirements

### Performance
- Component re-renders SHALL not increase due to sizing changes
- CSS bundle size SHALL remain under 50KB for all admin styles
- Mobile responsiveness SHALL not require JavaScript calculations

### Accessibility
- Touch targets SHALL maintain minimum 44x44px on mobile per WCAG guidelines
- Focus indicators SHALL remain visible with new compact sizing
- Text SHALL maintain minimum 12px actual size for readability

### Consistency
- ALL admin components SHALL follow the same sizing rules
- Spacing units SHALL use Tailwind's standard scale (0.5, 1, 1.5, 2, 2.5, 3, 4)
- Responsive breakpoints SHALL only use sm: and md: for simplicity

### Maintainability
- Sizing rules SHALL be defined in reusable Tailwind classes
- Component props SHALL accept size variants for flexibility
- Documentation SHALL specify the compact sizing standards