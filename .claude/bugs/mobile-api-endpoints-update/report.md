# Bug Report

## Bug Summary
Mobile API endpoints need updates to work correctly with the GCloud proxy server and match web app functionality. Multiple endpoints are missing required data fields (poll option images, poll status, news redirect URLs) and the POST endpoint for poll voting is untested in production.

## Bug Details

### Expected Behavior

**Polls API should provide:**
- GET endpoint returning list of available/active polls
- Poll option images included in response
- Poll status (enabled/disabled) matching public web app behavior
- POST endpoint for voting that works with proxy-forwarded requests
- Fraud prevention through device info and IP tracking

**News API should provide:**
- GET endpoint with title, summary, content
- Redirect URL field for each news item
- Image URLs for thumbnails/featured images
- Same data structure as web app

**Sponsors API:**
- Already working perfectly (confirmed in report)

### Actual Behavior

**Current Issues:**

1. **Polls GET endpoint** (`/api/mobile/v1/polls`):
   - Returns 500 error "Anketler yüklenirken bir hata oluştu"
   - Missing poll option images in response structure
   - Poll status not being checked correctly
   - Not aligned with web app poll display logic

2. **Polls POST endpoint** (`/api/mobile/v1/polls/[id]/vote`):
   - Code exists but UNTESTED in production
   - May not handle proxy-forwarded IP addresses correctly
   - Device info validation needs verification with real mobile clients

3. **News GET endpoint** (`/api/mobile/v1/news`):
   - Missing redirect URL field in response
   - Content field only available in detail endpoint (by design, but user wants it in list)
   - Image URLs present but need verification

4. **Proxy Server Workaround:**
   - SSL certificate issues on Android/iOS require proxy
   - Proxy URL: `https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy`
   - Example usage: `${EXPO_PUBLIC_PROXY_URL}/api/mobile/v1/...`
   - Need to test all endpoints through proxy in production

### Steps to Reproduce

1. Deploy application to production server
2. Access mobile API endpoints through GCloud proxy
3. Observe:
   - GET `/api/mobile/v1/polls` returns 500 error
   - GET `/api/mobile/v1/news` missing redirect URL field
   - POST `/api/mobile/v1/polls/[id]/vote` untested with real devices
4. Compare response structure to web app data requirements

### Environment
- **Version**: Current dev branch
- **Platform**: Production server (82.29.169.180) + GCloud Functions proxy
- **Configuration**:
  - Docker deployment
  - MySQL 8.0 database
  - Next.js 15.5.3 App Router
  - Proxy: `europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy`

## Impact Assessment

### Severity
- [x] High - Major functionality broken
  - Polls completely non-functional (500 error)
  - Mobile app cannot display polls or accept votes
  - Production deployment blocked

### Affected Users
- All mobile app users (iOS/Android)
- Testing team unable to verify mobile functionality
- Cannot proceed with mobile app deployment

### Affected Features
1. **Poll Voting System**: Completely broken
   - Cannot fetch active polls
   - Cannot submit votes
   - Mobile app shows errors

2. **News Feed**: Partially working
   - List displays but missing redirect URLs
   - Detail view works correctly
   - Cannot link to external news sources

3. **Mobile App Launch**: Blocked
   - Cannot test with deployed version
   - SSL workaround via proxy unverified
   - Production readiness compromised

## Additional Context

### Error Messages
```
GET /api/mobile/v1/polls
Response: 500 Internal Server Error
{
  "success": false,
  "data": null,
  "error": "Anketler yüklenirken bir hata oluştu"
}
```

### Related Documentation
- Previous test report: `MOBILE_API_REPORT.md` (from 2025-10-10)
- Existing endpoints: All under `/api/mobile/v1/` directory
- Working reference: `/api/mobile/v1/content/cards` (sponsors) works perfectly

### Technical Context

**Proxy Architecture:**
- Mobile apps cannot connect directly to server due to SSL issues
- GCloud Functions proxy provides Google SSL certificate
- Proxy forwards all requests to production server
- Need to verify IP address forwarding works (for vote fraud prevention)

**Web App Reference:**
- Public poll display: Shows poll options with images
- Vote submission: Tracks IP + device/browser fingerprint
- News display: Shows redirect URLs for external links
- All features work on web, need parity on mobile

### Screenshots/Media
None - API endpoints, all JSON responses

### Related Issues
- SSL certificate issues on mobile (workaround: proxy)
- Previous poll endpoint failures (documented in MOBILE_API_REPORT.md)
- News list endpoint cache issues (resolved, but mentioned for context)

## Initial Analysis

### Suspected Root Cause

1. **Polls Endpoint Error:**
   - Mobile settings service may be misconfigured
   - Database query issues with poll options and images
   - PollService not returning image URLs for poll items
   - Settings check (`enablePolls`) may be failing

2. **Missing Fields:**
   - API response types not matching mobile requirements
   - Image URLs for poll options not being fetched/joined
   - News redirect URLs not included in serialization
   - Response transformers missing required fields

3. **Untested POST Endpoint:**
   - Vote submission never tested with real devices
   - IP forwarding from proxy may not preserve original IP
   - Device info validation logic untested
   - Fraud prevention may block legitimate votes

### Affected Components

**Files Likely Involved:**
- `/src/app/api/mobile/v1/polls/route.ts` - GET endpoint (failing)
- `/src/app/api/mobile/v1/polls/[id]/vote/route.ts` - POST endpoint (untested)
- `/src/app/api/mobile/v1/news/route.ts` - Missing redirect URL field
- `/src/services/mobile/PollService.ts` - Poll data fetching logic
- `/src/services/mobile/NewsService.ts` - News data transformation
- `/src/types/mobile.ts` - TypeScript type definitions
- `/src/lib/db/queries/polls.ts` - Database queries for polls
- `/src/lib/db/queries/news.ts` - Database queries for news

**Database Tables:**
- `polls` - Poll records
- `poll_items` - Poll options (need to include images)
- `poll_votes` - Vote tracking
- `news` - News articles (need redirect_url field)
- `mobile_settings` - Configuration (enablePolls flag)

**Expected Changes:**
1. Fix poll data fetching to include option images
2. Add poll status checking logic
3. Include redirect URLs in news responses
4. Test and verify vote POST endpoint with proxy
5. Ensure IP address forwarding works for fraud prevention
6. Update TypeScript types to reflect all required fields

---

## Next Steps
After approval of this bug report, proceed to `/bug-analyze` phase to investigate the root cause and plan the fix.
