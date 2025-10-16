# Bug Report: Poll Option Description Not Displayed on Public Side

## Bug Summary
Poll option descriptions ("Açıklama (Opsiyonel)" field) are not displayed on the public-facing side of the application, even though they are available in the admin panel and stored in the database.

## Bug Details

### Expected Behavior
When viewing polls on the public side (homepage, polls page, or first-launch dialog), each poll option should display:
- **Seçenek Başlığı** (Option Title) - Currently displayed ✓
- **Açıklama** (Description) - Currently missing ✗

The description field is optional, so it should only appear when provided by the admin.

### Actual Behavior
Only the option title is displayed to public users. The description field, even when populated by admins, is never shown on:
- Homepage poll cards
- Polls page
- First-launch dialog modal
- Poll voting interface
- Poll results view

### Steps to Reproduce
1. Login to admin panel at `/admin`
2. Create or edit a poll with options
3. Fill in both "Seçenek Başlığı" and "Açıklama (Opsiyonel)" fields for poll options
4. Save the poll and set it as active
5. Navigate to the public homepage or polls page
6. Observe that only the option titles are shown, descriptions are missing

### Environment
- **Version**: Current production deployment
- **Platform**: Web application (Next.js 15)
- **Affected Pages**: All public-facing poll displays
- **Database**: MySQL 8.0 with MinIO storage

## Impact Assessment

### Severity
- [x] Medium - Feature impaired but workaround exists

### Affected Users
All public users viewing polls on the website and potentially mobile app users if they consume the same API endpoints.

### Affected Features
- Poll voting interface on homepage
- Dedicated polls page
- First-launch dialog
- Poll results display
- Historical/past polls view

## Additional Context

### Technical Investigation
The bug is caused by a **data flow interruption** in the frontend layer:

1. ✅ Database schema has `description` field (`PollItem.description`)
2. ✅ Backend API endpoints fetch and send description data
3. ❌ Frontend API client receives description but doesn't map it to the TypeScript interface
4. ❌ Components never receive description in the `PollOption` object
5. ❌ Components have no way to display it

### Affected Code Locations

#### 1. Type Definition Missing Field
**File**: `src/types/polls.ts`
```typescript
export interface PollOption {
  id: number;
  title: string;
  imageUrl?: string;
  voteCount: number;
  percentage?: number;
  // MISSING: description?: string;
}
```

#### 2. API Client Not Mapping Description
**File**: `src/lib/api/polls.ts`

Functions affected:
- `getActivePolls()` - lines 18-29
- `getPoll()` - lines 46-57
- `getPollResults()` - lines 90-101
- `getPastPolls()` - lines 135-146

Example from `getActivePolls()`:
```typescript
options: (poll.items || []).map((item: any) => ({
  id: item.id,
  title: item.title,
  imageUrl: item.image_url,
  voteCount: item.vote_count || 0,
  percentage: 0
  // MISSING: description: item.description
}))
```

#### 3. Components Not Displaying Description
**File**: `src/components/polls/PollCard.tsx` (lines 132-163)
- Voting interface only shows `option.title`

**File**: `src/components/polls/PollResults.tsx` (lines 72-98)
- Results view only shows `option.title` and vote counts

### Database Schema (Confirmed Working)
```sql
-- From prisma/schema.prisma
model PollItem {
  id           Int       @id @default(autoincrement())
  pollId       Int
  title        String    @db.VarChar(255)
  description  String?   @db.Text          -- ✓ Field exists
  imageUrl     String?   @db.VarChar(500)
  displayOrder Int       @default(0)
  voteCount    Int       @default(0)
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  poll         Poll      @relation(fields: [pollId], references: [id], onDelete: Cascade)
  votes        PollVote[]
}
```

### Backend API Endpoints (Confirmed Working)
**File**: `src/app/api/polls/active/route.ts` (lines 24-31)
**File**: `src/app/api/polls/[id]/route.ts` (lines 50-59)

Both endpoints correctly send `description` field in the response.

## Initial Analysis

### Suspected Root Cause
The bug is a **frontend data mapping issue**. The backend correctly provides the description data, but:
1. The TypeScript interface doesn't include the description field
2. The API client doesn't map the description from API responses
3. The UI components don't render the description even if it were available

### Affected Components
- `src/types/polls.ts` - Type definition
- `src/lib/api/polls.ts` - API client mapping layer (4 functions)
- `src/components/polls/PollCard.tsx` - Voting UI
- `src/components/polls/PollResults.tsx` - Results UI

### Files That Are Working Correctly
- Database schema ✓
- Backend API endpoints ✓
- Admin panel (description input works correctly) ✓

### Workaround
Currently no workaround exists for public users. Admins can still enter descriptions, but they will not be visible to the public until this bug is fixed.

## Related Issues
None identified. This appears to be an isolated frontend display issue.

---

**Bug Created**: 2025-10-16
**Created By**: Claude Code Bug Workflow
**Status**: Reported - Awaiting Analysis Phase
