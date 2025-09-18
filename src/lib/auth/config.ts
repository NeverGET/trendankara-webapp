/**
 * NextAuth.js configuration
 * SIMPLE implementation with credentials provider and database sessions
 */

import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { MySQLAdapter } from './adapter';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db/client';
import { isRateLimited, recordFailedAttempt, resetFailedAttempts, getClientIP } from './rate-limit';
import type { UserRole } from '@/types/auth';

/**
 * Authenticate user with rate limiting
 * This function should be called before NextAuth's signIn to handle rate limiting
 * @param email - User's email
 * @param password - User's password
 * @param ipAddress - Client's IP address
 * @returns Object with authentication result and rate limiting info
 */
export async function authenticateWithRateLimit(
  email: string,
  password: string,
  ipAddress: string
): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  isRateLimited?: boolean;
  remainingTime?: number;
}> {
  // Check if IP is rate limited
  const rateLimitCheck = isRateLimited(ipAddress);
  if (rateLimitCheck.isBlocked) {
    return {
      success: false,
      error: rateLimitCheck.message,
      isRateLimited: true,
      remainingTime: rateLimitCheck.remainingTime
    };
  }

  // Validate credentials
  if (!email || !password) {
    return {
      success: false,
      error: 'E-posta ve şifre gerekli' // Turkish: Email and password required
    };
  }

  try {
    // Get user from database
    console.log('Looking up user with email:', email);
    const result = await db.query(
      `SELECT id, email, password, name, role, is_active
       FROM users
       WHERE email = ?`,
      [email]
    );

    console.log('Database query result rows:', result.rows.length);
    const user = result.rows[0];

    if (!user) {
      console.log('User not found in database');
      // Record failed attempt for non-existent user
      const failedAttempt = recordFailedAttempt(ipAddress);
      return {
        success: false,
        error: failedAttempt.message || 'Geçersiz e-posta veya şifre', // Turkish: Invalid email or password
        isRateLimited: failedAttempt.isBlocked
      };
    }

    // Check if user is active
    if (!user.is_active) {
      // Record failed attempt for inactive user
      const failedAttempt = recordFailedAttempt(ipAddress);
      return {
        success: false,
        error: failedAttempt.message || 'Hesap aktif değil', // Turkish: Account is not active
        isRateLimited: failedAttempt.isBlocked
      };
    }

    // Verify password
    console.log('Verifying password for user:', user.email);
    console.log('Password hash from DB:', user.password);
    console.log('Password provided:', password);
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password verification result:', isValidPassword);

    if (!isValidPassword) {
      // Record failed attempt for wrong password
      const failedAttempt = recordFailedAttempt(ipAddress);
      return {
        success: false,
        error: failedAttempt.message || 'Geçersiz e-posta veya şifre', // Turkish: Invalid email or password
        isRateLimited: failedAttempt.isBlocked
      };
    }

    // Successful authentication - reset failed attempts
    resetFailedAttempts(ipAddress);

    // Return user object (password excluded)
    return {
      success: true,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      }
    };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      success: false,
      error: 'Sisteme giriş sırasında bir hata oluştu' // Turkish: An error occurred during login
    };
  }
}

/**
 * NextAuth configuration object
 * Defines providers, callbacks, and session strategy
 */
export const authConfig: NextAuthConfig = {
  // Note: Credentials provider requires JWT strategy
  // adapter: MySQLAdapter(), // Commented out as it's not compatible with JWT strategy

  // Use JWT sessions (required for credentials provider)
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },

  // Configure pages
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  // Configure providers - just credentials for now
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        console.log('=== AUTH ATTEMPT ===');
        console.log('Credentials received:', { email: credentials?.email, hasPassword: !!credentials?.password });

        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        // Extract IP address from request
        // Note: In NextAuth, req might not always be available, but we try to get it
        const ipAddress = req ? getClientIP(req.headers || {}) : 'unknown';
        console.log('IP Address:', ipAddress);

        // Use the rate-limited authentication function
        const authResult = await authenticateWithRateLimit(
          credentials.email as string,
          credentials.password as string,
          ipAddress
        );

        console.log('Auth Result:', {
          success: authResult.success,
          error: authResult.error,
          hasUser: !!authResult.user
        });

        if (!authResult.success) {
          // Log the error for debugging
          console.error('Authentication failed:', authResult.error, 'IP:', ipAddress);

          // NextAuth authorize function should return null for failed authentication
          // The error handling will be done at the callback level
          return null;
        }

        // Return user object for successful authentication
        console.log('Returning user:', authResult.user);
        return authResult.user;
      }
    })
  ],

  // Configure callbacks
  callbacks: {
    // JWT callback - runs whenever JWT is created, updated or accessed
    async jwt({ token, user }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },

    // Session callback - runs whenever session is accessed
    async session({ session, token }) {
      // Add user data from token to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },

    // Check if user is authorized to access the app
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      // Public routes that don't require authentication
      const publicRoutes = [
        '/',
        '/news',
        '/polls',
        '/api/radio',
        '/api/polls/vote',
        '/api/mobile',
        '/auth/login'
      ];

      // Check if current path is public
      const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
      );

      // Admin routes require authentication
      const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

      if (isAdminRoute && !isLoggedIn) {
        return false; // Redirect to login
      }

      // Already logged in users shouldn't access login page
      if (pathname === '/auth/login' && isLoggedIn) {
        return Response.redirect(new URL('/admin', request.url));
      }

      return true;
    }
  },

  // Enable debug logging in development
  debug: process.env.NODE_ENV === 'development',

  // Trust host
  trustHost: true,
};

// Export configured NextAuth instance
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);