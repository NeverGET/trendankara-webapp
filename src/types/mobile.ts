/**
 * TypeScript interfaces for mobile API responses
 * Provides type safety for mobile app communication with radio configuration endpoints
 * Supports requirement 5.1 and 5.2 for mobile API radio configuration
 */

/**
 * Mobile radio configuration interface for API responses
 * Used by /api/mobile/v1/radio endpoint to provide current radio configuration to mobile apps
 *
 * @interface MobileRadioConfig
 * @description Provides radio streaming configuration data with connection status and testing information
 * @requirements 5.1, 5.2 - Mobile API radio configuration and real-time updates
 */
export interface MobileRadioConfig {
  /** Primary stream URL for radio broadcasting */
  stream_url: string;

  /** Optional metadata URL for stream information and current playing data */
  metadata_url: string | null;

  /** Display name of the radio station */
  station_name: string;

  /**
   * Current connection status of the stream
   * - 'active': Stream is confirmed working and available
   * - 'testing': Stream is currently being tested for connectivity
   * - 'failed': Stream connectivity test failed or stream is unavailable
   */
  connection_status: 'active' | 'testing' | 'failed';

  /**
   * ISO timestamp of when the stream was last tested for connectivity
   * Used to determine if stream status information is current
   */
  last_tested: string;
}