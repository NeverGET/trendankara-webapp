/**
 * Next.js middleware for authentication
 * Protects admin routes and handles redirects
 * SIMPLE implementation using NextAuth
 */

import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware function to protect routes
 */
export default auth(async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await auth();

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/news',
    '/polls',
    '/auth/login',
  ];

  // Define API routes that don't require authentication
  const publicApiRoutes = [
    '/api/radio',
    '/api/polls/vote',
    '/api/mobile',
    '/api/auth', // NextAuth routes
  ];

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isPublicApiRoute = publicApiRoutes.some(route =>
    pathname.startsWith(route)
  );

  const isPublic = isPublicRoute || isPublicApiRoute;

  // Check if it's an admin route
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminApiRoute = pathname.startsWith('/api/admin');
  const isProtectedRoute = isAdminRoute || isAdminApiRoute;

  // If it's a protected route and user is not authenticated
  if (isProtectedRoute && !session) {
    // For API routes, return 401
    if (isAdminApiRoute) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For pages, redirect to login
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access login page
  if (pathname === '/auth/login' && session) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  // Check role-based access for super admin only routes
  if (pathname.startsWith('/admin/users') || pathname.startsWith('/api/admin/users')) {
    const userRole = (session?.user as any)?.role;

    if (userRole !== 'super_admin') {
      // For API routes, return 403
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { error: 'Forbidden: Super admin access required' },
          { status: 403 }
        );
      }

      // For pages, redirect to admin dashboard with error
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  // Allow the request to continue
  return NextResponse.next();
});

/**
 * Configure which routes the middleware should run on
 * Exclude static files and images
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - .well-known
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.well-known).*)',
  ],
};