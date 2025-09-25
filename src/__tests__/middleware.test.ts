/**
 * Test suite for Next.js middleware
 * Tests route matching logic, redirect behavior, public route exceptions, and middleware protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { middleware } from '../middleware';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

// Helper function to create mock NextRequest
function createMockRequest(pathname: string, baseUrl = 'http://localhost:3000'): NextRequest {
  const url = new URL(pathname, baseUrl);
  const request = new NextRequest(url);
  return request;
}

// Helper function to create mock token
function createMockToken(role = 'user') {
  return {
    id: 'user-id',
    sub: 'user-id',
    email: 'test@example.com',
    role,
    iat: Date.now() / 1000,
    exp: Date.now() / 1000 + 3600,
  };
}

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default environment variables for tests
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.AUTH_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Public Route Matching', () => {
    it('should allow access to home page without authentication', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(mockGetToken).toHaveBeenCalledWith({
        req: request,
        secret: 'test-secret'
      });
    });

    it('should allow access to news page without authentication', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/news');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow access to polls page without authentication', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/polls');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow access to login page without authentication', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/auth/login');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow access to news subpages without authentication', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/news/some-article');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow access to polls subpages without authentication', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/polls/some-poll');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });
  });

  describe('Public API Route Matching', () => {
    it('should allow access to radio API without authentication', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/radio');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow access to polls vote API without authentication', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/polls/vote');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow access to mobile API without authentication', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/mobile');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow access to mobile API subpaths without authentication', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/mobile/news');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow access to NextAuth API routes without authentication', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/auth/signin');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow access to test API routes without authentication', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/test/endpoint');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect (response.status).toBe(200);
    });
  });

  describe('Protected Route Matching', () => {
    it('should identify admin pages as protected routes', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/admin');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get('location')).toContain('/auth/login');
    });

    it('should identify admin subpages as protected routes', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/admin/dashboard');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get('location')).toContain('/auth/login');
    });

    it('should identify admin API routes as protected', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/admin/users');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(401); // Unauthorized for API routes
    });

    it('should identify admin API subpaths as protected', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/admin/news/create');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(401); // Unauthorized for API routes
    });
  });

  describe('Authentication Redirect Behavior', () => {
    it('should redirect unauthenticated users from admin pages to login', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/admin/dashboard');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307); // Redirect status
      const location = response.headers.get('location');
      expect(location).toContain('/auth/login');
      expect(location).toContain('callbackUrl=%2Fadmin%2Fdashboard');
    });

    it('should return 401 for unauthenticated API requests', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/admin/users');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Unauthorized' });
    });

    it('should preserve callback URL in login redirect', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/admin/users/manage');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('callbackUrl=%2Fadmin%2Fusers%2Fmanage');
    });

    it('should redirect authenticated users from login page to admin', async () => {
      mockGetToken.mockResolvedValue(createMockToken());
      const request = createMockRequest('/auth/login');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/admin');
    });
  });

  describe('Authenticated User Access', () => {
    it('should allow authenticated users access to admin pages', async () => {
      mockGetToken.mockResolvedValue(createMockToken());
      const request = createMockRequest('/admin/dashboard');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow authenticated users access to admin API routes', async () => {
      mockGetToken.mockResolvedValue(createMockToken());
      const request = createMockRequest('/api/admin/news');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow authenticated users access to public routes', async () => {
      mockGetToken.mockResolvedValue(createMockToken());
      const request = createMockRequest('/news');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow super_admin access to user management pages', async () => {
      mockGetToken.mockResolvedValue(createMockToken('super_admin'));
      const request = createMockRequest('/admin/users');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow super_admin access to user management API', async () => {
      mockGetToken.mockResolvedValue(createMockToken('super_admin'));
      const request = createMockRequest('/api/admin/users');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should deny regular user access to user management pages', async () => {
      mockGetToken.mockResolvedValue(createMockToken('user'));
      const request = createMockRequest('/admin/users');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/admin');
      expect(location).toContain('error=insufficient_permissions');
    });

    it('should deny regular user access to user management API', async () => {
      mockGetToken.mockResolvedValue(createMockToken('user'));
      const request = createMockRequest('/api/admin/users');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({ error: 'Forbidden: Super admin access required' });
    });

    it('should deny admin user access to user management pages', async () => {
      mockGetToken.mockResolvedValue(createMockToken('admin'));
      const request = createMockRequest('/admin/users/create');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/admin');
    });

    it('should deny admin user access to user management API', async () => {
      mockGetToken.mockResolvedValue(createMockToken('admin'));
      const request = createMockRequest('/api/admin/users/delete');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(403);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null token gracefully', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/admin');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
    });

    it('should handle undefined token gracefully', async () => {
      mockGetToken.mockResolvedValue(undefined as any);
      const request = createMockRequest('/admin');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
    });

    it('should handle token without role property', async () => {
      const tokenWithoutRole = {
        sub: 'user-id',
        email: 'test@example.com',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };
      mockGetToken.mockResolvedValue(tokenWithoutRole);
      const request = createMockRequest('/admin/users');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307); // Should redirect due to missing role
    });

    it('should handle getToken throwing an error', async () => {
      mockGetToken.mockRejectedValue(new Error('Token validation failed'));
      const request = createMockRequest('/admin');

      // The middleware currently doesn't handle getToken errors, so it will throw
      await expect(middleware(request)).rejects.toThrow('Token validation failed');
    });

    it('should handle empty pathname', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200); // Should treat as root path
    });

    it('should handle paths with query parameters', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/admin?tab=dashboard');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('callbackUrl=%2Fadmin');
    });

    it('should handle paths with fragments', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/admin#section');

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
    });
  });

  describe('Environment Variable Handling', () => {
    it('should use NEXTAUTH_SECRET when available', async () => {
      process.env.NEXTAUTH_SECRET = 'nextauth-secret';
      delete process.env.AUTH_SECRET;

      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/admin');

      await middleware(request);

      expect(mockGetToken).toHaveBeenCalledWith({
        req: request,
        secret: 'nextauth-secret'
      });
    });

    it('should use AUTH_SECRET as fallback', async () => {
      delete process.env.NEXTAUTH_SECRET;
      process.env.AUTH_SECRET = 'auth-secret';

      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/admin');

      await middleware(request);

      expect(mockGetToken).toHaveBeenCalledWith({
        req: request,
        secret: 'auth-secret'
      });
    });

    it('should handle missing secrets gracefully', async () => {
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.AUTH_SECRET;

      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/admin');

      await middleware(request);

      expect(mockGetToken).toHaveBeenCalledWith({
        req: request,
        secret: undefined
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete authentication flow', async () => {
      // Test unauthenticated access
      mockGetToken.mockResolvedValue(null);
      let request = createMockRequest('/admin/dashboard');
      let response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/auth/login');

      // Test authenticated access
      mockGetToken.mockResolvedValue(createMockToken());
      request = createMockRequest('/admin/dashboard');
      response = await middleware(request);

      expect(response.status).toBe(200);

      // Test redirect from login when authenticated
      request = createMockRequest('/auth/login');
      response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/admin');
    });

    it('should handle role escalation properly', async () => {
      // Test regular user trying to access super admin route
      mockGetToken.mockResolvedValue(createMockToken('user'));
      let request = createMockRequest('/admin/users');
      let response = await middleware(request);

      expect(response.status).toBe(307);

      // Test super admin accessing the same route
      mockGetToken.mockResolvedValue(createMockToken('super_admin'));
      request = createMockRequest('/admin/users');
      response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should handle mixed route types in single session', async () => {
      const token = createMockToken();
      mockGetToken.mockResolvedValue(token);

      // Test public route
      let request = createMockRequest('/news');
      let response = await middleware(request);
      expect(response.status).toBe(200);

      // Test protected route
      request = createMockRequest('/admin');
      response = await middleware(request);
      expect(response.status).toBe(200);

      // Test API route
      request = createMockRequest('/api/admin/news');
      response = await middleware(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Performance and Security', () => {
    it('should call getToken only once per request', async () => {
      mockGetToken.mockResolvedValue(createMockToken());
      const request = createMockRequest('/admin');

      await middleware(request);

      expect(mockGetToken).toHaveBeenCalledTimes(1);
    });

    it('should not expose sensitive information in error responses', async () => {
      mockGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/admin/users');

      const response = await middleware(request);
      const responseBody = await response.json();

      expect(responseBody.error).toBe('Unauthorized');
      expect(responseBody).not.toHaveProperty('secret');
      expect(responseBody).not.toHaveProperty('token');
      expect(responseBody).not.toHaveProperty('internal');
    });

    it('should handle concurrent requests correctly', async () => {
      const token = createMockToken('super_admin'); // Use super_admin to access all routes
      mockGetToken.mockResolvedValue(token);

      const requests = [
        createMockRequest('/admin'),
        createMockRequest('/api/admin/news'),
        createMockRequest('/news'),
        createMockRequest('/admin/users')
      ];

      const responses = await Promise.all(
        requests.map(request => middleware(request))
      );

      expect(responses[0].status).toBe(200); // /admin
      expect(responses[1].status).toBe(200); // /api/admin/news
      expect(responses[2].status).toBe(200); // /news
      expect(responses[3].status).toBe(200); // /admin/users (super_admin has access)
    });
  });
});