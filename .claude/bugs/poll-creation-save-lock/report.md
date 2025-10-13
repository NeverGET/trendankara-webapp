# Bug Report: Poll Creation Save Lock and UX Issues

## Bug Summary
The poll creation system in the admin panel has critical issues that prevent users from saving polls, particularly when attempting to save drafts during the creation process. The "Save" button in the unsaved changes dialog causes an infinite "Saving..." state, effectively locking the form and preventing any further progress.

## Bug Details

### Expected Behavior
1. **Draft Saving**: Users should be able to save incomplete polls as drafts and return later to complete them
2. **Unsaved Changes Warning**: When attempting to close the dialog with unsaved changes, users should see three options:
   - "Cancel" - Return to editing
   - "Don't Save & Close" - Discard changes and close
   - "Save" - Save current state and close
3. **Validation Warnings**: When clicking save with missing required fields, clear popup warnings should appear
4. **Modal Scrolling**: Users should be able to scroll the poll form using the scrollbar without triggering the close dialog action

### Actual Behavior
1. **Save Button Locks**: When user clicks "Save" in the unsaved changes confirmation dialog, the system enters an infinite "Saving..." state and never completes
2. **No Draft Feature**: The draft functionality is completely non-functional due to the save lock
3. **Validation Display**: Validation errors appear at the top of the form (summary list) but are not prominent enough - they should be displayed as popups for better visibility
4. **Scrollbar Click Issue**: Clicking on the scrollbar within the poll dialog is detected as a click-outside event, which triggers the close confirmation dialog

### Steps to Reproduce

#### Issue 1: Save Lock
1. Go to Admin Panel → Polls section
2. Click "Create New Poll" or edit an existing poll
3. Fill in some form fields (partial completion)
4. Attempt to close the dialog by clicking the X button or clicking outside
5. See the "You have unsaved changes" confirmation dialog
6. Click the "Save" button (Turkish: "Kaydet ve Çık")
7. Observe: The button shows "Kaydediliyor..." (Saving...) indefinitely
8. Result: User cannot complete the poll creation, form is locked

#### Issue 2: Validation Warning Visibility
1. Go to Admin Panel → Polls section
2. Click "Create New Poll"
3. Click the "Save" button (Turkish: "Oluştur") without filling required fields
4. Observe: Yellow validation summary appears at top of form
5. Result: Warning is easy to miss, especially on mobile or when scrolled down

#### Issue 3: Scrollbar Click Detection
1. Go to Admin Panel → Polls section
2. Click "Create New Poll" or edit an existing poll
3. Make some changes to the form
4. Scroll down using the scrollbar (click and drag the scrollbar thumb)
5. Observe: The "You have unsaved changes" confirmation dialog appears
6. Result: Users cannot scroll the form properly using the scrollbar

### Environment
- **Version**: Current production build (as of 2025-10-13)
- **Platform**: Web application (Next.js 15.5.3)
- **Affected Browsers**: All browsers (Chrome, Firefox, Safari, Edge)
- **Affected Users**: All admin users attempting to create or edit polls
- **Component Files**:
  - `/src/components/admin/PollDialog.tsx`
  - `/src/hooks/usePollForm.ts`
  - `/src/components/ui/dialog-reui.tsx`

## Impact Assessment

### Severity
- [x] **Critical** - System unusable
- [ ] High - Major functionality broken
- [ ] Medium - Feature impaired but workaround exists
- [ ] Low - Minor issue or cosmetic

**Justification**: This is a critical bug because:
1. Poll creation functionality is completely blocked when users try to save drafts
2. There is no workaround - users cannot save partial progress
3. Poll creation typically takes significant time and requires multiple attempts
4. Users lose all progress if they close the browser or navigate away

### Affected Users
- **Primary Impact**: All admin users who create or edit polls
- **Secondary Impact**: Radio station management who depend on timely poll creation
- **User Base**: Estimated 5-10 admin users, but critical for business operations

