# FRONTEND DESIGN PLAN
## Trend Ankara Radio - Professional Radio Station CMS

### 📋 Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Visual Design System](#visual-design-system)
3. [Component Architecture](#component-architecture)
4. [Page Layouts](#page-layouts)
5. [Interaction Patterns](#interaction-patterns)
6. [Responsive Design](#responsive-design)
7. [Accessibility Standards](#accessibility-standards)
8. [Performance Guidelines](#performance-guidelines)
9. [Implementation Roadmap](#implementation-roadmap)

---

## 🎯 Design Philosophy

### Core Principle: "Monkey-Proof Design"
**Even a monkey should be able to use this website** - This extreme simplicity ensures maximum usability for all users regardless of technical expertise.

### Design Pillars
1. **ULTRA-SIMPLE** - No confusion, no learning curve
2. **ALWAYS VISIBLE** - Critical functions never hidden
3. **BIG & BOLD** - Large touch targets, clear typography
4. **INSTANT FEEDBACK** - Every action has immediate response
5. **FAIL-SAFE** - Impossible to break or get lost

### What We're NOT Doing
- ❌ Dropdown menus
- ❌ Hidden navigation
- ❌ Small click targets
- ❌ Complex interactions
- ❌ Multiple step processes
- ❌ Hover-dependent features
- ❌ Auto-playing content
- ❌ Pop-up modals (except polls)

---

## 🧩 Component Architecture

### Component Hierarchy

```
Level 0: Layout Components
├── RootLayout
├── PublicLayout
└── AdminLayout

Level 1: Critical Components (Always Visible)
├── Header
│   ├── Logo
│   ├── Navigation (3 items max)
│   └── RadioPlayer (Persistent)
├── RadioPlayer
│   ├── PlayButton (60x60px min)
│   ├── VolumeControl
│   ├── CurrentSongDisplay
│   └── ConnectionStatus
└── MobileNavigation (Bottom bar on mobile)

Level 2: Primary Components
├── NewsCard
│   ├── Thumbnail (16:9 ratio)
│   ├── Title (24px min)
│   ├── Summary
│   ├── CategoryBadge
│   └── Metadata
├── PollCard
│   ├── Question
│   ├── Options (with images)
│   ├── VoteButton
│   └── Results
├── HeroSection
│   ├── StationLogo
│   ├── PlayButton (Giant)
│   └── Tagline
└── Footer
    ├── ContactInfo
    ├── SocialLinks
    └── Copyright

Level 3: Supporting Components
├── Button (Variants: primary, secondary, danger)
├── Card (Container component)
├── Modal (For news articles)
├── Input (Form fields)
├── LoadingState
├── ErrorBoundary
├── NoDataMessage
└── PaginationControls
```

### Component Specifications

#### 1. Button Component
```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'small' | 'medium' | 'large' | 'giant';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

/* Size Specifications */
- Small: 40px height, 14px font
- Medium: 48px height, 16px font
- Large: 56px height, 18px font
- Giant: 72px height, 24px font

/* Minimum touch target: 48x48px */
```

#### 2. RadioPlayer Component
```tsx
interface RadioPlayerProps {
  streamUrl: string;
  metadataUrl: string;
  autoPlay?: boolean;
  persistent?: boolean;
}

/* Layout */
- Desktop: Horizontal layout in header (400px width)
- Mobile: Fixed bottom bar (full width, 80px height)
- Controls: Play(60px), Volume(120px), Song(remaining)
```

#### 3. NewsCard Component
```tsx
interface NewsCardProps {
  id: number;
  title: string;
  summary: string;
  thumbnail: string;
  category: string;
  isHot?: boolean;
  isBreaking?: boolean;
  publishedAt: Date;
}

/* Specifications */
- Image: 16:9 ratio, lazy loaded
- Title: 2 lines max, truncate with ellipsis
- Summary: 3 lines max
- Click target: Entire card
- Hover: Scale(1.02) transition
```

#### 4. PollCard Component
```tsx
interface PollCardProps {
  id: number;
  question: string;
  options: PollOption[];
  endDate: Date;
  totalVotes: number;
  hasVoted: boolean;
}

/* Specifications */
- Question: 24px font, bold
- Options: Radio buttons with 60px images
- Vote button: Full width, 56px height
- Results: Animated percentage bars
```

---

## 📐 Page Layouts

### Homepage Layout
```
┌─────────────────────────────────────┐
│          HEADER (Fixed)             │
├─────────────────────────────────────┤
│                                     │
│         HERO SECTION                │
│     [Giant Play Button]             │
│                                     │
├─────────────────────────────────────┤
│         NEWS CAROUSEL               │
│     [Featured News Slides]          │
├─────────────────────────────────────┤
│   NEWS    │   NEWS    │   NEWS     │
│   CARD    │   CARD    │   CARD     │
├───────────┼───────────┼─────────────┤
│   NEWS    │   NEWS    │   NEWS     │
│   CARD    │   CARD    │   CARD     │
├─────────────────────────────────────┤
│         ACTIVE POLL                 │
│     [If exists, show card]          │
├─────────────────────────────────────┤
│          FOOTER                     │
└─────────────────────────────────────┘
```

### News Page Layout
```
┌─────────────────────────────────────┐
│          HEADER (Fixed)             │
├─────────────────────────────────────┤
│       PAGE TITLE: HABERLER          │
├─────────────────────────────────────┤
│      CATEGORY FILTERS               │
│  [All] [Magazine] [Artist] [Album]  │
├─────────────────────────────────────┤
│   NEWS    │   NEWS    │   NEWS     │
│   CARD    │   CARD    │   CARD     │
├───────────┼───────────┼─────────────┤
│   NEWS    │   NEWS    │   NEWS     │
│   CARD    │   CARD    │   CARD     │
├───────────┼───────────┼─────────────┤
│   NEWS    │   NEWS    │   NEWS     │
│   CARD    │   CARD    │   CARD     │
├─────────────────────────────────────┤
│         PAGINATION                  │
│     [← Previous] [1 2 3] [Next →]   │
├─────────────────────────────────────┤
│          FOOTER                     │
└─────────────────────────────────────┘
```

### Polls Page Layout
```
┌─────────────────────────────────────┐
│          HEADER (Fixed)             │
├─────────────────────────────────────┤
│       PAGE TITLE: ANKETLER          │
├─────────────────────────────────────┤
│                                     │
│       ACTIVE POLL (Large)           │
│         [Full voting UI]            │
│                                     │
├─────────────────────────────────────┤
│      PAST POLLS (Results)           │
├─────────────────────────────────────┤
│  POLL 1   │  POLL 2   │  POLL 3    │
│  RESULTS  │  RESULTS  │  RESULTS   │
├─────────────────────────────────────┤
│          FOOTER                     │
└─────────────────────────────────────┘
```

### Mobile Layout (< 768px)
```
┌──────────────┐
│    HEADER    │
│  [Logo][≡]   │
├──────────────┤
│              │
│   CONTENT    │
│   (Single    │
│    Column)   │
│              │
├──────────────┤
│              │
│   FOOTER     │
│              │
├──────────────┤
│ RADIO PLAYER │
│   (Fixed)    │
└──────────────┘
```

---

## 🎮 Interaction Patterns

### Click/Tap Behavior

#### Primary Interactions
1. **Play Button**
   - Click → Start radio immediately
   - Visual: Scale(0.95) on press
   - Audio: Soft click sound (optional)
   - State: Button transforms to pause

2. **News Card**
   - Click anywhere → Open article modal
   - Visual: Scale(1.02) on hover
   - Mobile: Touch feedback (ripple effect)

3. **Poll Voting**
   - Select option → Radio fills
   - Click vote → Instant submission
   - Result: Animated percentage bars

### Navigation Patterns

#### Desktop Navigation
```
Hover → Underline animation (300ms)
Click → Page transition (fade)
Active → Red underline persistent
```

#### Mobile Navigation
```
Tap hamburger → Slide menu from right
Tap outside → Close menu
Swipe right → Close menu
Bottom nav → Direct navigation
```

### Form Interactions

#### Input Fields
```
Focus → Red border appears
Type → Real-time validation
Error → Red border + message below
Success → Green checkmark inside field
```

#### Submit Buttons
```
Click → Loading spinner replaces text
Success → Green checkmark (2s) → Reset
Error → Red X + shake animation
```

### Loading States

#### Page Loading
```
1. Skeleton screens (not spinners)
2. Progressive content reveal
3. Stagger animations (100ms delays)
```

#### Lazy Loading
```
Images → Blur placeholder → Fade in
Content → 200px before viewport
Infinite scroll → Auto-load on scroll
```

### Error Handling

#### Network Errors
```
Connection lost → Red banner at top
"Bağlantı Koptu - Tekrar Deneniyor..."
Auto-retry → Every 5 seconds
Success → Green banner → Auto-hide (3s)
```

#### Form Errors
```
Validation → Instant inline messages
Submit error → Modal with details
"Bir Şeyler Ters Gitti 😕"
[Tekrar Dene] [İptal]
```

---

## 📱 Responsive Design

### Layout Adaptations

#### Mobile (< 768px)
- Single column layout
- Bottom navigation bar
- Full-width components
- Vertical news cards
- Drawer navigation menu
- Touch-optimized controls
- Fixed radio player at bottom

#### Tablet (768px - 1024px)
- 2 column grid for news
- Side-by-side poll options
- Horizontal radio player
- Expanded navigation

#### Desktop (> 1024px)
- 3 column grid for news
- Horizontal layouts
- Hover states enabled
- Keyboard navigation
- Sticky sidebar (admin)

---

## ♿ Accessibility Standards

### WCAG 2.1 Level AA Compliance

#### Color Contrast
- Text on background: 7:1 ratio minimum
- Large text (24px+): 4.5:1 ratio
- Interactive elements: 3:1 ratio
- Focus indicators: 3:1 ratio

#### Keyboard Navigation
```
Tab → Navigate forward
Shift+Tab → Navigate backward
Enter → Activate button/link
Space → Toggle selection
Escape → Close modal/menu
Arrow keys → Navigate options
```


### Language Support
- Turkish language throughout UI
- RTL support ready (future)
- Proper lang attributes
- Clear, simple language

---

## ⚡ Performance Guidelines

### Core Web Vitals Targets
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 600ms

### Optimization Strategies

#### Image Optimization
```jsx
// Use Next.js Image component
import Image from 'next/image';

<Image
  src={thumbnail}
  alt={title}
  width={640}
  height={360}
  loading="lazy"
  placeholder="blur"
  sizes="(max-width: 768px) 100vw,
         (max-width: 1200px) 50vw,
         33vw"
/>
```

#### Code Splitting
```jsx
// Lazy load non-critical components
const AdminPanel = lazy(() => import('./AdminPanel'));
const MediaManager = lazy(() => import('./MediaManager'));
```

#### Bundle Size Targets
- Initial JS: < 100KB
- Initial CSS: < 20KB
- Per-route JS: < 50KB
- Total bundle: < 300KB

#### Caching Strategy
```
Static Assets → 1 year cache
API Responses → 5 minute cache
Images → 30 day cache
Fonts → 1 year cache
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Set up Tailwind with dark theme
- [ ] Create color system CSS variables
- [ ] Build Button component
- [ ] Build Card component
- [ ] Build Modal component
- [ ] Set up typography scale

### Phase 2: Layout (Week 1-2)
- [ ] Create Header component
- [ ] Create Footer component
- [ ] Build Navigation menu
- [ ] Implement responsive grid
- [ ] Add page layouts

### Phase 3: Radio Player (Week 2)
- [ ] Build RadioPlayer component
- [ ] Implement audio controls
- [ ] Add iOS compatibility fixes
- [ ] Create persistent state
- [ ] Add reconnection logic

### Phase 4: Content Display (Week 2-3)
- [ ] Create NewsCard component
- [ ] Build NewsCarousel
- [ ] Implement NewsModal
- [ ] Add category badges
- [ ] Create loading skeletons

### Phase 5: Polling System (Week 3)
- [ ] Build PollCard component
- [ ] Create voting interface
- [ ] Implement results display
- [ ] Add vote validation
- [ ] Create poll popup

### Phase 6: Homepage (Week 3-4)
- [ ] Assemble hero section
- [ ] Integrate news carousel
- [ ] Add news grid
- [ ] Display active poll
- [ ] Optimize performance

### Phase 7: Additional Pages (Week 4)
- [ ] Complete News page
- [ ] Complete Polls page
- [ ] Add pagination
- [ ] Implement filters
- [ ] Add search (optional)

### Phase 8: Polish (Week 4-5)
- [ ] Add animations
- [ ] Implement error boundaries
- [ ] Add loading states
- [ ] Test accessibility
- [ ] Optimize bundle size

### Phase 9: Admin Panel (Week 5-6)
- [ ] Create admin layout
- [ ] Build data tables
- [ ] Add CRUD forms
- [ ] Implement media manager
- [ ] Add content builder

### Phase 10: Testing & Launch (Week 6)
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Performance testing
- [ ] Accessibility audit
- [ ] Production deployment

---

## 📊 Success Metrics

### User Experience Metrics
- Time to first interaction: < 3 seconds
- Task completion rate: > 95%
- Error rate: < 1%
- Bounce rate: < 30%
- Radio play rate: > 60%

### Technical Metrics
- Lighthouse score: > 90
- Bundle size: < 300KB
- API response time: < 200ms
- Uptime: 99.9%
- Mobile usage: > 50%

### Engagement Metrics
- Average session: > 5 minutes
- Poll participation: > 30%
- News clicks: > 40%
- Return visitors: > 50%

---

## 📝 Component Examples

### Button Component Usage
```jsx
// Primary Action Button
<Button variant="primary" size="large" fullWidth>
  Radyoyu Başlat
</Button>

// Secondary Button
<Button variant="secondary" size="medium">
  Daha Fazla
</Button>

// Danger Button
<Button variant="danger" size="small">
  Sil
</Button>

// Loading State
<Button variant="primary" loading>
  Yükleniyor...
</Button>
```

### NewsCard Component Usage
```jsx
<NewsCard
  title="Yeni Albüm Çıktı!"
  summary="Ünlü sanatçının merakla beklenen..."
  thumbnail="/images/news/album.jpg"
  category="ALBUM"
  isHot={true}
  publishedAt={new Date()}
  onClick={handleNewsClick}
/>
```

### RadioPlayer Component Usage
```jsx
<RadioPlayer
  streamUrl="https://radio.trendankara.com/stream"
  metadataUrl="https://radio.trendankara.com/metadata"
  autoPlay={false}
  persistent={true}
/>
```

---

## 🎨 Design Tokens Reference

### Quick Copy CSS Variables
```css
:root {
  /* Colors */
  --brand-red: #DC2626;
  --bg-primary: #000000;
  --text-primary: #FFFFFF;

  /* Spacing */
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Typography */
  --text-base: 16px;
  --text-xl: 24px;
  --text-3xl: 36px;

  /* Borders */
  --radius-md: 8px;
  --border-width: 1px;

  /* Transitions */
  --transition: 300ms ease;
}
```

### Tailwind Config Extension
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#DC2626',
        },
        dark: {
          bg: '#000000',
          surface: '#1A1A1A',
        }
      },
      fontSize: {
        'giant': '72px',
      },
      height: {
        'touch': '48px',
        'button-lg': '56px',
        'button-giant': '72px',
      }
    }
  }
}
```

---

## 🔗 References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Touch Targets](https://material.io/design/layout/spacing-methods.html#touch-targets)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)

---

## ✅ Checklist for Developers

Before marking a component as complete:

- [ ] Minimum touch target 48x48px
- [ ] Color contrast passes WCAG AA
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Mobile responsive
- [ ] Dark mode only
- [ ] Loading state included
- [ ] Error state included
- [ ] Turkish language used
- [ ] Performance optimized

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Author**: Trend Ankara Radio Development Team
**Status**: ACTIVE