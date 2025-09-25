# Implementation Plan

## Task Overview
Implement a comprehensive poll management system in the admin panel, replacing mock data with functional CRUD operations, time-based scheduling, image support, and result visibility controls. The implementation will leverage existing components and APIs while adding new capabilities for poll creation and management.

## Steering Document Compliance
Tasks follow Next.js 14+ app router patterns, use existing component structure in `/components/admin/`, leverage existing API patterns at `/api/admin/`, and maintain TypeScript type safety throughout.

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
- Reference requirements using: `_Requirements: X.Y_` format consistently
- Reference existing code to leverage using: `_Leverage: path/to/file.ts_`
- Focus only on coding tasks (no deployment, user testing, etc.)
- **Avoid broad terms**: No "system", "integration", "complete" in task titles

## Good vs Bad Task Examples
❌ **Bad Examples (Too Broad)**:
- "Implement poll management system" (affects many files, multiple purposes)
- "Add complete image support" (vague scope, no file specification)
- "Optimize performance" (too large, multiple techniques)

✅ **Good Examples (Atomic)**:
- "Create PollFormData interface in src/types/admin-polls.ts"
- "Add ImagePicker to poll option fields in PollItemsManager.tsx"
- "Implement date validation in PollScheduler component"

## Tasks

- [x] 1. Create poll form data interfaces in src/types/admin-polls.ts
  - File: src/types/admin-polls.ts (new)
  - Define PollFormData interface with all form fields
  - Define PollItemFormData interface for poll options
  - Define ExtendedPoll interface extending existing Poll type
  - Export all interfaces for use in components
  - _Leverage: src/types/polls.ts_
  - _Requirements: 1.2, 3.1, 4.1_

- [x] 2. Add show_results column to polls table schema
  - File: src/lib/db/migrations/add-poll-show-results.sql (new)
  - Create SQL migration to add show_results enum column
  - Set default value to 'after_voting'
  - Add column comment explaining the enum values
  - _Leverage: Existing polls table structure_
  - _Requirements: 5.1_

- [x] 3. Update polls.ts to include show_results field
  - File: src/lib/db/polls.ts (modify)
  - Add show_results to PollData interface
  - Update createPoll function to include show_results
  - Update updatePoll function to handle show_results
  - Modify getAllPolls to return show_results
  - _Leverage: Existing database functions_
  - _Requirements: 5.1, 6.1_

- [x] 4. Create usePollForm hook for form state management
  - File: src/hooks/usePollForm.ts (new)
  - Implement form state with React Hook Form
  - Add validation rules for dates and required fields
  - Include dirty state tracking for unsaved changes
  - Export hook with all form utilities
  - _Leverage: Existing form hook patterns_
  - _Requirements: 1.2, 1.3, 2.1_

- [x] 5. Create PollScheduler component for date selection
  - File: src/components/admin/PollScheduler.tsx (new)
  - Implement date/time pickers for start and end dates
  - Add validation for date order (end > start)
  - Set minimum date to today for future scheduling
  - Include date formatting utilities
  - _Leverage: src/components/ui/Input.tsx_
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Add ImagePicker to PollItemsManager for option images
  - File: src/components/admin/PollItemsManager.tsx (modify)
  - Import ImagePicker component
  - Add ImagePicker to each poll option field
  - Handle image URL changes in option data
  - Display image preview when URL exists
  - _Leverage: src/components/ui/ImagePicker.tsx_
  - _Requirements: 3.1, 3.4_

- [x] 7. Add option management buttons to PollItemsManager
  - File: src/components/admin/PollItemsManager.tsx (modify)
  - Implement add option button
  - Add remove option button with min 2 constraint
  - Disable remove when only 2 options remain
  - Update display_order when options change
  - _Leverage: src/components/ui/Button.tsx_
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 8. Create PollFormFields component for metadata inputs
  - File: src/components/admin/PollFormFields.tsx (new)
  - Implement title and description inputs
  - Add poll type selector (weekly/monthly/custom)
  - Include show_results dropdown with three options
  - Add homepage visibility checkbox
  - _Leverage: src/components/ui/Input.tsx_
  - _Requirements: 1.2, 5.1_

- [x] 9. Create PollDialog component shell
  - File: src/components/admin/PollDialog.tsx (new)
  - Set up modal dialog structure
  - Add form element with onSubmit handler
  - Include loading and error states
  - Implement close confirmation for dirty forms
  - _Leverage: src/components/ui/Modal.tsx_
  - _Requirements: 1.1_

