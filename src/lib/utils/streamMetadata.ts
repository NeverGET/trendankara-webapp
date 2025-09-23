/**
 * Stream Metadata Extraction Utility
 * Centralized parsing logic for Shoutcast/Icecast stream metadata
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { StreamMetadata, ServerType, AudioFormat } from '@/types/radioSettings';

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