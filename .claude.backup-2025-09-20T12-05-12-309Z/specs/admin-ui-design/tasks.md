# Implementation Plan

## Task Overview
Implementation of a professional admin dashboard UI with sidebar navigation, settings management, and MinIO-based media gallery. Tasks are broken down into atomic units that can be completed independently in 15-30 minutes each, focusing on single file modifications with clear outcomes.

## Steering Document Compliance
Tasks follow Next.js App Router conventions in `/src/app/admin/*` structure, leverage existing UI components from `/src/components/ui/*`, and integrate with established authentication and storage patterns per tech.md standards.

## Atomic Task Requirements
**Each task must meet these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Task Format Guidelines
- Use checkbox format: `- [ ] Task number. Task description`
- **Specify files**: Always include exact file paths to create/modify
- **Include implementation details** as bullet points
- Reference requirements using: `_Requirements: X.Y, Z.A_`
- Reference existing code to leverage using: `_Leverage: path/to/file.ts, path/to/component.tsx_`
- Focus only on coding tasks (no deployment, user testing, etc.)
- **Avoid broad terms**: No "system", "integration", "complete" in task titles

## Tasks

- [ ] 1. Create AdminSidebar component with navigation items
  - File: src/components/admin/AdminSidebar.tsx
  - Define navigation items array (Dashboard, Media, Settings, etc.)
  - Implement fixed sidebar with dark theme styling
  - Add active route highlighting using usePathname
  - Purpose: Provide persistent navigation for admin panel
  - _Leverage: src/components/ui/Button.tsx, src/lib/utils.ts_
  - _Requirements: 2.1, 2.2_

- [ ] 2. Add mobile responsiveness to AdminSidebar component
  - File: src/components/admin/AdminSidebar.tsx (modify)
  - Add hamburger menu toggle button
  - Implement collapsible sidebar for mobile screens
  - Use Tailwind responsive classes (md:block, hidden)
  - Purpose: Enable mobile-friendly navigation
  - _Leverage: existing Tailwind config_
  - _Requirements: 2.4, 2.5_

- [ ] 3. Update admin layout with sidebar integration
  - File: src/app/admin/layout.tsx (modify)
  - Import and integrate AdminSidebar component
  - Create two-column layout (sidebar + main content)
  - Maintain existing authentication check
  - Purpose: Add sidebar navigation to admin layout
  - _Leverage: src/lib/auth/utils.ts_
  - _Requirements: 1.1, 1.3_

- [ ] 4. Create StatsCard component for dashboard metrics
  - File: src/components/admin/StatsCard.tsx
  - Define props interface for title, value, icon, trend
  - Implement card with dark theme styling
  - Add loading state with skeleton
  - Purpose: Display metric cards on dashboard
  - _Leverage: src/components/ui/Card.tsx, src/components/ui/LoadingSpinner.tsx_
  - _Requirements: 1.1_

- [ ] 5. Create dashboard API route for fetching stats
  - File: src/app/api/admin/dashboard/stats/route.ts
  - Implement GET handler with authentication check
  - Query database for news, polls, media counts
  - Return formatted DashboardStats data
  - Purpose: Provide dashboard metrics data
  - _Leverage: src/lib/auth/utils.ts, src/lib/db/client.ts_
  - _Requirements: 1.1, 1.2_

- [ ] 6. Implement admin dashboard page with stats display
  - File: src/app/admin/page.tsx (modify)
  - Fetch stats data using server component
  - Display StatsCard components in grid layout
  - Add welcome message with user name
  - Purpose: Create functional admin dashboard
  - _Leverage: src/components/admin/StatsCard.tsx_
  - _Requirements: 1.1, 1.2, 1.5_

- [ ] 7. Create PasswordChangeForm component
  - File: src/components/admin/PasswordChangeForm.tsx
  - Define form with current, new, confirm password fields
  - Add client-side password strength validation
  - Include error and success state handling
  - Purpose: Enable secure password updates
  - _Leverage: src/components/ui/Input.tsx, src/components/ui/Button.tsx_
  - _Requirements: 3.1, 3.2_

- [ ] 8. Create password change API route
  - File: src/app/api/admin/settings/password/route.ts
  - Implement POST handler with authentication
  - Verify current password before update
  - Hash new password and update database
  - Purpose: Handle password change requests
  - _Leverage: src/lib/auth/utils.ts, src/lib/auth/password.ts_
  - _Requirements: 3.3, 3.4_

