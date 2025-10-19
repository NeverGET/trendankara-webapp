# Privacy Policy & Legal Documentation

This directory contains all legal documentation needed for TrendAnkara mobile app store release, including Privacy Policy and Terms & Conditions.

## Documents

### 1. `PRIVACY_POLICY_REQUIREMENTS.md` (Main Document)
**Comprehensive guide** covering:
- Language requirements (Turkish vs English)
- Store requirements (Apple & Google)
- KVKK (Turkish law) compliance details
- Complete data collection analysis
- Privacy policy content template (ready to use!)
- Technical implementation requirements
- Design specifications
- Mobile app configuration changes needed

**Read this first** for complete understanding.

### 2. `QUICK_CHECKLIST.md` (Action Items)
**Quick reference** with:
- Step-by-step checklist for webapp team
- Step-by-step checklist for mobile team
- Timeline and task ownership
- VERBIS registration reminder
- Status tracking

**Use this** for day-to-day implementation tracking.

### 3. `terms-and-conditions.html` ✅ **COMPLETE**
**English Terms & Conditions**:
- Ready-to-deploy HTML file
- Dark theme matching TrendAnkara branding
- Mobile-responsive design
- All legal sections included
- Company information filled in
- URL: `https://trendankara.com/terms-and-conditions.html`

### 4. `kullanim-kosullari.html` ✅ **COMPLETE**
**Turkish Terms & Conditions** (Kullanım Koşulları):
- Complete Turkish translation
- Dark theme matching TrendAnkara branding
- Mobile-responsive design
- All legal sections included
- Company information filled in
- URL: `https://trendankara.com/kullanim-kosullari.html`

### 5. `kunye.html` ✅ **COMPLETE**
**Company Information** (Künye):
- Turkish company details
- Radio station licensing info
- Contact information
- URL: `https://trendankara.com/kunye.html`

## Quick Start

### For Webapp Team
1. Read the main requirements document
2. Use the privacy policy content template (Turkish version provided)
3. Replace placeholders with actual company information
4. Implement at `https://trendankara.com/privacy-policy`
5. Follow technical requirements (mobile-responsive, < 3s load time)
6. Get legal review
7. Deploy and notify mobile team

### For Mobile Team
1. Wait for privacy policy to be deployed
2. Update `app.json` with privacy policy URL
3. Remove invalid schema properties
4. Add links to ALL legal pages in Settings screen:
   - Privacy Policy (Gizlilik Politikası)
   - Terms & Conditions (Kullanım Koşulları)
   - Künye (Company Identity)
5. Enter URLs in store submission forms
6. Test and submit

**📖 Complete Mobile Integration Guide**: [`../api/mobile-legal-pages-integration.md`](../api/mobile-legal-pages-integration.md)

## Critical Facts

✅ **Privacy Policy is MANDATORY** - app will be rejected without it
✅ **Terms & Conditions are MANDATORY** - required by both app stores
✅ **Turkish-only is sufficient** for Turkey-focused app
✅ **Both documents available** in Turkish and English
✅ **VERBIS registration required** (free, Turkey specific)
✅ **Must be publicly accessible** (no login)
✅ **Must load in < 3 seconds** on mobile

## Available URLs

Once deployed, the following pages will be accessible:

| Document | Turkish | English | Mobile Required |
|----------|---------|---------|-----------------|
| **Privacy Policy** | (To be implemented) | (To be implemented) | ✅ YES |
| **Terms & Conditions** | ✅ `kullanim-kosullari.html` | ✅ `terms-and-conditions.html` | ✅ YES |
| **Company Info (Künye)** | ✅ `kunye.html` | - | ✅ YES (Turkish law) |

**All three pages must be accessible from the mobile app Settings screen.**

**📱 Mobile Integration**: See complete guide at [`../api/mobile-legal-pages-integration.md`](../api/mobile-legal-pages-integration.md)

## What Data Does the App Collect?

**Minimal data collection** (privacy-friendly):
- Device info (for compatibility)
- App usage stats (for bug fixes)
- Poll votes (user choice)
- Push notification token (if enabled)
- Local preferences (theme, settings)

**No personal identification required** - no name, email, or phone.

## Timeline

Estimated **1 week** from start to completion:
- Webapp implementation: 2-4 days
- Legal review: 1 day
- Mobile app updates: 1 day
- Testing: 1 day

## Questions?

- **Content questions**: Check main requirements document
- **Technical webapp questions**: Review technical implementation section
- **Mobile app questions**: See mobile app configuration section
- **Legal questions**: Consult with Turkish lawyer (recommended!)

---

**Status**:
- Privacy Policy: 📋 Documentation Complete - Ready for Implementation
- Terms & Conditions: ✅ COMPLETE (HTML files ready)
- Company Info: ✅ COMPLETE

**Priority**: 🔴 CRITICAL (Blocks store submission)
**Created**: October 17, 2025
**Last Updated**: October 19, 2025 (Added Terms & Conditions)
