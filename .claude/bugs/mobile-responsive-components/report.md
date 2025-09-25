# Bug Report

## Bug Summary
Frontend components are too large for mobile devices, resulting in poor user experience on smaller screens. Components need to be optimized for better mobile responsiveness while maintaining a simple, clean design aesthetic.

## Bug Details

### Expected Behavior
- Components should scale appropriately on mobile devices (320px - 768px width)
- Text should be readable without horizontal scrolling
- Buttons and interactive elements should be easily tappable (min 44px touch targets)
- Cards and content containers should fit within viewport width
- Modals should be full-width on mobile with proper padding
- Forms should stack vertically on mobile screens
- Navigation should be mobile-optimized with hamburger menu

### Actual Behavior
- Components appear oversized on mobile devices
- Some elements may overflow the viewport causing horizontal scroll
- Touch targets might be too small or too close together
- Cards and containers may not adapt well to smaller screens
- Text might be too large or not wrap properly
- Spacing and padding may be excessive for mobile views

### Steps to Reproduce
1. Open the website on a mobile device or use browser dev tools (320px width)
2. Navigate through different pages (Home, News, Polls)
3. Interact with various components (modals, cards, buttons, forms)
4. Observe that components appear too large and don't fit well on screen

### Environment
- **Version**: Next.js 15.5.3 application
- **Platform**: Mobile browsers (iOS Safari, Chrome Mobile)
- **Configuration**: Responsive breakpoints using Tailwind CSS v4

## Impact Assessment

### Severity
- [x] High - Major functionality broken
- Mobile experience is crucial for radio listeners on-the-go

### Affected Users
All mobile users accessing the website, which likely represents a significant portion of the audience for a radio station

### Affected Features
- Radio player interface
- News cards and carousel
- Polls and voting interface
- Navigation menu
- Modals and popups
- Forms and inputs
- Footer content

## Additional Context

### Error Messages
No error messages - this is a UI/UX issue

### Screenshots/Media
Visual inspection shows components that are too large for mobile viewport

### Related Issues
- Mobile-first design principles need to be applied
- Touch target accessibility guidelines should be followed
- Performance on mobile devices may be affected by large components

## Initial Analysis

### Suspected Root Cause
- Desktop-first design approach without sufficient mobile optimization
- Fixed sizes instead of responsive units
- Insufficient use of Tailwind's responsive modifiers (sm:, md:, lg:)
- Padding and spacing values too large for mobile screens
- Font sizes not scaled down for mobile
- Grid layouts not adapting to single column on mobile

### Affected Components
Based on initial investigation:
- `src/components/ui/` - UI primitives (Button, Card, Modal, Input)
- `src/components/news/` - News components (NewsCard, NewsCarousel, NewsModal, NewsGrid)
- `src/components/polls/` - Poll components (PollCard, PollResults, VoteModal)
- `src/components/radio/` - Radio player components
- `src/components/common/` - Common components (Header, Footer, MobileNavigation)
- `src/app/globals.css` - Global styles and base configurations