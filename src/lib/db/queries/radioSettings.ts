import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import {
  BaseEntity,
  InsertResult,
  UpdateResult,
  DatabaseError
} from '@/types/database';
import {
  findById,
  findAll,
  updateById,
  count
} from './index';
import { db } from '@/lib/db/client';
import { StreamConfigurationData } from '@/types/radioSettings';

/**
 * Radio Settings Database Queries
 * Handles stream configuration, social media URLs, and connectivity testing
 * Implements requirements 2.1, 2.2, and 2.3 for admin radio settings management
 */

/**
 * Radio Settings Entity Interface
 * Represents the radio_settings table structure
 */
export interface RadioSettingsEntity extends BaseEntity {
  stream_url: string;
  metadata_url: string | null;
  station_name: string;
  station_description: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  is_active: boolean;
  updated_by: number | null;
}

/**
 * Stream validation result for testing connectivity
 */
export interface StreamValidationResult {
  isValid: boolean;
  statusCode?: number;
  error?: string;
  responseTime?: number;
  contentType?: string;
}

/**
 * Radio settings update data interface
 */
export interface RadioSettingsUpdateData {
  stream_url?: string;
  metadata_url?: string | null;
  station_name?: string;
  station_description?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  is_active?: boolean;
  updated_by?: number | null;
}

/**
 * Get the currently active radio settings
 * Requirement 2.1: Display current stream configuration from database
 */
export async function getActiveSettings(): Promise<RadioSettingsEntity | null> {
  try {
    // First try to get the most recently updated active settings
    // Note: radio_settings table doesn't have deleted_at column, so we skip soft delete filter
    const result = await findAll<RadioSettingsEntity>('radio_settings', {
      where: [{ column: 'is_active', operator: '=', value: true }],
      orderBy: [{ column: 'updated_at', direction: 'DESC' }],
      includeSoftDeleted: true  // Skip deleted_at filter as this table doesn't have that column
    });

    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }

    // If no active settings found, get the most recent one regardless of status
    const fallbackResult = await findAll<RadioSettingsEntity>('radio_settings', {
      orderBy: [{ column: 'updated_at', direction: 'DESC' }],
      includeSoftDeleted: true  // Skip deleted_at filter as this table doesn't have that column
    });

    if (Array.isArray(fallbackResult) && fallbackResult.length > 0) {
      return fallbackResult[0];
    }

    return null;
  } catch (error) {
    const dbError = error as DatabaseError;
    throw new Error(`Failed to get active radio settings: ${dbError.message}`);
  }
}

/**
 * Get radio settings by ID
 */
export async function getSettingsById(id: number): Promise<RadioSettingsEntity | null> {
  try {
    return await findById<RadioSettingsEntity>('radio_settings', id);
  } catch (error) {
    const dbError = error as DatabaseError;
    throw new Error(`Failed to get radio settings by ID ${id}: ${dbError.message}`);
  }
}

/**
 * Update radio settings with validation
 * Requirement 2.2: Stream URL update with validation before saving
 */
export async function updateSettings(
  id: number,
  data: RadioSettingsUpdateData
): Promise<UpdateResult> {
  try {
    // Validate stream URL if provided
    if (data.stream_url) {
      const urlValidation = validateStreamUrl(data.stream_url);
      if (!urlValidation.isValid) {
        throw new Error(`Invalid stream URL: ${urlValidation.error}`);
      }
    }

    // Validate social media URLs if provided
    const socialUrls = {
      facebook_url: data.facebook_url,
      twitter_url: data.twitter_url,
      instagram_url: data.instagram_url,
      youtube_url: data.youtube_url
    };

    for (const [key, url] of Object.entries(socialUrls)) {
      if (url && !validateUrl(url)) {
        throw new Error(`Invalid ${key.replace('_url', '')} URL: ${url}`);
      }
    }

    // Validate station name if provided
    if (data.station_name !== undefined) {
      if (typeof data.station_name !== 'string' || data.station_name.trim().length === 0) {
        throw new Error('Station name cannot be empty');
      }
      if (data.station_name.length > 255) {
        throw new Error('Station name cannot exceed 255 characters');
      }
    }

    // Validate station description length if provided
    if (data.station_description !== undefined && data.station_description !== null) {
      if (data.station_description.length > 65535) {
        throw new Error('Station description cannot exceed 65535 characters');
      }
    }

    // Update the settings
    return await updateById<RadioSettingsEntity>('radio_settings', id, data);
  } catch (error) {
    const dbError = error as DatabaseError;
    throw new Error(`Failed to update radio settings: ${dbError.message}`);
  }
}

/**
 * Test stream connection and validate stream URL
 * Requirement 2.3: Test button attempts connection to stream and displays status
 */
