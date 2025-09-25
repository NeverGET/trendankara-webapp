import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getActiveSettings, updateSettings, RadioSettingsUpdateData } from '@/lib/db/queries/radioSettings';
import { invalidateEntityCache } from '@/lib/cache/invalidation';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role for radio settings access
    const userRole = session.user?.role;
    if (!userRole || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      );
    }

    // Fetch current radio settings from database
    const settings = await getActiveSettings();

    if (!settings) {
      return NextResponse.json(
        { error: 'No radio settings found' },
        { status: 404 }
      );
    }

    // Format the response with current stream configuration
    const response = {
      id: settings.id,
      stream_url: settings.stream_url,
      metadata_url: settings.metadata_url,
      station_name: settings.station_name,
      station_description: settings.station_description,
      facebook_url: settings.facebook_url,
      twitter_url: settings.twitter_url,
      instagram_url: settings.instagram_url,
      youtube_url: settings.youtube_url,
      is_active: settings.is_active,
      created_at: settings.created_at,
      updated_at: settings.updated_at,
      updated_by: settings.updated_by
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Radio settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch radio settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role for radio settings modification
    const userRole = session.user?.role;
    if (!userRole || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: RadioSettingsUpdateData = await request.json();

    // Additional validation for critical changes - require super_admin for stream URL changes
    if ((body.stream_url || body.metadata_url) && userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin access required for stream URL modifications.' },
        { status: 403 }
      );
    }

    // Validate that at least one field is provided for update
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    // Get current active settings to determine which record to update
    const currentSettings = await getActiveSettings();

    if (!currentSettings) {
      return NextResponse.json(
        { error: 'No radio settings found to update' },
        { status: 404 }
      );
    }

    // Add updated_by field with user ID if available
    const updateData: RadioSettingsUpdateData = {
      ...body,
      updated_by: session.user?.id ? parseInt(session.user.id) : null
    };

    // Update the settings (validation is handled in updateSettings function)
    await updateSettings(currentSettings.id, updateData);

    // Invalidate radio cache after update
    await invalidateEntityCache('radio');

    // Fetch the updated settings to return
    const updatedSettings = await getActiveSettings();

    if (!updatedSettings) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated settings' },
        { status: 500 }
      );
    }

    // Format the response
    const response = {
      id: updatedSettings.id,
      stream_url: updatedSettings.stream_url,
      metadata_url: updatedSettings.metadata_url,
      station_name: updatedSettings.station_name,
      station_description: updatedSettings.station_description,
      facebook_url: updatedSettings.facebook_url,
      twitter_url: updatedSettings.twitter_url,
      instagram_url: updatedSettings.instagram_url,
      youtube_url: updatedSettings.youtube_url,
      is_active: updatedSettings.is_active,
      created_at: updatedSettings.created_at,
      updated_at: updatedSettings.updated_at,
      updated_by: updatedSettings.updated_by
    };

    // Return response with cache invalidation headers to ensure radio player reloads
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Radio settings update error:', error);

    // Handle validation errors with specific error messages
    if (error instanceof Error) {
      // Check if it's a validation error from the updateSettings function
      if (error.message.includes('Invalid stream URL') ||
          error.message.includes('Invalid') ||
          error.message.includes('cannot')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update radio settings' },
      { status: 500 }
    );
  }
}