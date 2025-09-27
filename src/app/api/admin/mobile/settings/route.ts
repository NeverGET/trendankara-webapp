/**
 * Admin Mobile Settings API
 * Get and update mobile app settings
 * Requirements: 1.8, 1.9, 3.4 - Settings management API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/utils';
import { MobileSettingsQueries } from '@/lib/queries/mobileSettingsQueries';
import type { MobileSettings } from '@/types/mobile';
import cacheManager from '@/lib/cache/MobileCacheManager';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get combined settings
    const settings = await MobileSettingsQueries.getCombinedSettings();

    // Get metadata for last update info
    const metadata = await MobileSettingsQueries.getAllWithMetadata();
    const lastUpdated = metadata.reduce((latest, item) => {
      const itemDate = new Date(item.updatedAt);
      return itemDate > latest ? itemDate : latest;
    }, new Date(0));

    return NextResponse.json({ 
      settings,
      lastUpdated: lastUpdated.toISOString()
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Ayarlar yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const settings: MobileSettings = await request.json();

    // Prepare settings for database - only use properties that exist in MobileSettings interface
    const dbSettings = {
      polls: {
        enablePolls: settings.enablePolls,
        showOnlyLastActivePoll: settings.showOnlyLastActivePoll
      },
      news: {
        enableNews: settings.enableNews,
        maxNewsCount: settings.maxNewsCount
      },
      app: {
        minimumAppVersion: settings.minimumAppVersion,
        maintenanceMode: settings.maintenanceMode
      },
      player: {
        playerLogoUrl: settings.playerLogoUrl
      },
      cards: {
        maxFeaturedCards: settings.maxFeaturedCards,
        cardDisplayMode: settings.cardDisplayMode,
        enableCardAnimation: settings.enableCardAnimation
      }
    };

    // Update settings in database
    await MobileSettingsQueries.updateBatch(dbSettings, (session.user as any)?.id || 1);

    // Invalidate all mobile cache
    cacheManager.invalidate('mobile:*');

    return NextResponse.json({ 
      success: true,
      message: 'Ayarlar başarıyla güncellendi' 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Ayarlar güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Initialize default settings on first load
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize default settings
    await MobileSettingsQueries.initializeDefaults();

    return NextResponse.json({ 
      success: true,
      message: 'Varsayılan ayarlar yüklendi' 
    });
  } catch (error) {
    console.error('Error initializing settings:', error);
    return NextResponse.json(
      { error: 'Varsayılan ayarlar yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}