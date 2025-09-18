/**
 * Authentication helper functions
 * SIMPLE utilities for session management and authorization
 */

import { auth } from './config';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

/**
 * Get the current server session
 * Use this in Server Components and Route Handlers
 */
export async function getServerSession(): Promise<Session | null> {
  return await auth();
}

/**
 * Require authentication for a page or API route
 * Redirects to login if not authenticated
 * @param redirectTo - Optional URL to redirect to after login
 */
export async function requireAuth(redirectTo?: string): Promise<Session> {
  const session = await auth();

  if (!session) {
    const loginUrl = redirectTo
      ? `/auth/login?callbackUrl=${encodeURIComponent(redirectTo)}`
      : '/auth/login';
    redirect(loginUrl);
  }

  return session;
}

/**
 * Check if user has a specific role
 * @param session - The user session
 * @param role - The required role
 * @returns boolean - True if user has the role
 */
export function checkRole(
  session: Session | null,
  role: 'admin' | 'super_admin' | 'editor'
): boolean {
  if (!session?.user) return false;

  const userRole = (session.user as any).role;

  // Super admin has access to everything
  if (userRole === 'super_admin') return true;

  // Admin has access to admin and editor roles
  if (userRole === 'admin' && (role === 'admin' || role === 'editor')) return true;

  // Direct role match
  return userRole === role;
}

/**
 * Require a specific role for access
 * Throws an error if user doesn't have the role
 * @param session - The user session
 * @param role - The required role
 */
export function requireRole(
  session: Session | null,
  role: 'admin' | 'super_admin' | 'editor'
): void {
  if (!checkRole(session, role)) {
    throw new Error('Unauthorized: Insufficient permissions');
  }
}

/**
 * Get user ID from session
 * @param session - The user session
 * @returns string | null - The user ID or null
 */
export function getUserId(session: Session | null): string | null {
  return (session?.user as any)?.id || null;
}

/**
 * Get user role from session
 * @param session - The user session
 * @returns string | null - The user role or null
 */
export function getUserRole(session: Session | null): string | null {
  return (session?.user as any)?.role || null;
}

/**
 * Check if user is authenticated
 * @param session - The user session
 * @returns boolean - True if authenticated
 */
export function isAuthenticated(session: Session | null): boolean {
  return !!session?.user;
}

/**
 * Check if user is super admin
 * @param session - The user session
 * @returns boolean - True if user is super admin
 */
export function isSuperAdmin(session: Session | null): boolean {
  return getUserRole(session) === 'super_admin';
}

/**
 * Check if user is admin (includes super admin)
 * @param session - The user session
 * @returns boolean - True if user is admin or super admin
 */
export function isAdmin(session: Session | null): boolean {
  const role = getUserRole(session);
  return role === 'admin' || role === 'super_admin';
}

/**
 * Format session for client-side use
 * Removes sensitive information
 * @param session - The user session
 * @returns Object - Safe session data
 */
export function formatSessionForClient(session: Session | null): any {
  if (!session?.user) return null;

  const user = session.user as any;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    expires: session.expires
  };
}