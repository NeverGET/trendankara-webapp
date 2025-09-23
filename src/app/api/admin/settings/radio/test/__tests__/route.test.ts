/**
 * @jest-environment node
 */

// Mock all dependencies before importing anything
jest.mock('@/lib/auth/config', () => ({
  auth: jest.fn()
}));

jest.mock('@/lib/db/queries/radioSettings', () => ({
  testStreamConnection: jest.fn()
}));

jest.mock('@/lib/middleware/rateLimit', () => ({
  streamTestRateLimit: {
    check: jest.fn(),
    onSuccess: jest.fn()
  },
  addRateLimitHeaders: jest.fn(),
  createRateLimitResponse: jest.fn()
}));

jest.mock('@/lib/utils/streamMetadata', () => ({
  getCurrentSong: jest.fn()
}));

// Import NextRequest after mocking to avoid ES module issues
import { NextRequest, NextResponse } from 'next/server';

// Dynamic import of the POST function to avoid early evaluation of mocks
let POST: any;

// Import the mocked functions
import { auth } from '@/lib/auth/config';
import { testStreamConnection } from '@/lib/db/queries/radioSettings';
import { streamTestRateLimit, addRateLimitHeaders, createRateLimitResponse } from '@/lib/middleware/rateLimit';
import { getCurrentSong } from '@/lib/utils/streamMetadata';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockTestStreamConnection = testStreamConnection as jest.MockedFunction<typeof testStreamConnection>;
const mockGetCurrentSong = getCurrentSong as jest.MockedFunction<typeof getCurrentSong>;

const mockAddRateLimitHeaders = addRateLimitHeaders as jest.MockedFunction<typeof addRateLimitHeaders>;
const mockCreateRateLimitResponse = createRateLimitResponse as jest.MockedFunction<typeof createRateLimitResponse>;

// Get the mocked streamTestRateLimit object from the module mock
const mockStreamTestRateLimit = streamTestRateLimit as jest.Mocked<typeof streamTestRateLimit>;