### Affected Features
1. **Poll Creation Workflow** - Completely broken for draft saving
2. **Poll Editing Workflow** - Partially affected when making changes
3. **User Experience** - Severely degraded due to scrollbar and validation issues
4. **Admin Productivity** - Significantly reduced, forcing users to complete polls in single sessions

## Additional Context

### Error Messages
No JavaScript errors are thrown. The system silently hangs in the "Saving..." state without completing the save operation or showing any error.

### Code Analysis

#### Root Cause Location: PollDialog.tsx:226-240
```typescript
// Save and close handler
const handleSaveAndClose = async () => {
  if (!isValid || isLoading || isSavingAndClosing) return;

  setIsSavingAndClosing(true);
  setShowCloseConfirm(false);

  try {
    await handleSubmit();
    // Note: handleSubmit already closes the dialog on success
  } catch (error) {
    console.error('Error saving before close:', error);
    // Don't close if save failed, let user retry
    setIsSavingAndClosing(false);
  }
};
```

**Issue**: The `handleSubmit()` function is being called incorrectly. It's a function that returns another function, not the actual submit handler.

#### Validation Display: PollDialog.tsx:315-345
Current implementation shows validation errors as a banner at the top of the form. This is easily missed, especially when:
- User is scrolled down in the form
- On mobile devices with limited screen space
- When focused on specific form fields

#### Scrollbar Click Issue: dialog-reui.tsx:45-53
```typescript
onClick={(e) => {
  // Close dialog when clicking outside on mobile
  if (e.target === e.currentTarget) {
    const closeButton = document.querySelector('[aria-label="Close"]');
    if (closeButton instanceof HTMLElement) {
      closeButton.click();
    }
  }
}}
```

**Issue**: This click handler on the overlay container doesn't properly distinguish between:
- Clicks on the scrollbar
- Clicks on the actual overlay (blurred background)

### Screenshots/Media
- Visual evidence shows "Kaydediliyor..." (Saving...) text remains indefinitely
- No loading spinner animation completes
- Form remains in locked state until page refresh

### Related Issues
- Similar issue may exist in other dialogs using the same `handleSubmit` pattern
- Draft functionality was intended but never properly implemented
- Overall dialog UX needs improvement across the admin panel

## Initial Analysis

### Suspected Root Cause

#### Issue 1: Save Lock (PRIMARY BUG)
The `handleSaveAndClose` function calls `handleSubmit()` which returns a submit handler function from react-hook-form, but doesn't actually invoke it. The correct approach should be:
1. Manually trigger form validation
2. If valid, call the onSubmit handler directly with form data
3. Or properly invoke the returned submit handler function

#### Issue 2: Validation Warnings
The current implementation uses a dismissible banner component which is not prominent enough. Should use a modal/popup dialog for validation errors that requires user acknowledgment.

#### Issue 3: Scrollbar Click Detection
The overlay click handler doesn't account for scrollbar interactions. The event target check `e.target === e.currentTarget` is insufficient because scrollbar clicks can bubble up and match this condition.

### Affected Components
1. **PollDialog.tsx** (Lines 226-240, 242-258)
   - `handleSaveAndClose` function - incorrect handleSubmit usage
   - `onSubmitHandler` function - validation display logic

2. **usePollForm.ts** (Lines 254-275)
   - `onSubmitHandler` function - form submission logic
   - May need to expose a manual submit function

3. **dialog-reui.tsx** (Lines 42-54)
   - Overlay click handler - needs better event filtering
   - Should ignore scrollbar and scroll area clicks

4. **ModalAdapter.tsx** (Lines 29-55)
   - May need to expose additional props to prevent click-outside behavior
   - Should pass through options to underlying Dialog component

