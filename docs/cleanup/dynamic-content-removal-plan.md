# Dynamic Content System Removal Plan

## Overview

This document outlines the safe removal of complex dynamic content system components after the mobile app is updated to use static pages. The mobile app will transition from the current complex component-based dynamic content system to simple static pages.

## Current Dynamic Content System Architecture

### 1. Component-Based Content Management

**Files to Remove:**
- `/src/components/content/` (entire directory)
  - `ComponentPalette.tsx` (empty placeholder)
  - `ComponentTypes.tsx` (empty placeholder)
  - `ContentBuilder.tsx` (empty placeholder)
  - `PreviewPane.tsx` (empty placeholder)

**Safe to Remove:** ✅ - These files are empty placeholders and can be removed immediately.

### 2. Advanced Content Page Builder

**Files to Remove:**
- `/src/app/admin/content/page.tsx` - Complex mobile content builder interface
- `/src/components/admin/ComponentPalette.tsx` - Component palette with 13 component types
- `/src/components/admin/MobilePreview.tsx` - Mobile preview system

**Component Types Defined:**
- Layout: hero, carousel, divider, spacer
- Content: text, news_list
- Media: image, video, audio_player
- Interactive: poll, button, social_links, contact_form

**Database Dependencies:**
- `content_pages` table - stores JSON component structure
- `content_components` table - component definitions
- `content_versions` table - version history

**Safe to Remove After:** Mobile app deployment using static pages

### 3. Content Pages Database System

**Database Tables:**
```sql
-- Primary content storage
content_pages (JSON-based component storage)
content_components (component type definitions)
content_versions (version history tracking)

-- Audit tracking
audit_log (tracks all content changes)
content_page_views (view analytics)
```

**API Endpoints to Remove:**
- `/api/admin/content` - Full CRUD for content pages
- `/api/mobile/v1/content/pages` - Mobile content delivery
- `/api/mobile/v1/content/route.ts` - Basic content endpoint (currently empty)

### 4. Content Database Functions

**Files to Remove:**
- `/src/lib/db/content-pages.ts` - Complete CRUD operations (528 lines)
- `/src/lib/db/migrations/004_create_content_audit_tables.sql`

**Functions Included:**
- getAllContentPages, getContentPageById, getContentPageBySlug
- createContentPage, updateContentPage, deleteContentPage
- duplicateContentPage, setContentPagePublishStatus
- setAsHomepage, trackPageView, getPageViewStats
- validateComponents, generateSlug

## Simplified Mobile Card System (Keep)

### Current Implementation (Retain)

**Files to Keep:**
- `/src/services/mobile/CardService.ts` - Simplified card management
- `/src/app/admin/mobile/cards/page.tsx` - Simple card admin interface
- `/src/app/api/mobile/v1/content/cards/` - Card API endpoints
- `/src/components/admin/mobile/` - Mobile card components

**Database to Keep:**
```sql
mobile_cards table:
- id, title, description, image_url, redirect_url
- is_featured, display_order, is_active
- created_at, updated_at, created_by, deleted_at
```

**Why Keep:** This system is simple, efficient, and will serve as the primary content management for the mobile app.

## Removal Strategy

### Phase 1: Immediate Safe Removals

**Can Remove Now (Low Risk):**
1. Empty content component files:
   ```bash
   rm -rf /src/components/content/
   ```

2. Component type definitions (not actively used):
   ```bash
   # Remove after confirming no imports
   rm /src/components/admin/ComponentPalette.tsx
   ```

### Phase 2: After Mobile App Deployment

**Remove After Mobile App Updates:**

1. **Content Management Interface:**
   ```bash
   rm /src/app/admin/content/page.tsx
   rm -rf /src/components/admin/MobilePreview.tsx
   ```

2. **Content Database Functions:**
   ```bash
   rm /src/lib/db/content-pages.ts
   ```

3. **Content API Endpoints:**
   ```bash
   rm -rf /src/app/api/admin/content/
   rm /src/app/api/mobile/v1/content/route.ts
   rm /src/app/api/mobile/v1/content/pages/
   ```

### Phase 3: Database Cleanup

**Database Migration for Removal:**
```sql
-- Step 1: Backup existing data
CREATE TABLE content_pages_backup AS SELECT * FROM content_pages;
CREATE TABLE content_versions_backup AS SELECT * FROM content_versions;

-- Step 2: Remove tables (after confirming mobile app works)
DROP TABLE content_versions;
DROP TABLE content_components;
DROP TABLE content_pages;

-- Step 3: Clean audit logs (optional)
DELETE FROM audit_log WHERE entity_type IN ('content_pages', 'content_components');
```