- [ ] 9. Implement settings page with password form
  - File: src/app/admin/settings/page.tsx (modify)
  - Import PasswordChangeForm component
  - Add page title and description
  - Wrap form in Card component
  - Purpose: Create settings page interface
  - _Leverage: src/components/admin/PasswordChangeForm.tsx, src/components/ui/Card.tsx_
  - _Requirements: 3.1, 3.5_

- [ ] 10. Create MediaGalleryGrid component
  - File: src/components/admin/MediaGalleryGrid.tsx
  - Define props for images array and onImageClick
  - Implement responsive grid layout (grid-cols-2 md:grid-cols-4)
  - Add image lazy loading with loading placeholders
  - Purpose: Display images in grid format
  - _Leverage: src/components/ui/Card.tsx_
  - _Requirements: 4.1, 4.4_

- [ ] 11. Create ImagePreviewModal component
  - File: src/components/admin/ImagePreviewModal.tsx
  - Define props for image data and onClose
  - Display full image with metadata (size, date, type)
  - Add delete button with confirmation
  - Purpose: Show image details in modal
  - _Leverage: src/components/ui/Modal.tsx, src/components/ui/Button.tsx_
  - _Requirements: 4.2, 6.1_

- [ ] 12. Create MediaSearchBar component
  - File: src/components/admin/MediaSearchBar.tsx
  - Implement search input with icon
  - Add debounced onChange handler
  - Include clear button when text present
  - Purpose: Enable image search functionality
  - _Leverage: src/components/ui/Input.tsx_
  - _Requirements: 4.3_

- [ ] 13. Create media list API route
  - File: src/app/api/admin/media/list/route.ts
  - Implement GET handler with authentication
  - Use MinIO client to list files
  - Support search query parameter
  - Purpose: Fetch media files from storage
  - _Leverage: src/lib/storage/client.ts, src/lib/auth/utils.ts_
  - _Requirements: 4.1, 4.3_

- [ ] 14. Create media delete API route
  - File: src/app/api/admin/media/delete/route.ts
  - Implement DELETE handler with authentication
  - Use MinIO client to remove file
  - Return success/error response
  - Purpose: Handle image deletion requests
  - _Leverage: src/lib/storage/client.ts, src/lib/auth/utils.ts_
  - _Requirements: 6.1, 6.2_

- [ ] 15. Create ImageUploadZone component
  - File: src/components/admin/ImageUploadZone.tsx
  - Implement drag-and-drop area with visual feedback
  - Add file input for click-to-upload
  - Include file type and size validation
  - Purpose: Enable drag-and-drop uploads
  - _Leverage: src/components/ui/Button.tsx_
  - _Requirements: 5.1, 5.2_

- [ ] 16. Create UploadProgressBar component
  - File: src/components/admin/UploadProgressBar.tsx
  - Define props for filename and progress percentage
  - Display progress bar with percentage text
  - Add cancel button for active uploads
  - Purpose: Show upload progress feedback
  - _Leverage: existing Tailwind classes_
  - _Requirements: 5.3_

- [ ] 17. Create useMediaUpload hook
  - File: src/hooks/useMediaUpload.ts
  - Implement file upload with progress tracking
  - Handle multiple file uploads concurrently
  - Include error handling and retry logic
  - Purpose: Manage upload state and logic
  - _Leverage: src/lib/storage/client.ts_
  - _Requirements: 5.3, 5.5_

- [ ] 18. Create media gallery page with server data fetching
  - File: src/app/admin/media/page.tsx (modify)
  - Import gallery and search components
  - Fetch initial media list server-side
  - Pass data to client components
  - Purpose: Set up media page with initial data
  - _Leverage: src/components/admin/MediaGalleryGrid.tsx, src/components/admin/MediaSearchBar.tsx_
  - _Requirements: 4.1_

- [ ] 19. Add client-side state management to media page
  - File: src/app/admin/media/page.tsx (continue)
  - Add state for search query
  - Implement selected image state
  - Handle gallery refresh after actions
  - Purpose: Enable interactive media management
  - _Leverage: React useState, useEffect hooks_
  - _Requirements: 4.3_

- [ ] 20. Add pagination to media gallery
  - File: src/components/admin/MediaGalleryGrid.tsx (modify)
  - Add pagination controls (prev/next buttons)
  - Implement page state management
  - Display current page and total pages
  - Purpose: Handle large image collections
  - _Leverage: src/components/ui/Button.tsx_
  - _Requirements: 4.5_

