/**
 * Middleware configuration for authentication
 * Centralized route patterns and rules
 * SIMPLE configuration keeping it basic
 */

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  '/',
  '/news',
  '/news/:path*',
  '/polls',
  '/polls/:path*',
  '/auth/login',
] as const;

/**
 * Public API routes that don't require authentication
 */
export const PUBLIC_API_ROUTES = [
  '/api/radio',
  '/api/radio/:path*',
  '/api/polls/vote',
  '/api/polls/vote/:path*',
  '/api/mobile',
  '/api/mobile/:path*',
  '/api/auth',
  '/api/auth/:path*',
  '/api/test', // Test endpoints for health checks
  '/api/test/:path*',
] as const;

/**
 * Admin routes that require authentication
 */
export const ADMIN_ROUTES = [
  '/admin',
  '/admin/:path*',
] as const;

/**
 * Admin API routes that require authentication
 */
export const ADMIN_API_ROUTES = [
  '/api/admin',
  '/api/admin/:path*',
] as const;

/**
 * Super admin only routes
 */
export const SUPER_ADMIN_ROUTES = [
  '/admin/users',
  '/admin/users/:path*',
  '/api/admin/users',
  '/api/admin/users/:path*',
  '/api/admin/sessions',
  '/api/admin/sessions/:path*',
] as const;

/**
 * Routes that authenticated users should not access
 */
export const AUTH_REDIRECT_ROUTES = [
  '/auth/login',
  '/auth/register', // If we add registration later
] as const;

/**
 * Default redirect paths
 */
export const REDIRECT_PATHS = {
  LOGIN: '/auth/login',
  ADMIN: '/admin',
  HOME: '/',
  UNAUTHORIZED: '/admin?error=unauthorized',
} as const;

/**
 * Check if a path matches a pattern
 * @param path - The path to check
 * @param pattern - The pattern to match (supports :path* wildcard)
 * @returns boolean - True if the path matches
 */
export function matchPath(path: string, pattern: string): boolean {
  // Simple pattern matching
  if (pattern.includes(':path*')) {
    const base = pattern.replace('/:path*', '');
    return path === base || path.startsWith(`${base}/`);
  }

  return path === pattern;
}

/**
 * Check if a path is public
 * @param path - The path to check
 * @returns boolean - True if the path is public
 */
export function isPublicPath(path: string): boolean {
  // Check public routes
  for (const route of PUBLIC_ROUTES) {
    if (matchPath(path, route)) return true;
  }

  // Check public API routes
  for (const route of PUBLIC_API_ROUTES) {
    if (matchPath(path, route)) return true;
  }

  return false;
}

/**
 * Check if a path requires authentication
 * @param path - The path to check
 * @returns boolean - True if authentication is required
 */
export function requiresAuth(path: string): boolean {
  // Check admin routes
  for (const route of ADMIN_ROUTES) {
    if (matchPath(path, route)) return true;
  }

  // Check admin API routes
  for (const route of ADMIN_API_ROUTES) {
    if (matchPath(path, route)) return true;
  }

  return false;
}

/**
 * Check if a path requires super admin role
 * @param path - The path to check
 * @returns boolean - True if super admin is required
 */
export function requiresSuperAdmin(path: string): boolean {
  for (const route of SUPER_ADMIN_ROUTES) {
    if (matchPath(path, route)) return true;
  }

  return false;
}

/**
 * Check if authenticated users should be redirected from this path
 * @param path - The path to check
 * @returns boolean - True if authenticated users should be redirected
 */
export function shouldRedirectAuthenticated(path: string): boolean {
  for (const route of AUTH_REDIRECT_ROUTES) {
    if (matchPath(path, route)) return true;
  }

  return false;
}

/**
 * Get the appropriate redirect URL for unauthorized access
 * @param path - The current path
 * @param isAuthenticated - Whether the user is authenticated
 * @param hasPermission - Whether the user has permission
 * @returns string - The redirect URL
 */
export function getRedirectUrl(
  path: string,
  isAuthenticated: boolean,
  hasPermission: boolean = true
): string {
  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return `${REDIRECT_PATHS.LOGIN}?callbackUrl=${encodeURIComponent(path)}`;
  }

  // Authenticated but no permission - redirect to admin with error
  if (!hasPermission) {
    return REDIRECT_PATHS.UNAUTHORIZED;
  }

  // Authenticated user on login page - redirect to admin
  if (shouldRedirectAuthenticated(path)) {
    return REDIRECT_PATHS.ADMIN;
  }

  // No redirect needed
  return path;
}