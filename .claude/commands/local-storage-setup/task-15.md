# local-storage-setup - Task 15

Execute task 15 for the local-storage-setup specification.

## Task Description
Create database initialization module

## Code Reuse
**Leverage existing code**: src/lib/db/schema.ts, src/lib/config/validator.ts, src/lib/utils/logger.ts

## Requirements Reference
**Requirements**: 3.1, 3.2, 5.1

## Usage
```
/Task:15-local-storage-setup
```

## Instructions

Execute with @spec-task-executor agent the following task: "Create database initialization module"

```
Use the @spec-task-executor agent to implement task 15: "Create database initialization module" for the local-storage-setup specification and include all the below context.

# Steering Context
## Steering Documents Context (Pre-loaded)

### Product Context
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

---

### Technology Context
# Technology Steering Document

## Core Stack

### Framework & Runtime
- **Next.js 15.5.3**: App Router, Server Components, Turbopack
- **React 19.1.0**: Latest React with concurrent features
- **Node.js**: Current Alpine version (Docker deployment)

### Styling & UI
- **Tailwind CSS v4**: Utility-first CSS framework
- **Framer Motion** (`motion`): Animation library
- **React Icons**: Icon library for UI components
- **Dark Mode**: Always-on dark theme (RED/BLACK/WHITE color scheme)

### Authentication & Security
- **NextAuth.js**: Admin authentication system
- **Session Management**: Server-side session handling
- **Access Control**: Route-based protection for admin areas

### Database
- **MySQL 8.0**: Primary database
- **Connection**: Docker network (local) / Direct connection (production)
- **Optimizations**:
  - Indexing for fast queries
  - Triggers for data consistency
  - Pagination for large datasets

### Storage
- **MinIO**: S3-compatible object storage
- **Features**:
  - Image storage with automatic thumbnails
  - Future: Audio/Video file support
- **Access Pattern**: URL-based media references

## Infrastructure

### Deployment Environment
- **Server**: VPC Ubuntu (1 CPU, 4GB RAM, 50GB Storage)
- **Container**: Docker-based deployment
- **Services**:
  - `radioapp`: Next.js application (port 3000)
  - `radiodb`: MySQL database (port 3306)
  - `radio_minio`: MinIO storage (ports 9000-9001)
  - `radio_phpmyadmin`: Database management (port 8080)

### CI/CD
- **GitHub Actions**: Automated deployment pipeline
- **Docker Build**: Multi-stage builds with Alpine base
- **Deployment**: SSH-based deployment to production server

### Development Environment
- **Local Docker Setup**: Replicate production environment
- **Hot Reload**: Turbopack for fast development
- **Database**: Local MySQL instance
- **Storage**: Local MinIO instance

## Third-Party Services

### Current Integrations
- **Radio Stream**: Direct HTTP/HTTPS streaming
- **CORS Proxy**: For metadata fetching (cros9.yayin.com.tr)

### Planned Integrations
- Extended media processing services
- Analytics and monitoring tools

## Mobile API Architecture

### API Design Principles
- **RESTful**: Standard HTTP methods and status codes
- **JSON**: All responses in JSON format
- **Stateless**: No session dependency for mobile
- **Versioned**: `/api/mobile/v1/` prefix for all mobile endpoints
- **CORS**: Configured for mobile app origins

### Mobile API Endpoints

#### Radio Player
- `GET /api/mobile/v1/radio/config`
  - Returns: Stream URL, metadata URL, current song info
  - Cache: 5 minutes

#### Polling System
- `GET /api/mobile/v1/polls/active`
  - Returns: Current active poll with items and images
  - Include: Vote counts, time remaining
- `POST /api/mobile/v1/polls/{pollId}/vote`
  - Body: `{ itemId, deviceId, deviceInfo }`
  - Validation: IP + Device ID uniqueness
  - Returns: Updated vote counts

#### News Feed
- `GET /api/mobile/v1/news`
  - Query params: `page`, `limit`, `category`
  - Returns: Paginated news with thumbnails
  - Supports: Infinite scroll pagination
  - Include: Image URLs, category, timestamps

#### Dynamic Content
- `GET /api/mobile/v1/content/pages`
  - Returns: List of available dynamic pages
- `GET /api/mobile/v1/content/pages/{pageId}`
  - Returns: JSON structure for page rendering
  - Format: Component array with types, props, actions

### API Response Format
```json
{
  "success": boolean,
  "data": any,
  "error": string | null,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "hasNext": boolean
  }
}
```

### Mobile-Specific Optimizations
- **Image Optimization**: Multiple resolutions (thumb, medium, full)
- **Caching Headers**: Proper ETags and Cache-Control
- **Compression**: Gzip for all text responses
- **Rate Limiting**: 100 requests/minute per IP
- **Error Handling**: Consistent error codes and messages

## Technical Constraints

### Performance Requirements
- **Stream Stability**: 99.9% uptime for radio player
- **Page Load**: < 3 seconds on 3G connection
- **Concurrent Users**: Support 1000+ simultaneous listeners
- **Database Queries**: < 100ms response time
- **Mobile API Response**: < 200ms average latency
- **Concurrent Mobile Users**: Support 5000+ mobile app users

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Special handling for iOS audio limitations

### Security Considerations
- No credentials in codebase
- Environment variables for sensitive data
- HTTPS-only in production
- Input sanitization for all user inputs
- Rate limiting for API endpoints

## Key Technical Decisions

### Radio Player Implementation
- **Context-based State**: Global player state management
- **iOS Optimizations**:
  - Nuclear reset strategy
  - Aggressive health monitoring
  - Cache-busting for stream URLs
- **Reconnection Logic**: Exponential backoff with max retries
- **Audio Context**: Web Audio API for visualizations (non-iOS)

### Image Handling
- **Thumbnail Generation**: Automatic on upload
- **Storage Pattern**: MinIO with public URLs
- **Optimization**: WebP format support
- **CDN Ready**: URL-based access pattern

### Database Design
- **Normalization**: 3NF for data integrity
- **Indexing Strategy**:
  - Primary keys on all tables
  - Indexes on foreign keys
  - Composite indexes for common queries
  - Indexes on poll vote queries (device_id, ip_address)
  - Indexes on news pagination (created_at, category)
- **Soft Deletes**: For content recovery
- **Timestamps**: created_at, updated_at on all tables

### Dynamic Content System
- **Page Builder Storage**: JSON columns for page definitions
- **Component Registry**: Predefined component types
- **Version Control**: Track page version history
- **Preview System**: Test pages before publishing
- **Mobile Rendering**: JSON schema for React Native components

### API Design
- **RESTful Routes**: Standard HTTP methods
- **Server Actions**: For form submissions
- **Response Format**: JSON with consistent structure
- **Error Handling**: Standardized error responses

## Development Guidelines

### Code Standards
- TypeScript for type safety (when applicable)
- ESLint for code quality
- Prettier for formatting
- Conventional commits

### Testing Strategy
- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical user flows
- Manual testing for iOS compatibility

### Monitoring & Logging
- Server-side error logging
- Stream health monitoring
- User analytics (privacy-compliant)
- Performance metrics

## Migration & Upgrade Path
- Database migrations via SQL scripts
- Zero-downtime deployments
- Rollback capability
- Version tagging for releases

---

### Structure Context
# Project Structure Steering Document

## Directory Organization

```
webapp/
├── .claude/                    # Claude-specific documentation
│   └── steering/               # Steering documents
├── .github/                    # GitHub Actions workflows
│   └── workflows/
│       └── deploy.yml          # CI/CD deployment pipeline
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/          # Public-facing pages
│   │   │   ├── layout.tsx     # Public layout wrapper
│   │   │   ├── page.tsx       # Homepage
│   │   │   ├── polls/         # Polling pages
│   │   │   └── news/          # News section
│   │   ├── admin/             # Admin panel (protected)
│   │   │   ├── layout.tsx     # Admin layout with auth
│   │   │   ├── page.tsx       # Admin dashboard
│   │   │   ├── polls/         # Poll management
│   │   │   ├── news/          # News management
│   │   │   ├── media/         # Media manager
│   │   │   ├── content/       # Dynamic content builder
│   │   │   └── settings/      # Radio & site settings
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth endpoints
│   │   │   ├── polls/         # Polling API
│   │   │   ├── news/          # News API
│   │   │   ├── media/         # Media upload/management
│   │   │   ├── radio/         # Radio metadata
│   │   │   └── mobile/        # Mobile app endpoints
│   │   │       └── v1/        # Version 1 API
│   │   │           ├── radio/ # Radio config
│   │   │           ├── polls/ # Poll data & voting
│   │   │           ├── news/  # News feed
│   │   │           └── content/ # Dynamic pages
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── common/            # Shared components
│   │   │   ├── Header.tsx     # Site header with logo
│   │   │   ├── Footer.tsx     # Site footer
│   │   │   └── Layout.tsx     # Layout wrapper
│   │   ├── radio/             # Radio player components
│   │   │   ├── RadioPlayer.tsx
│   │   │   ├── RadioPlayerContext.tsx
│   │   │   └── PlayerControls.tsx
│   │   ├── polls/             # Polling components
│   │   │   ├── PollCard.tsx
│   │   │   ├── VoteModal.tsx
│   │   │   └── PollResults.tsx
│   │   ├── news/              # News components
│   │   │   ├── NewsCarousel.tsx
│   │   │   ├── NewsCard.tsx
│   │   │   └── NewsModal.tsx
│   │   ├── media/             # Media components
│   │   │   ├── MediaManager.tsx
│   │   │   ├── MediaPicker.tsx
│   │   │   └── ImageUpload.tsx
│   │   ├── content/           # Dynamic content builder
│   │   │   ├── ContentBuilder.tsx
│   │   │   ├── ComponentPalette.tsx
│   │   │   ├── PreviewPane.tsx
│   │   │   └── ComponentTypes.tsx
│   │   └── ui/                # UI primitives
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── Card.tsx
│   │       └── Input.tsx
│   ├── lib/
│   │   ├── auth/              # Authentication utilities
│   │   ├── db/                # Database utilities
│   │   │   ├── client.ts      # MySQL client
│   │   │   └── queries/       # SQL query functions
│   │   ├── storage/           # MinIO utilities
│   │   │   ├── client.ts      # MinIO client
│   │   │   └── upload.ts      # Upload handlers
│   │   ├── utils/             # General utilities
│   │   │   ├── iosDetection.ts
│   │   │   ├── formatting.ts
│   │   │   └── validation.ts
│   │   └── constants.ts       # App constants
│   ├── hooks/                 # Custom React hooks
│   │   ├── useRadioPlayer.ts
│   │   ├── useMediaUpload.ts
│   │   └── usePagination.ts
│   ├── types/                 # TypeScript definitions
│   │   ├── database.ts        # DB schema types
│   │   ├── api.ts             # API types
│   │   └── index.ts           # Common types
│   └── styles/                # Additional styles
│       └── components/        # Component-specific styles
├── public/                    # Static assets
│   ├── images/               # Static images
│   └── fonts/                # Custom fonts
├── prisma/                   # Database schema (if using Prisma)
│   ├── schema.prisma
│   └── migrations/
├── docker/                   # Docker configurations
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env.local               # Local environment variables
├── .env.production          # Production environment template
├── next.config.mjs          # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## Naming Conventions

