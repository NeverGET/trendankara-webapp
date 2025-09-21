# Implementation Plan: Image Picker Dialog

## Task Overview
Implement a streamlined image picker component that wraps the existing MediaPickerDialog, providing simplified image selection with URL auto-population, visual preview, and seamless form integration. The implementation will be atomic and incremental, ensuring each task is independently testable.

## Steering Document Compliance
- Tasks follow `/src/components/ui/` structure for UI primitives
- Utilize existing MediaPickerDialog and form components
- Maintain TypeScript patterns and Tailwind CSS styling
- Preserve Turkish UI with English codebase

## Atomic Task Requirements
**Each task meets these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Tasks

### Phase 1: Core Component Structure

- [x] 1. Create ImagePicker component interface and shell
  - File: `/src/components/ui/ImagePicker.tsx`
  - Define ImagePickerProps interface with all props
  - Create basic component structure with empty render
  - Export component and types
  - _Leverage: existing dark theme styles from Button.tsx_
  - _Requirements: 1.1, 3.1, 5.1_

- [x] 2. Create useImagePicker hook with state management
  - File: `/src/hooks/useImagePicker.ts`
  - Define UseImagePickerOptions and UseImagePickerReturn interfaces
  - Implement basic state (isPickerOpen, preview)
  - Add open/close picker functions
  - _Leverage: useState, useCallback patterns from existing hooks_
  - _Requirements: 3.1, 4.1_

- [x] 3. Implement ImagePickerInput sub-component
  - File: `/src/components/ui/ImagePicker.tsx` (add to existing)
  - Create ImagePickerInput with input field and button
  - Add placeholder and disabled states
  - Connect to parent component props
  - _Leverage: Input component from /src/components/ui/Input.tsx_
  - _Requirements: 3.1, 4.1_

- [x] 4. Connect MediaPickerDialog to ImagePicker
  - File: `/src/components/ui/ImagePicker.tsx` (modify)
  - Import and render MediaPickerDialog
  - Pass isOpen state from hook
  - Wire onClose and onSelect handlers
  - _Leverage: MediaPickerDialog from /src/components/admin/MediaPickerDialog.tsx_
  - _Requirements: 1.1, 3.3, 5.6_

### Phase 2: Selection and URL Management

- [x] 5. Implement single image selection handler
  - File: `/src/hooks/useImagePicker.ts` (modify)
  - Add handleSelect function to process MediaItem
  - Extract URL based on sizePreference
  - Call onChange prop with selected URL
  - _Leverage: MediaItem interface from MediaPickerDialog_
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 6. Add size preference URL mapping
  - File: `/src/hooks/useImagePicker.ts` (modify)
  - Create getImageUrl helper function
  - Map thumbnail/medium/large/original to MediaItem fields
  - Handle missing thumbnail sizes gracefully
  - _Leverage: MediaItem.thumbnails structure_
  - _Requirements: 3.2_

- [x] 7. Implement URL input field population
  - File: `/src/components/ui/ImagePicker.tsx` (modify)
  - Display selected URL in input field
  - Add clear button when value exists
  - Trigger onChange on selection
  - _Leverage: Input component value/onChange pattern_
  - _Requirements: 3.1, 3.4, 3.5_

### Phase 3: Preview Functionality

- [x] 8. Create preview state management
  - File: `/src/hooks/useImagePicker.ts` (modify)
  - Add PreviewState interface and state
  - Implement loadPreview function
  - Handle loading and error states
  - _Leverage: useEffect for side effects_
  - _Requirements: 4.1, 4.2_

- [x] 9. Build preview thumbnail display
  - File: `/src/components/ui/ImagePicker.tsx` (modify)
  - Add preview image next to input
  - Show loading spinner while loading
  - Display error icon on load failure
  - _Leverage: LoadingSpinner component_
  - _Requirements: 4.1, 4.2, 4.5_

- [x] 10. Implement preview hover tooltip
  - File: `/src/components/ui/ImagePicker.tsx` (modify)
  - Add larger preview on hover
  - Position tooltip above thumbnail
  - Include image dimensions in tooltip
  - _Leverage: Tailwind CSS hover utilities_
  - _Requirements: 4.3_

- [x] 11. Add click-to-reopen on preview
  - File: `/src/components/ui/ImagePicker.tsx` (modify)
  - Make preview thumbnail clickable
  - Open picker when preview clicked
  - Add cursor pointer style
  - _Leverage: onClick handlers_
  - _Requirements: 4.4_

### Phase 4: Multiple Selection Mode

- [x] 12. Extend hook for multiple selection
  - File: `/src/hooks/useImagePicker.ts` (modify)
  - Handle MediaItem array in handleSelect
  - Store selected items array
  - Return array of URLs
  - _Leverage: existing multiple prop from MediaPickerDialog_
  - _Requirements: 7.1, 7.3_

- [x] 13. Update component for multiple mode
  - File: `/src/components/ui/ImagePicker.tsx` (modify)
  - Pass multiple prop to MediaPickerDialog
  - Display selected count in input
  - Show comma-separated URLs or count
  - _Leverage: MediaPickerDialog multiple selection_
  - _Requirements: 7.1, 7.2, 7.5_

