# Fix for Modal Cancel Button Redirect Issue

## Problem
When clicking "İptal" (Cancel) button in the news edit modal, it was redirecting to the admin home page instead of just closing the modal.

## Root Cause
The NewsForm component's cancel button was calling `window.history.back()` which navigates to the previous page in browser history. Since modals don't change the browser history, clicking cancel would go back to whatever page was visited before (typically admin home).

## Solution
Added an `onCancel` prop to NewsForm component that allows parent components to control the cancel behavior:

### Changes Made

#### 1. Updated NewsForm Component Interface
**File:** `src/components/admin/NewsForm.tsx`

Added `onCancel` prop:
```typescript
interface NewsFormProps {
  // ... other props
  onCancel?: () => void;
}
```

#### 2. Updated Cancel Button Logic
**File:** `src/components/admin/NewsForm.tsx` (lines 301-307)

Changed from:
```typescript
onClick={() => window.history.back()}
```

To:
```typescript
onClick={() => {
  if (onCancel) {
    onCancel();  // Use provided handler (for modals)
  } else {
    window.history.back();  // Fallback for standalone pages
  }
}}
```

#### 3. Updated Modal Usage
**File:** `src/app/admin/news/page.tsx`

For Create Modal (line 512):
```typescript
onCancel={() => setShowCreateModal(false)}
```

For Edit Modal (lines 532-535):
```typescript
onCancel={() => {
  setShowEditModal(false);
  setEditingNews(null);
}}
```

## Other Components Checked
- **PollDialog:** ✅ Already uses `onClose` properly, no issues
- **RadioSettingsForm:** Uses `window.history.back()` but it's on a dedicated page, not in a modal, so it's correct

## Testing
After these changes:
1. ✅ Cancel button in news create modal just closes the modal
2. ✅ Cancel button in news edit modal just closes the modal
3. ✅ No unwanted redirects to admin home page
4. ✅ Modal state is properly cleared when canceled

## Impact
- Only affects NewsForm component
- Backward compatible (fallback to `window.history.back()` if no `onCancel` provided)
- Fixes redirect issue in modals while maintaining correct behavior for standalone forms