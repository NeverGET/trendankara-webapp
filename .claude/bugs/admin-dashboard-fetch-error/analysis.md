# Bug Analysis

## Root Cause Analysis

### Investigation Summary
Through comprehensive code analysis, I've identified that the admin dashboard page (`src/app/admin/page.tsx`) is attempting to make an HTTP fetch request to its own API endpoint (`/api/admin/dashboard/stats`) from within a Next.js server component. This is an anti-pattern that fails in the Docker production environment due to network isolation and the way `NEXTAUTH_URL` is configured.

### Root Cause
**Primary Issue**: Server-Side Self-Fetch in Docker Environment

The `fetchDashboardStats()` function at `src/app/admin/page.tsx:17-47` attempts to fetch data from the API route using:

```typescript
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const response = await fetch(`${baseUrl}/api/admin/dashboard/stats`, {
  cache: 'no-store',
  headers: { cookie: cookie }
});
```

**Why This Fails**:
1. **In Production**: `NEXTAUTH_URL` is set to `https://www.trendankara.com` (from `deploy.yml:45`)
2. **Docker Network Isolation**: The Next.js container running at `radioapp` cannot reach external domain names pointing back to itself
3. **DNS Resolution**: The container cannot resolve `www.trendankara.com` to its own internal service
4. **Result**: The fetch fails with "fetch failed" error before establishing any connection

### Contributing Factors

1. **Architectural Anti-Pattern**
   - Making HTTP requests from server components to the same server's API routes is unnecessary
   - Server components already run on the server and have direct access to database and business logic
   - The API route at `src/app/api/admin/dashboard/stats/route.ts` simply executes database queries that could be called directly

2. **Environment Configuration**
   - `NEXTAUTH_URL` is designed for authentication callbacks, not for internal API calls
   - No separate environment variable exists for internal service URLs
   - Docker networking not leveraged for internal communication

3. **Inconsistent Patterns**
   - Other admin pages (`/admin/polls`, `/admin/news`) use `'use client'` and fetch from client-side
   - The dashboard page uses server-side rendering with server-side fetch, creating this unique issue

4. **Lack of Abstraction**
   - Business logic is split between the page component and API route
   - No shared service layer for database operations
   - Existing database utilities (`src/lib/db/queries/index.ts`) not utilized

## Technical Details

### Affected Code Locations

1. **Primary Issue - Dashboard Page**
   - **File**: `src/app/admin/page.tsx`
   - **Function**: `fetchDashboardStats()`
   - **Lines**: 17-47
   - **Issue**: Server component making HTTP fetch to own API, using external URL that fails in Docker

2. **Secondary - API Route**
   - **File**: `src/app/api/admin/dashboard/stats/route.ts`
   - **Function**: `GET()`
   - **Lines**: 5-85
   - **Issue**: Contains business logic that should be in a shared service layer

3. **Related Infrastructure**
   - **File**: `.github/workflows/deploy.yml`
   - **Lines**: 45
   - **Issue**: `NEXTAUTH_URL=https://www.trendankara.com` cannot be reached from within container

### Data Flow Analysis

**Current (Broken) Flow**:
```
Server Component (radioapp container)
  → fetch(https://www.trendankara.com/api/admin/dashboard/stats)
  → DNS lookup fails / Network unreachable
  → TypeError: fetch failed
```

**What Should Happen**:
```
Server Component
  → Direct database queries via lib/db/client
  → Get stats data
  → Render component with data
```

**Working Example Pattern** (from other admin pages):
```
Client Component ('use client')
  → Browser makes fetch to /api/...
  → API route handles request
  → Response returned to browser
```

### Dependencies

**Current Dependencies**:
- **Environment Variables**:
  - `NEXTAUTH_URL` (misconfigured for internal API calls)
  - Docker network: `radio_network_alt`
  - Database connection via `radio_mysql_alt:3306`

**Existing Infrastructure Available**:
- Database client: `src/lib/db/client.ts` (fully functional)
- Query utilities: `src/lib/db/queries/index.ts` (reusable helpers)
- Auth: `src/lib/auth/config.ts` (for session checks)

## Impact Analysis

### Direct Impact
- **User Experience**: Admin dashboard completely unusable
- **Business Impact**: Admins cannot see overview metrics immediately after login
- **Severity**: P0 - Critical blocker for primary admin workflow

### Indirect Impact
- **Loss of Trust**: Admins may question system reliability
- **Workflow Disruption**: Must navigate to specific pages to see any data
- **Potential Pattern**: If this pattern exists elsewhere, other pages may break similarly

### Risk Assessment
**Risks if Not Fixed**:
- Continued admin frustration and potential data entry errors
- Loss of overview functionality critical for decision-making
- May discourage use of admin panel altogether
- Sets bad precedent for future development patterns

## Solution Approach

### Fix Strategy
**Recommended Solution**: **Refactor to Direct Database Queries**

Remove the HTTP fetch entirely and call the database directly from the server component, following Next.js 15 best practices.

