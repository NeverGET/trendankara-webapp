import { NextRequest } from 'next/server';
import { GET, PUT } from '../route';
import { auth } from '@/lib/auth/config';
import { getActiveSettings, updateSettings } from '@/lib/db/queries/radioSettings';
import { invalidateEntityCache } from '@/lib/cache/invalidation';

// Mock dependencies
jest.mock('@/lib/auth/config');
jest.mock('@/lib/db/queries/radioSettings');
jest.mock('@/lib/cache/invalidation');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockGetActiveSettings = getActiveSettings as jest.MockedFunction<typeof getActiveSettings>;
const mockUpdateSettings = updateSettings as jest.MockedFunction<typeof updateSettings>;
const mockInvalidateEntityCache = invalidateEntityCache as jest.MockedFunction<typeof invalidateEntityCache>;

describe('/api/admin/settings/radio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSettings = {
    id: 1,
    stream_url: 'https://test.stream.com/radio',
    metadata_url: 'https://test.stream.com/metadata',
    station_name: 'Test Radio',
    station_description: 'Test Description',
    facebook_url: 'https://facebook.com/test',
    twitter_url: null,
    instagram_url: null,
    youtube_url: null,
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    updated_by: 1
  };

  describe('GET /api/admin/settings/radio', () => {
    it('should return settings for authenticated admin user', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin'
        }
      } as any);

      mockGetActiveSettings.mockResolvedValue(mockSettings);

      const request = new NextRequest('http://localhost/api/admin/settings/radio');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stream_url).toBe(mockSettings.stream_url);
      expect(data.station_name).toBe(mockSettings.station_name);
      expect(mockGetActiveSettings).toHaveBeenCalledTimes(1);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/admin/settings/radio');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for non-admin user', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'user@test.com',
          role: 'user'
        }
      } as any);

      const request = new NextRequest('http://localhost/api/admin/settings/radio');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions. Admin access required.');
    });

    it('should allow super_admin access', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'superadmin@test.com',
          role: 'super_admin'
        }
      } as any);

      mockGetActiveSettings.mockResolvedValue(mockSettings);

      const request = new NextRequest('http://localhost/api/admin/settings/radio');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should return 404 when no settings found', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin'
        }
      } as any);

      mockGetActiveSettings.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/admin/settings/radio');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No radio settings found');
    });

    it('should handle database errors', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin'
        }
      } as any);

      mockGetActiveSettings.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/admin/settings/radio');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch radio settings');
    });
  });

  describe('PUT /api/admin/settings/radio', () => {
    const validUpdateData = {
      station_name: 'Updated Radio',
      station_description: 'Updated Description'
    };

    it('should update settings for authenticated admin user', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin'
        }
      } as any);

      mockGetActiveSettings.mockResolvedValueOnce(mockSettings)
                            .mockResolvedValueOnce({ ...mockSettings, ...validUpdateData });
      mockUpdateSettings.mockResolvedValue({ affectedRows: 1 } as any);

      const request = new NextRequest('http://localhost/api/admin/settings/radio', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.station_name).toBe('Updated Radio');
      expect(mockUpdateSettings).toHaveBeenCalledWith(mockSettings.id, {
        ...validUpdateData,
        updated_by: 1
      });
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('radio');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/admin/settings/radio', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for non-admin user', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'user@test.com',
          role: 'user'
        }
      } as any);

      const request = new NextRequest('http://localhost/api/admin/settings/radio', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions. Admin access required.');
    });

    it('should require super_admin for stream URL changes', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin'
        }
      } as any);

      const streamUpdateData = {
        stream_url: 'https://new.stream.com/radio'
      };

      const request = new NextRequest('http://localhost/api/admin/settings/radio', {
        method: 'PUT',
        body: JSON.stringify(streamUpdateData)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Super admin access required for stream URL modifications.');
    });

    it('should allow super_admin to modify stream URLs', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'superadmin@test.com',
          role: 'super_admin'
        }
      } as any);

      const streamUpdateData = {
        stream_url: 'https://new.stream.com/radio'
      };

      mockGetActiveSettings.mockResolvedValueOnce(mockSettings)
                            .mockResolvedValueOnce({ ...mockSettings, ...streamUpdateData });
      mockUpdateSettings.mockResolvedValue({ affectedRows: 1 } as any);

      const request = new NextRequest('http://localhost/api/admin/settings/radio', {
        method: 'PUT',
        body: JSON.stringify(streamUpdateData)
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(mockUpdateSettings).toHaveBeenCalledWith(mockSettings.id, {
        ...streamUpdateData,
        updated_by: 1
      });
    });

    it('should require super_admin for metadata URL changes', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin'
        }
      } as any);

      const metadataUpdateData = {
        metadata_url: 'https://new.stream.com/metadata'
      };

      const request = new NextRequest('http://localhost/api/admin/settings/radio', {
        method: 'PUT',
        body: JSON.stringify(metadataUpdateData)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Super admin access required for stream URL modifications.');
    });

    it('should return 400 for empty update data', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin'
        }
      } as any);

      const request = new NextRequest('http://localhost/api/admin/settings/radio', {
        method: 'PUT',
        body: JSON.stringify({})
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('At least one field must be provided for update');
    });

    it('should return 404 when no current settings found', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin'
        }
      } as any);

      mockGetActiveSettings.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/admin/settings/radio', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No radio settings found to update');
    });

    it('should handle validation errors from updateSettings', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin'
        }
      } as any);

      mockGetActiveSettings.mockResolvedValue(mockSettings);
      mockUpdateSettings.mockRejectedValue(new Error('Invalid stream URL'));

      const request = new NextRequest('http://localhost/api/admin/settings/radio', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid stream URL');
    });

    it('should handle general database errors', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin'
        }
      } as any);

      mockGetActiveSettings.mockResolvedValue(mockSettings);
      mockUpdateSettings.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost/api/admin/settings/radio', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update radio settings');
    });

    it('should include cache control headers in response', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin'
        }
      } as any);

      mockGetActiveSettings.mockResolvedValueOnce(mockSettings)
                            .mockResolvedValueOnce({ ...mockSettings, ...validUpdateData });
      mockUpdateSettings.mockResolvedValue({ affectedRows: 1 } as any);

      const request = new NextRequest('http://localhost/api/admin/settings/radio', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });

    it('should handle null user ID gracefully', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: null,
          email: 'admin@test.com',
          role: 'admin'
        }
      } as any);

      mockGetActiveSettings.mockResolvedValueOnce(mockSettings)
                            .mockResolvedValueOnce({ ...mockSettings, ...validUpdateData });
      mockUpdateSettings.mockResolvedValue({ affectedRows: 1 } as any);

      const request = new NextRequest('http://localhost/api/admin/settings/radio', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(mockUpdateSettings).toHaveBeenCalledWith(mockSettings.id, {
        ...validUpdateData,
        updated_by: null
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parsing errors', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin'
        }
      } as any);

      const request = new NextRequest('http://localhost/api/admin/settings/radio', {
        method: 'PUT',
        body: 'invalid json'
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update radio settings');
    });

    it('should handle auth errors', async () => {
      mockAuth.mockRejectedValue(new Error('Auth service unavailable'));

      const request = new NextRequest('http://localhost/api/admin/settings/radio');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch radio settings');
    });
  });
});