### Files
- **Components**: PascalCase (e.g., `RadioPlayer.tsx`)
- **Utilities**: camelCase (e.g., `iosDetection.ts`)
- **API Routes**: kebab-case (e.g., `radio-settings`)
- **Pages**: kebab-case folders with `page.tsx`

### Code
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase with `I` prefix for interfaces
- **Database Tables**: snake_case
- **Database Columns**: snake_case

### Git Branches
- `main`: Production branch
- `dev`: Development branch
- `feature/[feature-name]`: Feature branches
- `fix/[bug-description]`: Bug fix branches

## Component Organization

### Component Structure
```tsx
// Imports - External
import React from 'react';
import { motion } from 'motion';

// Imports - Internal
import { Button } from '@/components/ui';
import { useRadioPlayer } from '@/hooks';

// Types
interface ComponentProps {
  // ...
}

// Component
export function ComponentName({ props }: ComponentProps) {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
}
```

### API Route Structure

### Standard API Route
```ts
// app/api/[route]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  // Authentication check if needed
  // Validation
  // Business logic
  // Response
}
```

### Mobile API Route
```ts
// app/api/mobile/v1/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    // Request validation
    // Database query with pagination
    // Image URL generation with sizes

    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        page: 1,
        limit: 20,
        total: 100,
        hasNext: true
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

## Database Schema Pattern

### Tables Structure
- `users`: Admin users
- `polls`: Poll definitions
- `poll_items`: Items in polls
- `poll_votes`: Vote records (indexed on device_id, ip_address)
- `news`: News articles (indexed on created_at, category)
- `news_categories`: News categories
- `media`: Media library
- `settings`: Application settings
- `radio_settings`: Radio configuration
- `content_pages`: Dynamic page definitions (JSON structure)
- `content_components`: Available component types
- `content_versions`: Page version history

### Common Columns
- `id`: Primary key (AUTO_INCREMENT)
- `created_at`: Record creation (TIMESTAMP)
- `updated_at`: Last update (TIMESTAMP)
- `deleted_at`: Soft delete (TIMESTAMP NULL)
- `created_by`: User reference (Foreign Key)
- `is_active`: Status flag (BOOLEAN)

## Environment Variables

### Required Variables
```env
# Database
DATABASE_URL=mysql://user:pass@localhost:3306/dbname

# Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=media

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Radio
RADIO_STREAM_URL=https://radyo.yayin.com.tr:5132/stream
RADIO_METADATA_URL=https://radyo.yayin.com.tr:5132/

# Mobile API
API_VERSION=v1
MOBILE_API_KEY=your-api-key
RATE_LIMIT_MOBILE=100
```

## Import Aliases
```json
{
  "@/*": ["./src/*"],
  "@/components": ["./src/components"],
  "@/lib": ["./src/lib"],
  "@/hooks": ["./src/hooks"],
  "@/types": ["./src/types"]
}
```

## Build & Deploy Process

### Local Development
```bash
npm run dev          # Start development server
npm run build        # Build production
npm run start        # Start production server
```

### Docker Commands
```bash
docker-compose up -d      # Start all services
docker-compose down       # Stop all services
docker-compose logs -f    # View logs
```

### Deployment Flow
1. Push to `main` branch
2. GitHub Actions triggers
3. Build Docker image
4. Deploy to server via SSH
5. Restart containers
6. Health check

## Testing Structure
```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── e2e/              # End-to-end tests
└── fixtures/         # Test data
```

## Documentation Standards
- README.md at project root
- Component documentation in JSDoc format
- API documentation in OpenAPI format
- Database schema documentation
- Deployment guide in /docs

**Note**: Steering documents have been pre-loaded. Do not use get-content to fetch them again.

# Specification Context
## Specification Context (Pre-loaded): local-storage-setup

### Requirements
# Requirements Document

## Introduction

This feature implements MySQL database and MinIO object storage connectivity for the local development environment. The goal is to establish a robust data persistence layer that mirrors production capabilities while enabling efficient local development workflows. This includes setting up database connections, object storage clients, and necessary utilities for media management.

## Alignment with Product Vision

This feature directly supports the product vision by providing essential infrastructure for:
- **Media Manager**: Centralized image/media management with MinIO storage
- **Content Management**: Database persistence for polls, news, and dynamic content
- **Performance**: Local database queries under 100ms as specified in tech.md
- **Development Efficiency**: Local environment mirroring production for faster development
- **"Keep it basic" motto**: Simple, straightforward implementation without overcomplication

## Requirements

### Requirement 1: MySQL Database Connection

**User Story:** As a developer, I want to connect to a local MySQL database, so that I can develop and test database operations locally

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL establish a MySQL connection using environment variables
2. IF the MySQL connection fails THEN the system SHALL provide clear error messages with connection details
3. WHEN a database query is executed THEN the system SHALL return results in under 100ms for standard queries
4. IF the database is unavailable THEN the system SHALL handle errors gracefully without crashing
5. WHEN connection pooling is enabled THEN the system SHALL reuse connections efficiently

### Requirement 2: MinIO Object Storage Client

**User Story:** As a developer, I want to connect to local MinIO storage, so that I can upload and manage media files during development

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL initialize a MinIO client using environment variables
2. IF MinIO is not accessible THEN the system SHALL log detailed error messages with endpoint information
3. WHEN a file is uploaded THEN the system SHALL store it in the configured bucket
4. WHEN retrieving files THEN the system SHALL generate proper public URLs
5. IF bucket does not exist THEN the system SHALL create it automatically on first use

### Requirement 3: Database Schema Initialization

**User Story:** As a developer, I want database tables to be properly initialized, so that I can start development immediately

#### Acceptance Criteria

1. WHEN the database connects for the first time THEN the system SHALL check for existing schema
2. IF tables are missing THEN the system SHALL create them according to structure.md specifications
3. WHEN creating tables THEN the system SHALL apply proper indexes as defined in tech.md
4. IF migration is needed THEN the system SHALL provide clear migration instructions

### Requirement 4: Media Upload and Thumbnail Generation

**User Story:** As a content editor, I want to upload images with automatic thumbnail generation, so that media is optimized for web display

#### Acceptance Criteria

1. WHEN an image is uploaded THEN the system SHALL generate thumbnails automatically
2. IF upload fails THEN the system SHALL provide user-friendly error messages
3. WHEN thumbnails are generated THEN the system SHALL create multiple sizes (thumb, medium, full)
4. WHEN accessing media THEN the system SHALL return appropriate size based on context

### Requirement 5: Environment Configuration Management

**User Story:** As a developer, I want clear environment configuration, so that I can easily set up my local development environment

#### Acceptance Criteria

1. WHEN environment variables are missing THEN the system SHALL provide helpful error messages
2. IF using Docker THEN the system SHALL connect using Docker network names
3. WHEN not using Docker THEN the system SHALL connect to localhost services
4. IF credentials are incorrect THEN the system SHALL indicate authentication failure clearly

## Non-Functional Requirements

### Performance
- Database connection establishment: < 500ms
- Query execution time: < 100ms for standard queries
- File upload to MinIO: < 2 seconds for images up to 5MB
- Thumbnail generation: < 1 second per image
- Connection pool size: Minimum 5, Maximum 20 connections

### Security
- Database credentials stored in environment variables only
- No hardcoded passwords or secrets in codebase
- MinIO access keys properly secured in .env files
- SQL injection prevention through parameterized queries
- File upload validation for type and size

### Reliability
- Automatic reconnection on database connection loss
- Connection pooling with health checks
- MinIO client retry logic with exponential backoff
- Graceful degradation if storage is temporarily unavailable
- Proper error logging for debugging

### Usability
- Clear error messages for connection failures
- Helpful setup documentation for developers
- Console logging of successful connections in development
- Environment variable validation on startup
- Docker Compose integration for one-command setup

---

### Design
# Design Document

## Overview

This design establishes the MySQL database and MinIO object storage connectivity for the local development environment. The implementation follows a modular architecture with singleton patterns for connection management, connection pooling for database efficiency, and a service layer abstraction for storage operations. The design prioritizes simplicity, performance, and developer experience while maintaining production parity.

## Steering Document Alignment

### Technical Standards (tech.md)
- **MySQL 8.0**: Using mysql2 driver with promise support for async/await patterns
- **MinIO S3-compatible API**: Using official MinIO JavaScript SDK
- **Connection Pooling**: Implementing pool with 5-20 connections as specified
- **Performance Targets**: Design ensures <100ms query execution through indexing and pooling
- **Environment Variables**: All configuration via process.env following security best practices
- **Error Handling**: Standardized error responses with detailed logging in development

### Project Structure (structure.md)
- **Database Client**: `src/lib/db/client.ts` - MySQL connection management
- **Storage Client**: `src/lib/storage/client.ts` - MinIO client initialization
- **Upload Utilities**: `src/lib/storage/upload.ts` - File upload and thumbnail generation
- **Query Functions**: `src/lib/db/queries/` - Database query utilities
- **API Routes**: Following existing pattern in `src/app/api/`
- **Type Definitions**: `src/types/database.ts` and `src/types/storage.ts`

## Code Reuse Analysis

### Existing Components to Leverage
- **Empty Placeholder Files**: `src/lib/db/client.ts` and `src/lib/storage/client.ts` ready for implementation
- **Docker Configuration**: `docker/docker-compose.yml` with MySQL and MinIO services configured
- **Environment Setup**: `.env.local` with all necessary connection variables
- **API Route Pattern**: Existing routes in `src/app/api/` to follow for consistency
- **Type System**: TypeScript configuration ready for type-safe implementations

### Integration Points
- **Next.js App Router**: Server-side database queries in Server Components
- **API Routes**: Database and storage operations in API endpoints
- **Docker Network**: Services communicate via `radio_network` bridge
- **Environment Variables**: Using Next.js built-in env support

## Architecture

The architecture uses a layered approach with clear separation of concerns:

```mermaid
graph TD
    A[Next.js Application] --> B[Database Layer]
    A --> C[Storage Layer]
    B --> D[MySQL Connection Pool]
    C --> E[MinIO Client]
    D --> F[(MySQL Database)]
    E --> G[(MinIO Storage)]

    B --> H[Query Functions]
    C --> I[Upload Service]
    I --> J[Thumbnail Generator]

    K[Environment Variables] --> B
    K --> C