**Why This Approach**:
1. ✅ **Eliminates Root Cause**: No more network calls to self
2. ✅ **Performance Improvement**: Removes HTTP overhead
3. ✅ **Follows Best Practices**: Server components should use direct data access
4. ✅ **Consistent with Stack**: Matches Next.js App Router patterns
5. ✅ **Leverages Existing Code**: Uses established `db` client and query utilities
6. ✅ **Simpler Architecture**: Less moving parts, easier to maintain
7. ✅ **Docker-Safe**: No dependency on external URLs or network configuration

### Alternative Solutions

**Alternative 1: Use Internal Docker URL**
- Set `NEXTAUTH_URL=http://radioapp:3000` for internal calls
- **Pros**: Minimal code changes
- **Cons**:
  - Still anti-pattern (unnecessary HTTP overhead)
  - Breaks authentication callbacks (NEXTAUTH_URL must be external)
  - Requires separate env var for internal vs external URLs
  - Adds complexity to configuration
  - Not recommended by Next.js documentation

**Alternative 2: Convert to Client Component**
- Change page to `'use client'` and fetch from browser
- **Pros**: Matches pattern used by `/admin/polls` and `/admin/news`
- **Cons**:
  - Loses SSR benefits (slower initial load)
  - Extra round trip (server → browser → server API → database)
  - Requires loading states and error handling on client
  - Data not available for server-side meta tags

**Alternative 3: Create Service Layer**
- Extract business logic to `src/lib/services/dashboard.ts`
- Import and call from both page and API route
- **Pros**:
  - Reusable code
  - Clean separation of concerns
  - API route remains functional for client-side calls if needed
- **Cons**:
  - More refactoring required
  - API route becomes redundant for this use case

**Selected Approach**: Combination of Solution 1 (Direct DB) + Solution 3 (Service Layer)
- Extract logic to service function for reusability
- Call service directly from server component
- Remove or deprecate API route (no longer needed)

### Risks and Trade-offs

**Risks of Chosen Solution**:
1. **Testing Impact**: Need to test server component with real database
2. **Error Handling**: Must ensure proper error handling in server component context
3. **Session Check**: Need to verify authentication in server component

**Mitigation**:
- Use existing `auth()` function from `src/lib/auth/config.ts` for session checks
- Implement try-catch with fallback to empty stats (already exists in current code)
- Follow existing patterns from other query utilities

**Trade-offs**:
- API route becomes unused (can be removed or kept for future client-side needs)
- Slight architectural shift (more direct database access from pages)

**Benefits Outweigh Risks**:
- Eliminates entire class of bugs (self-fetch issues)
- Faster, more efficient data loading
- Simpler codebase with less indirection

## Implementation Plan

### Changes Required

#### Change 1: Create Dashboard Service Function
- **File**: `src/lib/services/dashboard.ts` (new file)
- **Modification**: Extract business logic from API route
- **Purpose**: Reusable function for fetching dashboard statistics

```typescript
// src/lib/services/dashboard.ts
import { db } from '@/lib/db/client';
import { count } from '@/lib/db/queries';

export interface DashboardStats {
  totalNews: number;
  totalPolls: number;
  activePolls: number;
  totalMedia: number;
  currentListeners: number;
  peakListeners: number;
  streamStatus: boolean;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Use existing query utilities for database counts
    const totalNews = await count('news');
    const totalPolls = await count('polls');
    const activePolls = await count('polls', [
      { column: 'is_active', operator: '=', value: 1 }
    ]);
    const totalMedia = await count('media');

    // Fetch radio statistics (external API)
    let radioStats = {
      currentListeners: 0,
      peakListeners: 0,
      streamStatus: false
    };

    try {
      const radioResponse = await fetch('https://radyo.yayin.com.tr:5132/stats?json=1', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (radioResponse.ok) {
        const radioData = await radioResponse.json();
        radioStats = {
          currentListeners: radioData.currentlisteners || 0,
          peakListeners: radioData.peaklisteners || 0,
          streamStatus: radioData.streamstatus === 1
        };
      }
    } catch (radioError) {
      console.error('Failed to fetch radio stats:', radioError);
      // Continue with default values
    }

    return {
      totalNews,
      totalPolls,
      activePolls,
      totalMedia,
      ...radioStats
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return empty stats on error
    return {
      totalNews: 0,
      totalPolls: 0,
      activePolls: 0,
      totalMedia: 0,
      currentListeners: 0,
      peakListeners: 0,
      streamStatus: false
    };
  }
}
```

#### Change 2: Refactor Admin Dashboard Page
- **File**: `src/app/admin/page.tsx`
- **Modification**: Remove `fetchDashboardStats`, import and call service directly
- **Lines to Change**: 17-50

