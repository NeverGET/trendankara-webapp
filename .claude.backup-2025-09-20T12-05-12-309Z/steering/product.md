# Product Steering Document

## Product Overview
A professional radio station CMS platform serving Turkish audiences with live radio streaming, content management, and audience engagement features.

## Core Motto
"Keep it basic, don't overcomplicate anything" - Simplicity and functionality are paramount.

## Target Users
### Primary Users
- **Turkish Radio Listeners**: General public accessing the radio stream and content
- **Station Administrators**: Managing content, polls, and news
- **Content Editors**: Publishing and managing news articles

### User Access Points
- **Public Site**: https://[DOMAIN].com/ (Turkish interface)
- **Admin Panel**: https://[DOMAIN].com/admin (Turkish interface, English codebase)
- **Mobile App**: React Native iOS/Android app (consuming backend APIs)

## Key Features

### 1. Live Radio Player
- **Core Functionality**: Continuous streaming without interruption during page navigation
- **Technical Requirements**:
  - iOS TCP compatibility
  - Browser player problem handling
  - Auto-reconnection logic
  - Stream health monitoring
- **User Experience**: Always-on player that maintains state across the entire site

### 2. Polling System
- **Purpose**: Audience engagement through polls (Top 50 of Week, Top 10 of Month, etc.)
- **Features**:
  - Time-bound polls with start/end dates
  - Photo attachments for poll items
  - Public voting interface
  - Results visualization
  - Historical polls archive
- **Security**: Device/browser + IP verification (simple implementation)
- **Display**: Homepage popup + dedicated polls page

### 3. News Section
- **Layout**: Carousel-style featured news at top
- **Categories**:
  - MAGAZINE
  - ARTIST
  - ALBUM RELEASE
  - CONCERT
  - Admin-created custom categories
- **Features**:
  - Image galleries
  - Full article popup display
  - Breaking/Hot news markers
  - Admin controls (add/hide/delete)

### 4. Media Manager
- **Purpose**: Centralized image/media management
- **Features**:
  - Upload/Edit/Delete capabilities
  - Automatic thumbnail generation
  - Search functionality
  - Dialog component for content selection
  - URL-based media references

### 5. Mobile App API Backend
- **Purpose**: Provide RESTful API endpoints for React Native mobile app
- **Core Endpoints**:
  - Radio player configuration (stream URL, metadata)
  - Active poll data with voting endpoint
  - Paginated news feed with infinite scroll support
  - Dynamic content pages for sponsorships/custom content
- **Features**:
  - JSON-based responses
  - Pagination support for news
  - Real-time poll voting
  - Dynamic content builder responses

### 6. Dynamic Content Builder (Mobile-Only)
- **Purpose**: Create custom sponsorship/promotional pages for mobile app
- **Admin Features**:
  - Visual page builder in admin panel
  - Component-based design system
  - Preview functionality
  - Multiple active pages support
- **Mobile Delivery**:
  - JSON array structure defining page layout
  - Component types (text, image, button, card, etc.)
  - Styling and action definitions
  - Mobile app renders dynamically from JSON

## Design Philosophy
- **Color Scheme**: RED/BLACK/WHITE (matching company logo)
- **Theme**: Dark mode always
- **Style**: Professional, modern radio station aesthetic
- **Reference**: Similar to kralmuzik.com.tr quality
- **Logo Placement**: Prominent showcase in top navigation

## Content Management Rules
- Fixed page layouts (only content changes)
- All visual elements in Turkish
- Codebase and documentation in English
- No feature overcomplification
- Focus on core functionality

## Success Metrics
- Stream stability and uptime
- User engagement through polls (web + mobile)
- Content freshness (news updates)
- Admin efficiency in content management
- Page load performance
- Mobile API response times (< 200ms)
- Mobile app adoption rate

## Business Objectives
- Provide reliable 24/7 radio streaming service
- Engage Turkish audience with relevant content
- Simplify content management for administrators
- Maintain professional web presence
- Enable audience participation through voting

## Future Considerations
- Music file storage (planned)
- Video content support (planned)
- Extended media types beyond images