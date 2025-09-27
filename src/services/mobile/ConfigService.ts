/**
 * Mobile Config Service
 * Manages mobile app configuration and settings
 * Requirements: 3.1, 3.5, 3.6, 3.7 - Mobile app settings management
 */

import type { MobileSettings } from '@/types/mobile';
import { db } from '@/lib/db/client';
import cacheManager from '@/lib/cache/MobileCacheManager';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface SettingRow extends RowDataPacket {
  id: number;
  setting_key: string;
  setting_value: any; // JSON parsed
  description: string;
  updated_at: Date;
}

export class ConfigService {
  private readonly CACHE_KEY = 'mobile:settings';
  private readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Get all mobile settings
   * Returns cached settings if available
   *
   * @returns Mobile settings object
   */
  async getSettings(): Promise<MobileSettings> {
    // Check cache first
    const cached = cacheManager.get<MobileSettings>(this.CACHE_KEY);
    if (cached) {
      return cached.data;
    }


    try {
      const query = `
        SELECT
          setting_key,
          setting_value,
          description,
          updated_at
        FROM mobile_settings
        ORDER BY setting_key
      `;

      const [rows] = await db.execute<SettingRow[]>(query);

      // Combine all settings into a single object
      const settings = this.combineSettings(rows);

      // Cache the result
      cacheManager.set(this.CACHE_KEY, settings, this.CACHE_TTL);

      return settings;
    } catch (error) {
      console.error('Error fetching mobile settings:', error);

      // Return default settings on error
      return this.getDefaultSettings();
    }
  }