describe('/api/admin/settings/radio/test', () => {
  beforeAll(async () => {
    // Dynamically import the POST function after all mocks are set up
    const routeModule = await import('../route');
    POST = routeModule.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default rate limit behavior (allowed)
    mockStreamTestRateLimit.check.mockReturnValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60000
    });

    // Default addRateLimitHeaders behavior
    mockAddRateLimitHeaders.mockImplementation((response) => response);
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost/api/admin/settings/radio/test', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  };

  const mockAdminSession = {
    user: {
      id: '1',
      email: 'admin@test.com',
      role: 'admin'
    }
  };

  const mockSuperAdminSession = {
    user: {
      id: '1',
      email: 'superadmin@test.com',
      role: 'super_admin'
    }
  };

  describe('Authentication and Authorization', () => {
    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockTestStreamConnection).not.toHaveBeenCalled();
    });

    it('should return 401 for session without user email', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: null,
          role: 'admin'
        }
      } as any);

      const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
      const response = await POST(request);
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

      const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions. Admin access required.');
    });

    it('should allow admin users', async () => {
      mockAuth.mockResolvedValue(mockAdminSession as any);
      mockTestStreamConnection.mockResolvedValue({
        isValid: true,
        statusCode: 200,
        responseTime: 1500,
        contentType: 'audio/mpeg'
      });
      mockGetCurrentSong.mockResolvedValue({
        success: true,
        metadata: {
          streamTitle: 'Test Radio',
          bitrate: 128
        }
      });

      const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should allow super_admin users', async () => {
      mockAuth.mockResolvedValue(mockSuperAdminSession as any);
      mockTestStreamConnection.mockResolvedValue({
        isValid: true,
        statusCode: 200,
        responseTime: 1500,
        contentType: 'audio/mpeg'
      });
      mockGetCurrentSong.mockResolvedValue({
        success: true,
        metadata: {
          streamTitle: 'Test Radio',
          bitrate: 128
        }
      });

      const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should return 403 for undefined role', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'user@test.com',
          role: undefined
        }
      } as any);

      const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions. Admin access required.');
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockAdminSession as any);
    });

    it('should enforce rate limit of 10 tests per minute', async () => {
      mockStreamTestRateLimit.check.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 45000,
        retryAfter: 45
      });

      mockCreateRateLimitResponse.mockReturnValue(
        new Response(JSON.stringify({
          error: 'Rate limit exceeded. Too many stream tests. Try again in 45 seconds.'
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }) as any
      );

      const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Rate limit exceeded');
      expect(mockTestStreamConnection).not.toHaveBeenCalled();
      expect(mockCreateRateLimitResponse).toHaveBeenCalledWith(45);
    });

    it('should include rate limit headers in successful response', async () => {
      mockTestStreamConnection.mockResolvedValue({
        isValid: true,
        statusCode: 200,
        responseTime: 1500,
        contentType: 'audio/mpeg'
      });
      mockGetCurrentSong.mockResolvedValue({
        success: true,
        metadata: {
          streamTitle: 'Test Radio'
        }
      });

      const rateLimitResult = {
        allowed: true,
        remaining: 8,
        resetTime: Date.now() + 55000
      };
      mockStreamTestRateLimit.check.mockReturnValue(rateLimitResult);

      const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockAddRateLimitHeaders).toHaveBeenCalledWith(expect.any(Object), rateLimitResult);
      expect(mockStreamTestRateLimit.onSuccess).toHaveBeenCalledWith(request);
    });

    it('should include rate limit headers in failed response', async () => {
      mockTestStreamConnection.mockResolvedValue({
        isValid: false,
        statusCode: 404,
        responseTime: 5000,
        error: 'Stream not found'
      });

      const rateLimitResult = {
        allowed: true,
        remaining: 7,
        resetTime: Date.now() + 50000
      };
      mockStreamTestRateLimit.check.mockReturnValue(rateLimitResult);

      const request = createRequest({ streamUrl: 'https://invalid.stream.com/radio' });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockAddRateLimitHeaders).toHaveBeenCalledWith(expect.any(Object), rateLimitResult);
    });

    it('should handle rate limit without retry after', async () => {
      mockStreamTestRateLimit.check.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 30000
      });

      mockCreateRateLimitResponse.mockReturnValue(
        new Response(JSON.stringify({
          error: 'Rate limit exceeded. Too many stream tests. Try again in 60 seconds.'
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }) as any
      );

      const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
      const response = await POST(request);

      expect(response.status).toBe(429);
      expect(mockCreateRateLimitResponse).toHaveBeenCalledWith(60);
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockAdminSession as any);
    });

    it('should return 400 for missing streamUrl', async () => {
      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Stream URL is required');
      expect(mockTestStreamConnection).not.toHaveBeenCalled();
    });

    it('should return 400 for null streamUrl', async () => {
      const request = createRequest({ streamUrl: null });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Stream URL is required');
    });

    it('should return 400 for non-string streamUrl', async () => {
      const request = createRequest({ streamUrl: 12345 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Stream URL is required');
    });

    it('should return 400 for empty string streamUrl', async () => {
      const request = createRequest({ streamUrl: '' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Stream URL is required');
    });
  });

  describe('Stream URL Testing', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockAdminSession as any);
    });

    describe('Successful Stream Tests', () => {
      it('should return success response with connection details for valid stream', async () => {
        const streamResult = {
          isValid: true,
          statusCode: 200,
          responseTime: 1500,
          contentType: 'audio/mpeg'
        };
        const metadataResult = {
          success: true,
          metadata: {
            streamTitle: 'Test Radio Station',
            bitrate: 128,
            audioFormat: 'MP3' as const,
            serverInfo: {
              serverType: 'shoutcast' as const,
              serverName: 'SHOUTcast',
              serverVersion: '2.0'
            }
          }
        };

        mockTestStreamConnection.mockResolvedValue(streamResult);
        mockGetCurrentSong.mockResolvedValue(metadataResult);

        const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          success: true,
          status: 'success',
          message: 'Stream connection successful',
          details: {
            statusCode: 200,
            responseTime: 1500,
            contentType: 'audio/mpeg'
          },
          metadata: metadataResult.metadata
        });
        expect(mockTestStreamConnection).toHaveBeenCalledWith('https://test.stream.com/radio');
        expect(mockGetCurrentSong).toHaveBeenCalledWith('https://test.stream.com/radio', expect.any(Number));
      });

      it('should include metadata extraction with remaining timeout calculation', async () => {
        const streamResult = {
          isValid: true,
          statusCode: 200,
          responseTime: 2000,
          contentType: 'audio/mpeg'
        };
        mockTestStreamConnection.mockResolvedValue(streamResult);
        mockGetCurrentSong.mockResolvedValue({
          success: true,
          metadata: { streamTitle: 'Test' }
        });

        const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
        await POST(request);

        // Should calculate remaining time: max(3000, 10000 - 2000) = 8000
        expect(mockGetCurrentSong).toHaveBeenCalledWith('https://test.stream.com/radio', 8000);
      });

      it('should use minimum 3 seconds for metadata extraction when response time is high', async () => {
        const streamResult = {
          isValid: true,
          statusCode: 200,
          responseTime: 8500,
          contentType: 'audio/mpeg'
        };
        mockTestStreamConnection.mockResolvedValue(streamResult);
        mockGetCurrentSong.mockResolvedValue({
          success: true,
          metadata: { streamTitle: 'Test' }
        });

        const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
        await POST(request);

        // Should use minimum: max(3000, 10000 - 8500) = 3000
        expect(mockGetCurrentSong).toHaveBeenCalledWith('https://test.stream.com/radio', 3000);
      });

      it('should handle successful stream test without metadata', async () => {
        mockTestStreamConnection.mockResolvedValue({
          isValid: true,
          statusCode: 200,
          responseTime: 1200,
          contentType: 'audio/mpeg'
        });
        mockGetCurrentSong.mockResolvedValue({
          success: false,
          error: 'No metadata available'
        });

        const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.metadata).toBeUndefined();
        expect(data.metadataError).toBe('No metadata available');
      });

      it('should handle metadata extraction errors gracefully', async () => {
        mockTestStreamConnection.mockResolvedValue({
          isValid: true,
          statusCode: 200,
          responseTime: 1000,
          contentType: 'audio/mpeg'
        });
        mockGetCurrentSong.mockRejectedValue(new Error('Metadata service unavailable'));

        const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.metadata).toBeUndefined();
        expect(data.metadataError).toBe('Metadata service unavailable');
      });

      it('should handle non-Error metadata extraction failures', async () => {
        mockTestStreamConnection.mockResolvedValue({
          isValid: true,
          statusCode: 200,
          responseTime: 1000,
          contentType: 'audio/mpeg'
        });
        mockGetCurrentSong.mockRejectedValue('String error');

        const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.metadataError).toBe('Metadata extraction failed');
      });
    });

    describe('Failed Stream Tests', () => {
      it('should return failure response with error details for invalid stream', async () => {
        const streamResult = {
          isValid: false,
          statusCode: 404,
          responseTime: 5000,
          contentType: null,
          error: 'Stream not found'
        };
        mockTestStreamConnection.mockResolvedValue(streamResult);

        const request = createRequest({ streamUrl: 'https://invalid.stream.com/radio' });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          success: false,
          status: 'failure',
          message: 'Stream connection failed',
          error: 'Stream not found',
          details: {
            statusCode: 404,
            responseTime: 5000,
            contentType: null
          }
        });
        expect(mockGetCurrentSong).not.toHaveBeenCalled();
      });

      it('should handle connection timeout errors', async () => {
        const streamResult = {
          isValid: false,
          statusCode: 408,
          responseTime: 10000,
          error: 'Connection timeout'
        };
        mockTestStreamConnection.mockResolvedValue(streamResult);

        const request = createRequest({ streamUrl: 'https://slow.stream.com/radio' });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Connection timeout');
      });

      it('should handle various HTTP error codes', async () => {
        const testCases = [
          { statusCode: 403, error: 'Access forbidden' },
          { statusCode: 500, error: 'Internal server error' },
          { statusCode: 503, error: 'Service unavailable' }
        ];

        for (const testCase of testCases) {
          mockTestStreamConnection.mockResolvedValue({
            isValid: false,
            statusCode: testCase.statusCode,
            responseTime: 2000,
            error: testCase.error
          });

          const request = createRequest({ streamUrl: 'https://error.stream.com/radio' });
          const response = await POST(request);
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(false);
          expect(data.error).toBe(testCase.error);
          expect(data.details.statusCode).toBe(testCase.statusCode);
        }
      });
    });

    describe('Various Stream URL Formats', () => {
      beforeEach(() => {
        mockTestStreamConnection.mockResolvedValue({
          isValid: true,
          statusCode: 200,
          responseTime: 1500,
          contentType: 'audio/mpeg'
        });
        mockGetCurrentSong.mockResolvedValue({
          success: true,
          metadata: { streamTitle: 'Test' }
        });
      });

      it('should handle HTTP URLs', async () => {
        const request = createRequest({ streamUrl: 'http://radio.example.com:8000/stream' });
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockTestStreamConnection).toHaveBeenCalledWith('http://radio.example.com:8000/stream');
      });

      it('should handle HTTPS URLs', async () => {
        const request = createRequest({ streamUrl: 'https://secure.radio.com/live' });
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockTestStreamConnection).toHaveBeenCalledWith('https://secure.radio.com/live');
      });

      it('should handle URLs with custom ports', async () => {
        const request = createRequest({ streamUrl: 'https://radio.com:8443/stream.mp3' });
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockTestStreamConnection).toHaveBeenCalledWith('https://radio.com:8443/stream.mp3');
      });

      it('should handle URLs with query parameters', async () => {
        const request = createRequest({ streamUrl: 'https://radio.com/stream?bitrate=128&format=mp3' });
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockTestStreamConnection).toHaveBeenCalledWith('https://radio.com/stream?bitrate=128&format=mp3');
      });

      it('should handle international domain names', async () => {
        const request = createRequest({ streamUrl: 'https://radyoankara.com.tr/canlı-yayın' });
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockTestStreamConnection).toHaveBeenCalledWith('https://radyoankara.com.tr/canlı-yayın');
      });
    });
  });

  describe('Timeout and Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockAdminSession as any);
    });

    it('should handle timeout errors with 408 status', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.name = 'AbortError';
      mockTestStreamConnection.mockRejectedValue(timeoutError);

      const request = createRequest({ streamUrl: 'https://timeout.stream.com/radio' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(408);
      expect(data).toEqual({
        success: false,
        status: 'failure',
        message: 'Stream connection test timed out',
        error: 'Connection timeout (10 seconds exceeded)'
      });
    });

    it('should handle timeout errors with timeout message', async () => {
      const timeoutError = new Error('Request timeout after 10 seconds');
      mockTestStreamConnection.mockRejectedValue(timeoutError);

      const request = createRequest({ streamUrl: 'https://timeout.stream.com/radio' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(408);
      expect(data.message).toBe('Stream connection test timed out');
    });

    it('should handle general errors with 500 status', async () => {
      const networkError = new Error('Network unreachable');
      mockTestStreamConnection.mockRejectedValue(networkError);

      const request = createRequest({ streamUrl: 'https://network.error.com/radio' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        status: 'failure',
        message: 'Stream connection test failed',
        error: 'Internal server error'
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockTestStreamConnection.mockRejectedValue('String exception');

      const request = createRequest({ streamUrl: 'https://exception.stream.com/radio' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle JSON parsing errors', async () => {
      mockAuth.mockResolvedValue(mockAdminSession as any);

      const request = new NextRequest('http://localhost/api/admin/settings/radio/test', {
        method: 'POST',
        body: 'invalid json content',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle auth service errors', async () => {
      mockAuth.mockRejectedValue(new Error('Auth service unavailable'));

      const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Metadata Integration', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockAdminSession as any);
      mockTestStreamConnection.mockResolvedValue({
        isValid: true,
        statusCode: 200,
        responseTime: 1500,
        contentType: 'audio/mpeg'
      });
    });

    it('should extract complete metadata for Shoutcast streams', async () => {
      const fullMetadata = {
        streamTitle: 'Test Radio Station',
        bitrate: 128,
        audioFormat: 'MP3' as const,
        serverInfo: {
          serverType: 'shoutcast' as const,
          serverName: 'SHOUTcast',
          serverVersion: '2.0'
        },
        extra: {
          genre: 'Pop/Rock',
          contentType: 'audio/mpeg',
          url: 'https://test.stream.com',
          sampleRate: 44100
        }
      };

      mockGetCurrentSong.mockResolvedValue({
        success: true,
        metadata: fullMetadata,
        responseTime: 800
      });

      const request = createRequest({ streamUrl: 'https://shoutcast.stream.com/radio' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata).toEqual(fullMetadata);
      expect(data.metadataError).toBeUndefined();
    });

    it('should extract metadata for Icecast streams', async () => {
      const icecastMetadata = {
        streamTitle: 'Icecast Radio',
        bitrate: 320,
        audioFormat: 'AAC' as const,
        serverInfo: {
          serverType: 'icecast' as const,
          serverName: 'Icecast',
          serverVersion: '2.4.4'
        }
      };

      mockGetCurrentSong.mockResolvedValue({
        success: true,
        metadata: icecastMetadata
      });

      const request = createRequest({ streamUrl: 'https://icecast.stream.com/radio' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata).toEqual(icecastMetadata);
    });

    it('should handle partial metadata extraction', async () => {
      const partialMetadata = {
        streamTitle: 'Radio Station',
        // Missing bitrate, audioFormat, etc.
      };

      mockGetCurrentSong.mockResolvedValue({
        success: true,
        metadata: partialMetadata
      });

      const request = createRequest({ streamUrl: 'https://partial.stream.com/radio' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata).toEqual(partialMetadata);
      expect(data.metadataError).toBeUndefined();
    });

    it('should handle metadata extraction timeout', async () => {
      mockGetCurrentSong.mockResolvedValue({
        success: false,
        error: 'Metadata extraction timed out'
      });

      const request = createRequest({ streamUrl: 'https://slow-metadata.stream.com/radio' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true); // Stream test still succeeded
      expect(data.metadata).toBeUndefined();
      expect(data.metadataError).toBe('Metadata extraction timed out');
    });

    it('should handle metadata service network errors', async () => {
      mockGetCurrentSong.mockResolvedValue({
        success: false,
        error: 'Network error: CORS proxy unavailable'
      });

      const request = createRequest({ streamUrl: 'https://cors-blocked.stream.com/radio' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata).toBeUndefined();
      expect(data.metadataError).toBe('Network error: CORS proxy unavailable');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockAdminSession as any);
    });

    it('should handle extremely slow stream responses', async () => {
      mockTestStreamConnection.mockResolvedValue({
        isValid: true,
        statusCode: 200,
        responseTime: 9800, // Nearly at timeout limit
        contentType: 'audio/mpeg'
      });
      mockGetCurrentSong.mockResolvedValue({
        success: true,
        metadata: { streamTitle: 'Slow Stream' }
      });

      const request = createRequest({ streamUrl: 'https://slow.stream.com/radio' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.details.responseTime).toBe(9800);
      // Should use minimum 3 seconds for metadata
      expect(mockGetCurrentSong).toHaveBeenCalledWith('https://slow.stream.com/radio', 3000);
    });

    it('should handle missing response time in stream result', async () => {
      mockTestStreamConnection.mockResolvedValue({
        isValid: true,
        statusCode: 200,
        // responseTime is undefined
        contentType: 'audio/mpeg'
      });
      mockGetCurrentSong.mockResolvedValue({
        success: true,
        metadata: { streamTitle: 'Test' }
      });

      const request = createRequest({ streamUrl: 'https://test.stream.com/radio' });
      const response = await POST(request);

      expect(response.status).toBe(200);
      // Should use full 10 seconds when response time is missing
      expect(mockGetCurrentSong).toHaveBeenCalledWith('https://test.stream.com/radio', 10000);
    });

    it('should handle very large stream URLs', async () => {
      const largeUrl = 'https://test.stream.com/radio?' + 'param='.repeat(1000) + 'value';
      mockTestStreamConnection.mockResolvedValue({
        isValid: true,
        statusCode: 200,
        responseTime: 1500,
        contentType: 'audio/mpeg'
      });
      mockGetCurrentSong.mockResolvedValue({
        success: true,
        metadata: { streamTitle: 'Test' }
      });

      const request = createRequest({ streamUrl: largeUrl });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockTestStreamConnection).toHaveBeenCalledWith(largeUrl);
    });

    it('should handle special characters in stream URLs', async () => {
      const specialUrl = 'https://test.stream.com/radyo-çalışıyor?türkçe=evet&encoding=utf-8';
      mockTestStreamConnection.mockResolvedValue({
        isValid: true,
        statusCode: 200,
        responseTime: 1500,
        contentType: 'audio/mpeg'
      });
      mockGetCurrentSong.mockResolvedValue({
        success: true,
        metadata: { streamTitle: 'Türkçe Radyo' }
      });

      const request = createRequest({ streamUrl: specialUrl });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockTestStreamConnection).toHaveBeenCalledWith(specialUrl);
    });
  });
});