# Design Document - Mobile App Restructure

## Overview

The Mobile App Restructure feature transforms the complex dynamic content management system into a monkey-proof, three-page structure: static polls, static news, and simple sponsorship cards. This design maximizes reuse of existing components while eliminating complexity through strategic simplification. The architecture maintains all current API endpoints unchanged while adding only a minimal card management interface and simple logo upload functionality.

## Steering Document Alignment

### Technical Standards (tech.md)
- **Next.js 15 App Router**: Leverages existing `/api/mobile/v1/` structure without changes
- **MySQL 8.0**: Reuses existing database patterns and query optimization strategies
- **Existing Authentication**: Uses current `requireAuth()` and admin layout patterns
- **TypeScript**: Extends existing mobile.ts types with minimal new interfaces
- **Caching Strategy**: Maintains current ETag and memory caching from radio endpoint
- **Response Format**: Keeps existing JSON structure with success/data/error pattern

### Project Structure (structure.md)
- **API Routes**: No changes to existing `/src/app/api/mobile/v1/` endpoints
- **Admin Pages**: Simplifies `/src/app/admin/mobile/` to focus only on cards and logo
- **Components**: Reuses existing `/src/components/admin/mobile/` components extensively
- **Database**: Leverages `/src/lib/db/queries/` patterns for new card operations
- **Types**: Extends `/src/types/mobile.ts` with minimal additions

## Code Reuse Analysis

### Existing Components to Leverage
- **`MobileCardForm.tsx`**: Already exists with perfect card management functionality - NO CHANGES NEEDED
- **`MobileCardList.tsx`**: Existing drag-and-drop card management - REUSE AS-IS
- **`MobileStatsCard.tsx`**: Perfect for dashboard statistics - REUSE AS-IS
- **`MobileSettingsForm.tsx`**: Add simple logo upload field to existing form
- **`MediaPickerDialog.tsx`**: Already integrated for image selection
- **`/src/lib/db/queries/index.ts`**: Perfect CRUD patterns for card operations
- **Admin layout and authentication**: Zero changes needed

### Integration Points
- **Polls System**: Keep existing `/api/mobile/v1/polls` endpoint unchanged
- **News System**: Keep existing `/api/mobile/v1/news` endpoint unchanged
- **Radio Config**: Add logo URL to existing `/api/mobile/v1/radio` response
- **Database**: Add simple `sponsorship_cards` table alongside existing tables
- **Media Storage**: Use existing MinIO patterns and proxy URL conversion

## Architecture

```mermaid
graph TB
    subgraph "Mobile App (No Changes)"
        MA[React Native App]
        PP[Polls Page - Static]
        NP[News Page - Static]
        SP[Sponsorship Page - Static]
    end

    subgraph "Existing APIs (Unchanged)"
        RADIO[/api/mobile/v1/radio]
        POLLS[/api/mobile/v1/polls]
        NEWS[/api/mobile/v1/news]
    end

    subgraph "New Simple API"
        CARDS[/api/mobile/v1/cards]
    end

    subgraph "Simplified Admin (Monkey-Proof)"
        ADMIN[Mobile Cards Admin]
        LOGO[Logo Upload in Settings]
    end

    subgraph "Database (Minimal Changes)"
        EXISTING[(Existing Tables)]
        CARDTBL[(sponsorship_cards)]
    end

    MA --> PP --> POLLS
    MA --> NP --> NEWS
    MA --> SP --> CARDS
    MA --> RADIO

    ADMIN --> CARDS
    LOGO --> RADIO

    CARDS --> CARDTBL
    POLLS --> EXISTING
    NEWS --> EXISTING
    RADIO --> EXISTING

    ADMIN -.\"Reuses Existing\".-> MobileCardForm
    ADMIN -.\"Reuses Existing\".-> MobileCardList
```

## Components and Interfaces

### Mobile Pages (Static - No Admin Editing)

