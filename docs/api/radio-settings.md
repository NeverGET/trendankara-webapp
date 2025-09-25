# Radio Settings API Documentation

This document describes the API endpoints for managing radio station settings in the TrendAnkara admin system.

## Overview

The Radio Settings API allows administrators to configure and manage radio stream settings, including stream URLs, station information, and social media links. These settings are used by the public radio player component and can be updated in real-time.

## Authentication

All radio settings endpoints require authentication and admin-level permissions:

- **Authentication Required**: Yes
- **Required Role**: `admin` or `super_admin`
- **Stream URL Changes**: Require `super_admin` role

## Base URL

```
/api/admin/settings/radio
```

## Endpoints

### GET /api/admin/settings/radio

Retrieves the current active radio settings.

#### Authentication
- **Required**: Yes
- **Roles**: `admin`, `super_admin`

#### Request

```http
GET /api/admin/settings/radio
Authorization: Bearer <session-token>
```

#### Response

**Success (200 OK)**
```json
{
  "id": 1,
  "stream_url": "https://stream.example.com/radio",
  "metadata_url": "https://stream.example.com/metadata",
  "station_name": "Trend Ankara Radio",
  "station_description": "En güncel müzikler ve haberler",
  "facebook_url": "https://facebook.com/trendankara",
  "twitter_url": "https://twitter.com/trendankara",
  "instagram_url": "https://instagram.com/trendankara",
  "youtube_url": "https://youtube.com/trendankara",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "updated_by": 1
}
```

**Error Responses**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: No radio settings found
- `500 Internal Server Error`: Server error

#### Example using curl

```bash
curl -X GET \
  'https://api.trendankara.com/api/admin/settings/radio' \
  -H 'Authorization: Bearer YOUR_SESSION_TOKEN' \
  -H 'Content-Type: application/json'
```

---

### PUT /api/admin/settings/radio

Updates the current radio settings.

#### Authentication
- **Required**: Yes
- **Roles**: `admin`, `super_admin`
- **Note**: Stream URL changes require `super_admin` role

#### Request

```http
PUT /api/admin/settings/radio
Authorization: Bearer <session-token>
Content-Type: application/json
```

#### Request Body

```json
{
  "station_name": "Updated Station Name",
  "station_description": "Updated description",
  "stream_url": "https://new-stream.example.com/radio",
  "metadata_url": "https://new-stream.example.com/metadata",
  "facebook_url": "https://facebook.com/newpage",
  "twitter_url": "https://twitter.com/newhandle",
  "instagram_url": "https://instagram.com/newhandle",
  "youtube_url": "https://youtube.com/newchannel"
}
```

#### Field Descriptions

| Field | Type | Required | Description | Restrictions |
|-------|------|----------|-------------|--------------|
| `station_name` | string | No | Radio station name | Max 255 characters |
| `station_description` | string | No | Station description | Max 65535 characters |
| `stream_url` | string | No | Main stream URL | Valid HTTP/HTTPS URL, super_admin only |
| `metadata_url` | string | No | Metadata endpoint URL | Valid HTTP/HTTPS URL, super_admin only |
| `facebook_url` | string | No | Facebook page URL | Valid HTTP/HTTPS URL |
| `twitter_url` | string | No | Twitter profile URL | Valid HTTP/HTTPS URL |
| `instagram_url` | string | No | Instagram profile URL | Valid HTTP/HTTPS URL |
| `youtube_url` | string | No | YouTube channel URL | Valid HTTP/HTTPS URL |

#### Response

**Success (200 OK)**
```json
{
  "id": 1,
  "stream_url": "https://new-stream.example.com/radio",
  "metadata_url": "https://new-stream.example.com/metadata",
  "station_name": "Updated Station Name",
  "station_description": "Updated description",
  "facebook_url": "https://facebook.com/newpage",
  "twitter_url": "https://twitter.com/newhandle",
  "instagram_url": "https://instagram.com/newhandle",
  "youtube_url": "https://youtube.com/newchannel",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-02T10:30:00Z",
  "updated_by": 1
}
```

**Error Responses**
- `400 Bad Request`: Validation error or invalid data
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: No settings found to update
- `500 Internal Server Error`: Server error

#### Example using curl

```bash
curl -X PUT \
  'https://api.trendankara.com/api/admin/settings/radio' \
  -H 'Authorization: Bearer YOUR_SESSION_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "station_name": "Updated Station Name",
    "station_description": "Updated description"
  }'
```

---

### POST /api/admin/settings/radio/test

Tests connectivity to a stream URL before saving settings.

