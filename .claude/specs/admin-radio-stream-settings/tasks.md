# Implementation Plan - Admin Radio Stream Settings

## Task Overview
This implementation plan breaks down the admin radio stream settings feature into atomic, executable coding tasks following the 4-phase approach outlined in the design. Each task is designed to be completable in 15-30 minutes by an experienced developer and touches 1-3 related files maximum.

## Steering Document Compliance
All tasks follow structure.md conventions for file organization and tech.md patterns for component architecture. Tasks leverage existing components, maintain TypeScript type safety, and follow established admin panel patterns while extending current radio settings functionality.

## Atomic Task Requirements
**Each task meets these criteria for optimal agent execution:**
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

## Good vs Bad Task Examples
❌ **Bad Examples (Too Broad)**:
- "Implement stream testing system" (affects many files, multiple purposes)
- "Add complete radio settings enhancements" (vague scope, no file specification)
- "Build stream validation with metadata and preview" (too large, multiple components)

✅ **Good Examples (Atomic)**:
- "Create StreamTestResult interface in types/radioSettings.ts with success/error properties"
- "Add handleTestStream function to RadioSettingsForm.tsx with loading state"
- "Create AudioPreviewPlayer component in components/admin/ with play/pause controls"

## Tasks

### Phase 1: Core Infrastructure and Data Models

- [x] 1. Create TypeScript interfaces for stream testing in src/types/radioSettings.ts
  - File: src/types/radioSettings.ts
  - Define StreamTestResult interface with success, message, timestamp, details properties
  - Add StreamMetadata interface with streamTitle, bitrate, audioFormat, serverInfo
  - Include AudioPreviewState interface with isPlaying, isLoading, currentUrl, error
  - Purpose: Establish type safety for stream testing data structures
  - _Leverage: existing types structure, current RadioSettingsFormData interface_
  - _Requirements: 2.1, 3.1, 4.1_

- [x] 2. Extend RadioSettingsFormData interface in src/types/radioSettings.ts
  - File: src/types/radioSettings.ts (continue from task 1)
  - Add optional testResults, previewState, metadata properties to existing interface
  - Create enum for AudioFormat (MP3, AAC, OGG, FLAC) and ServerType (Shoutcast, Icecast)
  - Export all new interfaces and maintain backward compatibility
  - Purpose: Extend form data type with new testing capabilities
  - _Leverage: existing RadioSettingsFormData structure_
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 3. Create useAudioPreview hook in src/hooks/useAudioPreview.ts
  - File: src/hooks/useAudioPreview.ts
  - Implement audio element creation with play/pause/stop functions
  - Add volume control and loading state management
  - Include automatic cleanup with useEffect cleanup function
  - Return preview state and control functions
  - Purpose: Provide isolated audio preview functionality
  - _Leverage: src/hooks/useRadioPlayer.ts patterns, existing audio handling_
  - _Requirements: 3.1, 3.2, 3.3, 3.6_

- [x] 4. Create metadata extraction utility in src/lib/utils/streamMetadata.ts
  - File: src/lib/utils/streamMetadata.ts
  - Implement parseStreamHeaders function for Shoutcast/Icecast metadata parsing
  - Add getCurrentSong function for real-time metadata extraction
  - Include server type detection utility (Shoutcast vs Icecast)
  - Add timeout handling and error recovery functions
  - Purpose: Centralize metadata parsing logic for reuse
  - _Leverage: existing utility patterns, error handling_
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Enhance stream test API with metadata in src/app/api/admin/settings/radio/test/route.ts
  - File: src/app/api/admin/settings/radio/test/route.ts (modify existing)
  - Add metadata extraction call to existing testStreamConnection function
  - Include parsed metadata in success response alongside existing details
  - Maintain backward compatibility with current API response format
  - Purpose: Extend stream validation to include metadata information
  - _Leverage: existing stream test implementation, rate limiting, auth middleware_
  - _Requirements: 2.4, 4.1, 4.2_

### Phase 2: Individual UI Components

- [x] 6. Create StreamTestResult component in src/components/admin/StreamTestResult.tsx
  - File: src/components/admin/StreamTestResult.tsx
  - Display test status using Card component with success/error styling
  - Show connection details (response time, status code, content type) in organized layout
  - Include retry button using existing Button component
  - Add proper TypeScript props interface with TestResultData
  - Purpose: Provide visual feedback for stream test results
  - _Leverage: src/components/ui/Card.tsx, src/components/ui/Button.tsx_
  - _Requirements: 2.4, 2.5, 2.6_