  /**
   * Update mobile settings
   * Updates specific settings and clears cache
   *
   * @param settings Partial settings to update
   * @param userId User ID of updater
   * @returns Updated settings
   */
  async updateSettings(
    settings: Partial<MobileSettings>,
    userId?: number
  ): Promise<MobileSettings> {

    try {
      // Start transaction
      await db.beginTransaction();

      try {
        // Map settings to database keys
        const updates = this.mapSettingsToDbKeys(settings);

        // Update each setting key
        for (const [key, value] of Object.entries(updates)) {
          await this.updateSettingKey(db, key, value, userId);
        }

        // Commit transaction
        await db.commit();

        // Clear cache to force refresh
        cacheManager.invalidate(this.CACHE_KEY);
        cacheManager.invalidate('mobile:*'); // Clear all mobile caches

        // Return updated settings
        return await this.getSettings();
      } catch (error) {
        // Rollback on error
        await db.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error updating mobile settings:', error);
      throw new Error('Ayarlar güncellenemedi');
    }
  }

  /**
   * Get player logo URL
   * Helper method to get just the player logo
   *
   * @returns Player logo URL or null
   */
  async getPlayerLogo(): Promise<string | null> {
    const settings = await this.getSettings();
    return settings.playerLogoUrl || null;
  }

  /**
   * Update a single setting key
   *
   * @param key Setting key
   * @param value New value
   * @param userId User ID of updater
   */
  async updateSingleSetting(
    key: string,
    value: any,
    userId?: number
  ): Promise<void> {

    try {
      await this.updateSettingKey(db, key, value, userId);

      // Clear cache
      cacheManager.invalidate(this.CACHE_KEY);
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      throw new Error(`Ayar güncellenemedi: ${key}`);
    }
  }

  /**
   * Get a specific setting value
   *
   * @param key Setting key
   * @returns Setting value or null
   */
  async getSettingValue(key: string): Promise<any> {

    try {
      const query = `
        SELECT setting_value
        FROM mobile_settings
        WHERE setting_key = ?
        LIMIT 1
      `;

      const [rows] = await db.execute<SettingRow[]>(query, [key]);

      if (rows.length === 0) {
        return null;
      }

      return rows[0].setting_value;
    } catch (error) {
      console.error(`Error fetching setting ${key}:`, error);
      return null;
    }
  }

  /**
   * Reset settings to defaults
   * Resets all settings to their default values
   *
   * @param userId User ID of resetter
   */
  async resetToDefaults(userId?: number): Promise<MobileSettings> {
    const defaults = this.getDefaultSettings();
    return await this.updateSettings(defaults, userId);
  }

  /**
   * Update a setting key in the database
   *
   * @param db Database connection
   * @param key Setting key
   * @param value New value
   * @param userId User ID of updater
   */
  private async updateSettingKey(
    db: any,
    key: string,
    value: any,
    userId?: number
  ): Promise<void> {
    const query = `
      UPDATE mobile_settings
      SET setting_value = ?,
          updated_at = NOW(),
          updated_by = ?
      WHERE setting_key = ?
    `;

    const jsonValue = JSON.stringify(value);
    await db.execute(query, [jsonValue, userId || null, key]);
  }

  /**
   * Combine setting rows into a single MobileSettings object
   *
   * @param rows Setting rows from database
   * @returns Combined settings object
   */
  private combineSettings(rows: SettingRow[]): MobileSettings {
    const settings: any = {};

    for (const row of rows) {
      const value = row.setting_value;

      switch (row.setting_key) {
        case 'polls_config':
          if (value) {
            settings.showOnlyLastActivePoll = value.showOnlyLastActivePoll ?? false;
            settings.enablePolls = value.enablePolls ?? true;
          }
          break;

        case 'news_config':
          if (value) {
            settings.maxNewsCount = value.maxNewsCount ?? 50;
            settings.enableNews = value.enableNews ?? true;
          }
          break;

        case 'app_config':
          if (value) {
            settings.maintenanceMode = value.maintenanceMode ?? false;
            settings.minimumAppVersion = value.minimumAppVersion ?? '1.0.0';
            settings.forceUpdate = value.forceUpdate ?? false;
          }
          break;

        case 'player_config':
          if (value) {
            settings.playerLogoUrl = value.playerLogoUrl ?? null;
          }
          break;

        case 'cards_config':
          if (value) {
            settings.cardDisplayMode = value.cardDisplayMode ?? 'grid';
            settings.maxFeaturedCards = value.maxFeaturedCards ?? 3;
            settings.enableCardAnimation = value.enableCardAnimation ?? true;
          }
          break;
      }
    }

    // Ensure all required fields have defaults
    return {
      showOnlyLastActivePoll: settings.showOnlyLastActivePoll ?? false,
      maxNewsCount: settings.maxNewsCount ?? 50,
      enablePolls: settings.enablePolls ?? true,
      enableNews: settings.enableNews ?? true,
      playerLogoUrl: settings.playerLogoUrl ?? null,
      cardDisplayMode: settings.cardDisplayMode ?? 'grid',
      maxFeaturedCards: settings.maxFeaturedCards ?? 3,
      enableCardAnimation: settings.enableCardAnimation ?? true,
      maintenanceMode: settings.maintenanceMode ?? false,
      minimumAppVersion: settings.minimumAppVersion ?? '1.0.0',
      forceUpdate: settings.forceUpdate ?? false
    };
  }

  /**
   * Map MobileSettings properties to database setting keys
   *
   * @param settings Mobile settings object
   * @returns Mapped database updates
   */
  private mapSettingsToDbKeys(settings: Partial<MobileSettings>): Record<string, any> {
    const updates: Record<string, any> = {};

    // Group settings by database key
    const pollsConfig: any = {};
    const newsConfig: any = {};
    const appConfig: any = {};
    const playerConfig: any = {};
    const cardsConfig: any = {};

    // Map each setting to its group
    if (settings.showOnlyLastActivePoll !== undefined) {
      pollsConfig.showOnlyLastActivePoll = settings.showOnlyLastActivePoll;
    }
    if (settings.enablePolls !== undefined) {
      pollsConfig.enablePolls = settings.enablePolls;
    }

    if (settings.maxNewsCount !== undefined) {
      newsConfig.maxNewsCount = settings.maxNewsCount;
    }
    if (settings.enableNews !== undefined) {
      newsConfig.enableNews = settings.enableNews;
    }

    if (settings.maintenanceMode !== undefined) {
      appConfig.maintenanceMode = settings.maintenanceMode;
    }
    if (settings.minimumAppVersion !== undefined) {
      appConfig.minimumAppVersion = settings.minimumAppVersion;
    }
    if (settings.forceUpdate !== undefined) {
      appConfig.forceUpdate = settings.forceUpdate;
    }

    if (settings.playerLogoUrl !== undefined) {
      playerConfig.playerLogoUrl = settings.playerLogoUrl;
    }

    if (settings.cardDisplayMode !== undefined) {
      cardsConfig.cardDisplayMode = settings.cardDisplayMode;
    }
    if (settings.maxFeaturedCards !== undefined) {
      cardsConfig.maxFeaturedCards = settings.maxFeaturedCards;
    }
    if (settings.enableCardAnimation !== undefined) {
      cardsConfig.enableCardAnimation = settings.enableCardAnimation;
    }

    // Only include groups with updates
    if (Object.keys(pollsConfig).length > 0) {
      updates['polls_config'] = pollsConfig;
    }
    if (Object.keys(newsConfig).length > 0) {
      updates['news_config'] = newsConfig;
    }
    if (Object.keys(appConfig).length > 0) {
      updates['app_config'] = appConfig;
    }
    if (Object.keys(playerConfig).length > 0) {
      updates['player_config'] = playerConfig;
    }
    if (Object.keys(cardsConfig).length > 0) {
      updates['cards_config'] = cardsConfig;
    }

    return updates;
  }

  /**
   * Get default settings
   * Returns default configuration values
   *
   * @returns Default mobile settings
   */
  private getDefaultSettings(): MobileSettings {
    return {
      showOnlyLastActivePoll: false,
      maxNewsCount: 50,
      enablePolls: true,
      enableNews: true,
      playerLogoUrl: null,
      cardDisplayMode: 'grid',
      maxFeaturedCards: 3,
      enableCardAnimation: true,
      maintenanceMode: false,
      minimumAppVersion: '1.0.0',
      forceUpdate: false
    };
  }

  /**
   * Check if app is in maintenance mode
   *
   * @returns True if maintenance mode is enabled
   */
  async isMaintenanceMode(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.maintenanceMode || false;
  }

  /**
   * Check if app version requires update
   *
   * @param appVersion Current app version
   * @returns Object indicating if update is required
   */
  async checkAppVersion(appVersion: string): Promise<{
    updateRequired: boolean;
    forceUpdate: boolean;
    minimumVersion: string;
  }> {
    const settings = await this.getSettings();

    const updateRequired = this.compareVersions(
      appVersion,
      settings.minimumAppVersion || '1.0.0'
    ) < 0;

    return {
      updateRequired,
      forceUpdate: updateRequired && (settings.forceUpdate || false),
      minimumVersion: settings.minimumAppVersion || '1.0.0'
    };
  }

  /**
   * Check if update is available for given version
   *
   * @param currentVersion Current app version
   * @returns True if update is available
   */
  async isUpdateAvailable(currentVersion: string): Promise<boolean> {
    const settings = await this.getSettings();
    return this.compareVersions(currentVersion, settings.appVersion || '1.0.0') < 0;
  }

  /**
   * Compare version strings
   *
   * @param v1 First version
   * @param v2 Second version
   * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  }
}

// Export singleton instance
const configService = new ConfigService();
export default configService;