```

## Components and Interfaces

### Component 1: Database Client (`src/lib/db/client.ts`)
- **Purpose:** Manage MySQL connection pool and provide query interface with automatic environment detection
- **Interfaces:**
  - `getConnection()`: Returns pooled connection with health check
  - `query<T>(sql: string, params?: any[])`: Execute parameterized queries with type safety
  - `transaction<T>(callback: (conn: Connection) => Promise<T>)`: Handle transactional operations with auto-rollback
  - `isDockerEnvironment()`: Detect Docker vs local environment based on hostname resolution
- **Dependencies:** mysql2/promise, environment variables, dns module for Docker detection
- **Reuses:** N/A (new implementation)
- **Performance:** Connection pool (5-20), prepared statements cache, query timeout 5s

### Component 2: Storage Client (`src/lib/storage/client.ts`)
- **Purpose:** Initialize and manage MinIO client instance
- **Interfaces:**
  - `getClient()`: Returns configured MinIO client
  - `ensureBucket()`: Create bucket if not exists
  - `getPublicUrl()`: Generate public access URLs
- **Dependencies:** @aws-sdk/client-s3 or minio, environment variables
- **Reuses:** N/A (new implementation)

### Component 3: Upload Service (`src/lib/storage/upload.ts`)
- **Purpose:** Handle file uploads with validation and thumbnail generation
- **Interfaces:**
  - `uploadImage()`: Process and store image with thumbnails
  - `deleteFile()`: Remove file from storage
  - `generateThumbnails()`: Create multiple image sizes
- **Dependencies:** sharp, MinIO client, multer for multipart handling
- **Reuses:** Storage client from Component 2

### Component 4: Database Schema Manager (`src/lib/db/schema.ts`)
- **Purpose:** Initialize and validate database schema
- **Interfaces:**
  - `initializeSchema()`: Create tables if not exist
  - `checkSchema()`: Validate existing schema
  - `runMigration()`: Execute schema updates
- **Dependencies:** Database client, SQL schema definitions
- **Reuses:** Database client from Component 1

### Component 5: Environment Validator (`src/lib/config/validator.ts`)
- **Purpose:** Validate required environment variables on startup
- **Interfaces:**
  - `validateEnv()`: Check all required variables
  - `getConfig()`: Return typed configuration object
- **Dependencies:** process.env, zod for validation
- **Reuses:** N/A (new implementation)

## Data Models

### Database Schema
```sql
-- Users table (admin users)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor') DEFAULT 'editor',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_active (is_active)
);

