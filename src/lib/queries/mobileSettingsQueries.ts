/**
 * Mobile Settings Database Queries
 * Centralized query functions for mobile configuration
 * Requirements: 1.8, 1.9 - Settings management queries
 */

import { db } from '@/lib/db/client';
import type { MobileSettings } from '@/types/mobile';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class MobileSettingsQueries {
  /**
   * Get all settings as key-value pairs
   */
  static async getAll(): Promise<Record<string, any>> {
    const query = `
      SELECT setting_key, setting_value
      FROM mobile_settings
    `;

    const { rows } = await db.query<RowDataPacket>(query);
    
    const settings: Record<string, any> = {};
    for (const row of rows) {
      settings[row.setting_key] = row.setting_value;
    }
    
    return settings;
  }

  /**
   * Get setting by key
   */
  static async getByKey(key: string): Promise<any | null> {
    const query = `
      SELECT setting_value
      FROM mobile_settings
      WHERE setting_key = ?
    `;

    const { rows } = await db.query<RowDataPacket>(query, [key]);
    return rows[0]?.setting_value || null;
  }

  /**
   * Update or insert setting
   */
  static async upsert(key: string, value: any, userId?: number): Promise<boolean> {
    const query = `
      INSERT INTO mobile_settings (setting_key, setting_value, updated_by)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        setting_value = VALUES(setting_value),
        updated_by = VALUES(updated_by),
        updated_at = CURRENT_TIMESTAMP
    `;

    const result = await db.insert(query, [
      key,
      JSON.stringify(value),
      userId || null
    ]);

    return result.affectedRows > 0;
  }

  /**
   * Update multiple settings in transaction
   */
  static async updateBatch(settings: Record<string, any>, userId?: number): Promise<boolean> {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      for (const [key, value] of Object.entries(settings)) {
        const query = `
          INSERT INTO mobile_settings (setting_key, setting_value, updated_by)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            setting_value = VALUES(setting_value),
            updated_by = VALUES(updated_by),
            updated_at = CURRENT_TIMESTAMP
        `;

        await connection.execute(query, [
          key,
          JSON.stringify(value),
          userId || null
        ]);
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get combined settings as MobileSettings object
   */
  static async getCombinedSettings(): Promise<MobileSettings> {
    const settings = await this.getAll();
    
    return {
      // Poll settings
      enablePolls: settings.polls?.enablePolls ?? true,
      showOnlyLastActivePoll: settings.polls?.showOnlyLastActivePoll ?? true,
      
      // News settings
      enableNews: settings.news?.enableNews ?? true,
      maxNewsCount: settings.news?.maxNewsCount ?? 100,
      enableBreakingNews: settings.news?.enableBreakingNews ?? true,
      
      // App settings
      appVersion: settings.app?.appVersion ?? '1.0.0',
      minAppVersion: settings.app?.minAppVersion ?? '1.0.0',
      forceUpdate: settings.app?.forceUpdate ?? false,
      maintenanceMode: settings.app?.maintenanceMode ?? false,
      maintenanceMessage: settings.app?.maintenanceMessage ?? 'Sistem bakımda',
      
      // Player settings
      streamUrl: settings.player?.streamUrl ?? 'https://radyodinle1.turkhosted.com/yayin?uri=shoutcast2.netdirekt.com.tr:8046/stream',
      playerBackgroundUrl: settings.player?.playerBackgroundUrl ?? null,
      enableLiveInfo: settings.player?.enableLiveInfo ?? true,
      
      // Card settings
      maxFeaturedCards: settings.cards?.maxFeaturedCards ?? 5,
      maxNormalCards: settings.cards?.maxNormalCards ?? 20
    };
  }

  /**
   * Initialize default settings if not exists
   */
  static async initializeDefaults(): Promise<void> {
    const defaultSettings = [
      {
        key: 'polls',
        value: {
          enablePolls: true,
          showOnlyLastActivePoll: true
        },
        description: 'Anket ayarları'
      },
      {
        key: 'news',
        value: {
          enableNews: true,
          maxNewsCount: 100,
          enableBreakingNews: true
        },
        description: 'Haber ayarları'
      },
      {
        key: 'app',
        value: {
          appVersion: '1.0.0',
          minAppVersion: '1.0.0',
          forceUpdate: false,
          maintenanceMode: false,
          maintenanceMessage: 'Sistem bakımda'
        },
        description: 'Uygulama ayarları'
      },
      {
        key: 'player',
        value: {
          streamUrl: 'https://radyodinle1.turkhosted.com/yayin?uri=shoutcast2.netdirekt.com.tr:8046/stream',
          playerBackgroundUrl: null,
          enableLiveInfo: true
        },
        description: 'Oynatıcı ayarları'
      },
      {
        key: 'cards',
        value: {
          maxFeaturedCards: 5,
          maxNormalCards: 20
        },
        description: 'Kart limitleri'
      }
    ];

    for (const setting of defaultSettings) {
      // Check if setting exists
      const existing = await this.getByKey(setting.key);
      
      if (!existing) {
        // Insert default setting
        const query = `
          INSERT INTO mobile_settings (setting_key, setting_value, description)
          VALUES (?, ?, ?)
        `;
        
        await db.insert(query, [
          setting.key,
          JSON.stringify(setting.value),
          setting.description
        ]);
      }
    }
  }

  /**
   * Get settings with metadata
   */
  static async getAllWithMetadata(): Promise<Array<{
    key: string;
    value: any;
    description: string | null;
    updatedAt: Date;
    updatedBy: number | null;
  }>> {
    const query = `
      SELECT 
        setting_key as \`key\`,
        setting_value as value,
        description,
        updated_at as updatedAt,
        updated_by as updatedBy
      FROM mobile_settings
      ORDER BY setting_key
    `;

    const { rows } = await db.query<RowDataPacket>(query);
    return rows as any[];
  }
}