- [ ] 21. Add upload section to media page
  - File: src/app/admin/media/page.tsx (continue)
  - Integrate ImageUploadZone component
  - Display UploadProgressBar for active uploads
  - Refresh gallery after successful uploads
  - Purpose: Complete upload functionality
  - _Leverage: src/components/admin/ImageUploadZone.tsx, src/hooks/useMediaUpload.ts_
  - _Requirements: 5.1, 5.4_

- [ ] 22. Create NotificationToast component
  - File: src/components/admin/NotificationToast.tsx
  - Define props for message, type (success/error/info)
  - Implement auto-dismiss after timeout
  - Add close button for manual dismiss
  - Purpose: Show user feedback messages
  - _Leverage: existing Tailwind classes_
  - _Requirements: 3.4, 5.5, 6.5_

- [ ] 23. Create basic NotificationContext provider
  - File: src/contexts/NotificationContext.tsx
  - Create context with notification state
  - Implement showNotification function
  - Export provider and hook
  - Purpose: Enable app-wide notifications
  - _Leverage: React Context API_
  - _Requirements: 3.4_

- [ ] 24. Add notification queue management
  - File: src/contexts/NotificationContext.tsx (modify)
  - Implement queue array for multiple notifications
  - Add auto-dismiss timer logic
  - Handle notification removal
  - Purpose: Manage multiple notifications
  - _Leverage: src/components/admin/NotificationToast.tsx_
  - _Requirements: 5.5, 6.5_

- [ ] 25. Integrate notifications in admin layout
  - File: src/app/admin/layout.tsx (modify)
  - Wrap children with NotificationProvider
  - Add NotificationToast container
  - Position notifications fixed top-right
  - Purpose: Enable notifications across admin
  - _Leverage: src/contexts/NotificationContext.tsx_
  - _Requirements: 1.3_

- [ ] 26. Add bulk selection to media gallery
  - File: src/components/admin/MediaGalleryGrid.tsx (modify)
  - Add checkbox overlay on images
  - Implement selection state management
  - Show selection count in header
  - Purpose: Enable multi-select for bulk actions
  - _Leverage: existing component structure_
  - _Requirements: 6.3_

- [ ] 27. Create BulkActionBar component
  - File: src/components/admin/BulkActionBar.tsx
  - Display when items selected
  - Add delete all button with confirmation
  - Include clear selection button
  - Purpose: Provide bulk operation controls
  - _Leverage: src/components/ui/Button.tsx_
  - _Requirements: 6.3_

- [ ] 28. Add keyboard navigation to gallery
  - File: src/components/admin/MediaGalleryGrid.tsx (modify)
  - Implement arrow key navigation
  - Add Enter key for preview
  - Support Space key for selection
  - Purpose: Improve accessibility
  - _Leverage: React keyboard event handlers_
  - _Requirements: 4.1, 4.2_

- [ ] 29. Add image usage check before deletion
  - File: src/app/api/admin/media/delete/route.ts (modify)
  - Query database for image URL references
  - Return usage information if found
  - Block deletion if in use (optional override)
  - Purpose: Prevent accidental content breakage
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 6.4_

- [ ] 30. Add Turkish language strings
  - File: src/lib/translations/admin.ts
  - Create translation object with Turkish labels
  - Include all UI text strings
  - Export translation helper function
  - Purpose: Localize admin interface
  - _Leverage: new file_
  - _Requirements: 4.1, 4.2_

- [ ] 31. Apply translations to admin components
  - File: src/components/admin/AdminSidebar.tsx (modify)
  - Replace hardcoded strings with translations
  - Update navigation labels to Turkish
  - Purpose: Localize sidebar navigation
  - _Leverage: src/lib/translations/admin.ts_
  - _Requirements: 4.1, 4.2_

- [ ] 32. Add loading skeletons to dashboard
  - File: src/components/admin/StatsCard.tsx (modify)
  - Create skeleton variant for loading state
  - Use pulse animation for placeholder
  - Maintain card dimensions during load
  - Purpose: Improve perceived performance
  - _Leverage: existing Tailwind animation classes_
  - _Requirements: 1.1_

- [ ] 33. Add error boundaries to admin pages
  - File: src/app/admin/error.tsx
  - Create error boundary component
  - Display user-friendly error message
  - Include retry button
  - Purpose: Handle runtime errors gracefully
  - _Leverage: Next.js error boundary pattern_
  - _Requirements: 1.3_