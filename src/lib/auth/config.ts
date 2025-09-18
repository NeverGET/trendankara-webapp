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

/**
 * NextAuth configuration object
 * Defines providers, callbacks, and session strategy
 */
export const authConfig: NextAuthConfig = {
  // Use database adapter for session storage
  adapter: MySQLAdapter(),

  // Use database sessions instead of JWT
  session: {
    strategy: 'database',
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Get user from database
          const result = await db.query(
            `SELECT id, email, password, name, role, is_active
             FROM users
             WHERE email = ? AND deleted_at IS NULL`,
            [credentials.email]
          );

          const user = result.rows[0];

          if (!user) {
            console.error('User not found:', credentials.email);
            return null;
          }

          // Check if user is active
          if (!user.is_active) {
            console.error('User is not active:', credentials.email);
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValidPassword) {
            console.error('Invalid password for user:', credentials.email);
            return null;
          }

          // Return user object (password excluded)
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],

  // Configure callbacks
  callbacks: {
    // Enrich session with user role
    async session({ session, user }) {
      if (user && session.user) {
        // Get fresh user data from database
        const result = await db.query(
          `SELECT id, email, name, role, is_active
           FROM users
           WHERE id = ? AND deleted_at IS NULL`,
          [user.id]
        );

        const dbUser = result.rows[0];

        if (dbUser) {
          session.user.id = dbUser.id.toString();
          session.user.role = dbUser.role;
          session.user.email = dbUser.email;
          session.user.name = dbUser.name;
        }
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