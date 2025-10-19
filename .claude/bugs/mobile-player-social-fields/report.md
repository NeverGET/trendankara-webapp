# Bug Report

## Bug Summary
Mobile app player social contact fields (WhatsApp, Instagram, Live Call Phone Number) are not being provided through the mobile API endpoint, despite being successfully stored in the database and manageable through the admin panel.

## Bug Details

### Expected Behavior
1. Admin should be able to save/update these fields in the admin panel:
   - **Istek Hattı** (Live stream guest phone number / Live Call Phone Number)
   - **WhatsApp Hattı** (WhatsApp song request number)
   - **Instagram** (Station's Instagram profile URL)
   - **Facebook** (Station's Facebook page URL)

2. Mobile API endpoint (`/api/mobile/v1/config`) should return these fields with:
   - Field existence status (to determine if feature is enabled/disabled)
   - Action type metadata (WhatsApp message redirect / Call number / Open Instagram profile)
   - The actual data (phone number, URL, etc.)

3. Mobile app should be able to:
   - Detect if a field exists (enabled) or not (disabled)
   - Know what action to perform based on field type
   - Use the provided data for the appropriate action

### Actual Behavior
1. ✅ **Admin Panel**: Works correctly
   - Fields can be saved and updated successfully
   - Data is stored in `mobile_settings` table under the `player` key
   - Current data in production:
     ```json
     {
       "playerLogoUrl": "/api/media/uploads/1758306383548-Trendankara3.png",
       "enableLiveInfo": true,
       "playerFacebookUrl": "https://facebook.com/trendankara",
       "playerInstagramUrl": "https://instagram.com/trendankara",
       "liveCallPhoneNumber": "0312 555 12 34",
       "playerWhatsappNumber": "905551234567"
     }
     ```

2. ❌ **Mobile API Endpoint**: NOT providing the fields
   - `/api/mobile/v1/config` endpoint only returns `playerLogoUrl`
   - Missing fields:
     - `playerInstagramUrl`
     - `playerWhatsappNumber`
     - `playerFacebookUrl`
     - `liveCallPhoneNumber`
     - `enableLiveInfo`

3. ❌ **Mobile App**: Cannot use these features
   - No way to detect if WhatsApp/Instagram/Phone features are enabled
   - No data to perform the actions
   - Features are essentially disabled despite being configured

### Steps to Reproduce
1. Go to Admin Panel → Mobile Settings → Oynatıcı (Player) Tab
2. Fill in the social contact fields:
   - Instagram: `https://instagram.com/trendankara`
   - WhatsApp: `905551234567`
   - Live Call Phone: `0312 555 12 34`
   - Facebook: `https://facebook.com/trendankara`
3. Save the settings successfully
4. Call mobile API: `GET /api/mobile/v1/config`
5. Observe response - only `playerLogoUrl` is included in player settings
6. Missing fields are not returned to mobile app

### Environment
- **Version**: Current production (dev branch: f9861e0)
- **Platform**: Backend API (Next.js 15.5.3, MySQL 8.0)
- **Database**: Production database at 82.29.169.180:3307
- **Configuration**:
  - Database table: `mobile_settings`
  - Settings key: `player`
  - Admin panel endpoint: `/api/admin/mobile/settings`
  - Mobile API endpoint: `/api/mobile/v1/config`

## Impact Assessment

### Severity
- [x] High - Major functionality broken
  - Social media integration features are completely non-functional for mobile app
  - Admin configuration has no effect on mobile app experience

### Affected Users
- **Mobile App Users**: Cannot use WhatsApp song request, cannot call live stream number, cannot open Instagram profile
- **Radio Station Administrators**: Their configuration efforts are wasted
- **Station Management**: Lost engagement opportunities through social channels

### Affected Features
1. **Mobile Player Social Integration**
   - WhatsApp song request feature (non-functional)
   - Live call-in feature (non-functional)
   - Instagram profile link (non-functional)
   - Facebook page link (non-functional)

2. **Admin Panel Mobile Settings**
   - Settings are saved but have no effect on mobile app
   - False impression that features are working

## Additional Context

### Technical Investigation Results

#### Database Layer ✅
```sql
-- Data is correctly stored in mobile_settings table
SELECT setting_key, setting_value FROM mobile_settings WHERE setting_key = 'player';

-- Returns:
{
  "playerLogoUrl": "/api/media/uploads/1758306383548-Trendankara3.png",
  "enableLiveInfo": true,
  "playerFacebookUrl": "https://facebook.com/trendankara",
  "playerInstagramUrl": "https://instagram.com/trendankara",
  "liveCallPhoneNumber": "0312 555 12 34",
  "playerWhatsappNumber": "905551234567"
}
```

#### Admin Panel ✅
- File: `src/components/admin/mobile/MobileSettingsForm.tsx`
- Lines 383-447: All social media fields are implemented
- Fields:
  - `playerFacebookUrl` (lines 386-398)
  - `playerInstagramUrl` (lines 400-412)
  - `playerWhatsappNumber` (lines 414-429)
  - `liveCallPhoneNumber` (lines 431-446)

#### TypeScript Types ✅
- File: `src/types/mobile.ts`
- Lines 142-147: All fields are defined in `MobileSettings` interface
```typescript
playerFacebookUrl?: string;
playerInstagramUrl?: string;
playerWhatsappNumber?: string;
liveCallPhoneNumber?: string;
```

#### ConfigService ❌ (ROOT CAUSE)
- File: `src/services/mobile/ConfigService.ts`
- Method: `combineSettings()` (lines 207-265)
- **Issue 1**: Looking for wrong database key
  - Code searches for: `player_config`
  - Database uses: `player`
- **Issue 2**: Only extracting `playerLogoUrl`
  - Line 236-240:
    ```typescript
    case 'player_config':  // ← Wrong key!
      if (value) {
        settings.playerLogoUrl = value.playerLogoUrl ?? null;
        // ❌ Missing all other player fields
      }
      break;
    ```

### Error Messages
No error messages - silent failure. The service simply doesn't extract the fields.

### Related Issues
- This affects mobile app specification requirements for social media integration
- Related to mobile API requirements 5.1-5.6 for radio configuration
- Blocks user engagement features through social channels

## Initial Analysis

### Suspected Root Cause
The `ConfigService.combineSettings()` method has two critical bugs:

1. **Wrong Database Key**:
   - Looking for `player_config` instead of `player`
   - This causes the switch case to never match
   - Even though data exists in database, it's not being read

2. **Incomplete Field Extraction**:
   - Only extracts `playerLogoUrl` from player settings
   - Ignores all social media contact fields
   - Fields need to be explicitly mapped

### Affected Components
1. **Primary**:
   - `src/services/mobile/ConfigService.ts` (lines 207-265)
   - Method: `combineSettings()`
   - Method: `mapSettingsToDbKeys()` (lines 274-341)

2. **Dependent**:
   - `/api/mobile/v1/config/route.ts` - Uses ConfigService
   - Mobile app - Cannot receive the data

3. **Related but Working**:
   - `src/lib/queries/mobileSettingsQueries.ts` - Admin panel queries (working)
   - `src/app/api/admin/mobile/settings/route.ts` - Admin API (working)
   - `src/components/admin/mobile/MobileSettingsForm.tsx` - Admin UI (working)

## Fix Requirements

### 1. ConfigService Fix
Update `combineSettings()` method to:
- Match correct database key: `player` (not `player_config`)
- Extract all player fields:
  - `playerLogoUrl`
  - `enableLiveInfo`
  - `playerFacebookUrl`
  - `playerInstagramUrl`
  - `playerWhatsappNumber`
  - `liveCallPhoneNumber`

### 2. Type Safety
Ensure `MobileSettings` interface includes all fields in return type (already defined, just need to map them)

### 3. API Response Enhancement (Optional)
Consider adding action type metadata to help mobile app:
```typescript
{
  playerInstagramUrl?: string;
  playerInstagramAction?: 'open-profile'; // Mobile app knows to open Instagram app
  playerWhatsappNumber?: string;
  playerWhatsappAction?: 'send-message'; // Mobile app knows to open WhatsApp
  liveCallPhoneNumber?: string;
  liveCallPhoneAction?: 'call'; // Mobile app knows to initiate call
}
```

### 4. Testing Requirements
- Verify `/api/mobile/v1/config` returns all player fields
- Test with fields present (should return values)
- Test with fields absent (should return undefined/null)
- Confirm mobile app can detect enabled/disabled state
- Validate admin panel changes reflect in API response

## Success Criteria
1. Mobile API endpoint returns all configured social contact fields
2. Mobile app can detect which features are enabled (field exists) vs disabled (field undefined)
3. Mobile app receives correct data for each action type
4. Admin panel changes immediately reflect in mobile API response
5. No breaking changes to existing functionality (playerLogoUrl still works)