- [x] 10. Integrate form components into PollDialog
  - File: src/components/admin/PollDialog.tsx (modify)
  - Import and integrate PollFormFields
  - Add PollScheduler component
  - Include PollItemsManager
  - Wire up form state with usePollForm hook
  - _Leverage: Components from tasks 5, 7, 8_
  - _Requirements: 1.1, 1.2_

- [x] 11. Create poll API service functions
  - File: src/lib/api/admin-polls.ts (new)
  - Implement createPollWithItems function
  - Add updatePollWithItems function
  - Create deletePoll with confirmation
  - Include error handling and response parsing
  - _Leverage: Existing API patterns_
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 12. Add poll creation logic to PollDialog
  - File: src/components/admin/PollDialog.tsx (modify)
  - Implement handleSubmit for create mode
  - Add API call with loading state
  - Handle success with dialog close and refresh
  - Show error messages on failure
  - _Leverage: src/lib/api/admin-polls.ts_
  - _Requirements: 1.4, 1.5, 6.3_

- [x] 13. Add poll editing logic to PollDialog
  - File: src/components/admin/PollDialog.tsx (modify)
  - Load existing poll data in edit mode
  - Populate form fields with current values
  - Implement update API call
  - Add warning for active poll edits
  - _Leverage: src/lib/api/admin-polls.ts_
  - _Requirements: 8.1, 8.2_

- [x] 14. Create enhanced API endpoint for poll with items
  - File: src/app/api/admin/polls/items/route.ts (new)
  - Implement POST for creating poll with items atomically
  - Use database transaction for consistency
  - Return new poll ID on success
  - Include proper error responses
  - _Leverage: src/lib/db/polls.ts_
  - _Requirements: 6.2_

- [x] 15. Create API endpoint for updating poll with items
  - File: src/app/api/admin/polls/[id]/items/route.ts (new)
  - Implement PUT for updating poll and items
  - Handle item additions, updates, and deletions
  - Use transaction for atomic updates
  - Invalidate cache after update
  - _Leverage: src/lib/db/polls.ts, src/lib/cache/invalidation.ts_
  - _Requirements: 6.2, 6.4_

- [x] 16. Remove mock data from admin polls page
  - File: src/app/admin/polls/page.tsx (modify lines 29-163)
  - Remove mockPolls constant
  - Remove mockStats constant
  - Remove pollTypes and pollStatuses constants
  - Keep UI components for later integration
  - _Leverage: Existing page structure_
  - _Requirements: 6.5_

- [x] 17. Add polls data fetching hook
  - File: src/hooks/usePollsData.ts (new)
  - Create hook for loading polls with pagination
  - Include filter and search parameters
  - Handle loading and error states
  - Export for use in polls page
  - _Leverage: src/lib/api/admin-polls.ts_
  - _Requirements: 6.5_

- [x] 18. Integrate data fetching in polls page
  - File: src/app/admin/polls/page.tsx (modify)
  - Import and use usePollsData hook
  - Update state with real poll data
  - Connect filters to API parameters
  - Display loading spinner during fetch
  - _Leverage: src/hooks/usePollsData.ts_
  - _Requirements: 6.5_

- [x] 19. Wire up PollDialog in admin polls page
  - File: src/app/admin/polls/page.tsx (modify)
  - Import PollDialog component
  - Add dialog state management
  - Connect "Yeni Anket" button to open dialog
  - Implement onSave to refresh poll list
  - _Leverage: src/components/admin/PollDialog.tsx_
  - _Requirements: 1.1_

- [x] 20. Connect edit buttons to PollDialog
  - File: src/app/admin/polls/page.tsx (modify)
  - Pass poll data to dialog for editing
  - Set mode to 'edit' when edit clicked
  - Handle edit success with list refresh
  - Update PollCard edit button handlers
  - _Leverage: src/components/admin/PollDialog.tsx_
  - _Requirements: 8.1_

- [ ] 21. Implement poll deletion with confirmation
  - File: src/app/admin/polls/page.tsx (modify handleDeletePoll function)
  - Replace console.log with actual API call
  - Include vote count in confirmation message
  - Refresh list after successful deletion
  - Show error toast on failure
  - _Leverage: src/lib/api/admin-polls.ts, useConfirmation hook_
  - _Requirements: 8.3, 8.4, 8.5_

