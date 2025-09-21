# Requirements Document

## Introduction

This feature enables administrators to create and manage polls through the admin panel. Currently, the admin polls page displays dummy data and lacks functionality for creating, editing, and managing polls. This implementation will add a comprehensive poll management system with time-based scheduling, image support for poll options, and result visibility controls for the public-facing polls page.

## Alignment with Product Vision

This feature enhances the radio application's audience engagement capabilities by providing a robust polling system that connects listeners with content they care about. By enabling administrators to create time-based polls with visual elements, the platform can gather valuable audience insights while maintaining content freshness and relevance.

## Requirements

### Requirement 1: Poll Creation and Management

**User Story:** As an admin, I want to create polls with customizable settings, so that I can engage our audience with relevant questions and gather their opinions.

#### Acceptance Criteria

1. WHEN admin clicks "Yeni Anket" button THEN the system SHALL display a poll creation dialog with all necessary fields
2. WHEN creating a poll THEN the system SHALL require title, question, start date, end date, and at least 2 poll options
3. IF start date is after end date THEN the system SHALL display validation error "End date must be after start date"
4. WHEN poll is saved THEN the system SHALL store it in the database and display it in the polls list
5. IF poll creation fails THEN the system SHALL display an error message and preserve entered data

### Requirement 2: Time-Based Poll Scheduling

**User Story:** As an admin, I want to schedule polls with specific start and end dates, so that polls automatically activate and deactivate based on the timeline.

#### Acceptance Criteria

1. WHEN setting poll dates THEN the system SHALL allow selecting future start dates from today onwards
2. WHEN current date/time is between start and end dates THEN the system SHALL mark poll as "active"
3. WHEN current date/time is before start date THEN the system SHALL mark poll as "scheduled"
4. WHEN current date/time is after end date THEN the system SHALL mark poll as "ended"
5. IF poll is scheduled for future THEN the system SHALL NOT display it on public polls page until active

### Requirement 3: Image Support for Poll Options

**User Story:** As an admin, I want to add images to poll options and the poll itself, so that I can create visually engaging polls.

#### Acceptance Criteria

1. WHEN creating/editing poll options THEN the system SHALL provide image picker for each option
2. WHEN adding poll header image THEN the system SHALL allow selecting from media library
3. IF image URL is invalid THEN the system SHALL display preview error with retry option
4. WHEN image is selected THEN the system SHALL display thumbnail preview
5. IF no image is provided THEN the system SHALL display poll option without image

### Requirement 4: Poll Options Management

**User Story:** As an admin, I want to add, edit, reorder, and remove poll options dynamically, so that I can create comprehensive polls.

#### Acceptance Criteria

1. WHEN creating poll THEN the system SHALL start with 2 empty option fields
2. WHEN clicking "Add Option" THEN the system SHALL add new option field below existing ones
3. WHEN clicking remove icon on option THEN the system SHALL delete that option if more than 2 remain
4. IF only 2 options remain THEN the system SHALL disable remove buttons
5. WHEN dragging option handle THEN the system SHALL allow reordering options

### Requirement 5: Result Visibility Controls

**User Story:** As an admin, I want to control when users can see poll results, so that I can manage how voting information is revealed.

#### Acceptance Criteria

1. WHEN configuring poll THEN the system SHALL provide "Show Results" setting with options: "After voting", "Always", "When ended"
2. IF "After voting" is selected THEN public users SHALL see results only after they vote
3. IF "Always" is selected THEN public users SHALL see current results without voting
4. IF "When ended" is selected THEN public users SHALL see results only after poll end date
5. WHEN user has already voted THEN the system SHALL always show results regardless of setting

### Requirement 6: Backend API Integration

**User Story:** As an admin, I want reliable backend APIs for poll operations, so that all poll data is properly persisted and retrieved.

#### Acceptance Criteria

1. WHEN performing CRUD operations THEN the system SHALL use existing API endpoints at /api/admin/polls
2. WHEN creating poll with options THEN the system SHALL save poll and options in single transaction
3. IF API request fails THEN the system SHALL show appropriate error message
4. WHEN poll is updated THEN the system SHALL invalidate relevant caches
5. WHEN loading polls page THEN the system SHALL fetch real data instead of mock data

### Requirement 7: Public Poll Display

**User Story:** As a public user, I want to see only current and finished polls with appropriate result visibility, so that I can participate in active polls and view past results.

#### Acceptance Criteria

1. WHEN viewing public polls page THEN the system SHALL display only active and ended polls
2. IF poll is scheduled for future THEN the system SHALL NOT display it to public users
3. WHEN poll is active THEN the system SHALL show it in "Active Polls" section
4. WHEN poll has ended THEN the system SHALL show it in "Past Polls" section with results
5. IF user has voted THEN the system SHALL show results based on admin's visibility setting

### Requirement 8: Edit and Delete Operations

**User Story:** As an admin, I want to edit existing polls and delete unwanted ones, so that I can maintain accurate poll content.

#### Acceptance Criteria

1. WHEN clicking edit button on poll THEN the system SHALL open edit dialog with current data
2. WHEN editing active poll THEN the system SHALL warn about potential impact on votes
3. WHEN deleting poll THEN the system SHALL request confirmation with warning about data loss
4. IF poll has votes THEN the system SHALL include vote count in deletion warning
5. WHEN poll is deleted THEN the system SHALL perform soft delete preserving data integrity

## Non-Functional Requirements

### Performance
- Poll creation dialog SHALL open within 500ms
- Image picker SHALL load media library within 1 second
- Poll list SHALL support pagination for more than 20 items
- API responses SHALL complete within 2 seconds

### Security
- All poll operations SHALL require admin authentication
- Input validation SHALL prevent SQL injection and XSS attacks
- File uploads SHALL validate image types and sizes
- API endpoints SHALL implement rate limiting

### Reliability
- Poll creation SHALL handle network failures gracefully
- Unsaved changes SHALL prompt warning before navigation
- Database transactions SHALL ensure data consistency
- System SHALL handle concurrent poll updates

### Usability
- Interface SHALL be responsive for desktop and tablet
- Forms SHALL provide inline validation feedback
- Drag-and-drop SHALL work on touch devices
- Error messages SHALL be clear and actionable