- [x] 7. Create AudioPreviewPlayer component in src/components/admin/AudioPreviewPlayer.tsx
  - File: src/components/admin/AudioPreviewPlayer.tsx
  - Implement play/pause/stop controls using Button component
  - Add volume slider and loading spinner integration
  - Use useAudioPreview hook for audio functionality
  - Include error display for failed audio loading with Turkish messages
  - Purpose: Provide audio preview interface independent from main player
  - _Leverage: src/components/ui/Button.tsx, src/components/ui/LoadingSpinner.tsx, src/hooks/useAudioPreview.ts_
  - _Requirements: 3.1, 3.2, 3.3, 3.7_

- [x] 8. Create MetadataDisplay component in src/components/admin/MetadataDisplay.tsx
  - File: src/components/admin/MetadataDisplay.tsx
  - Show stream metadata in organized Card layout with labeled sections
  - Display stream title, bitrate, format, current song information
  - Include server information section with type and version
  - Add "Metadata bilgisi mevcut değil" message for missing data
  - Purpose: Organize and display extracted stream metadata
  - _Leverage: src/components/ui/Card.tsx, existing data display patterns_
  - _Requirements: 4.2, 4.3, 4.5_

- [x] 9. Create StreamTestButton component in src/components/admin/StreamTestButton.tsx
  - File: src/components/admin/StreamTestButton.tsx
  - Implement test button with loading state using existing Button component
  - Add rate limiting feedback with countdown timer
  - Include Turkish error messages for empty URL and format validation
  - Handle test API call and return results to parent component
  - Purpose: Encapsulate stream testing functionality in reusable component
  - _Leverage: src/components/ui/Button.tsx, src/components/ui/LoadingSpinner.tsx_
  - _Requirements: 2.1, 2.2, 2.3, 2.7_

- [x] 10. Create StreamPreviewSection component in src/components/admin/StreamPreviewSection.tsx
  - File: src/components/admin/StreamPreviewSection.tsx
  - Combine AudioPreviewPlayer and MetadataDisplay in single section
  - Add conditional rendering based on successful test results
  - Include section title and organized layout using Card wrapper
  - Handle preview state management for parent form
  - Purpose: Group preview and metadata functionality in organized section
  - _Leverage: src/components/admin/AudioPreviewPlayer.tsx, src/components/admin/MetadataDisplay.tsx_
  - _Requirements: 3.1, 4.1, 4.2_

### Phase 3: Form Integration and Enhanced Features

- [x] 11. Add stream test integration to RadioSettingsForm in src/components/admin/RadioSettingsForm.tsx
  - File: src/components/admin/RadioSettingsForm.tsx (modify existing)
  - Import and integrate StreamTestButton component after stream URL input
  - Add testResults state management to existing form state
  - Handle test success/failure with StreamTestResult component display
  - Maintain existing form validation and submission logic
  - Purpose: Integrate stream testing functionality into existing form
  - _Leverage: existing form structure, new StreamTestButton and StreamTestResult components_
  - _Requirements: 1.1, 2.1, 2.4_

- [x] 12. Add preview section to RadioSettingsForm in src/components/admin/RadioSettingsForm.tsx
  - File: src/components/admin/RadioSettingsForm.tsx (continue from task 11)
  - Import and conditionally render StreamPreviewSection component
  - Show preview section only after successful stream test
  - Add preview cleanup on form unmount or URL change
  - Maintain independence from main radio player
  - Purpose: Add audio preview and metadata display to form
  - _Leverage: existing form layout, new StreamPreviewSection component_
  - _Requirements: 3.1, 3.5, 4.1_

- [x] 13. Add confirmation dialog for URL changes in src/components/admin/RadioSettingsForm.tsx
  - File: src/components/admin/RadioSettingsForm.tsx (continue from task 12)
  - Import ConfirmDialog and show before form submission when URL changed
  - Display current vs new URL comparison in dialog
  - Add Turkish confirmation message "Stream URL'si değiştirilecek, onaylıyor musunuz?"
  - Preserve original URL until user confirms
  - Purpose: Add safety mechanism for critical stream URL changes
  - _Leverage: src/components/ui/ConfirmDialog.tsx, existing modal patterns_
  - _Requirements: 1.4, 1.5_

- [x] 14. Create metadata update endpoint in src/app/api/admin/settings/radio/metadata/route.ts
  - File: src/app/api/admin/settings/radio/metadata/route.ts
  - Implement POST endpoint for real-time metadata updates during preview
  - Add admin authentication check and rate limiting
  - Return current stream metadata without full validation
  - Include proper error handling and Turkish error messages
  - Purpose: Enable real-time metadata updates during preview sessions
  - _Leverage: existing API patterns, auth middleware, metadata utilities_
  - _Requirements: 4.3, 4.4_