- [x] 14. Add multiple preview display
  - File: `/src/components/ui/ImagePicker.tsx` (modify)
  - Show grid of preview thumbnails
  - Limit preview display to first 4 images
  - Add "+X more" indicator
  - _Leverage: CSS grid utilities_
  - _Requirements: 7.2_

### Phase 5: Error Handling and Validation

- [x] 15. Implement error handling for network failures
  - File: `/src/hooks/useImagePicker.ts` (modify)
  - Add try-catch in selection handler
  - Show "Bağlantı hatası" error message
  - Add retry mechanism
  - _Leverage: existing error patterns_
  - _Requirements: 2.6, 3.6_

- [x] 16. Add URL validation
  - File: `/src/hooks/useImagePicker.ts` (modify)
  - Create validateImageUrl function
  - Check URL format and extension
  - Show "Geçersiz resim URL'i" for invalid URLs
  - _Leverage: existing validation utilities_
  - _Requirements: 3.6, 4.2_

- [x] 17. Display validation errors in component
  - File: `/src/components/ui/ImagePicker.tsx` (modify)
  - Show error message below input
  - Add red border on error state
  - Clear error on new selection
  - _Leverage: Input component error prop_
  - _Requirements: 3.6, 5.2_

### Phase 6: Keyboard Navigation and Accessibility

- [x] 18. Add keyboard event handlers
  - File: `/src/components/ui/ImagePicker.tsx` (modify)
  - Handle Enter key to open picker
  - Handle Escape to close picker
  - Maintain focus on input after close
  - _Leverage: onKeyDown event handlers_
  - _Requirements: 6.1, 6.3, 6.5_

- [x] 19. Implement ARIA attributes
  - File: `/src/components/ui/ImagePicker.tsx` (modify)
  - Add aria-label to buttons
  - Add aria-describedby for errors
  - Include role attributes
  - _Leverage: existing accessibility patterns_
  - _Requirements: 6.4_

- [x] 20. Add focus trap management
  - File: `/src/components/ui/ImagePicker.tsx` (modify)
  - Store last focused element
  - Return focus after dialog closes
  - Trap focus within dialog
  - _Leverage: useRef for focus management_
  - _Requirements: 6.1_

### Phase 7: Form Integration

- [x] 21. Create react-hook-form wrapper
  - File: `/src/components/ui/ImagePicker.tsx` (add export)
  - Export ImagePickerField component
  - Use Controller from react-hook-form
  - Handle field registration
  - _Leverage: existing form patterns in NewsForm_
  - _Requirements: 5.1, 5.2_

- [x] 22. Add formik adapter
  - File: `/src/components/ui/ImagePicker.tsx` (add export)
  - Export ImagePickerFormik component
  - Use Field from formik
  - Handle formik props
  - _Leverage: formik field patterns_
  - _Requirements: 5.1_

- [x] 23. Support validation props
  - File: `/src/components/ui/ImagePicker.tsx` (modify)
  - Add required, pattern, validate props
  - Pass validation to form libraries
  - Show validation errors
  - _Leverage: existing validation patterns_
  - _Requirements: 5.2_

### Phase 8: Performance Optimizations

- [x] 24. Implement lazy loading for MediaPickerDialog
  - File: `/src/components/ui/ImagePicker.tsx` (modify)
  - Use dynamic import for MediaPickerDialog
  - Show loading state while importing
  - Cache imported component
  - _Leverage: React.lazy and Suspense_
  - _Requirements: Performance NFR_

- [x] 25. Add preview image caching
  - File: `/src/hooks/useImagePicker.ts` (modify)
  - Create preview cache Map
  - Store loaded preview URLs
  - Reuse cached previews
  - _Leverage: Map data structure_
  - _Requirements: Performance NFR_

- [x] 26. Implement debounced search passthrough
  - File: `/src/components/ui/ImagePicker.tsx` (modify)
  - Pass search props to MediaPickerDialog
  - Maintain 300ms debounce
  - Preserve search state
  - _Leverage: existing MediaPickerDialog search_
  - _Requirements: 2.1_

### Phase 9: Integration Examples

- [x] 27. Create NewsForm integration example
  - File: `/src/components/admin/NewsForm.tsx` (modify)
  - Replace image URL input with ImagePicker
  - Handle featured image selection
  - Test form submission
  - _Leverage: existing NewsForm structure_
  - _Requirements: 5.3_

- [x] 28. Add PollItemsManager integration
  - File: `/src/components/admin/PollItemsManager.tsx` (modify)
  - Use ImagePicker for item thumbnails
  - Handle multiple item images
  - Test poll item updates
  - _Leverage: existing PollItemsManager_
  - _Requirements: 5.4_

- [x] 29. Create usage documentation
  - File: `/src/components/ui/ImagePicker.README.md`
  - Document all props and methods
  - Add usage examples
  - Include integration patterns
  - _Leverage: existing README patterns_
  - _Requirements: Maintainability NFR_

- [x] 30. Add Storybook stories (optional)
  - File: `/src/components/ui/ImagePicker.stories.tsx`
  - Create basic usage story
  - Add multiple selection story
  - Include error state examples
  - _Leverage: Storybook patterns if available_
  - _Requirements: Maintainability NFR_