### Data Flow Analysis
1. User clicks "Save" in confirmation dialog
2. `handleSaveAndClose` is called
3. `setIsSavingAndClosing(true)` sets loading state
4. `handleSubmit()` is called but returns a function instead of executing
5. No actual save operation occurs
6. Loading state never gets reset because no error is thrown
7. Form remains locked with "Saving..." text visible

### Dependencies
- `react-hook-form` (v7.x) - form management library
- `@radix-ui/react-dialog` - dialog primitive component
- Dialog state management is spread across multiple layers:
  - PollDialog (business logic)
  - ModalAdapter (legacy compatibility)
  - dialog-reui (Radix UI wrapper)

## Solution Approach

### Fix Strategy

#### Priority 1: Fix Save Lock (Critical)
1. Correct the `handleSaveAndClose` function to properly invoke the form submission
2. Add proper error handling and loading state management
3. Ensure form data is validated before submission
4. Add timeout protection (max 10 seconds) to prevent infinite loading states

#### Priority 2: Improve Validation Display (High)
1. Replace banner-style validation summary with modal dialog
2. Create a dedicated ValidationDialog component
3. Show modal immediately when user attempts to save invalid form
4. List all validation errors in a clear, scrollable format
5. Add "Fix Errors" button that closes modal and focuses first error field

#### Priority 3: Fix Scrollbar Click Issue (Medium)
1. Update click handler in dialog-reui.tsx to ignore scrollbar clicks
2. Check if click target is a scrollbar or scroll container
3. Consider using pointer-events CSS or more precise event filtering
4. Test on all browsers (Chrome, Firefox, Safari, Edge)

### Alternative Solutions

#### Alternative 1: Auto-save Draft
Instead of requiring explicit save action:
- Implement auto-save every 30 seconds
- Store draft in localStorage or database
- Show "Draft saved at HH:MM" indicator
- Eliminate need for "Save" button in close confirmation

**Trade-offs**:
- (+) Better UX, no user action needed
- (+) Prevents data loss
- (-) More complex implementation
- (-) Requires draft storage system

#### Alternative 2: Staged Save Process
Break poll creation into steps:
- Step 1: Basic info (title, description, dates)
- Step 2: Poll options
- Step 3: Settings and preview
- Save after each step completion

**Trade-offs**:
- (+) Prevents loss of partial progress
- (+) Better UX for complex forms
- (-) Major UI redesign required
- (-) More development time

### Risks and Trade-offs

#### Chosen Solution Risks
1. **Form Submission Timing**: Need to ensure form validation completes before submission
2. **Error Handling**: Must handle all error cases (network, validation, server errors)
3. **Loading State Management**: Complex state transitions between dialogs
4. **Scrollbar Detection**: Different browsers may have different scrollbar implementations

#### Mitigation Strategies
1. Add comprehensive error logging
2. Implement timeout protection
3. Add unit tests for form submission flow
4. Cross-browser testing for scrollbar behavior
5. Add fallback UI for edge cases

## Implementation Plan

### Changes Required

#### Change 1: Fix handleSaveAndClose in PollDialog.tsx
- **File**: `src/components/admin/PollDialog.tsx`
- **Lines**: 226-240
- **Modification**:
  ```typescript
  const handleSaveAndClose = async () => {
    if (!isValid || isLoading || isSavingAndClosing) return;

    setIsSavingAndClosing(true);
    setShowCloseConfirm(false);

    try {
      // Get current form values
      const formData = getValues();

      // Manually trigger validation
      const isFormValid = await trigger();

      if (!isFormValid) {
        setIsSavingAndClosing(false);
        setError('Lütfen tüm zorunlu alanları doldurun');
        return;
      }

      // Call onSubmit handler from usePollForm
      await handleSubmit()(undefined as any); // Invoke the returned function

      // Success - dialog will close automatically
    } catch (error) {
      console.error('Error saving before close:', error);
      setError(error instanceof Error ? error.message : 'Kayıt sırasında hata oluştu');
      setIsSavingAndClosing(false);
    }
  };
  ```

