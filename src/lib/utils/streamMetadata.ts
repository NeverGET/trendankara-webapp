/**
 * Stream Metadata Extraction Utility
 * Centralized parsing logic for Shoutcast/Icecast stream metadata
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { StreamMetadata, ServerType, AudioFormat, StreamTestResult } from '@/types/radioSettings';

/**
 * Metadata extraction result interface
 * Contains parsed metadata and any errors encountered
 */
export interface MetadataExtractionResult {
  /** Whether metadata extraction was successful */
  success: boolean;
  /** Extracted metadata if successful */
  metadata?: StreamMetadata;
  /** Error message if extraction failed */
  error?: string;
  /** Response time for metadata extraction */
  responseTime?: number;
}

/**
 * Stream headers interface for parsing server information
 */
interface StreamHeaders {
  [key: string]: string | null;
}

/**
 * Parse stream headers to extract metadata for Shoutcast/Icecast streams
 * Requirement 4.1: Extract metadata after successful stream test
 * Requirement 4.2: Display stream title, bitrate, audio format, server information
 */
export function parseStreamHeaders(headers: StreamHeaders): StreamMetadata {
  const metadata: StreamMetadata = {};

  // Parse server information and detect server type
  const serverInfo = detectServerType(headers);
  if (serverInfo) {
    metadata.serverInfo = serverInfo;
  }

  // Extract stream title (common across both server types)
  const streamTitle =
    headers['icy-name'] ||
    headers['x-audiocast-name'] ||
    headers['icy-description'] ||
    headers['server-name'];

  if (streamTitle) {
    metadata.streamTitle = streamTitle;
  }

  // Extract bitrate information
  const bitrate =
    headers['icy-br'] ||
    headers['x-audiocast-bitrate'] ||
    headers['ice-bitrate'];

  if (bitrate) {
    const bitrateNum = parseInt(bitrate, 10);
    if (!isNaN(bitrateNum)) {
      metadata.bitrate = bitrateNum;
    }
  }

  // Extract audio format from content type
  const contentType = headers['content-type'];
  if (contentType) {
    metadata.audioFormat = parseAudioFormat(contentType);

    // Store additional technical details
    metadata.extra = {
      ...metadata.extra,
      contentType: contentType,
      url: headers['icy-url'] || headers['x-audiocast-url']
    };
  }

  // Extract genre information
  const genre =
    headers['icy-genre'] ||
    headers['x-audiocast-genre'] ||
    headers['ice-genre'];

  if (genre && metadata.extra) {
    metadata.extra.genre = genre;
  }

  // Extract sample rate if available
  const sampleRate = headers['ice-samplerate'] || headers['icy-sr'];
  if (sampleRate && metadata.extra) {
    const sampleRateNum = parseInt(sampleRate, 10);
    if (!isNaN(sampleRateNum)) {
      metadata.extra.sampleRate = sampleRateNum;
    }
  }

  // Extract channel information
  const channels = headers['ice-channels'] || headers['icy-channels'];
  if (channels && metadata.extra) {
    const channelsNum = parseInt(channels, 10);
    if (!isNaN(channelsNum)) {
      metadata.extra.channels = channelsNum;
    }
  }

  return metadata;
}

/**
 * Get current playing song metadata from stream
 * Requirement 4.3: Display current playing content metadata
 * Requirement 4.4: Update metadata dynamically during sessions
 */
export async function getCurrentSong(
  streamUrl: string,
  timeout: number = 10000
): Promise<MetadataExtractionResult> {
  const startTime = Date.now();

  try {
    // Use CORS proxy for cross-origin requests to streaming servers
    const proxyUrl = `https://cros9.yayin.com.tr/${streamUrl}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Icy-MetaData': '1', // Request metadata from Shoutcast/Icecast
          'User-Agent': 'TrendAnkara-WebApp/1.0',
          'Accept': '*/*'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch metadata: ${response.status} ${response.statusText}`,
          responseTime
        };
      }

      // Convert headers to a plain object for easier processing
      const headers: StreamHeaders = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      // Parse metadata from headers
      const metadata = parseStreamHeaders(headers);

      // Extract current song from metadata if available
      const metadataInterval = headers['icy-metaint'];
      if (metadataInterval && response.body) {
        // For now, extract from headers - full metadata parsing would require
        // reading the stream body and parsing the metadata blocks
        const currentTrack = headers['icy-title'] || headers['streamtitle'];
        if (currentTrack) {
          metadata.streamTitle = currentTrack;
        }
      }

      return {
        success: true,
        metadata,
        responseTime
      };

    } finally {
      clearTimeout(timeoutId);
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    let errorMessage = 'Unknown error occurred';

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = `Metadata extraction timeout (${timeout}ms exceeded)`;
      } else if (error instanceof TypeError) {
        errorMessage = `Network error: ${error.message}`;
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
      responseTime
    };
  }
}