-- Media table (for uploaded files)
CREATE TABLE IF NOT EXISTS media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  url VARCHAR(1000) NOT NULL,
  thumbnails JSON,
  width INT,
  height INT,
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_created (created_at),
  INDEX idx_deleted (deleted_at)
);

-- Settings table (application settings)
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id),
  INDEX idx_key (setting_key)
);
```

### Database Connection Configuration
```typescript
interface DatabaseConfig {
  host: string;              // Docker: 'radiodb' | Local: 'localhost'
  port: number;              // 3306
  user: string;              // from DATABASE_URL
  password: string;          // from DATABASE_URL
  database: string;          // 'radio_db'
  connectionLimit: number;   // Min: 5, Max: 20
  waitForConnections: boolean; // true
  queueLimit: number;        // 0 (unlimited)
  enableKeepAlive: boolean;  // true
  keepAliveInitialDelay: number; // 0
}

### Storage Configuration
```typescript
interface StorageConfig {
  endpoint: string;
  port: number;
  accessKey: string;
  secretKey: string;
  bucket: string;
  useSSL: boolean;
}
```

### Media Upload Result
```typescript
interface UploadResult {
  originalUrl: string;
  thumbnails: {
    thumb: string;    // 150x150 - for lists and grids
    medium: string;   // 600x600 - for cards and previews
    full: string;     // 1200x1200 - for full view
  };
  metadata: {
    size: number;
    mimeType: string;
    dimensions: { width: number; height: number; };
  };
}
```