```typescript
// src/app/admin/page.tsx
import { StatsCard } from '@/components/admin/StatsCard';
import { RadioStatsCard } from '@/components/admin/RadioStatsCard';
import { AdminDashboardGrid, ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import {
  FiFileText,
  FiBarChart2,
  FiImage,
  FiActivity,
  FiRadio,
  FiUsers
} from 'react-icons/fi';
import { getDashboardStats } from '@/lib/services/dashboard';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

// Force dynamic rendering since this page requires authentication
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Check authentication
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  // Fetch dashboard stats directly (no HTTP call)
  const stats = await getDashboardStats();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-dark-text-primary">
          Yönetim Paneli
        </h1>
        <p className="text-sm md:text-base text-dark-text-secondary mt-1">
          Site yönetimine genel bakış
        </p>
      </div>

      {/* Radio Stats - Featured */}
      <RadioStatsCard
        currentListeners={stats.currentListeners}
        peakListeners={stats.peakListeners}
        streamStatus={stats.streamStatus}
        className="mb-6"
      />

      {/* Other Stats Grid */}
      <AdminDashboardGrid gap="md">
        <StatsCard
          title="Toplam Haber"
          value={stats.totalNews}
          icon={<FiFileText className="w-4 h-4 md:w-5 md:h-5" />}
          badge={stats.totalNews > 100 ? { text: 'Popüler', variant: 'purple' } : stats.totalNews > 50 ? { text: 'Aktif', variant: 'success' } : undefined}
        />

        <StatsCard
          title="Toplam Anket"
          value={stats.totalPolls}
          icon={<FiBarChart2 className="w-4 h-4 md:w-5 md:h-5" />}
          badge={stats.totalPolls > 0 ? { text: `${stats.totalPolls} Anket`, variant: 'info' } : undefined}
        />

        <StatsCard
          title="Aktif Anket"
          value={stats.activePolls}
          icon={<FiActivity className="w-4 h-4 md:w-5 md:h-5" />}
          trend={stats.activePolls > 0 ? { value: 100, isPositive: true } : undefined}
          badge={stats.activePolls > 0 ? { text: 'Canlı', variant: 'success' } : { text: 'Pasif', variant: 'warning' }}
        />

        <StatsCard
          title="Medya Dosyaları"
          value={stats.totalMedia}
          icon={<FiImage className="w-4 h-4 md:w-5 md:h-5" />}
          badge={stats.totalMedia > 500 ? { text: 'Yüksek', variant: 'pink' } : stats.totalMedia > 100 ? { text: 'Orta', variant: 'purple' } : undefined}
        />
      </AdminDashboardGrid>

      {/* Quick Actions */}
      {/* ... rest of the component remains the same ... */}
    </div>
  );
}
```

#### Change 3: Update or Remove API Route (Optional)
- **File**: `src/app/api/admin/dashboard/stats/route.ts`
- **Options**:
  1. **Option A**: Update to use service function (keep API for potential client-side use)
  2. **Option B**: Remove entirely (not needed anymore)

**Recommended: Option A** (Keep API functional but simplified)

```typescript
// src/app/api/admin/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getDashboardStats } from '@/lib/services/dashboard';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service function
    const stats = await getDashboardStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
```

### Testing Strategy

#### Unit Tests
- Test `getDashboardStats()` service function with mocked database
- Verify error handling returns empty stats object
- Test radio stats fetch with timeout and error handling

#### Integration Tests
1. **Database Integration**:
   - Verify service function queries correct tables
   - Test with real database connection
   - Validate count queries return accurate numbers

2. **Server Component**:
   - Test page renders with stats data
   - Verify authentication redirect works
   - Test error states (database connection failure)

3. **Radio API Integration**:
   - Test external radio stats fetch
   - Verify fallback when radio API is unavailable
   - Test timeout handling

#### Production Verification
1. **Deploy to Production**:
   - Deploy via GitHub Actions
   - Monitor container logs for errors
   - Verify no "fetch failed" errors

2. **Smoke Tests**:
   - Login to admin panel
   - Navigate to dashboard
   - Verify all stats display correctly
   - Check browser console for errors

3. **Performance Check**:
   - Measure page load time (should be faster than before)
   - Check database query performance
   - Verify no timeout issues

### Rollback Plan

**If Issues Arise**:

1. **Immediate Rollback** (within 5 minutes):
   ```bash
   cd /opt/app
   git revert HEAD
   docker build -t radioapp .
   docker stop radioapp && docker rm radioapp
   docker run -d --name radioapp --network radio_network_alt -p 3000:3000 --restart always [env vars...] radioapp
   ```

2. **Quick Fix** (if partial success):
   - Revert `src/app/admin/page.tsx` to use try-catch with empty stats
   - Keep service function for future use
   - Re-deploy with minimal changes

3. **Data Verification**:
   - Check database connection is still working
   - Verify other admin pages still function
   - Test authentication still works

**Rollback Success Criteria**:
- Admin can login
- Dashboard displays (even if with default values)
- No critical errors in logs

---

**Analysis Completed**: 2025-10-15
**Analyst**: Claude Code
**Confidence Level**: High
**Recommended Action**: Proceed with implementation

## Next Steps

1. Get user approval for this analysis
2. Proceed to `/bug-fix` phase to implement the solution
3. Test thoroughly in local environment
4. Deploy to production via GitHub Actions
5. Verify fix with `/bug-verify` phase
