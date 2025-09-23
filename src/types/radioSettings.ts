/**
 * TypeScript interfaces for radio stream testing functionality
 * Provides type safety for stream testing, audio preview, and metadata display
 */

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