### Database Query Result
```typescript
interface QueryResult<T = any> {
  rows: T[];
  fields: FieldInfo[];
  affectedRows?: number;
  insertId?: number;
}
```

## Error Handling

### Error Scenarios

1. **Database Connection Failure**
   - **Handling:** Retry with exponential backoff, max 3 attempts
   - **User Impact:** "Database temporarily unavailable" message in development console
   - **Logging:** Detailed connection error with host/port information

2. **MinIO Connection Failure**
   - **Handling:** Graceful degradation, queue uploads for retry
   - **User Impact:** "Media upload temporarily unavailable" with retry option
   - **Logging:** Endpoint and credential validation errors

3. **Invalid Environment Variables**
   - **Handling:** Fail fast on startup with clear instructions
   - **User Impact:** Application won't start, shows missing variable names
   - **Logging:** List of missing/invalid variables with setup guide

4. **Upload Size Exceeded**
   - **Handling:** Reject before upload, return size limit
   - **User Impact:** "File too large. Maximum size: 5MB"
   - **Logging:** File size and limit information

5. **Thumbnail Generation Failure**
   - **Handling:** Store original, mark thumbnails as pending
   - **User Impact:** Original image available, thumbnails generated async
   - **Logging:** Image processing error details

## Testing Strategy

