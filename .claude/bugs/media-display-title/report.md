# Bug Report

## Bug Summary
Admin panel media page and media picker dialogs are displaying the file path (filename) instead of the user-friendly title for images, causing visual confusion. Additionally, the upload button in the MediaPickerDialog is not functional.

## Bug Details

### Expected Behavior
1. **Media Display**: Images should display their `title` property (e.g., "MERO ATİ.png", "BURAK BULUT.jpg") instead of the file path (e.g., "uploads/1760271742920-MERO_AT_.png")
2. **Upload Functionality**: The upload button in MediaPickerDialog should work, allowing users to upload files and immediately select them without page refresh

### Actual Behavior
1. **Media Display**: All media components are showing the `filename` field which contains the full storage path like "uploads/1760271742920-MERO_AT_.png" instead of the human-readable `title` field like "MERO ATİ.png"
2. **Upload Functionality**: While the upload button exists in MediaPickerDialog, it appears to not be functioning properly - file upload doesn't refresh the media list in real-time

### Steps to Reproduce
1. Navigate to Admin Panel → Media Management page (https://trendankara.com/admin/media)
2. Observe the hover overlay on images - shows full file path like "uploads/1760271742920-MERO_AT_.png"
3. Open any media picker dialog from other admin pages (e.g., when adding an image to news)
4. Observe same filename display issue in hover text (line 308 in MediaPickerDialog.tsx)
5. Try to upload a file using the "Yükle" button in MediaPickerDialog
6. Note that the file may upload but the media list doesn't refresh automatically

### Environment
- **Version**: Next.js 15.5.3, React 19.1.0
- **Platform**: Web (all browsers)
- **Configuration**: Production deployment on VPC Ubuntu 24.04.3 LTS

## Impact Assessment

### Severity
- [x] Medium - Feature impaired but workaround exists

### Affected Users
All admin users who manage media files through:
- The admin media management page
- Any media picker dialog used throughout the admin panel (news, polls, content builder, etc.)

### Affected Features
1. **Admin Media Management Page** (`/admin/media`)
   - MediaGalleryGrid component (line 123 in MediaGalleryGrid.tsx)
   - List view display (line 549 in page.tsx)

2. **Media Picker Dialog** (used across admin panel)
   - MediaPickerDialog component (line 308 in MediaPickerDialog.tsx)
   - Upload functionality (lines 146-172 in MediaPickerDialog.tsx)

## Additional Context

### API Response Structure
The media API (`/api/admin/media`) returns both fields:
```json
{
  "id": "32",
  "filename": "uploads/1760271742920-MERO_AT_.png",
  "title": "MERO ATİ.png",
  "url": "/api/media/uploads/1760271742920-MERO_AT_.png",
  ...
}
```

### Error Messages
No error messages - this is a visual/UX bug where the wrong field is being displayed.

### Screenshots/Media
API endpoint tested successfully:
```bash
curl 'https://trendankara.com/api/admin/media?page=1&limit=24&search=&type=all&sort=newest&orphaned=false'
```

### Related Issues
None identified - this is an isolated display issue affecting multiple components.

## Initial Analysis

### Suspected Root Cause
Components are hardcoded to display the `filename` field instead of the `title` field:
1. **MediaGalleryGrid.tsx:123** - `{image.filename}` in hover overlay
2. **MediaPickerDialog.tsx:308** - `{item.filename}` in hover overlay
3. **page.tsx:549** (Admin Media Page) - `{file.filename}` in list view

### Affected Components
1. **MediaGalleryGrid.tsx** - Used in admin media page
2. **MediaPickerDialog.tsx** - Used throughout admin panel for media selection
3. **page.tsx** (Admin Media) - List view display
4. Upload functionality in MediaPickerDialog needs to trigger a refresh after successful upload

### Fix Approach
1. Replace all `filename` references with `title` in display contexts
2. Keep `filename` available for debugging/tooltips if needed
3. Fix upload button to refresh media list after successful upload without page refresh
4. Ensure uploaded files are immediately available for selection
