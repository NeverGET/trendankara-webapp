# Bug Report

## Bug Summary
The news admin page has two critical issues: images are not displaying in the news list, and the preview functionality does not work (clicking preview does nothing).

## Bug Details

### Expected Behavior
1. News articles with featured images should display thumbnails in the news cards on the admin page
2. Clicking the preview/view button (eye icon) should open the news article in a preview modal or new tab
3. The news list should properly show all visual content for articles

### Actual Behavior
1. News articles show a placeholder icon instead of actual images, even when featured_image data exists
2. Clicking the preview/view button (eye icon) only logs to console but doesn't open any preview
3. The news admin page appears visually broken with missing images

### Steps to Reproduce
1. Navigate to http://localhost:3000/admin/news
2. Observe that news cards show generic placeholder icons instead of actual images
3. Click on any eye icon (preview button) on a news card
4. Observe that nothing happens except a console log message

### Environment
- **Version**: Next.js 15.5.3 with React 19.1.0
- **Platform**: Web browser (all browsers affected)
- **Configuration**: Development environment with local MySQL and MinIO storage

## Impact Assessment

### Severity
- [x] High - Major functionality broken

### Affected Users
Admin users who manage news content

### Affected Features
- News thumbnail display in admin dashboard
- News preview functionality
- Visual content management for news articles

## Additional Context

### Error Messages
No error messages in console, but the following issues were identified in code:

1. **Data Mapping Issue**: The API returns raw database fields but the frontend expects a different structure
   - API returns: `featured_image`, `is_hot`, `is_breaking`, `created_at`
   - Frontend expects: `thumbnail`, `isHot`, `isBreaking`, `publishedAt`

2. **Preview Handler Issue**: The preview function is incomplete
   ```typescript
   const handleViewNews = (id: number) => {
     // TODO: Open news in new tab or modal
     console.log('View news:', id);
   };
   ```

### Screenshots/Media
Based on the code analysis:
- News cards are rendering with fallback placeholder: `/api/placeholder/400/200`
- The actual featured_image URLs from the database are not being used

### Related Issues
- Data transformation between backend (snake_case) and frontend (camelCase) conventions
- Missing implementation for the preview functionality

## Initial Analysis

### Suspected Root Cause
1. **Image Display Issue**: Mismatch between API response format and expected NewsArticle type structure. The API returns `featured_image` (string) but the component expects `thumbnail` (MediaFile | string).

2. **Preview Issue**: The handleViewNews function is not implemented - it only contains a TODO comment and console.log statement.

### Affected Components
- **File**: `src/app/admin/news/page.tsx`
  - **Lines**: 361 (image URL mapping), 219-222 (preview handler)
  - **Issue**: Incorrect property mapping and unimplemented preview function

- **File**: `src/lib/api/admin/news.ts`
  - **Issue**: No data transformation from API format to frontend format

- **File**: `src/app/api/admin/news/route.ts`
  - **Issue**: Returns raw database fields without transformation

- **File**: `src/types/news.ts`
  - **Issue**: Type mismatch between API response and NewsArticle interface