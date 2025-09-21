# Bug Report: ImagePicker Component Issues

## Summary
The ImagePicker component has multiple issues affecting functionality and user experience. Images are not loading properly in the MediaPickerDialog, and there are UI/UX problems with unnecessary elements and overlapping icons.

## Environment
- **Project**: TrendAnkara Web Application
- **Component**: `/src/components/ui/ImagePicker.tsx`
- **Related**: `/src/components/admin/MediaPickerDialog.tsx`
- **Framework**: Next.js 15.5.3, React 19.1.0
- **Browser**: All modern browsers
- **Server**: MinIO S3-compatible storage (82.29.169.180:9002)

## Issues

### Issue 1: Images Not Loading as Thumbnails
**Priority**: High
**Status**: Open

**Description**:
Images in the MediaPickerDialog appear as black boxes instead of showing actual image thumbnails. The images only display after being selected.

**Expected Behavior**:
Images should load and display as thumbnails in the grid/list view of the MediaPickerDialog.

**Actual Behavior**:
Black boxes appear where images should be. Images only become visible after selection.

**Root Cause Analysis**:
- The API response doesn't include thumbnail URLs
- The component attempts to use `thumbnails.small/medium/large` which don't exist
- Current implementation uses full image URLs but they're not loading properly in the dialog

**Steps to Reproduce**:
1. Open any form with ImagePicker component
2. Click the "Resim Seç" button
3. Observe the media grid showing black boxes instead of images

---

### Issue 2: Unnecessary Upload Component in Dialog
**Priority**: Medium
**Status**: Open

**Description**:
The ImagePicker dialog shows an upload button ("Yükle") which is not needed for a simple image selection interface. The upload functionality should be separate from the picker.

**Expected Behavior**:
The dialog should only show existing media for selection, without upload capabilities.

**Actual Behavior**:
Upload button is prominently displayed in the dialog header.

**Location**:
`/src/components/admin/MediaPickerDialog.tsx` lines 270-293

---

### Issue 3: Search Icon Overlapping Placeholder Text
**Priority**: Low
**Status**: Open

**Description**:
The search icon in the MediaPickerDialog overlaps with the placeholder text "Medya ara..." making it difficult to read.

**Expected Behavior**:
Search icon should be properly positioned with adequate spacing from the placeholder text.

**Actual Behavior**:
Icon overlaps with the beginning of the placeholder text.

**Location**:
`/src/components/admin/MediaPickerDialog.tsx` lines 217-226

**CSS Issue**:
- Search icon absolute positioning needs adjustment
- Input padding-left needs to be increased

---

### Issue 4: Categories Feature Not Needed
**Priority**: Low
**Status**: Open

**Description**:
The ImagePicker includes category filtering which is unnecessary for a simple image selection tool.

**Expected Behavior**:
Simple image picker without category filtering.

**Actual Behavior**:
Category parameter is passed and used in API calls, adding unnecessary complexity.

**Affected Files**:
- `/src/components/ui/ImagePicker.tsx`
- `/src/components/admin/MediaPickerDialog.tsx`

## Proposed Solutions

### Solution for Issue 1: Fix Image Loading
1. Ensure full image URLs are being used since thumbnails don't exist
2. Add proper error handling and fallback for image loading
3. Consider implementing lazy loading for performance
4. Debug why `img` tags aren't loading the URLs properly

### Solution for Issue 2: Remove Upload Button
1. Add a `hideUpload` prop to MediaPickerDialog
2. Pass `hideUpload={true}` from ImagePicker
3. Conditionally render the upload section based on this prop

### Solution for Issue 3: Fix Search Icon Position
1. Increase left padding on the input: `className="pl-12"` instead of `pl-10`
2. Adjust search icon positioning if needed

### Solution for Issue 4: Remove Categories
1. Remove category prop from ImagePicker interface
2. Don't pass category to MediaPickerDialog
3. Simplify the API calls to not include category filtering

## Testing Requirements
- Verify images load properly in the dialog
- Ensure selected images populate the input field correctly
- Test with various image formats and sizes
- Verify mobile responsiveness
- Test keyboard navigation

## Additional Notes
- The component was recently created and integrated
- Uses MinIO server for image storage
- Turkish UI localization is in use