- [x] 15. Add real-time metadata updates to MetadataDisplay in src/components/admin/MetadataDisplay.tsx
  - File: src/components/admin/MetadataDisplay.tsx (modify existing)
  - Add useEffect to poll metadata endpoint during preview sessions
  - Include metadata refresh functionality with loading state
  - Handle polling cleanup when preview stops
  - Add error handling for failed metadata updates
  - Purpose: Provide dynamic metadata updates during audio preview
  - _Leverage: existing component structure, new metadata API endpoint_
  - _Requirements: 4.3, 4.4_

### Phase 4: Testing and Validation

- [x] 16. Create unit tests for useAudioPreview hook in src/hooks/__tests__/useAudioPreview.test.ts
  - File: src/hooks/__tests__/useAudioPreview.test.ts
  - Test audio element creation and cleanup with mocked audio
  - Verify play/pause/stop functionality with state changes
  - Test error handling and loading states
  - Validate volume control and preview independence
  - Purpose: Ensure audio preview hook reliability
  - _Leverage: existing test patterns, audio mocking utilities_
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 17. Create unit tests for StreamTestResult component in src/components/admin/__tests__/StreamTestResult.test.tsx
  - File: src/components/admin/__tests__/StreamTestResult.test.tsx
  - Test success and error state rendering with different props
  - Verify connection details display formatting
  - Test retry button click functionality
  - Validate Turkish message display
  - Purpose: Ensure test result component displays correctly
  - _Leverage: React Testing Library patterns, existing component tests_
  - _Requirements: 2.4, 2.5, 2.6_

- [x] 18. Create unit tests for AudioPreviewPlayer component in src/components/admin/__tests__/AudioPreviewPlayer.test.tsx
  - File: src/components/admin/__tests__/AudioPreviewPlayer.test.tsx
  - Test play/pause/stop button interactions
  - Verify loading states and error display
  - Test volume control functionality
  - Mock useAudioPreview hook for isolated testing
  - Purpose: Ensure audio preview component works correctly
  - _Leverage: React Testing Library patterns, hook mocking_
  - _Requirements: 3.1, 3.2, 3.3, 3.7_

- [x] 19. Create unit tests for MetadataDisplay component in src/components/admin/__tests__/MetadataDisplay.test.tsx
  - File: src/components/admin/__tests__/MetadataDisplay.test.tsx
  - Test metadata rendering with various data combinations
  - Verify "no metadata" message display in Turkish
  - Test real-time updates functionality
  - Validate server information formatting
  - Purpose: Ensure metadata display component reliability
  - _Leverage: React Testing Library patterns, existing component tests_
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 20. Create integration tests for enhanced RadioSettingsForm in src/components/admin/__tests__/RadioSettingsForm.integration.test.tsx
  - File: src/components/admin/__tests__/RadioSettingsForm.integration.test.tsx
  - Test complete workflow from URL entry to test to preview
  - Verify form submission with confirmation dialog
  - Test error scenarios and form state preservation
  - Validate independence from main radio player
  - Purpose: Ensure all new features work together properly
  - _Leverage: existing integration test patterns, form testing utilities_
  - _Requirements: All requirements integration_

- [x] 21. Create API tests for enhanced stream test endpoint in src/app/api/admin/settings/radio/test/__tests__/route.test.ts
  - File: src/app/api/admin/settings/radio/test/__tests__/route.test.ts
  - Test metadata extraction functionality with mocked streams
  - Verify rate limiting enforcement and error responses
  - Test various stream URL formats and protocols
  - Validate timeout handling and error scenarios
  - Purpose: Ensure API enhancements work correctly
  - _Leverage: existing API test patterns, stream mocking utilities_
  - _Requirements: 2.4, 2.5, 2.6, 2.7, 4.1_

## Implementation Notes

### Dependency Order
Tasks are ordered to minimize dependencies:
1. **Phase 1** establishes core infrastructure (types, hooks, utilities)
2. **Phase 2** builds individual UI components using Phase 1 foundations
3. **Phase 3** integrates components into existing form with minimal modifications
4. **Phase 4** validates all functionality with comprehensive testing

### Atomic Component Strategy
- Each component is created independently before integration
- RadioSettingsForm is modified in three focused tasks (11-13) rather than one large task
- Supporting components handle their own logic before being composed
- This approach allows agents to work on individual pieces without complex dependencies

### Code Reuse Maximization
- Leverages existing UI components (Button, Input, Card, Modal, LoadingSpinner)
- Extends current form patterns and validation logic
- Follows established admin authentication and API patterns
- Maintains consistency with existing Turkish language support

### Quality Assurance
- Each component includes dedicated unit tests
- Integration tests verify component interactions
- API tests ensure backend functionality
- Testing tasks are atomic and focus on single components