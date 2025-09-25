# Requirements Document: Image Picker Dialog

## Introduction

This feature introduces a reusable Image Picker Dialog component that provides a streamlined interface for selecting images from the media library. The component will integrate with the existing MediaPickerDialog but offer a simplified, image-focused experience with search capabilities and immediate visual feedback. When users select an image, the picker will automatically populate the image URL into the designated input field, making media selection intuitive and efficient for content editors and administrators.

## Alignment with Product Vision

This feature directly supports the product's core motto "Keep it basic, don't overcomplicate anything" by:
- **Simplifying media selection**: Reducing the steps needed to select and use images in forms
- **Enhancing admin efficiency**: Streamlining content creation workflow for news and poll items
- **Leveraging existing infrastructure**: Building upon the robust MediaPickerDialog foundation
- **Improving user experience**: Providing immediate visual feedback and search capabilities
- **Maintaining consistency**: Using the same media library backend and UI patterns

## Requirements

### Requirement 1: Image-Focused Selection Interface

**User Story:** As a content editor, I want to quickly browse and select images from the media library, so that I can efficiently add visuals to my content.

#### Acceptance Criteria

1. WHEN the image picker is opened THEN it SHALL display only image files from the media library
2. IF thumbnails are available THEN the system SHALL display 150x150px thumbnails for quick visual scanning
3. WHEN images are displayed THEN they SHALL show in a responsive grid layout (2 columns mobile <640px, 4 columns tablet 640-1024px, 6 columns desktop >1024px)
4. IF an image has metadata THEN the system SHALL display filename, dimensions, and file size on hover
5. WHEN loading images THEN the system SHALL implement pagination with 20 items per page and load more button
6. IF the media library is empty THEN the system SHALL display an upload prompt with clear instructions

### Requirement 2: Search and Filter Capabilities

**User Story:** As an admin user, I want to search for specific images by name or filter by properties, so that I can find the right image quickly.

#### Acceptance Criteria

1. WHEN typing in the search field THEN the system SHALL filter images after 300ms debounce delay
2. IF search term matches filename, title, or alt text THEN the image SHALL appear in results
3. WHEN no matches are found THEN the system SHALL display "Arama sonucu bulunamadı" message with search suggestions
4. IF filters are applied THEN they SHALL persist during the session until manually cleared
5. WHEN clearing search THEN the system SHALL return to showing all available images
6. IF network error occurs during search THEN the system SHALL display "Bağlantı hatası, tekrar deneyin" error message

### Requirement 3: Single-Click Selection with URL Population

**User Story:** As a user filling a form, I want to select an image and have its URL automatically populated in the input field, so that I don't need to copy-paste URLs manually.

#### Acceptance Criteria

1. WHEN an image is clicked THEN it SHALL immediately populate the target input field with the image URL
2. IF size selection is enabled THEN the system SHALL offer: thumbnail (150x150), medium (400x400), large (800x800), or original
3. WHEN an image is selected THEN the dialog SHALL close automatically for single selection mode
4. IF the input field already has a value THEN the system SHALL replace it with the new selection
5. WHEN selection is made THEN the system SHALL trigger onChange event for form validation
6. IF the selected image URL is invalid or fails to load THEN the system SHALL show "Resim yüklenemedi" error state

### Requirement 4: Visual Preview in Input Field

**User Story:** As a content creator, I want to see a preview of the selected image next to the input field, so that I can verify I've chosen the correct image.

#### Acceptance Criteria

1. WHEN an image URL is populated THEN a thumbnail preview SHALL appear adjacent to the input field
2. IF the URL is invalid or image fails to load THEN the system SHALL show a placeholder or error state
3. WHEN hovering over the preview THEN the system SHALL display a larger preview tooltip
4. IF the user wants to change the image THEN clicking the preview SHALL reopen the picker
5. WHEN the input is cleared THEN the preview SHALL also be removed

### Requirement 5: Integration with Existing Forms

**User Story:** As a developer, I want to easily integrate the image picker into existing forms, so that all image selection interfaces are consistent.

#### Acceptance Criteria