#### Authentication
- **Required**: Yes
- **Roles**: `admin`, `super_admin`

#### Rate Limiting
- **Limit**: 10 requests per minute per user
- **Headers**: Rate limit information included in response

#### Request

```http
POST /api/admin/settings/radio/test
Authorization: Bearer <session-token>
Content-Type: application/json
```

#### Request Body

```json
{
  "streamUrl": "https://test-stream.example.com/radio"
}
```

#### Response

**Success (200 OK)**
```json
{
  "success": true,
  "status": "success",
  "message": "Stream connection successful",
  "details": {
    "statusCode": 200,
    "responseTime": 150,
    "contentType": "audio/mpeg"
  }
}
```

**Failed Stream Test (200 OK)**
```json
{
  "success": false,
  "status": "failure",
  "message": "Stream connection failed",
  "error": "Connection timeout",
  "details": {
    "statusCode": null,
    "responseTime": 10000,
    "contentType": null
  }
}
```

**Rate Limited (429 Too Many Requests)**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

#### Response Headers

Rate limiting headers are included in all responses:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1640995200
Retry-After: 60 (only when rate limited)
```

#### Example using curl

```bash
curl -X POST \
  'https://api.trendankara.com/api/admin/settings/radio/test' \
  -H 'Authorization: Bearer YOUR_SESSION_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "streamUrl": "https://test-stream.example.com/radio"
  }'
```

---

## Cache Invalidation

When radio settings are updated via the PUT endpoint, the following cache invalidation occurs automatically:

1. **Radio Configuration Cache**: Public radio config is invalidated
2. **CDN Cache**: Edge cache is cleared for radio endpoints
3. **Client-Side Cache**: Browser cache headers ensure fresh data

## Real-Time Updates

After updating radio settings:

1. The public `/api/radio` endpoint immediately reflects changes
2. Active radio players receive update events
3. Players automatically reconnect with new stream URLs
4. Fallback mechanisms activate if new URLs fail

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Invalid stream URL: Stream URL must use HTTP or HTTPS protocol"
}
```

#### 403 Forbidden
```json
{
  "error": "Super admin access required for stream URL modifications."
}
```

#### 429 Rate Limited
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

### Validation Rules

1. **Stream URLs**: Must be valid HTTP/HTTPS URLs
2. **Social Media URLs**: Must be valid HTTP/HTTPS URLs
3. **Station Name**: Required, 2-255 characters
4. **Description**: Optional, max 65535 characters
5. **URL Length**: Maximum 500 characters per URL

## Security Considerations

1. **Role-Based Access**: Stream URL changes restricted to super_admin
2. **Rate Limiting**: Stream testing limited to prevent abuse
3. **Input Validation**: All URLs validated before saving
4. **Session Management**: Secure session tokens required
5. **HTTPS Only**: All URLs must use secure protocols

## Integration Examples

### JavaScript/TypeScript

```typescript
interface RadioSettings {
  station_name?: string;
  station_description?: string;
  stream_url?: string;
  metadata_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  youtube_url?: string;
}

// Get current settings
async function getRadioSettings(): Promise<RadioSettings> {
  const response = await fetch('/api/admin/settings/radio', {
    headers: {
      'Authorization': `Bearer ${sessionToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch radio settings');
  }

  return response.json();
}

// Update settings
async function updateRadioSettings(settings: RadioSettings): Promise<RadioSettings> {
  const response = await fetch('/api/admin/settings/radio', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(settings)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update settings');
  }

  return response.json();
}

// Test stream URL
async function testStreamUrl(streamUrl: string): Promise<boolean> {
  const response = await fetch('/api/admin/settings/radio/test', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ streamUrl })
  });

  if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  const result = await response.json();
  return result.success;
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

function useRadioSettings() {
  const [settings, setSettings] = useState<RadioSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getRadioSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: RadioSettings) => {
    setLoading(true);
    setError(null);

    try {
      const data = await updateRadioSettings(newSettings);
      setSettings(data);

      // Trigger real-time update
      window.dispatchEvent(new CustomEvent('radioSettingsUpdated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings
  };
}
```

## Changelog

### Version 1.0.0
- Initial implementation of radio settings API
- Basic CRUD operations for radio configuration
- Stream URL testing functionality
- Rate limiting for test endpoint
- Role-based access control

### Version 1.1.0
- Added real-time update events
- Implemented cache invalidation
- Enhanced error handling with retry support
- Added fallback URL mechanism

## Support

For API support or questions, please contact the development team or refer to the main documentation.