- [x] 22. Create poll status calculation utility
  - File: src/lib/utils/poll-status.ts (new)
  - Implement getPollStatus function based on dates
  - Return 'draft', 'scheduled', 'active', or 'ended'
  - Export for use in components
  - Add unit tests for date logic
  - _Leverage: Date utilities_
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 23. Update PollCard to show real status
  - File: src/components/admin/PollCard.tsx (modify)
  - Import poll status utility
  - Calculate status from start/end dates
  - Update status badge display
  - Show countdown for ending soon polls
  - _Leverage: src/lib/utils/poll-status.ts_
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 24. Add poll statistics fetching
  - File: src/lib/api/admin-polls.ts (modify)
  - Add getPollStatistics function
  - Fetch vote counts and participation data
  - Parse response into statistics interface
  - Export for dashboard use
  - _Leverage: Existing API patterns_
  - _Requirements: 1.1_

- [ ] 25. Update stats cards with real data
  - File: src/app/admin/polls/page.tsx (modify)
  - Fetch poll statistics on mount
  - Update StatsCard components with real values
  - Calculate percentages and trends
  - Handle loading state for stats
  - _Leverage: src/lib/api/admin-polls.ts_
  - _Requirements: 1.1_

- [ ] 26. Implement poll filtering logic
  - File: src/app/admin/polls/page.tsx (modify filteredPolls)
  - Apply type filter to real poll data
  - Apply status filter using poll status utility
  - Implement search across title and description
  - Maintain filter state across refreshes
  - _Leverage: src/lib/utils/poll-status.ts_
  - _Requirements: 1.1_

- [ ] 27. Add batch delete API calls
  - File: src/app/admin/polls/page.tsx (modify handleBatchDelete)
  - Implement API calls for batch deletion
  - Show progress during batch operations
  - Update selection state after completion
  - Handle partial failures gracefully
  - _Leverage: src/lib/api/admin-polls.ts_
  - _Requirements: 8.3, 8.5_

- [x] 28. Update public polls API to filter by status
  - File: src/lib/api/polls.ts (modify getActivePolls)
  - Filter polls where current date is between start/end
  - Exclude scheduled future polls
  - Include show_results field in response
  - Sort by start_date descending
  - _Leverage: Existing API structure_
  - _Requirements: 7.1, 7.2_

- [x] 29. Update public polls API for past polls
  - File: src/lib/api/polls.ts (modify getPastPolls)
  - Filter polls where end_date < current date
  - Always include results for ended polls
  - Include show_results field
  - Implement pagination support
  - _Leverage: Existing API structure_
  - _Requirements: 7.4_

- [x] 30. Update public PollCard for result visibility
  - File: src/components/polls/PollCard.tsx (modify)
  - Check show_results setting from poll data
  - Show results based on visibility rules
  - Handle "after_voting", "always", "when_ended" cases
  - Respect hasVoted prop for result display
  - _Leverage: Existing component structure_
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 31. Add image display to public PollCard options
  - File: src/components/polls/PollCard.tsx (modify)
  - Display option images when available
  - Add fallback for missing images
  - Implement responsive image sizing
  - Include alt text for accessibility
  - _Leverage: Existing component structure_
  - _Requirements: 3.5_

- [x] 32. Create poll preview endpoint
  - File: src/app/api/admin/polls/[id]/preview/route.ts (new)
  - Implement GET endpoint for poll preview
  - Return poll as it would appear publicly
  - Include preview_mode flag
  - Require admin authentication
  - _Leverage: src/lib/db/polls.ts_
  - _Requirements: 1.1_

- [x] 33. Add preview button to admin poll actions
  - File: src/components/admin/PollCard.tsx (modify)
  - Add preview button to action buttons
  - Open preview in new tab/modal
  - Pass preview URL with poll ID
  - Include preview icon
  - _Leverage: Existing button patterns_
  - _Requirements: 1.1_

- [x] 34. Install drag-and-drop library
  - File: package.json (modify)
  - Add @dnd-kit/sortable to dependencies
  - Add @dnd-kit/core to dependencies
  - Run npm install to update lock file
  - Verify installation success
  - _Leverage: npm package management_
  - _Requirements: 4.5_

- [x] 35. Add drag-and-drop to PollItemsManager
  - File: src/components/admin/PollItemsManager.tsx (modify)
  - Import DndContext and sortable components
  - Wrap items in sortable container
  - Add drag handles to each item
  - Update display_order on reorder
  - _Leverage: @dnd-kit/sortable library_
  - _Requirements: 4.5_

- [x] 36. Add form validation feedback
  - File: src/components/admin/PollDialog.tsx (modify)
  - Display inline errors for invalid fields
  - Show validation on blur and submit
  - Highlight required fields with asterisks
  - Add success toast on save
  - _Leverage: React Hook Form validation_
  - _Requirements: 1.3_