#### Polls Page Component
- **Purpose:** Display current active polls with voting capability
- **Interfaces:** Uses existing poll API responses unchanged
- **Dependencies:** Existing polls endpoint, vote caching, device validation
- **Reuses:** Current poll voting logic, error handling, cache management
- **Implementation:** Static React Native component consuming existing API

#### News Page Component
- **Purpose:** Display paginated news articles with categories and detail views
- **Interfaces:** Uses existing news API responses unchanged
- **Dependencies:** Existing news endpoint, pagination, image galleries
- **Reuses:** Current news fetching, infinite scroll, modal display patterns
- **Implementation:** Static React Native component consuming existing API

#### Sponsorship Page Component
- **Purpose:** Display simple sponsorship cards with modal detail view
- **Interfaces:** New simple cards API returning active cards only
- **Dependencies:** New cards endpoint, image proxy, modal display
- **Reuses:** Existing modal patterns, image optimization, caching strategies
- **Implementation:** Static React Native component with card grid and modal

### Admin Interface (Monkey-Proof Simplicity)

#### Sponsorship Cards Manager (`/admin/mobile/cards` - EXISTING)
- **Purpose:** Manage sponsorship cards through existing interface
- **Interfaces:** Already implemented - NO CHANGES NEEDED
- **Dependencies:** Existing MobileCardForm, MobileCardList, MobileStatsCard
- **Reuses:** 100% of existing card management functionality
- **Implementation:** Current page works perfectly as-is

#### Logo Upload in Settings (`/admin/mobile/settings` - MINOR ADDITION)
- **Purpose:** Add simple logo upload to existing settings form
- **Interfaces:** Extend existing MobileSettingsForm with one additional field
- **Dependencies:** Existing MediaPickerDialog, settings save logic
- **Reuses:** Current settings management, form validation, image upload
- **Implementation:** Add single logo upload field to existing form

### API Layer (Minimal Changes)

#### Cards API (NEW - Super Simple)
- **Purpose:** Return active sponsorship cards for mobile display
- **Interfaces:**
  ```typescript
  GET /api/mobile/v1/cards
  Response: { success: boolean, data: MobileCard[], cache: { etag, maxAge } }
  ```
- **Dependencies:** New sponsorship_cards table, existing cache manager
- **Reuses:** Existing API response format, caching patterns, URL proxy conversion
- **Implementation:** Simple query with cache, 20 lines of code maximum

#### Radio API (TINY ADDITION)
- **Purpose:** Add logo URL to existing radio config response
- **Interfaces:** Extend existing response with optional playerLogoUrl field
- **Dependencies:** Current radio settings, new logo storage
- **Reuses:** 100% of existing radio config logic
- **Implementation:** Add 2 lines to existing endpoint

## Data Models

### New Table: `sponsorship_cards` (Monkey-Proof Schema)
```sql
CREATE TABLE sponsorship_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  redirect_url VARCHAR(500),
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  INDEX idx_active_featured_order (is_active, is_featured, display_order),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Extend Existing: `mobile_settings` table
```sql
-- Add logo URL to existing settings JSON
-- No schema changes needed - use existing JSON column
-- Add playerLogoUrl field to JSON settings
```

### TypeScript Interfaces (Minimal Extensions)
```typescript
// Extend existing mobile.ts - cards already defined!
// Only need to add logo field to existing MobileRadioConfig:

export interface MobileRadioConfig {
  // ... existing fields unchanged ...
  playerLogoUrl?: string; // NEW: Simple logo URL addition
}

