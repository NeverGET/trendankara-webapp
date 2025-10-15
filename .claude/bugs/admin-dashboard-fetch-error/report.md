# Bug Report

## Bug Summary
Admin dashboard page failing with "fetch failed" TypeError when attempting to load dashboard statistics via server-side fetch call to internal API endpoint.

## Bug Details

### Expected Behavior
- Admin dashboard page should successfully fetch statistics from `/api/admin/dashboard/stats` endpoint
- Dashboard should display all statistics cards (news count, polls count, active polls, media files, radio stats)
- Server-side fetch should work seamlessly within Next.js server components

### Actual Behavior
The page crashes with a TypeError during server-side rendering:

```
TypeError: fetch failed

    at fetchDashboardStats (src/app/admin/page.tsx:23:22)
    at AdminDashboardPage (src/app/admin/page.tsx:50:17)
    at AdminDashboardPage (<anonymous>:null:null)
```

The fetch call to `${baseUrl}/api/admin/dashboard/stats` is failing before receiving a response.

### Steps to Reproduce
1. Log in to the admin panel at `/admin`
2. Navigate to the admin dashboard page (default landing page after login)
3. Observe console error in terminal/logs
4. Page fails to render properly

### Environment
- **Version**: Next.js 15.5.3 (Turbopack)
- **Platform**: Production server (Ubuntu 24.04.3 LTS, Docker container)
- **Configuration**:
  - Server-side rendering (SSR) with `dynamic = 'force-dynamic'`
  - Docker network: `radio_network_alt`
  - Container: `radioapp`

## Impact Assessment

### Severity
- [x] Critical - System unusable
- [ ] High - Major functionality broken
- [ ] Medium - Feature impaired but workaround exists
- [ ] Low - Minor issue or cosmetic

### Affected Users
All admin users attempting to access the dashboard. This is the primary landing page after admin login, making it a critical blocker.

### Affected Features
- Admin dashboard statistics display
- Quick metrics overview (news, polls, media counts)
- Radio stream statistics
- Admin user experience immediately after login

## Additional Context

### Error Messages
```
TypeError: fetch failed

Stack trace:
    at fetchDashboardStats (src/app/admin/page.tsx:23:22)
    at AdminDashboardPage (src/app/admin/page.tsx:50:17)
    at AdminDashboardPage (<anonymous>:null:null)
```

### Code Context
**File**: `src/app/admin/page.tsx:23`

```typescript
async function fetchDashboardStats() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const headersList = await headers();
    const cookie = headersList.get('cookie') || '';

    const response = await fetch(`${baseUrl}/api/admin/dashboard/stats`, {
      cache: 'no-store',
      headers: {
        cookie: cookie
      }
    });
    // ... rest of function
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Returns default stats
  }
}
```

### Environment Variable Issue
The `NEXTAUTH_URL` environment variable is likely:
1. Not set in production Docker container
2. Set to an incorrect value that cannot be resolved from within the container
3. Pointing to an external URL that the container cannot reach due to Docker networking

### Related Issues
- Docker networking configuration between containers
- Environment variable configuration in production deployment
- Server-side fetch calls in Next.js 15 with Docker

## Initial Analysis

### Suspected Root Cause
**Primary Issue**: Server-side fetch call is attempting to make an HTTP request to itself using `NEXTAUTH_URL`, but the URL is either:
1. Not set (defaults to `http://localhost:3000` which may not work in Docker)
2. Set to external domain (e.g., `https://www.trendankara.com`) which cannot be reached from within the container
3. Network isolation preventing container-to-container communication

**Why This Happens in Docker**:
- The Next.js server running in Docker container cannot reach external URLs that point back to itself
- Internal DNS resolution fails for external domain names within container network
- `localhost:3000` refers to container's localhost, not host machine

### Affected Components
1. **Primary**:
   - `src/app/admin/page.tsx:17-47` - `fetchDashboardStats()` function
   - Environment variable: `NEXTAUTH_URL`

2. **Secondary**:
   - `src/app/api/admin/dashboard/stats/route.ts` - API route being called
   - Docker deployment configuration
   - GitHub Actions deployment workflow

### Technical Pattern Issue
This is an anti-pattern in Next.js server components - making an HTTP fetch call to the same server's API route from within a server component. Better approaches:
1. Call database directly from server component
2. Extract shared business logic into a service function
3. Use internal API base URL for Docker environments

---

**Created**: 2025-10-15
**Reporter**: Claude Code (via user bug report)
**Priority**: P0 (Critical - Blocks admin functionality)
