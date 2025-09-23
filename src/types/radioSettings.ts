/**
 * TypeScript interfaces for radio stream testing functionality
 * Provides type safety for stream testing, audio preview, and metadata display
 */

/**
 * Radio stream configuration data interface
 * Maps to the radio_settings database table structure for admin settings management
 * Supports requirements 1.1 and 2.1 for stream URL configuration
 */
export interface StreamConfigurationData {
  /** Unique identifier for the configuration */
  id: number;
  /** Primary stream URL for radio broadcasting */
  stream_url: string;
  /** Optional metadata URL for stream information */
  metadata_url: string | null;
  /** Display name of the radio station */
  station_name: string;
  /** Optional description of the radio station */
  station_description: string | null;
  /** Facebook social media URL */
  facebook_url: string | null;
  /** Twitter social media URL */
  twitter_url: string | null;
  /** Instagram social media URL */
  instagram_url: string | null;
  /** YouTube social media URL */
  youtube_url: string | null;
  /** Whether this configuration is currently active */
  is_active: boolean;
  /** ID of the user who last updated this configuration */
  updated_by: number | null;
  /** When this configuration was created */
  created_at: Date;
  /** When this configuration was last updated */
  updated_at: Date;
}

/**
 * Result interface for stream connectivity testing
 * Used to track test outcomes with detailed information
 */
export interface StreamTestResult {
  /** Whether the stream test was successful */
  success: boolean;
  /** Human-readable message about the test result */
  message: string;
  /** ISO timestamp when the test was performed */
  timestamp: string;
  /** Additional technical details about the test */
  details?: {
    /** HTTP status code if applicable */
    statusCode?: number;
    /** Response time in milliseconds */
    responseTime?: number;
    /** Error code for failed tests */
    errorCode?: string;
    /** Technical error message */
    errorMessage?: string;
  };
}

/**
 * URL validation result interface for format validation feedback
 * Provides detailed validation feedback for stream URL input fields
 * Supports requirement 2.1 for URL format validation
 */
export interface URLValidationResult {
  /** Whether the URL format is valid */
  isValid: boolean;
  /** Human-readable validation message */
  message: string;
  /** Specific validation error type if invalid */
  errorType?: 'format' | 'protocol' | 'length' | 'hostname' | 'unreachable';
  /** Suggested corrections for invalid URLs */
  suggestions?: string[];
  /** Additional validation details */
  details?: {
    /** Whether the URL protocol is supported (http/https) */
    protocolValid?: boolean;
    /** Whether the URL length is within limits */
    lengthValid?: boolean;
    /** Whether the hostname is valid */
    hostnameValid?: boolean;
    /** Parsed URL components for debugging */
    parsedUrl?: {
      protocol: string;
      hostname: string;
      port?: number;
      pathname: string;
    };
  };
}

/**
 * Metadata information extracted from audio streams
 * Contains stream technical details and current playing information
 */
export interface StreamMetadata {
  /** Current stream title or song name */
  streamTitle?: string;
  /** Audio bitrate in kbps (e.g., 128, 320) */
  bitrate?: number;
  /** Audio format/codec (e.g., 'MP3', 'AAC', 'OGG') */
  audioFormat?: string;
  /** Server information and software details */
  serverInfo?: {
    /** Server software name (e.g., 'Icecast', 'Shoutcast') */
    software?: string;
    /** Server version */
    version?: string;
    /** Server description */
    description?: string;
  };
  /** Additional stream metadata */
  extra?: {
    /** Stream genre */
    genre?: string;
    /** Stream URL being tested */
    url?: string;
    /** Content type header */
    contentType?: string;
    /** Sample rate in Hz */
    sampleRate?: number;
    /** Number of audio channels */
    channels?: number;
  };
}

/**
 * State management for audio preview functionality
 * Tracks playback state independently from main radio player
 */
export interface AudioPreviewState {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Whether audio is in loading state */
  isLoading: boolean;
  /** Current stream URL being previewed */
  currentUrl: string | null;
  /** Error message if preview failed */
  error: string | null;
  /** Volume level (0-1) for preview player */
  volume?: number;
  /** Current playback time in seconds */
  currentTime?: number;
  /** Duration of the stream (may be unknown for live streams) */
  duration?: number;
}

/**
 * Supported audio formats for stream validation
 */
export enum AudioFormat {
  MP3 = 'MP3',
  AAC = 'AAC',
  OGG = 'OGG',
  FLAC = 'FLAC'
}

/**
 * Supported streaming server types
 */
export enum ServerType {
  Shoutcast = 'Shoutcast',
  Icecast = 'Icecast'
}

/**
 * Extended radio settings form data interface
 * Includes existing fields plus stream testing capabilities
 */
export interface RadioSettingsFormData {
  /** Station display name */
  stationName: string;
  /** Station description */
  description: string;
  /** Primary stream URL */
  streamUrl: string;
  /** Optional backup stream URL */
  backupStreamUrl?: string;
  /** Station website URL */
  websiteUrl?: string;
  /** Social media URL */
  socialUrl?: string;
  /** Optional test results for stream validation */
  testResults?: StreamTestResult;
  /** Optional audio preview state for testing */
  previewState?: AudioPreviewState;
  /** Optional metadata from stream testing */
  metadata?: StreamMetadata;
}

/**
 * Stream test request parameters
 * Used for API calls to test stream connectivity
 */
export interface StreamTestRequest {
  /** Stream URL to test */
  url: string;
  /** Timeout in seconds (default: 10) */
  timeout?: number;
  /** Whether to extract metadata during test */
  includeMetadata?: boolean;
}

/**
 * Stream test response from API
 * Combines test result with optional metadata
 */
export interface StreamTestResponse {
  /** Test result information */
  result: StreamTestResult;
  /** Stream metadata if available */
  metadata?: StreamMetadata;
  /** Rate limiting information */
  rateLimit?: {
    /** Remaining tests allowed */
    remaining: number;
    /** Rate limit reset time */
    resetTime: string;
    /** Maximum tests per time window */
    limit: number;
  };
}