// Everything else already exists in current mobile.ts!
```

## Error Handling (Reuse Existing Patterns)

### Error Scenarios

1. **Cards API Failure**
   - **Handling:** Return empty array with success=true (graceful degradation)
   - **User Impact:** Mobile app shows "No cards available" message
   - **Implementation:** Reuse existing error handling patterns

2. **Logo Upload Failure**
   - **Handling:** Show Turkish error message, maintain existing logo
   - **User Impact:** Admin sees clear error, can retry upload
   - **Implementation:** Reuse existing MediaPickerDialog error handling

3. **Database Connection Issues**
   - **Handling:** Return cached data if available
   - **User Impact:** Mobile app continues working with cached content
   - **Implementation:** Reuse existing cache fallback strategies

## Performance Optimizations (Leverage Existing)

### Database Optimization
- Composite index on `(is_active, is_featured, display_order)` for fast card queries
- Reuse existing connection pooling and query optimization patterns
- Cards query: `SELECT * FROM sponsorship_cards WHERE is_active = 1 ORDER BY is_featured DESC, display_order ASC` (sub-50ms)

### API Response Optimization
- Reuse existing gzip compression and ETag headers
- Memory caching with 5-minute TTL for card data
- Image URLs automatically converted using existing proxy pattern
- Response size: ~2KB for typical 10-card response

### Mobile App Optimization
- Static pages load faster than dynamic content (estimated 50% improvement)
- Cards cached locally with standard mobile app cache TTL
- Image lazy loading using existing React Native patterns

## Testing Strategy (Reuse Existing Infrastructure)

### Unit Testing
- Card CRUD operations using existing database test patterns
- API response format validation using existing test utilities
- Logo upload validation using existing media upload tests

### Integration Testing
- Cards API endpoint using existing mobile API test patterns
- Admin interface using existing admin panel test patterns
- Mobile app integration using existing React Native test setup

### End-to-End Testing
- Card creation → mobile display flow
- Logo upload → mobile player display
- Static page navigation (polls → news → cards)

## Migration Plan (Zero Downtime)

### Phase 1: Add Cards Infrastructure (Safe)
1. Create `sponsorship_cards` table (no impact on existing system)
2. Add cards API endpoint (new endpoint, no changes to existing)
3. Add logo field to settings (non-breaking addition)

### Phase 2: Admin Interface (Already Exists)
1. Existing card management already works perfectly
2. Add logo upload to existing settings form (minor addition)
3. Test admin functionality

### Phase 3: Mobile App Update (Client-Side)
1. Update mobile app to use three static pages
2. Add cards API consumption
3. Update radio config to use logo URL
4. Deploy mobile app update

### Phase 4: Cleanup (Optional)
1. Remove unused dynamic content system (when ready)
2. Archive old content tables (when confirmed not needed)
3. Remove complex admin interfaces (when new system proven)

## Security Considerations (Maintain Existing Standards)

### API Security
- Reuse existing rate limiting (100 requests/minute per IP)
- Maintain existing CORS configuration
- Use existing input sanitization patterns
- Keep existing authentication for admin operations

### Data Security
- Card URLs use existing proxy pattern (no direct storage exposure)
- Logo uploads use existing media validation and security
- Admin operations require existing authentication
- Audit logging using existing patterns

## Implementation Complexity Assessment

### Monkey-Proof Simplicity Score: 🐒🐒🐒🐒🐒 (5/5 Bananas)

**What Makes This Monkey-Proof:**
1. **Reuses 95% of existing code** - almost no new complexity
2. **Admin interface already exists** - cards management already implemented
3. **APIs barely change** - just one new endpoint, tiny addition to another
4. **Database changes minimal** - one simple table, one JSON field addition
5. **Mobile app simplifies** - static pages easier than dynamic content
6. **No breaking changes** - everything additive and backward compatible

**Total New Code Estimate:**
- Cards API endpoint: ~50 lines
- Logo upload field: ~10 lines
- Database migration: ~20 lines
- Mobile app static pages: ~200 lines (much simpler than current dynamic system)
- **Total: ~280 lines of new code vs. thousands of lines removed**

**Maintenance Complexity: DECREASES**
- Removes complex dynamic content system
- Eliminates component palette and drag-drop builder
- Reduces database complexity
- Simplifies mobile app navigation and state management
- Admin interface becomes point-and-click simple

This design achieves maximum simplification while maintaining all functionality - truly monkey-proof! 🐒