export async function testStreamConnection(streamUrl: string): Promise<StreamValidationResult> {
  const startTime = Date.now();

  try {
    // Basic URL validation first
    const urlValidation = validateStreamUrl(streamUrl);
    if (!urlValidation.isValid) {
      return {
        isValid: false,
        error: urlValidation.error,
        responseTime: Date.now() - startTime
      };
    }

    // Test HTTP/HTTPS connection
    const response = await fetch(streamUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000), // 10 second timeout
      headers: {
        'User-Agent': 'TrendAnkara-WebApp/1.0',
        'Accept': '*/*'
      }
    });

    const responseTime = Date.now() - startTime;
    const contentType = response.headers.get('content-type') || 'unknown';

    if (response.ok) {
      // Check if content type suggests audio stream
      const isAudioStream = contentType.includes('audio/') ||
                           contentType.includes('application/ogg') ||
                           contentType.includes('video/') || // Some streams use video mime types
                           contentType.includes('application/octet-stream');

      if (!isAudioStream) {
        return {
          isValid: false,
          statusCode: response.status,
          error: `Stream URL returned unexpected content type: ${contentType}`,
          responseTime,
          contentType
        };
      }

      return {
        isValid: true,
        statusCode: response.status,
        responseTime,
        contentType
      };
    } else {
      return {
        isValid: false,
        statusCode: response.status,
        error: `Stream URL returned status ${response.status}: ${response.statusText}`,
        responseTime,
        contentType
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let errorMessage = 'Unknown error occurred';

    if (error instanceof TypeError) {
      errorMessage = `Network error: ${error.message}`;
    } else if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = 'Connection timeout (10 seconds exceeded)';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      isValid: false,
      error: errorMessage,
      responseTime
    };
  }
}

/**
 * Validate stream URL format and protocol
 */
function validateStreamUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);

    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: 'Stream URL must use HTTP or HTTPS protocol'
      };
    }

    // Check URL length
    if (url.length > 500) {
      return {
        isValid: false,
        error: 'Stream URL cannot exceed 500 characters'
      };
    }

    // Basic hostname validation
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      return {
        isValid: false,
        error: 'Stream URL must have a valid hostname'
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
}

/**
 * Validate general URL format
 */
function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol) && url.length <= 500;
  } catch {
    return false;
  }
}

/**
 * Get all radio settings (for admin management)
 */
export async function getAllSettings(): Promise<RadioSettingsEntity[]> {
  try {
    const result = await findAll<RadioSettingsEntity>('radio_settings', {
      orderBy: [{ column: 'updated_at', direction: 'DESC' }],
      includeSoftDeleted: true  // Skip deleted_at filter as this table doesn't have that column
    });

    return Array.isArray(result) ? result : result.data;
  } catch (error) {
    const dbError = error as DatabaseError;
    throw new Error(`Failed to get all radio settings: ${dbError.message}`);
  }
}

/**
 * Count total radio settings records
 */
export async function getSettingsCount(): Promise<number> {
  try {
    return await count('radio_settings');
  } catch (error) {
    const dbError = error as DatabaseError;
    throw new Error(`Failed to count radio settings: ${dbError.message}`);
  }
}

/**
 * Activate specific radio settings (set as active and deactivate others)
 */
export async function activateSettings(id: number, updatedBy?: number): Promise<void> {
  try {
    await db.transaction(async (connection) => {
      // Deactivate all settings
      await connection.execute(
        'UPDATE radio_settings SET is_active = ?, updated_at = ? WHERE is_active = ?',
        [false, new Date(), true]
      );

      // Activate the specified settings
      const updateData: RadioSettingsUpdateData = {
        is_active: true,
        updated_by: updatedBy || null
      };

      await connection.execute(
        'UPDATE radio_settings SET is_active = ?, updated_at = ?, updated_by = ? WHERE id = ?',
        [updateData.is_active, new Date(), updateData.updated_by, id]
      );
    });
  } catch (error) {
    const dbError = error as DatabaseError;
    throw new Error(`Failed to activate radio settings: ${dbError.message}`);
  }
}

/**
 * Get fallback stream URL from environment or backup settings
 * Requirement 2.5: Fallback mechanism for failed stream connections
 */