### Unit Testing
- **Database Client**: Mock mysql2 connection, test query building
- **Storage Client**: Mock MinIO client, test URL generation
- **Upload Service**: Mock file processing, test validation logic
- **Environment Validator**: Test with various env configurations

### Integration Testing
- **Database Operations**: Test with Docker MySQL container
- **Storage Operations**: Test with Docker MinIO container
- **Full Upload Flow**: End-to-end image upload with thumbnails
- **Schema Initialization**: Test table creation and indexing

### End-to-End Testing
- **Developer Setup**: Clone repo, run docker-compose, verify connections
- **Media Upload**: Upload image via UI, verify storage and thumbnails
- **Database Queries**: Create, read, update, delete operations
- **Error Recovery**: Test connection loss and recovery

## Implementation Considerations

### Connection Management
- Use singleton pattern for database pool and MinIO client
- Lazy initialization on first use
- Graceful shutdown handling for connection cleanup
- Environment detection: Check if 'radiodb' hostname resolves for Docker, fallback to localhost

### Performance Optimizations
- Connection pool configuration: min 5, max 20, idle timeout 60s
- Prepared statements for frequent queries (cache size: 100)
- Query optimization: Use indexes on foreign keys and frequent WHERE columns
- Image processing: Queue with 2 workers, max 5MB per image
- CDN-ready URL generation: Pre-signed URLs with 7-day expiry

