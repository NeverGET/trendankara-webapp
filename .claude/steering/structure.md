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