export async function getFallbackUrl(): Promise<string | null> {
  try {
    // First, try to get from environment variables
    const envStreamUrl = process.env.RADIO_STREAM_URL;
    if (envStreamUrl) {
      console.log('Using fallback stream URL from environment:', envStreamUrl);
      return envStreamUrl;
    }

    // Then, try to get backup stream URL from database
    const settings = await findAll<RadioSettingsEntity>('radio_settings', {
      where: [
        { column: 'backup_stream_url', operator: 'IS NOT', value: null },
        { column: 'backup_stream_url', operator: '!=', value: '' }
      ],
      orderBy: [{ column: 'updated_at', direction: 'DESC' }],
      includeSoftDeleted: true  // Skip deleted_at filter as this table doesn't have that column
    });

    if (Array.isArray(settings) && settings.length > 0) {
      const backupUrl = (settings[0] as any).backup_stream_url;
      if (backupUrl) {
        console.log('Using fallback stream URL from database backup:', backupUrl);
        return backupUrl;
      }
    }

    // Finally, try to get any working stream URL from previous settings
    const allSettings = await findAll<RadioSettingsEntity>('radio_settings', {
      orderBy: [{ column: 'updated_at', direction: 'DESC' }],
      includeSoftDeleted: true  // Skip deleted_at filter as this table doesn't have that column
    });

    if (Array.isArray(allSettings) && allSettings.length > 0) {
      for (const setting of allSettings) {
        if (setting.stream_url) {
          console.log('Using fallback stream URL from previous settings:', setting.stream_url);
          return setting.stream_url;
        }
      }
    }

    console.warn('No fallback stream URL available');
    return null;
  } catch (error) {
    console.error('Error getting fallback URL:', error);
    return null;
  }
}

/**
 * Test stream URL with automatic fallback
 */
export async function testStreamConnectionWithFallback(streamUrl: string): Promise<StreamValidationResult & { usedFallback?: boolean; fallbackUrl?: string }> {
  // First test the primary URL
  const primaryResult = await testStreamConnection(streamUrl);

  if (primaryResult.isValid) {
    return primaryResult;
  }

  console.log('Primary stream URL failed, attempting fallback...');

  // If primary fails, try fallback
  const fallbackUrl = await getFallbackUrl();

  if (!fallbackUrl || fallbackUrl === streamUrl) {
    // No fallback available or fallback is same as primary
    return {
      ...primaryResult,
      error: `${primaryResult.error} (no fallback available)`
    };
  }

  console.log('Testing fallback URL:', fallbackUrl);
  const fallbackResult = await testStreamConnection(fallbackUrl);

  if (fallbackResult.isValid) {
    return {
      ...fallbackResult,
      usedFallback: true,
      fallbackUrl: fallbackUrl
    };
  }

  // Both primary and fallback failed
  return {
    ...primaryResult,
    error: `Primary: ${primaryResult.error}; Fallback: ${fallbackResult.error}`,
    usedFallback: false,
    fallbackUrl: fallbackUrl
  };
}

/**
 * Get stream URL with automatic fallback on main URL failure
 */
export async function getStreamUrlWithFallback(): Promise<{ url: string; isFallback: boolean }> {
  try {
    const settings = await getActiveSettings();

    if (settings?.stream_url) {
      // Test the main URL
      const testResult = await testStreamConnection(settings.stream_url);

      if (testResult.isValid) {
        return {
          url: settings.stream_url,
          isFallback: false
        };
      }

      console.warn('Main stream URL failed test, using fallback');
    }

    // Main URL failed or doesn't exist, get fallback
    const fallbackUrl = await getFallbackUrl();

    if (fallbackUrl) {
      return {
        url: fallbackUrl,
        isFallback: true
      };
    }

    // No fallback available, return main URL anyway
    return {
      url: settings?.stream_url || 'https://radyo.yayin.com.tr:5132/stream',
      isFallback: false
    };
  } catch (error) {
    console.error('Error getting stream URL with fallback:', error);

    // Return default fallback
    return {
      url: process.env.RADIO_STREAM_URL || 'https://radyo.yayin.com.tr:5132/stream',
      isFallback: true
    };
  }
}

/**
 * Create new radio settings record
 */
export async function createSettings(data: Omit<RadioSettingsUpdateData, 'updated_by'> & {
  stream_url: string;
  updated_by?: number;
}): Promise<InsertResult> {
  try {
    // Validate required stream URL
    const urlValidation = validateStreamUrl(data.stream_url);
    if (!urlValidation.isValid) {
      throw new Error(`Invalid stream URL: ${urlValidation.error}`);
    }

    // Validate station name
    if (!data.station_name || data.station_name.trim().length === 0) {
      throw new Error('Station name is required');
    }

    const insertData = {
      stream_url: data.stream_url,
      metadata_url: data.metadata_url || null,
      station_name: data.station_name || 'Trend Ankara Radio',
      station_description: data.station_description || null,
      facebook_url: data.facebook_url || null,
      twitter_url: data.twitter_url || null,
      instagram_url: data.instagram_url || null,
      youtube_url: data.youtube_url || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
      updated_by: data.updated_by || null
    };

    const columns = Object.keys(insertData);
    const values: any[] = Object.values(insertData);
    columns.push('created_at', 'updated_at');
    values.push(new Date(), new Date());

    const placeholders = values.map(() => '?').join(', ');
    const sql = `INSERT INTO radio_settings (${columns.join(', ')}) VALUES (${placeholders})`;

    return await db.insert(sql, values);
  } catch (error) {
    const dbError = error as DatabaseError;
    throw new Error(`Failed to create radio settings: ${dbError.message}`);
  }
}