- [x] 37. Create loading skeleton component for polls
  - File: src/components/admin/PollSkeleton.tsx (new)
  - Create skeleton card matching poll card layout
  - Add shimmer animation effect
  - Export for use in polls page
  - Make responsive for grid/list views
  - _Leverage: Tailwind CSS animations_
  - _Requirements: Performance_

- [x] 38. Add loading skeletons to poll list
  - File: src/app/admin/polls/page.tsx (modify)
  - Import PollSkeleton component
  - Display skeletons during loading
  - Show appropriate number based on view mode
  - Remove skeletons when data loads
  - _Leverage: src/components/admin/PollSkeleton.tsx_
  - _Requirements: Performance_

- [x] 39. Add error boundary for poll page
  - File: src/app/admin/polls/error.tsx (new)
  - Create error boundary component
  - Display user-friendly error message
  - Include retry action button
  - Log errors for debugging
  - _Leverage: Next.js error boundary pattern_
  - _Requirements: Reliability_

- [x] 40. Add unsaved changes warning
  - File: src/components/admin/PollDialog.tsx (modify)
  - Track form dirty state from usePollForm
  - Show warning dialog on close with unsaved changes
  - Implement beforeunload listener
  - Provide save/discard/cancel options
  - _Leverage: src/hooks/usePollForm.ts_
  - _Requirements: Reliability_

- [x] 41. Add search debouncing to polls page
  - File: src/app/admin/polls/page.tsx (modify)
  - Import useDebounce hook or create inline
  - Debounce search query by 300ms
  - Update filtered results after delay
  - Prevent excessive filtering calls
  - _Leverage: React hooks_
  - _Requirements: Performance_

- [x] 42. Add memo to PollCard component
  - File: src/components/admin/PollCard.tsx (modify)
  - Wrap component in React.memo
  - Define props comparison function
  - Prevent unnecessary re-renders
  - Test performance improvement
  - _Leverage: React.memo_
  - _Requirements: Performance_

- [x] 43. Add keyboard shortcuts handler
  - File: src/app/admin/polls/page.tsx (modify)
  - Add useEffect for keyboard listeners
  - Implement Cmd/Ctrl+N for new poll
  - Add Escape to close dialog
  - Handle Delete key for selected polls
  - _Leverage: Keyboard event patterns_
  - _Requirements: Usability_

- [x] 44. Add keyboard shortcut tooltips
  - File: src/app/admin/polls/page.tsx (modify)
  - Add title attributes with shortcuts
  - Update button hover text
  - Include platform-specific keys
  - Display in help text
  - _Leverage: Existing tooltip patterns_
  - _Requirements: Usability_

- [x] 45. Enhance poll export with full data
  - File: src/lib/utils/poll-export.ts (modify)
  - Add function to export poll with all fields
  - Include poll options in export
  - Add vote statistics to export
  - Format dates in readable format
  - _Leverage: Existing export functions_
  - _Requirements: 1.1_

- [x] 46. Add CSV export for poll results
  - File: src/lib/utils/poll-export.ts (modify)
  - Create CSV generation for results
  - Include headers for poll metadata
  - Add rows for each option with votes
  - Handle special characters properly
  - _Leverage: CSV generation patterns_
  - _Requirements: 1.1_

- [x] 47. Write integration test for poll creation
  - File: tests/integration/admin-polls.test.ts (new)
  - Test poll creation with options
  - Verify database persistence
  - Check all fields saved correctly
  - Assert response structure
  - _Leverage: Existing test utilities_
  - _Requirements: 6.2_

- [x] 48. Write integration test for cache invalidation
  - File: tests/integration/admin-polls.test.ts (modify)
  - Test cache cleared after poll creation
  - Verify cache cleared after update
  - Check cache cleared after deletion
  - Assert fresh data fetched
  - _Leverage: Cache testing patterns_
  - _Requirements: 6.4_

- [x] 49. Write integration test for transaction rollback
  - File: tests/integration/admin-polls.test.ts (modify)
  - Test rollback on poll creation error
  - Verify no partial data saved
  - Check error response returned
  - Assert database state unchanged
  - _Leverage: Transaction testing patterns_
  - _Requirements: 6.2_

- [x] 50. Run migration to add show_results column
  - File: Manual database operation
  - Execute migration from task 2
  - Verify column added successfully
  - Check default values set
  - Test column in queries
  - _Leverage: Database migration process_
  - _Requirements: 5.1_