/**
 * Enhanced stream connectivity testing with detailed feedback
 * Requirements: 2.1, 2.2, 2.3 - Stream connectivity testing with 10-second timeout
 * Performs HEAD request to validate connectivity and extract detailed information
 */
export async function testStreamConnection(
  streamUrl: string,
  timeout: number = 10000
): Promise<StreamTestResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // Validate URL format first
    let url: URL;
    try {
      url = new URL(streamUrl);
    } catch (error) {
      return {
        success: false,
        message: 'Invalid URL format',
        timestamp,
        details: {
          errorCode: 'INVALID_URL',
          errorMessage: 'The provided URL is not in a valid format',
          responseTime: Date.now() - startTime
        }
      };
    }

    // Ensure protocol is HTTP or HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        success: false,
        message: 'Unsupported protocol. Only HTTP and HTTPS are supported',
        timestamp,
        details: {
          errorCode: 'UNSUPPORTED_PROTOCOL',
          errorMessage: `Protocol ${url.protocol} is not supported`,
          responseTime: Date.now() - startTime
        }
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Perform HEAD request for connectivity testing
      const response = await fetch(streamUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'TrendAnkara-WebApp/1.0',
          'Accept': 'audio/*,*/*',
          'Range': 'bytes=0-0' // Minimal range request to test streaming capability
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      // Extract response headers
      const headers: StreamHeaders = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      const contentType = headers['content-type'] || '';
      const serverHeader = headers['server'] || '';

      // Validate content type for audio streams
      const isAudioStream = validateAudioContentType(contentType);

      if (response.ok) {
        // Extract server information using existing functions
        const serverInfo = detectServerType(headers);
        const audioFormat = parseAudioFormat(contentType);

        // Build success message with details
        let message = 'Stream connection successful';
        const details: string[] = [];

        if (serverInfo?.software) {
          details.push(`Server: ${serverInfo.software}${serverInfo.version ? ` ${serverInfo.version}` : ''}`);
        }

        if (audioFormat) {
          details.push(`Format: ${audioFormat}`);
        }

        if (isAudioStream) {
          details.push('Audio content detected');
        }

        if (details.length > 0) {
          message += ` (${details.join(', ')})`;
        }

        return {
          success: true,
          message,
          timestamp,
          details: {
            statusCode: response.status,
            responseTime
          }
        };
      } else {
        return {
          success: false,
          message: `Stream connection failed (HTTP ${response.status})`,
          timestamp,
          details: {
            statusCode: response.status,
            responseTime,
            errorCode: 'HTTP_ERROR',
            errorMessage: `${response.status} ${response.statusText}`,
            ...(contentType && { contentType })
          }
        };
      }

    } finally {
      clearTimeout(timeoutId);
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    let errorMessage = 'Unknown error occurred';
    let errorCode = 'UNKNOWN_ERROR';

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = `Connection timeout after ${timeout}ms`;
        errorCode = 'TIMEOUT';
      } else if (error instanceof TypeError) {
        errorMessage = `Network error: ${error.message}`;
        errorCode = 'NETWORK_ERROR';
      } else {
        errorMessage = error.message;
        errorCode = 'REQUEST_ERROR';
      }
    }

    return {
      success: false,
      message: `Stream test failed: ${errorMessage}`,
      timestamp,
      details: {
        responseTime,
        errorCode,
        errorMessage
      }
    };
  }
}

/**
 * Validate content type for audio streams
 * Checks if the content type indicates an audio stream
 */
function validateAudioContentType(contentType: string): boolean {
  if (!contentType) return false;

  const audioTypes = [
    'audio/',
    'application/ogg',
    'application/octet-stream' // Some streams use this generic type
  ];

  const lowerContentType = contentType.toLowerCase();
  return audioTypes.some(type => lowerContentType.includes(type));
}

/**
 * Enhanced stream testing with metadata extraction
 * Combines connectivity testing with metadata parsing for comprehensive feedback
 */