## Migration Strategy for Existing Content

### Content Assessment

1. **Current Content Pages:** Check existing `content_pages` table for active content
2. **Convert to Cards:** Transform existing dynamic content into simple mobile cards
3. **Static Alternatives:** Create static pages for complex content

### Migration Script Template

```typescript
// migration-script.ts
async function migrateContentToCards() {
  // 1. Get all published content pages
  const contentPages = await getAllContentPages({}, { is_published: true });

  // 2. Convert each to a simple mobile card
  for (const page of contentPages) {
    const cardData = {
      title: page.title,
      description: page.description || extractFromComponents(page.content_json),
      imageUrl: extractImageFromComponents(page.content_json),
      redirectUrl: `/static-pages/${page.slug}`,
      isFeatured: page.is_homepage,
      isActive: true
    };

    await cardService.createCard(cardData);
  }

  // 3. Create static HTML pages for complex content
  await generateStaticPages(contentPages);
}
```

## Rollback Procedures

### Emergency Rollback Plan

1. **Restore from Backup:**
   ```sql
   -- Restore content tables from backup
   CREATE TABLE content_pages AS SELECT * FROM content_pages_backup;
   CREATE TABLE content_versions AS SELECT * FROM content_versions_backup;
   ```

2. **Restore Code Files:**
   ```bash
   # Use git to restore removed files
   git checkout HEAD~1 -- src/app/admin/content/
   git checkout HEAD~1 -- src/lib/db/content-pages.ts
   git checkout HEAD~1 -- src/app/api/admin/content/
   ```

3. **Mobile App Fallback:**
   - Revert mobile app to use dynamic content endpoints
   - Ensure API endpoints are functional
   - Test component rendering

## Risk Assessment

### Low Risk (Immediate Removal)
- ✅ Empty component files in `/src/components/content/`
- ✅ Unused component definitions

### Medium Risk (After Mobile Deployment)
- ⚠️ Content management interface removal
- ⚠️ API endpoint removal
- ⚠️ Database function removal

### High Risk (Database Changes)
- ❌ Content table removal (requires careful validation)
- ❌ Data migration (backup essential)

## Validation Checklist

### Pre-Removal Validation

- [ ] Confirm mobile app is using static pages
- [ ] Verify no active content pages in production
- [ ] Test mobile card system functionality
- [ ] Backup all content data
- [ ] Document current content for migration

### Post-Removal Validation

- [ ] Mobile app functions without dynamic content
- [ ] Admin interface works with card system only
- [ ] No broken imports or references
- [ ] Database integrity maintained
- [ ] Performance improvements measured

## Dependencies and Considerations

### External Dependencies

1. **Mobile App Update Required:**
   - App must be updated to use static pages
   - Content loading logic must change
   - API endpoints must be updated

2. **Content Team Training:**
   - Train staff on simplified card system
   - Document new content workflow
   - Create content migration guidelines

### Technical Considerations

1. **SEO Impact:** Static pages may improve SEO
2. **Performance:** Simplified system will be faster
3. **Maintenance:** Reduced code complexity
4. **Scalability:** Card system is more scalable

## Timeline Recommendation

```
Week 1: Phase 1 - Remove empty files
Week 2-3: Mobile app development and testing
Week 4: Mobile app deployment
Week 5: Phase 2 - Remove content management code
Week 6: Phase 3 - Database cleanup (with validation)
Week 7: Final validation and documentation
```

## Benefits of Removal

1. **Simplified Architecture:** Reduce complexity from 13 component types to simple cards
2. **Better Performance:** Static pages load faster than dynamic components
3. **Easier Maintenance:** Fewer files and systems to maintain
4. **Mobile-First Design:** Card system better suited for mobile interface
5. **Reduced Bugs:** Less complex code means fewer potential issues

## Contact and Support

- **Technical Lead:** Review database migrations
- **Mobile Team:** Coordinate app deployment
- **Content Team:** Handle content migration
- **DevOps Team:** Handle backup and rollback procedures

---

**Document Status:** Ready for implementation
**Last Updated:** 2025-09-28
**Version:** 1.0
**Approval Required:** Technical Lead, Mobile Team Lead