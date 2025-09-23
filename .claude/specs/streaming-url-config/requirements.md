# Requirements Document

## Introduction

This feature enables administrators to dynamically configure the radio streaming URL through the admin settings interface, replacing the current hardcoded stream URL system. The implementation includes real-time URL validation, stream connectivity testing, automatic URL format correction, and seamless integration with the existing radio player system. This enhancement ensures stream continuity, provides administrative flexibility, and supports both web and mobile platforms with a unified configuration management system.

## Alignment with Product Vision

This feature directly supports the core motto of "Keep it basic, don't overcomplicate anything" by providing a simple administrative interface for critical radio configuration while maintaining the reliability required for 24/7 radio streaming service. It aligns with the business objective of providing reliable streaming service and simplifying content management for administrators. The implementation leverages existing radio settings database infrastructure and integrates seamlessly with the established radio player system, supporting both web and mobile app platforms as outlined in the product vision.

## Requirements

### Requirement 1: Admin Interface for Stream URL Configuration

**User Story:** As a radio station administrator, I want to edit the radio streaming URL from the admin settings page, so that I can quickly update the stream configuration without requiring code changes or deployments.

#### Acceptance Criteria

1. WHEN an administrator accesses the admin settings page (/admin/settings) THEN the system SHALL display the current streaming URL in an editable input field using ReUI components
2. WHEN an administrator modifies the streaming URL THEN the system SHALL provide real-time validation feedback before saving
3. WHEN an administrator clicks save THEN the system SHALL validate the URL format and attempt a connection test before persisting changes
4. IF the URL format is invalid THEN the system SHALL display specific error messages and prevent saving
5. WHEN a valid URL is saved successfully THEN the system SHALL show a success confirmation and trigger real-time updates to all active radio players

### Requirement 2: Stream Connectivity Testing

**User Story:** As a radio station administrator, I want to test if a streaming URL is working before saving it, so that I can ensure the radio stream will be accessible to listeners without interruption.

#### Acceptance Criteria

1. WHEN an administrator enters a streaming URL THEN the system SHALL provide a "Test Stream" button next to the input field
2. WHEN the test button is clicked THEN the system SHALL perform a HEAD request to validate connectivity within 10 seconds
3. IF the stream test succeeds THEN the system SHALL display connection details including response time, content type, and server information
4. IF the stream test fails THEN the system SHALL show specific error messages including timeout, network errors, or invalid content type
5. WHEN testing is in progress THEN the system SHALL show a loading indicator and disable the test button
6. WHEN test results are available THEN the system SHALL display metadata information including server type (Shoutcast/Icecast), bitrate, and audio format if available

### Requirement 3: URL Format Validation and Auto-Correction

**User Story:** As a radio station administrator, I want the system to automatically detect and correct common URL format issues, so that I can avoid configuration errors that would break the radio stream.

#### Acceptance Criteria

1. WHEN an administrator enters a URL ending with "/stream" THEN the system SHALL suggest removing "/stream" and using the base URL format
2. WHEN an administrator enters a URL ending with "/index.html" or similar file extensions THEN the system SHALL automatically suggest the corrected base URL format
3. IF a URL uses HTTP protocol THEN the system SHALL warn about security implications but allow the configuration
4. WHEN a URL format is automatically corrected THEN the system SHALL show a warning message explaining the change: "Corrected URL format from [old] to [new]. Shoutcast/Icecast typically require base URLs without file extensions."
5. WHEN URL validation fails THEN the system SHALL display specific guidance: "Use format: https://server:port/ (base URL without /stream or file extensions)"

### Requirement 4: Real-Time Radio Player Updates

**User Story:** As a radio station administrator, I want the radio player to automatically use the new streaming URL when I update the configuration, so that listeners experience uninterrupted service with the updated stream.

#### Acceptance Criteria

