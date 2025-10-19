# Mobile API Documentation

This directory contains documentation for integrating with the Trend Ankara Radio mobile API.

---

## 📱 Mobile App Guides

### Getting Started
- **[Mobile App Update Guide](./mobile-app-update-guide.md)** - Overview of API changes and migration guide
- **[Mobile Player Social Features](./mobile-player-social-features.md)** - Complete guide for social integration (WhatsApp, Instagram, Facebook, Phone)
- **[Quick Reference](./mobile-player-social-quick-reference.md)** - Fast lookup guide for social features

### Backend API Documentation
- **[Radio Settings API](./radio-settings.md)** - Radio configuration endpoints
- **[GCloud Proxy Setup](./gcloud-proxy-todo.md)** - Google Cloud proxy configuration (if needed)

---

## 🚀 Quick Links

### Most Used Endpoints

```
GET /api/mobile/v1/config          - Mobile app configuration & social features
GET /api/mobile/v1/polls/active    - Active polls
GET /api/mobile/v1/news            - News feed
GET /api/mobile/v1/radio           - Radio player config
```

### Base URL

**Production**: `https://www.trendankara.com`
**Staging**: _(Contact backend team)_

---

## 📋 Feature Documentation

### Social Features (NEW ✨)
The mobile player now supports social contact features:

- ✅ **WhatsApp Song Request** - Let users request songs via WhatsApp
- ✅ **Instagram Profile Link** - Link to station's Instagram
- ✅ **Facebook Page Link** - Link to station's Facebook page
- ✅ **Live Call-In Number** - Phone number for on-air participation
- ✅ **Player Logo** - Custom branding for mobile player
- ✅ **Live Info Toggle** - Show/hide current song information

**Documentation**:
- 📖 [Complete Guide](./mobile-player-social-features.md)
- ⚡ [Quick Reference](./mobile-player-social-quick-reference.md)

**Example Usage**:
```typescript
const response = await fetch('https://www.trendankara.com/api/mobile/v1/config');
const { data } = await response.json();

// Check if WhatsApp is enabled
if (data.playerWhatsappNumber) {
  // Show WhatsApp button
  const url = `whatsapp://send?phone=${data.playerWhatsappNumber}`;
  Linking.openURL(url);
}
```

---

## 🔄 API Versioning

Current version: **v1**

All mobile endpoints use the `/api/mobile/v1/` prefix.

---

## 📞 Support

- **Technical Issues**: Check API response and error logs
- **Feature Requests**: Contact product team
- **Documentation Updates**: Submit PR to this directory

---

## 📝 Contributing

To update this documentation:

1. Edit the relevant `.md` file
2. Follow existing format and structure
3. Include code examples
4. Test all example code
5. Submit PR with clear description

---

**Last Updated**: 2025-10-19