#### Change 2: Add timeout protection
- **File**: `src/components/admin/PollDialog.tsx`
- **Lines**: Add new utility function
- **Modification**:
  ```typescript
  // Add timeout wrapper for save operations
  const withTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMs: number = 10000
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('İşlem zaman aşımına uğradı')), timeoutMs)
      ),
    ]);
  };
  ```

#### Change 3: Create ValidationDialog component
- **File**: `src/components/ui/ValidationDialog.tsx` (new file)
- **Modification**: Create new modal component for validation errors
  ```typescript
  export function ValidationDialog({
    isOpen,
    onClose,
    errors
  }: ValidationDialogProps) {
    // Display validation errors in modal format
    // Show list of all errors with field names
    // Provide "Fix Errors" button
  }
  ```

#### Change 4: Fix scrollbar click detection
- **File**: `src/components/ui/dialog-reui.tsx`
- **Lines**: 42-54
- **Modification**:
  ```typescript
  onClick={(e) => {
    // Only close if clicking directly on the overlay, not scrollbar
    if (e.target === e.currentTarget) {
      // Additional check: ensure it's not a scrollbar interaction
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX;
      const clickY = e.clientY;

      // Check if click is within scrollbar area (typically right edge)
      const isScrollbarClick =
        clickX > rect.right - 20 || // Right scrollbar
        clickY > rect.bottom - 20;  // Bottom scrollbar

      if (!isScrollbarClick) {
        const closeButton = document.querySelector('[aria-label="Close"]');
        if (closeButton instanceof HTMLElement) {
          closeButton.click();
        }
      }
    }
  }}
  ```

#### Change 5: Improve validation display in PollDialog
- **File**: `src/components/admin/PollDialog.tsx`
- **Lines**: 242-258 (onSubmitHandler function)
- **Modification**: Replace banner with ValidationDialog modal

### Testing Strategy

#### Unit Tests
1. Test `handleSaveAndClose` with valid form data
2. Test `handleSaveAndClose` with invalid form data
3. Test timeout protection triggers correctly
4. Test validation dialog displays all errors

#### Integration Tests
1. Full poll creation flow with save-and-close
2. Poll editing flow with unsaved changes
3. Form validation display and dismissal
4. Scrollbar interaction doesn't close dialog

#### Manual Testing Checklist
- [ ] Create new poll, partially fill, attempt close, click "Save" → Should save and close
- [ ] Create new poll, don't fill required fields, click save → Should show validation modal
- [ ] Create new poll, make changes, scroll using scrollbar → Should not trigger close dialog
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on mobile devices (iOS Safari, Chrome Mobile)
- [ ] Test with keyboard navigation (Tab, Enter, Escape)
- [ ] Test with screen readers for accessibility

#### Edge Cases
1. Network timeout during save operation
2. Server returns error during save
3. Very long poll with many options
4. Rapid clicking of save button
5. Browser loses focus during save
6. Form validation changes after initial check

### Rollback Plan

#### If Issues Arise After Deployment
1. **Immediate**: Feature flag to revert to old modal behavior
2. **Short-term**: Roll back to previous commit
3. **Long-term**: Keep old PollDialog as PollDialogLegacy.tsx

#### Monitoring Points
1. Watch for error logs with "handleSaveAndClose" or "form submission"
2. Monitor poll creation success rate
3. Track time-to-complete for poll creation
4. User feedback on poll creation experience

#### Rollback Procedure
```bash
# 1. Revert to previous commit
git revert <commit-hash>

# 2. Or use feature flag
# Update .env or runtime config:
USE_LEGACY_POLL_DIALOG=true

# 3. Deploy hotfix
npm run build
docker build -t radioapp:rollback .
# Deploy to production
```

---

**Report Created**: 2025-10-13
**Reporter**: Development Team
**Severity**: Critical
**Status**: Reported - Ready for Analysis
**Next Step**: Proceed to `/bug-analyze` phase