1. WHEN streaming URL is successfully updated in admin settings THEN the system SHALL broadcast a configuration update event to all active radio players
2. WHEN a radio player receives a configuration update event THEN it SHALL call the reloadConfiguration() method to fetch the new URL
3. IF the radio player is currently playing THEN it SHALL seamlessly transition to the new stream URL without stopping playback
4. WHEN transitioning to a new URL THEN the system SHALL use iOS-compatible cache-busting parameters for mobile compatibility
5. IF the new stream URL fails to connect THEN the radio player SHALL fall back to the previous working URL and log the failure
6. WHEN configuration update is complete THEN all radio player instances SHALL reflect the new stream URL and metadata

### Requirement 5: Mobile API Integration

**User Story:** As a mobile app user, I want the mobile app to automatically receive updated radio streaming configuration, so that I can access the radio stream without requiring app updates when the stream URL changes.

#### Acceptance Criteria

1. WHEN the mobile app requests radio configuration via /api/mobile/v1/radio THEN the system SHALL return the current active streaming URL from the database
2. WHEN the streaming URL is updated through admin settings THEN the mobile API endpoint SHALL immediately reflect the new configuration
3. WHEN the mobile app calls the radio API THEN the response SHALL include stream_url, metadata_url, station_name, and connection testing status
4. IF no active radio settings exist THEN the API SHALL return a fallback URL from environment variables
5. WHEN the API is called THEN it SHALL respond within 200ms as specified in product requirements
6. WHEN mobile app receives new configuration THEN it SHALL validate the stream URL before attempting to use it

### Requirement 6: Database Integration and Fallback System

**User Story:** As a system administrator, I want the radio configuration to be stored reliably in the database with automatic fallback mechanisms, so that the radio service remains available even if the primary stream URL fails.

#### Acceptance Criteria

1. WHEN an administrator updates the streaming URL THEN the system SHALL store it in the radio_settings table with is_active flag
2. WHEN saving new settings THEN the system SHALL deactivate previous settings and activate the new configuration atomically
3. IF the primary stream URL becomes unavailable THEN the system SHALL automatically attempt fallback URLs from previous configurations
4. WHEN no database settings are available THEN the system SHALL use RADIO_STREAM_URL environment variable as fallback
5. WHEN updating settings THEN the system SHALL record the admin user ID who made the change and timestamp
6. IF database operation fails THEN the system SHALL maintain existing configuration and display appropriate error messages

### Requirement 7: Comprehensive Error Handling and User Feedback

**User Story:** As a radio station administrator, I want clear feedback about any issues with stream URL configuration, so that I can quickly identify and resolve problems that could affect the radio service.

#### Acceptance Criteria

1. WHEN a stream test fails due to timeout THEN the system SHALL display "Connection timeout (10 seconds exceeded)" message
2. WHEN a stream test fails due to network error THEN the system SHALL display "Network error: [specific error details]"
3. WHEN a stream test returns non-audio content type THEN the system SHALL display "Stream URL returned unexpected content type: [type]"
4. IF URL format is completely invalid THEN the system SHALL display "Invalid URL format. Use format: https://server:port/"
5. WHEN save operation fails THEN the system SHALL display specific database error messages while protecting sensitive information
6. WHEN validation or testing is successful THEN the system SHALL display positive confirmation with stream details
7. WHEN any error occurs THEN the system SHALL maintain the previous working configuration until a valid replacement is confirmed

## Non-Functional Requirements

### Performance
- Stream connectivity tests must complete within 10 seconds maximum
- Mobile API endpoints must respond within 200ms as per product requirements
- Real-time configuration updates must propagate to radio players within 2 seconds
- Admin interface must provide immediate feedback for user actions (loading states, validation)

### Security
- Only authenticated administrators with super_admin role can modify stream URLs
- All stream URLs must use HTTPS protocol (HTTP allowed with warnings)
- URL validation must prevent injection attacks and malformed URLs
- Admin actions must be logged with user identification and timestamps

### Reliability
- System must maintain radio service continuity during URL transitions
- Automatic fallback mechanisms must activate within 5 seconds of primary URL failure
- Database operations must be atomic to prevent configuration corruption
- Failed configuration updates must not affect existing working stream URLs

### Usability
- Admin interface must use consistent ReUI components for professional appearance
- Error messages must be specific and actionable for administrators
- URL format corrections must be clearly explained to prevent confusion
- Stream testing must provide comprehensive feedback about connection status and metadata