### Security Measures
- No credentials in code or error messages
- SQL injection prevention via mysql2 parameterized queries
- File type validation: Accept only image/jpeg, image/png, image/webp
- Size limits: 5MB per file, validated at multer middleware

### Developer Experience
- Clear console output: "✅ MySQL connected (Docker)" or "✅ MySQL connected (Local)"
- Helpful error messages: "❌ MySQL connection failed. Check if Docker is running: docker-compose up -d"
- Docker health checks: Wait for MySQL/MinIO ready state before app start
- Auto-creation: Database tables and MinIO bucket created on first run

### Environment Detection Logic
```typescript
// Detect Docker environment
async function isDockerEnvironment(): Promise<boolean> {
  try {
    await dns.promises.lookup('radiodb');
    return true; // Docker network resolved
  } catch {
    return false; // Use localhost
  }
}

// Connection string builder
function getConnectionConfig(): DatabaseConfig {
  const isDocker = await isDockerEnvironment();
  return {
    host: isDocker ? 'radiodb' : 'localhost',
    port: 3306,
    // ... other config
  };
}
```

### Error Recovery Strategy
- **Database Reconnection**: Exponential backoff (1s, 2s, 4s, 8s) with max 3 retries
- **MinIO Retry**: 3 attempts with 500ms, 1s, 2s delays
- **Upload Failure**: Store failed uploads in queue table for retry
- **Graceful Degradation**: If MinIO unavailable, allow app to run without media features

**Note**: Specification documents have been pre-loaded. Do not use get-content to fetch them again.

## Task Details
- Task ID: 15
- Description: Create database initialization module
- Leverage: src/lib/db/schema.ts, src/lib/config/validator.ts, src/lib/utils/logger.ts
- Requirements: 3.1, 3.2, 5.1

## Instructions
- Implement ONLY task 15: "Create database initialization module"
- Follow all project conventions and leverage existing code
- Mark the task as complete using: claude-code-spec-workflow get-tasks local-storage-setup 15 --mode complete
- Provide a completion summary
```

## Task Completion
When the task is complete, mark it as done:
```bash
claude-code-spec-workflow get-tasks local-storage-setup 15 --mode complete
```

## Next Steps
After task completion, you can:
- Execute the next task using /local-storage-setup-task-[next-id]
- Check overall progress with /spec-status local-storage-setup