1. WHEN integrating the picker THEN it SHALL work with existing form libraries (react-hook-form, formik)
2. IF validation is required THEN the component SHALL support standard validation props
3. WHEN used in NewsForm (src/components/admin/NewsForm.tsx) THEN it SHALL handle featured images and gallery images
4. IF used in PollItemsManager (src/components/admin/PollItemsManager.tsx) THEN it SHALL support item thumbnail selection
5. WHEN integrated THEN it SHALL maintain the existing dark theme and styling
6. WHEN wrapping MediaPickerDialog (src/components/admin/MediaPickerDialog.tsx) THEN it SHALL preserve all existing media manager functionality

### Requirement 6: Keyboard Navigation and Accessibility

**User Story:** As a user who prefers keyboard navigation, I want to browse and select images without using a mouse, so that I can work efficiently.

#### Acceptance Criteria

1. WHEN using Tab key THEN focus SHALL move through interactive elements in logical order
2. IF using arrow keys in grid view THEN focus SHALL move between images directionally
3. WHEN pressing Enter on a focused image THEN it SHALL be selected
4. IF using screen reader THEN all images SHALL have appropriate alt text or descriptions
5. WHEN pressing Escape THEN the dialog SHALL close without making changes

### Requirement 7: Multiple Selection Mode

**User Story:** As a content editor creating galleries, I want to select multiple images at once, so that I can build image collections efficiently.

#### Acceptance Criteria

1. WHEN multiple mode is enabled THEN users SHALL be able to select multiple images with checkboxes
2. IF images are selected THEN a counter SHALL show "X selected" in the dialog footer
3. WHEN confirming multiple selection THEN URLs SHALL be returned as an array
4. IF maximum selection limit is set THEN the system SHALL prevent selecting beyond the limit
5. WHEN deselecting images THEN the selection count SHALL update immediately

### Requirement 8: Upload Integration

**User Story:** As a content creator, I want to upload new images directly from the picker dialog, so that I don't need to navigate to the media manager separately.

#### Acceptance Criteria

1. WHEN upload button is clicked THEN a file selection dialog SHALL open with accept="image/*"
2. IF files are selected THEN they SHALL upload to /api/admin/media/upload endpoint with 10MB max file size
3. WHEN upload completes THEN new images SHALL appear immediately in the picker
4. IF upload fails THEN the system SHALL display specific error: "Dosya çok büyük" (>10MB), "Geçersiz format" (non-image), "Bağlantı hatası" (network)
5. WHEN uploading THEN a progress indicator SHALL show percentage complete
6. IF multiple files are selected THEN they SHALL upload in parallel with individual progress tracking

## Non-Functional Requirements

### Performance
- Image grid SHALL load within 500ms on standard broadband connection
- Search filtering SHALL respond within 100ms of user input (after 300ms debounce)
- Thumbnail loading SHALL use lazy loading with Intersection Observer API for images outside viewport
- Component SHALL handle libraries with 10,000+ images using virtual scrolling if necessary
- Initial render SHALL display within 200ms with loading skeleton

### Usability
- Interface SHALL be intuitive without requiring user training
- All interactive elements SHALL meet minimum 44px touch target size
- Error messages SHALL be clear and actionable in Turkish
- Loading states SHALL provide clear feedback during operations

### Compatibility
- Component SHALL work in all modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Interface SHALL be fully responsive from 320px to 4K displays
- Component SHALL maintain functionality with JavaScript disabled (graceful degradation)
- Integration SHALL work with React 19 and Next.js 15

### Security
- Component SHALL only display images user has permission to access
- Upload functionality SHALL validate file types and sizes on client and server
- URLs SHALL be sanitized before population in input fields
- Component SHALL prevent XSS through proper HTML escaping

### Maintainability
- Component SHALL follow existing project TypeScript patterns
- Code SHALL be modular with clear separation of concerns
- Styles SHALL use existing Tailwind CSS utilities and components
- Component SHALL include JSDoc comments for public methods
- Component interface SHALL extend MediaPickerDialog props for consistency
- Integration SHALL use existing media API types from src/types/api.ts