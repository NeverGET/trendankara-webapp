/**
 * Integration tests for NextAuth.js authentication API endpoints
 * Tests the complete authentication flow including login, session creation, and rate limiting
 */

import { NextRequest } from 'next/server';
import { handlers } from '@/lib/auth/config';
import { authenticateWithRateLimit } from '@/lib/auth/config';
import { clearAllRateLimits } from '@/lib/auth/rate-limit';
import bcrypt from 'bcryptjs';

// Mock the database client
jest.mock('@/lib/db/client', () => ({
  db: {
    query: jest.fn()
  }
}));

// Import the mocked db after mocking
import { db } from '@/lib/db/client';
const mockDb = db as jest.Mocked<typeof db>;

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    // Clear rate limiting data before each test
    clearAllRateLimits();
    // Reset database mocks
    mockDb.query.mockReset();
  });

  afterEach(() => {
    // Clean up any test artifacts
    clearAllRateLimits();
  });

  describe('NextAuth Handlers', () => {
    it('should export GET and POST handlers', () => {
      expect(handlers.GET).toBeDefined();
      expect(handlers.POST).toBeDefined();
      expect(typeof handlers.GET).toBe('function');
      expect(typeof handlers.POST).toBe('function');
    });
  });

  describe('Successful Login Flow', () => {
    const validUser = {
      id: 1,
      email: 'admin',
      password: '$2a$10$xH6.TmKwtLVgVr7rR3HJaeWz1oA0Xj1V9k4rYZhF4Y8ZN7z0N7cBa', // Hash for 'admin'
      name: 'Admin User',
      role: 'admin',
      is_active: 1
    };

    beforeEach(() => {
      // Mock successful database response for valid user
      mockDb.query.mockResolvedValue({
        rows: [validUser],
        fields: [],
        affectedRows: 1,
        insertId: 0,
        warningStatus: 0
      });
    });

    it('should authenticate valid credentials successfully', async () => {
      const result = await authenticateWithRateLimit('admin', 'admin', '192.168.1.1');

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: '1',
        email: 'admin',
        name: 'Admin User',
        role: 'admin'
      });
      expect(result.error).toBeUndefined();
      expect(result.isRateLimited).toBeFalsy();
    });

    it('should verify password correctly with bcrypt', async () => {
      // Test with the actual hash that would be in the database
      const isValidPassword = await bcrypt.compare('admin', validUser.password);
      expect(isValidPassword).toBe(true);

      // Test with wrong password
      const isInvalidPassword = await bcrypt.compare('wrongpassword', validUser.password);
      expect(isInvalidPassword).toBe(false);
    });

    it('should include all required user fields in response', async () => {
      const result = await authenticateWithRateLimit('admin', 'admin', '192.168.1.1');

      expect(result.success).toBe(true);
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('name');
      expect(result.user).toHaveProperty('role');

      // Should not include password in response
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('is_active');
    });

    it('should reset failed attempts on successful login', async () => {
      // First, simulate some failed attempts
      await authenticateWithRateLimit('admin', 'wrongpassword', '192.168.1.1');
      await authenticateWithRateLimit('admin', 'wrongpassword', '192.168.1.1');

      // Then succeed - this should reset the counter
      const result = await authenticateWithRateLimit('admin', 'admin', '192.168.1.1');

      expect(result.success).toBe(true);
      expect(result.isRateLimited).toBeFalsy();
    });
  });

  describe('Invalid Credentials Handling', () => {
    it('should reject non-existent user', async () => {
      // Mock empty database response (user not found)
      mockDb.query.mockResolvedValue({
        rows: [],
        fields: [],
        affectedRows: 0,
        insertId: 0,
        warningStatus: 0
      });

      const result = await authenticateWithRateLimit('nonexistent', 'password', '192.168.1.1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Geçersiz e-posta veya şifre');
      expect(result.user).toBeUndefined();
    });

    it('should reject incorrect password for valid user', async () => {
      const validUser = {
        id: 1,
        email: 'admin',
        password: '$2a$10$xH6.TmKwtLVgVr7rR3HJaeWz1oA0Xj1V9k4rYZhF4Y8ZN7z0N7cBa', // Hash for 'admin'
        name: 'Admin User',
        role: 'admin',
        is_active: 1
      };

      mockDb.query.mockResolvedValue({
        rows: [validUser],
        fields: [],
        affectedRows: 1,
        insertId: 0,
        warningStatus: 0
      });

      const result = await authenticateWithRateLimit('admin', 'wrongpassword', '192.168.1.1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Geçersiz e-posta veya şifre');
      expect(result.user).toBeUndefined();
    });

    it('should reject inactive user account', async () => {
      const inactiveUser = {
        id: 1,
        email: 'admin',
        password: '$2a$10$xH6.TmKwtLVgVr7rR3HJaeWz1oA0Xj1V9k4rYZhF4Y8ZN7z0N7cBa',
        name: 'Admin User',
        role: 'admin',
        is_active: 0 // Inactive user
      };

      mockDb.query.mockResolvedValue({
        rows: [inactiveUser],
        fields: [],
        affectedRows: 1,
        insertId: 0,
        warningStatus: 0
      });

      const result = await authenticateWithRateLimit('admin', 'admin', '192.168.1.1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Hesap aktif değil');
      expect(result.user).toBeUndefined();
    });

    it('should validate required credentials', async () => {
      // Test missing email
      const result1 = await authenticateWithRateLimit('', 'password', '192.168.1.1');
      expect(result1.success).toBe(false);
      expect(result1.error).toBe('E-posta ve şifre gerekli');

      // Test missing password
      const result2 = await authenticateWithRateLimit('admin', '', '192.168.1.1');
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('E-posta ve şifre gerekli');

      // Test both missing
      const result3 = await authenticateWithRateLimit('', '', '192.168.1.1');
      expect(result3.success).toBe(false);
      expect(result3.error).toBe('E-posta ve şifre gerekli');
    });
  });

  describe('Session Creation and JWT', () => {
    const validUser = {
      id: 1,
      email: 'admin',
      password: '$2a$10$xH6.TmKwtLVgVr7rR3HJaeWz1oA0Xj1V9k4rYZhF4Y8ZN7z0N7cBa',
      name: 'Admin User',
      role: 'admin',
      is_active: 1
    };

    beforeEach(() => {
      mockDb.query.mockResolvedValue({
        rows: [validUser],
        fields: [],
        affectedRows: 1,
        insertId: 0,
        warningStatus: 0
      });
    });

    it('should configure JWT session strategy correctly', async () => {
      const { authConfig } = await import('@/lib/auth/config');

      expect(authConfig.session?.strategy).toBe('jwt');
      expect(authConfig.session?.maxAge).toBe(24 * 60 * 60); // 24 hours
      expect(authConfig.session?.updateAge).toBe(60 * 60); // 1 hour
    });

    it('should include credentials provider in configuration', async () => {
      const { authConfig } = await import('@/lib/auth/config');

      expect(authConfig.providers).toBeDefined();
      expect(Array.isArray(authConfig.providers)).toBe(true);
      expect(authConfig.providers.length).toBeGreaterThan(0);

      // Check that credentials provider is configured
      const credentialsProvider = authConfig.providers.find(
        (provider: any) => provider.name === 'credentials'
      );
      expect(credentialsProvider).toBeDefined();
    });

    it('should configure correct login pages', async () => {
      const { authConfig } = await import('@/lib/auth/config');

      expect(authConfig.pages?.signIn).toBe('/auth/login');
      expect(authConfig.pages?.error).toBe('/auth/login');
    });

    it('should handle JWT callback correctly', async () => {
      const { authConfig } = await import('@/lib/auth/config');

      const mockToken = {};
      const mockUser = {
        id: '1',
        email: 'admin',
        name: 'Admin User',
        role: 'admin'
      };

      const result = await authConfig.callbacks?.jwt?.({ token: mockToken, user: mockUser });

      expect(result).toEqual({
        id: '1',
        email: 'admin',
        name: 'Admin User',
        role: 'admin'
      });
    });

    it('should handle session callback correctly', async () => {
      const { authConfig } = await import('@/lib/auth/config');

      const mockSession = {
        user: {}
      };
      const mockToken = {
        id: '1',
        email: 'admin',
        name: 'Admin User',
        role: 'admin'
      };

      const result = await authConfig.callbacks?.session?.({
        session: mockSession,
        token: mockToken
      });

      expect(result.user).toEqual({
        id: '1',
        email: 'admin',
        name: 'Admin User',
        role: 'admin'
      });
    });
  });

  describe('Rate Limiting Behavior', () => {
    const validUser = {
      id: 1,
      email: 'admin',
      password: '$2a$10$xH6.TmKwtLVgVr7rR3HJaeWz1oA0Xj1V9k4rYZhF4Y8ZN7z0N7cBa',
      name: 'Admin User',
      role: 'admin',
      is_active: 1
    };

    beforeEach(() => {
      mockDb.query.mockResolvedValue({
        rows: [validUser],
        fields: [],
        affectedRows: 1,
        insertId: 0,
        warningStatus: 0
      });
    });

    it('should track failed attempts by IP address', async () => {
      const ipAddress = '192.168.1.100';

      // First failed attempt
      let result = await authenticateWithRateLimit('admin', 'wrongpassword', ipAddress);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Geçersiz şifre. 4 deneme hakkınız kaldı.');

      // Second failed attempt
      result = await authenticateWithRateLimit('admin', 'wrongpassword', ipAddress);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Geçersiz şifre. 3 deneme hakkınız kaldı.');

      // Third failed attempt
      result = await authenticateWithRateLimit('admin', 'wrongpassword', ipAddress);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Geçersiz şifre. 2 deneme hakkınız kaldı.');
    });

    it('should block IP after maximum failed attempts', async () => {
      const ipAddress = '192.168.1.101';

      // Make 5 failed attempts (the maximum)
      for (let i = 0; i < 5; i++) {
        await authenticateWithRateLimit('admin', 'wrongpassword', ipAddress);
      }

      // Next attempt should be blocked
      const result = await authenticateWithRateLimit('admin', 'wrongpassword', ipAddress);
      expect(result.success).toBe(false);
      expect(result.isRateLimited).toBe(true);
      expect(result.error).toContain('Çok fazla başarısız giriş denemesi');
      expect(result.remainingTime).toBeGreaterThan(0);
    });

    it('should handle rate limiting for different IP addresses independently', async () => {
      const ip1 = '192.168.1.102';
      const ip2 = '192.168.1.103';

      // Make failed attempts from IP1
      for (let i = 0; i < 5; i++) {
        await authenticateWithRateLimit('admin', 'wrongpassword', ip1);
      }

      // IP1 should be blocked
      let result = await authenticateWithRateLimit('admin', 'wrongpassword', ip1);
      expect(result.isRateLimited).toBe(true);

      // IP2 should still work (first attempt)
      result = await authenticateWithRateLimit('admin', 'wrongpassword', ip2);
      expect(result.isRateLimited).toBeFalsy();
      expect(result.error).toBe('Geçersiz şifre. 4 deneme hakkınız kaldı.');
    });

    it('should reset rate limiting on successful login', async () => {
      const ipAddress = '192.168.1.104';

      // Make some failed attempts
      await authenticateWithRateLimit('admin', 'wrongpassword', ipAddress);
      await authenticateWithRateLimit('admin', 'wrongpassword', ipAddress);

      // Successful login should reset the counter
      let result = await authenticateWithRateLimit('admin', 'admin', ipAddress);
      expect(result.success).toBe(true);

      // Next failed attempt should start counting from 1 again
      result = await authenticateWithRateLimit('admin', 'wrongpassword', ipAddress);
      expect(result.error).toBe('Geçersiz şifre. 4 deneme hakkınız kaldı.');
    });

    it('should handle unknown IP addresses gracefully', async () => {
      const result = await authenticateWithRateLimit('admin', 'wrongpassword', 'unknown');
      expect(result.success).toBe(false);
      expect(result.isRateLimited).toBeFalsy();
    });
  });

  describe('Authentication Flow End-to-End', () => {
    const testUsers = [
      {
        id: 1,
        email: 'admin',
        password: '$2a$10$xH6.TmKwtLVgVr7rR3HJaeWz1oA0Xj1V9k4rYZhF4Y8ZN7z0N7cBa', // 'admin'
        name: 'Admin User',
        role: 'admin',
        is_active: 1
      },
      {
        id: 2,
        email: 'superadmin',
        password: '$2a$10$xH6.TmKwtLVgVr7rR3HJaeWz1oA0Xj1V9k4rYZhF4Y8ZN7z0N7cBa', // 'superadmin'
        name: 'Super Admin',
        role: 'super_admin',
        is_active: 1
      }
    ];

    it('should authenticate admin user successfully', async () => {
      mockDb.query.mockResolvedValue({
        rows: [testUsers[0]],
        fields: [],
        affectedRows: 1,
        insertId: 0,
        warningStatus: 0
      });

      const result = await authenticateWithRateLimit('admin', 'admin', '192.168.1.1');

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('admin');
      expect(result.user?.role).toBe('admin');
    });

    it('should authenticate superadmin user successfully', async () => {
      mockDb.query.mockResolvedValue({
        rows: [testUsers[1]],
        fields: [],
        affectedRows: 1,
        insertId: 0,
        warningStatus: 0
      });

      const result = await authenticateWithRateLimit('superadmin', 'superadmin', '192.168.1.1');

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('superadmin');
      expect(result.user?.role).toBe('super_admin');
    });

    it('should handle database connection errors gracefully', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      const result = await authenticateWithRateLimit('admin', 'admin', '192.168.1.1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sisteme giriş sırasında bir hata oluştu');
    });

    it('should validate the complete authentication process', async () => {
      mockDb.query.mockResolvedValue({
        rows: [testUsers[0]],
        fields: [],
        affectedRows: 1,
        insertId: 0,
        warningStatus: 0
      });

      // Step 1: Authenticate credentials
      const authResult = await authenticateWithRateLimit('admin', 'admin', '192.168.1.1');
      expect(authResult.success).toBe(true);

      // Step 2: Verify JWT configuration
      const { authConfig } = await import('@/lib/auth/config');
      expect(authConfig.session?.strategy).toBe('jwt');

      // Step 3: Test JWT callback flow
      const jwtResult = await authConfig.callbacks?.jwt?.({
        token: {},
        user: authResult.user
      });
      expect(jwtResult).toMatchObject({
        id: authResult.user?.id,
        email: authResult.user?.email,
        name: authResult.user?.name,
        role: authResult.user?.role
      });

      // Step 4: Test session callback flow
      const sessionResult = await authConfig.callbacks?.session?.({
        session: { user: {} },
        token: jwtResult
      });
      expect(sessionResult.user).toMatchObject({
        id: authResult.user?.id,
        email: authResult.user?.email,
        name: authResult.user?.name,
        role: authResult.user?.role
      });
    });
  });

  describe('Authorization Configuration', () => {
    it('should configure public routes correctly', async () => {
      const { authConfig } = await import('@/lib/auth/config');

      // Mock request and auth objects
      const mockAuth = { user: { id: '1', email: 'admin' } };
      const publicRoutes = ['/', '/news', '/polls', '/auth/login'];

      for (const route of publicRoutes) {
        const mockRequest = {
          nextUrl: { pathname: route }
        } as any;

        const result = await authConfig.callbacks?.authorized?.({
          auth: null,
          request: mockRequest
        });

        // Public routes should be accessible without authentication
        expect(result).toBe(true);
      }
    });

    it('should protect admin routes', async () => {
      const { authConfig } = await import('@/lib/auth/config');

      const adminRoutes = ['/admin', '/admin/dashboard', '/api/admin/users'];

      for (const route of adminRoutes) {
        const mockRequest = {
          nextUrl: { pathname: route }
        } as any;

        // Without authentication
        let result = await authConfig.callbacks?.authorized?.({
          auth: null,
          request: mockRequest
        });
        expect(result).toBe(false);

        // With authentication
        result = await authConfig.callbacks?.authorized?.({
          auth: { user: { id: '1', email: 'admin' } },
          request: mockRequest
        });
        expect(result).toBe(true);
      }
    });

    it('should redirect authenticated users from login page', async () => {
      const { authConfig } = await import('@/lib/auth/config');

      const mockRequest = {
        nextUrl: { pathname: '/auth/login' },
        url: 'http://localhost:3000/auth/login'
      } as any;

      const result = await authConfig.callbacks?.authorized?.({
        auth: { user: { id: '1', email: 'admin' } },
        request: mockRequest
      });

      // Should return a redirect response
      expect(result).toBeInstanceOf(Response);
    });
  });
});