export async function testStreamWithMetadata(
  streamUrl: string,
  timeout: number = 10000
): Promise<{
  testResult: StreamTestResult;
  metadata?: StreamMetadata;
  responseTime: number;
}> {
  const startTime = Date.now();

  // First perform connectivity test
  const testResult = await testStreamConnection(streamUrl, timeout);

  if (!testResult.success) {
    return {
      testResult,
      responseTime: testResult.details?.responseTime || (Date.now() - startTime)
    };
  }

  // If connectivity test succeeds, try to extract metadata
  try {
    const metadataResult = await getCurrentSong(streamUrl, Math.max(timeout - (Date.now() - startTime), 1000));

    return {
      testResult: {
        ...testResult,
        message: testResult.message + (metadataResult.success ? ' with metadata' : ', limited metadata')
      },
      metadata: metadataResult.metadata,
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    // Return successful connectivity test even if metadata extraction fails
    return {
      testResult: {
        ...testResult,
        message: testResult.message + ', metadata unavailable'
      },
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Detect streaming server type (Shoutcast vs Icecast)
 * Returns server information including type, version, and description
 */
export function detectServerType(headers: StreamHeaders): StreamMetadata['serverInfo'] | null {
  const server = headers['server'];
  const icyName = headers['icy-name'];
  const icyVersion = headers['icy-version'] || headers['x-audiocast-server-url'];

  // Detect Shoutcast
  if (server && server.toLowerCase().includes('shoutcast')) {
    return {
      software: ServerType.Shoutcast,
      version: extractVersionFromServer(server),
      description: icyName || undefined
    };
  }

  // Detect Icecast
  if (server && server.toLowerCase().includes('icecast')) {
    return {
      software: ServerType.Icecast,
      version: extractVersionFromServer(server),
      description: icyName || undefined
    };
  }

  // Fallback detection based on headers
  if (headers['icy-name'] || headers['icy-br'] || headers['icy-genre']) {
    // Likely Shoutcast/Icecast based on ICY headers
    return {
      software: icyVersion ? ServerType.Icecast : ServerType.Shoutcast,
      version: icyVersion || undefined,
      description: icyName || undefined
    };
  }

  return null;
}

/**
 * Parse audio format from content type header
 * Maps MIME types to human-readable audio format names
 */
export function parseAudioFormat(contentType: string): AudioFormat | undefined {
  const lowerContentType = contentType.toLowerCase();

  if (lowerContentType.includes('audio/mpeg') || lowerContentType.includes('audio/mp3')) {
    return AudioFormat.MP3;
  }

  if (lowerContentType.includes('audio/aac') || lowerContentType.includes('audio/mp4')) {
    return AudioFormat.AAC;
  }

  if (lowerContentType.includes('audio/ogg') || lowerContentType.includes('application/ogg')) {
    return AudioFormat.OGG;
  }

  if (lowerContentType.includes('audio/flac')) {
    return AudioFormat.FLAC;
  }

  // Return undefined for unknown formats
  return undefined;
}

/**
 * Extract version number from server header string
 * Handles various server header formats
 */
function extractVersionFromServer(serverHeader: string): string | undefined {
  // Match version patterns like "2.4.1", "v1.2.3", etc.
  const versionMatch = serverHeader.match(/v?(\d+(?:\.\d+)*)/i);
  return versionMatch ? versionMatch[1] : undefined;
}

/**
 * Create a timeout-aware metadata extraction function
 * Includes automatic retry logic with exponential backoff
 */
export async function extractMetadataWithRetry(
  streamUrl: string,
  options: {
    timeout?: number;
    maxRetries?: number;
    baseDelay?: number;
  } = {}
): Promise<MetadataExtractionResult> {
  const { timeout = 10000, maxRetries = 3, baseDelay = 1000 } = options;

  let lastError: string = '';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await getCurrentSong(streamUrl, timeout);

    if (result.success) {
      return result;
    }

    lastError = result.error || 'Unknown error';

    // Don't retry on the last attempt
    if (attempt < maxRetries - 1) {
      // Exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`
  };
}

/**
 * Validate extracted metadata for completeness
 * Checks if essential metadata fields are present
 */
export function validateMetadata(metadata: StreamMetadata): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  // Check for essential fields
  if (!metadata.streamTitle) {
    missingFields.push('streamTitle');
  }

  if (!metadata.serverInfo?.software) {
    missingFields.push('serverInfo.software');
  }

  if (!metadata.audioFormat) {
    missingFields.push('audioFormat');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Format metadata for display purposes
 * Returns human-readable metadata summary
 */
export function formatMetadataForDisplay(metadata: StreamMetadata): {
  title: string;
  details: string[];
} {
  const title = metadata.streamTitle || 'Unknown Stream';
  const details: string[] = [];

  if (metadata.serverInfo?.software) {
    let serverDetail = metadata.serverInfo.software;
    if (metadata.serverInfo.version) {
      serverDetail += ` ${metadata.serverInfo.version}`;
    }
    details.push(`Server: ${serverDetail}`);
  }

  if (metadata.audioFormat) {
    let audioDetail = metadata.audioFormat;
    if (metadata.bitrate) {
      audioDetail += ` @ ${metadata.bitrate}kbps`;
    }
    details.push(`Format: ${audioDetail}`);
  }

  if (metadata.extra?.genre) {
    details.push(`Genre: ${metadata.extra.genre}`);
  }

  if (metadata.extra?.sampleRate && metadata.extra?.channels) {
    details.push(`Audio: ${metadata.extra.sampleRate}Hz, ${metadata.extra.channels}ch`);
  }

  return { title, details };
}