# Requirements Document - Admin Radio Stream Settings

## Introduction

The Admin Radio Stream Settings feature enables administrators to manage radio streaming URLs, test stream connectivity, preview audio playback, and view stream metadata. This feature ensures continuous radio service by allowing admins to efficiently update streaming sources, validate their functionality, and confirm audio quality before making changes live. It supports the core radio player functionality while maintaining the platform's principle of simplicity and reliability.

## Alignment with Product Vision

This feature directly supports several key product goals:

- **Live Radio Player Core Functionality**: Enables admins to maintain continuous streaming without interruption during source changes, supporting the "always-on player that maintains state across the entire site"
- **Admin Efficiency**: Streamlines content management workflow for administrators, aligning with the goal of "simplify content management for administrators"
- **Stream Stability and Uptime**: Provides tools to test and validate streams before deployment, supporting the "99.9% uptime for radio player" performance requirement
- **Professional Web Presence**: Ensures reliable streaming service that maintains the platform's professional radio station aesthetic
- **Simplicity Principle**: Follows the core motto "Keep it basic, don't overcomplicate anything" with straightforward URL management interface

## Requirements

### Requirement 1: Stream URL Management

**User Story:** As an admin, I want to edit the radio stream URL, so that I can update the streaming source when technical changes or service migrations occur.

#### Acceptance Criteria

1. WHEN an admin accesses the radio settings page THEN the system SHALL display the current stream URL in an editable input field
2. WHEN an admin modifies the URL value THEN the system SHALL validate the URL format in real-time using debounced validation
3. WHEN the URL format is invalid THEN the system SHALL display "Geçerli bir URL girin (http:// veya https:// ile başlamalı)" error message
4. WHEN an admin attempts to save changes THEN the system SHALL require explicit confirmation before updating the live stream
5. IF the save operation fails THEN the system SHALL preserve the original working URL and display error feedback

### Requirement 2: Stream URL Validation

**User Story:** As an admin, I want to test if a stream URL is valid and accessible, so that I can verify connectivity before making the URL live.

#### Acceptance Criteria

1. WHEN an admin enters a stream URL THEN the system SHALL display a "Stream URL Test Et" button
2. WHEN an admin clicks the test button AND the URL is empty THEN the system SHALL display "Lütfen test etmek için bir stream URL'si girin" message
3. WHEN an admin clicks the test button AND the URL format is invalid THEN the system SHALL display "Geçerli bir URL formatı girin" message
4. WHEN the test is initiated THEN the system SHALL attempt connection with a 10-second timeout
5. IF the stream test succeeds THEN the system SHALL display success feedback with connection details (status code, response time, content type)
6. IF the stream test fails THEN the system SHALL display failure feedback with specific error information
7. WHEN multiple test requests are made THEN the system SHALL enforce rate limiting of 10 tests per minute per user

### Requirement 3: Audio Preview Functionality

**User Story:** As an admin, I want to preview audio playback from a stream URL, so that I can confirm audio quality and content before making changes live.

#### Acceptance Criteria

1. WHEN a stream URL test is successful THEN the system SHALL display a "Preview" or play button
2. WHEN an admin clicks the preview button THEN the system SHALL start streaming audio from the tested URL within 3 seconds
3. WHEN preview audio is playing THEN the system SHALL display pause/stop controls
4. WHEN an admin stops the preview THEN the audio SHALL cease immediately without affecting the main radio player
5. IF the admin navigates away from the page THEN the system SHALL automatically stop preview audio
6. WHEN preview audio is active THEN the system SHALL ensure it operates independently from the main site radio player
7. IF preview audio fails to start THEN the system SHALL display "Önizleme başlatılamadı" error message

### Requirement 4: Stream Metadata Display

**User Story:** As an admin, I want to view stream metadata when a URL test is successful, so that I can verify stream information and current content details.

#### Acceptance Criteria

1. WHEN a stream URL test succeeds THEN the system SHALL attempt to extract available metadata
2. IF metadata is available THEN the system SHALL display stream title/name, bitrate, audio format (MP3, AAC, etc.), and server information
3. IF current playing content metadata is available THEN the system SHALL display the current song/content information
4. WHEN metadata changes during the session THEN the system SHALL update the displayed information dynamically
5. IF no metadata is available THEN the system SHALL display "Metadata bilgisi mevcut değil" message
6. WHEN metadata extraction fails THEN the system SHALL not prevent successful URL validation

## Non-Functional Requirements

### Performance
- Stream URL validation SHALL complete within 10 seconds maximum
- Preview audio playback SHALL start within 3 seconds of user interaction
- Real-time URL format validation SHALL respond within 500ms using debounced input
- Metadata extraction SHALL not delay stream validation beyond the 10-second limit

### Security
- Only authenticated administrators SHALL access stream settings functionality
- Stream URL modification SHALL require admin role verification (admin or super_admin)
- Rate limiting SHALL prevent abuse with maximum 10 test requests per minute per user
- Stream testing SHALL not expose internal network information in error messages

### Reliability
- Stream validation accuracy SHALL exceed 95% for correctly formatted URLs
- Original stream URL SHALL be preserved until explicit admin confirmation of changes
- System SHALL handle network timeouts gracefully without affecting main radio player
- Preview audio SHALL operate independently without interfering with live radio functionality

### Usability
- Interface SHALL be responsive and accessible on desktop and tablet devices
- All error messages SHALL be displayed in Turkish with clear, actionable guidance
- Form validation SHALL provide immediate feedback for URL format errors
- Success and failure states SHALL be clearly differentiated with appropriate visual indicators

## Business Rules
- Only users with 'admin' or 'super_admin' roles can access stream settings
- Stream URL changes require explicit confirmation before being applied to live radio player
- Invalid or unreachable URLs cannot be saved as the primary stream URL
- Preview playback is limited to admin interface and must not affect public radio player
- Original stream configuration is preserved during testing and preview operations
- System maintains backward compatibility with existing RadioPlayerContext

## Edge Cases
- Handle URLs that are temporarily unavailable due to server maintenance
- Manage streams that require authentication headers or special protocols
- Deal with URLs that redirect to different endpoints (follow redirects appropriately)
- Handle streams with no metadata or incomplete metadata information
- Manage network timeouts during testing without blocking the interface
- Handle concurrent admin access to stream settings (last save wins with warning)
- Manage preview audio conflicts if multiple admin sessions attempt preview simultaneously

## Dependencies
- Existing admin authentication system (NextAuth.js configuration)
- Current RadioPlayerContext and radio player implementation
- Media handling capabilities and audio element management
- Form validation system using react-hook-form
- Rate limiting middleware infrastructure
- Database queries for radio settings (getActiveSettings, updateSettings functions)

## Success Metrics
- Administrators can successfully test and update stream URLs without service disruption
- Stream validation accuracy exceeds 95% for properly formatted URLs
- Preview functionality works reliably across supported browsers
- Metadata displays correctly when available from streaming sources
- Zero disruption to main radio player functionality during admin stream management
- Admin workflow completion time for stream updates under 2 minutes including testing