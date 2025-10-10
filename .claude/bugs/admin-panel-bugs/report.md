# Bug Report: Admin Panel Multiple Issues

## Bug Summary
Multiple critical bugs affecting the admin panel's polls, news, and media management features. Issues include API endpoint failures, state management problems, and image preview failures.

## Bug Details

### Expected Behavior
1. **Polls Page**: Delete functionality should work, preview should show popup, dropdowns should update state, form submission should succeed
2. **News Page**: Category dropdown should update when selected
3. **Media Page**: Uploaded images should display previews correctly

### Actual Behavior
Multiple failures across admin panel features (detailed below)

### Steps to Reproduce

#### Issue 1: Polls - Delete Functionality Broken
1. Navigate to admin polls page
2. Click delete on poll ID 4
3. **Observe**: 404 error

**Error Details:**
```
DELETE https://trendankara.com/api/admin/polls/4 404 (Not Found)
Error deleting poll: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

#### Issue 2: Polls - Preview Button Not Working
1. Navigate to admin polls page
2. Click eye icon preview button on a poll
3. **Observe**: Only console output "View 4" appears, no popup displayed

#### Issue 3: Polls - Dropdown State Not Updating
1. Open poll create/edit popup
2. Try to select "Anket Türü" (Poll Type) dropdown
3. Try to select "Sonuçları Göster" (Show Results) dropdown
4. **Observe**: Selections don't persist, state remains unchanged

#### Issue 4: Polls - Form Submission Error
1. Open poll create popup
2. Fill in form fields
3. Submit the form
4. **Observe**: Sometimes fails with undefined parameter error

**Error Details:**
```
Error creating poll: Error: Bind parameters must not contain undefined. To pass SQL NULL specify JS null
```

**Request/Response:**
```bash
# Request
curl 'https://trendankara.com/api/admin/polls/items' \
  -H 'content-type: application/json' \
  --data-raw '{"title":"kjhlkjh","description":"","poll_type":"custom","start_date":"2025-10-11T12:00","end_date":"2025-10-18T12:00","is_active":true,"show_on_homepage":true,"show_results":"after_voting","items":[{"tempId":"temp-1","title":"hlkjhlkjh","description":"","image_url":"","display_order":0,"is_active":true},{"tempId":"temp-2","title":"kljhkljhkljh","description":"","image_url":"","display_order":1,"is_active":true}]}'

# Response
{"error":"Bind parameters must not contain undefined. To pass SQL NULL specify JS null"}
```

#### Issue 5: Polls - Unnecessary Preview Endpoint
1. Click new tab icon preview button
2. **Observe**: Opens new tab showing raw JSON instead of preview

**Endpoint:**
```
https://trendankara.com/api/admin/polls/4/preview
```

**Response:**
```json
{"success":true,"data":{"id":4,"question":"lkjlkj","description":"lkjlkj","startDate":"2025-10-11T12:00:00.000Z","endDate":"2025-10-19T12:00:00.000Z","totalVotes":0,"show_results":"after_voting","options":[{"id":6,"title":"lkjlkj","description":"lkjlkjlkj","imageUrl":null,"votes":0},{"id":7,"title":"jlkjlkj","description":"lkjlkjlkj","imageUrl":null,"votes":0}],"preview_mode":true}}
```

**Expected**: Only eye icon popup preview is needed, remove new tab button functionality

#### Issue 6: News - Category Dropdown State Not Changing
1. Navigate to admin news page
2. Click "Kategori" (Category) dropdown
3. Select a category
4. **Observe**: Selection doesn't persist, state remains unchanged

#### Issue 7: Media - Image Previews Not Showing
1. Upload images to media manager (successfully saved to MinIO)
2. Navigate to media page
3. **Observe**: Images show as blank rectangles instead of previews

**Investigation Endpoint:**
```bash
curl 'https://trendankara.com/_next/image?url=http%3A%2F%2Fminio%3A9000%2Fmedia%2Fuploads%2F1760077818530-687-200x300.jpg&w=320&q=75'
```

**Response:**
```
"url" parameter is not allowed
```

**Note**: Images exist in MinIO admin panel but fail to load through Next.js Image component

### Environment
- **Version**: Next.js 15.5.3, React 19.1.0
- **Platform**: Production (https://trendankara.com)
- **Browser**: Chrome 141 on Windows
- **Backend**: MySQL 8.0, MinIO storage

## Impact Assessment

### Severity
- [x] High - Major functionality broken
  - Delete functionality completely broken (polls)
  - Image previews not working (media)
  - Form submissions failing intermittently (polls)
  - State management broken (polls, news)

### Affected Users
- All admin users attempting to manage polls, news, and media content

### Affected Features
1. **Polls Management** (4 issues):
   - Delete functionality
   - Preview popup
   - Dropdown state management
   - Form submission with undefined parameters
2. **News Management** (1 issue):
   - Category dropdown state
3. **Media Management** (1 issue):
   - Image preview display

## Additional Context

### Error Messages
See specific issues above for detailed error messages and stack traces.

### Root Cause Hypotheses

#### Polls Delete (404 Error)
- API route `/api/admin/polls/[id]` may not exist or not handling DELETE method
- Route file might be missing DELETE handler

#### Polls/News Dropdowns
- React state not updating properly on selection
- Possible controlled component issues
- Event handlers may not be triggering state updates

#### Polls Form Submission (Undefined Parameters)
- Empty string fields being passed as `undefined` instead of `null`
- Database expects `NULL` but receives `undefined`
- Need to sanitize form data before submission

#### Media Image Previews
- Next.js Image component configuration issue
- MinIO URL format not compatible with Next.js image optimization
- `remotePatterns` in `next.config.mjs` may not be configured correctly
- Internal Docker hostname `minio:9000` not accessible from client-side

### Affected Components

#### Polls System
- `src/app/admin/polls/page.tsx` - Main polls management page
- `src/app/api/admin/polls/[id]/route.ts` - Individual poll operations
- `src/app/api/admin/polls/items/route.ts` - Poll items endpoint
- Poll form components (create/edit dialog)

#### News System
- `src/app/admin/news/page.tsx` - News management page
- Category dropdown component

#### Media System
- `src/app/admin/media/page.tsx` - Media management page
- `next.config.mjs` - Image optimization configuration
- MinIO integration

## Initial Analysis

### Suspected Root Causes

1. **API Route Missing**: DELETE handler not implemented for `/api/admin/polls/[id]`
2. **State Management**: Dropdown components not properly bound to state updates
3. **Form Data Sanitization**: Empty strings not converted to NULL before database insertion
4. **Image Configuration**: Next.js `remotePatterns` not configured for MinIO, or using internal Docker hostname

### Priority Order
1. **Critical**: Fix polls delete (404 error)
2. **Critical**: Fix media image previews (blocking media management)
3. **High**: Fix polls form submission (undefined parameters)
4. **High**: Fix dropdown state management (polls & news)
5. **Medium**: Fix preview popup functionality
6. **Low**: Remove unnecessary preview endpoint

---

**Created**: 2025-10-10
**Status**: Reported - Awaiting Analysis