/**
 * Atomically update stream URL configuration with database transaction
 * Requirement 6.1: Store stream URL in radio_settings table with is_active flag
 * Requirement 6.2: Deactivate previous settings and activate new configuration atomically
 * Requirement 6.5: Record admin user ID and timestamp for audit trail
 *
 * This method ensures data consistency by:
 * 1. Validating the new stream URL before database operations
 * 2. Using database transactions for atomic operations
 * 3. Deactivating all existing active configurations
 * 4. Creating new configuration record with active status
 * 5. Recording admin user tracking and proper timestamps
 *
 * @param streamConfigData - Complete stream configuration data including URL and metadata
 * @param adminUserId - ID of the admin user making the change for audit trail
 * @returns Promise resolving to the new configuration record with generated ID
 * @throws Error if stream URL validation fails or database operations fail
 */
export async function updateStreamUrlAtomic(
  streamConfigData: Omit<StreamConfigurationData, 'id' | 'created_at' | 'updated_at'>,
  adminUserId: number
): Promise<StreamConfigurationData> {
  try {
    // Pre-validation: Validate stream URL before starting transaction
    const urlValidation = validateStreamUrl(streamConfigData.stream_url);
    if (!urlValidation.isValid) {
      throw new Error(`Invalid stream URL: ${urlValidation.error}`);
    }

    // Validate required station name
    if (!streamConfigData.station_name || streamConfigData.station_name.trim().length === 0) {
      throw new Error('Station name is required for stream configuration');
    }

    // Validate station name length
    if (streamConfigData.station_name.length > 255) {
      throw new Error('Station name cannot exceed 255 characters');
    }

    // Validate station description length if provided
    if (streamConfigData.station_description !== null &&
        streamConfigData.station_description !== undefined &&
        streamConfigData.station_description.length > 65535) {
      throw new Error('Station description cannot exceed 65535 characters');
    }

    // Validate social media URLs if provided
    const socialUrls = {
      facebook_url: streamConfigData.facebook_url,
      twitter_url: streamConfigData.twitter_url,
      instagram_url: streamConfigData.instagram_url,
      youtube_url: streamConfigData.youtube_url
    };

    for (const [key, url] of Object.entries(socialUrls)) {
      if (url && !validateUrl(url)) {
        throw new Error(`Invalid ${key.replace('_url', '')} URL: ${url}`);
      }
    }

    // Execute atomic database operation using transaction
    const result = await db.transaction(async (connection) => {
      const now = new Date();

      // Step 1: Deactivate all existing active radio settings
      await connection.execute(
        'UPDATE radio_settings SET is_active = ?, updated_at = ?, updated_by = ? WHERE is_active = ?',
        [false, now, adminUserId, true]
      );

      // Step 2: Create new active configuration record
      const insertData = {
        stream_url: streamConfigData.stream_url,
        metadata_url: streamConfigData.metadata_url || null,
        station_name: streamConfigData.station_name,
        station_description: streamConfigData.station_description || null,
        facebook_url: streamConfigData.facebook_url || null,
        twitter_url: streamConfigData.twitter_url || null,
        instagram_url: streamConfigData.instagram_url || null,
        youtube_url: streamConfigData.youtube_url || null,
        is_active: true, // New configuration is always active
        updated_by: adminUserId,
        created_at: now,
        updated_at: now
      };

      const columns = Object.keys(insertData);
      const values: any[] = Object.values(insertData);
      const placeholders = values.map(() => '?').join(', ');

      const insertSql = `INSERT INTO radio_settings (${columns.join(', ')}) VALUES (${placeholders})`;
      const [insertResult] = await connection.execute<ResultSetHeader>(insertSql, values);

      // Return the complete configuration data with generated ID
      return {
        id: insertResult.insertId,
        stream_url: streamConfigData.stream_url,
        metadata_url: streamConfigData.metadata_url,
        station_name: streamConfigData.station_name,
        station_description: streamConfigData.station_description,
        facebook_url: streamConfigData.facebook_url,
        twitter_url: streamConfigData.twitter_url,
        instagram_url: streamConfigData.instagram_url,
        youtube_url: streamConfigData.youtube_url,
        is_active: true,
        updated_by: adminUserId,
        created_at: now,
        updated_at: now
      } as StreamConfigurationData;
    });

    return result;
  } catch (error) {
    const dbError = error as DatabaseError;
    throw new Error(`Failed to atomically update stream URL configuration: ${dbError.message}`);
  }
}