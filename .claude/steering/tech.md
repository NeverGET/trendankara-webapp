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
- **Server**: VPC Ubuntu 24.04.3 LTS (1 CPU, 4GB RAM, 50GB Storage)
- **SSH Access**: `ssh root@82.29.169.180` (for backup and emergency management)
- **Container**: Docker-based deployment
- **Services**:
  - `radioapp`: Next.js application (port 3000, network: radio_network_alt)
  - `radio_mysql_alt`: MySQL 8.0 database (port 3307 external, 3306 internal)
  - `minio`: MinIO storage (port 9002 external, 9000 internal)
  - `radio_phpmyadmin_alt`: Database management (port 8080)

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

## Production Deployment Best Practices & Lessons Learned

### Critical Configuration Points

#### Environment Variables
**DO:**
- Use environment variables for ALL service connections
- Override .env files with actual environment variables in Docker
- Keep production credentials separate from development
- Use Docker environment variables with -e flags

**AVOID:**
- Hardcoding localhost or development values in .env.production
- Baking .env.production into Docker images (it overrides runtime env vars)
- Using DATABASE_URL when individual vars (DATABASE_HOST, etc.) work better

#### Docker Networking
**DO:**
- Use consistent Docker network (`radio_network_alt` in our case)
- Use container names as hostnames within the same network
- Avoid underscores in container names for MinIO (use `minio` not `radio_minio_alt`)

**AVOID:**
- Mixing containers across different networks
- Using IP addresses when container names work
- Creating containers without --network flag

#### Database Configuration
**Correct Production Setup:**
```bash
DATABASE_HOST=radio_mysql_alt  # Use container name, not localhost
DATABASE_PORT=3306             # Internal port, not external
DATABASE_USER=root
DATABASE_PASSWORD=radiopass123  # Match what's in MySQL container
DATABASE_NAME=radio_db
```

**Common Mistakes to Avoid:**
- Using external port (3307) instead of internal (3306)
- Wrong passwords (verify with `docker inspect` first)
- Missing `mysql2` package in production build
- Creating triggers without SUPER privilege (move logic to application)

#### Storage (MinIO) Configuration
**Correct Production Setup:**
```bash
MINIO_ENDPOINT=minio           # Simple hostname without underscores
MINIO_PORT=9000               # Internal port
MINIO_ACCESS_KEY=minioadmin   # Default or custom
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=media
MINIO_USE_SSL=false
```

**Common Mistakes to Avoid:**
- Using hostnames with underscores (breaks MinIO client)
- Forgetting to create the bucket
- Missing `minio` package in production build
- Using external port (9002) instead of internal (9000)

### Docker Build Considerations

#### Standalone Next.js Builds
**Issue:** Next.js standalone builds don't include all runtime dependencies

**Solution:** Add production dependencies explicitly in Dockerfile:
```dockerfile
# Install production dependencies that are needed at runtime
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production --omit=dev
```

#### File Permissions
**Issue:** Can't modify files copied into container at build time

**Solution:**
- Pass configuration via environment variables
- Or copy configuration files after container start with `docker cp`

### Database Schema Management

#### Index Creation
**DO:**
- Create indexes after tables are populated
- Use try-catch or ignore duplicate errors
- Check column existence before creating indexes

**AVOID:**
- Using `IF NOT EXISTS` for indexes (not supported in MySQL)
- Creating indexes on non-existent columns

#### Migrations
**DO:**
- Use safe migrations without triggers for production
- Move trigger logic to application code
- Test migrations on a copy first

**AVOID:**
- Using triggers without SUPER privilege
- Running untested migrations on production

### Testing & Verification

#### Health Check Endpoints
Create comprehensive health checks:
- `/api/test/db` - Database connection and schema validation
- `/api/test/storage` - Storage connection and bucket access

#### Quick Verification Commands
```bash
# Test from local machine
curl -s https://www.trendankara.com/api/test/db | jq '.health'
curl -s https://www.trendankara.com/api/test/storage | jq '.health'

# Test from inside container
docker exec radioapp node -e "console.log(process.env.DATABASE_HOST)"
```

### Emergency Recovery

#### SSH Access for Emergencies
- Server: `ssh root@82.29.169.180`
- Always available for direct server management
- Can restart containers, check logs, modify configs

#### Container Management Commands
```bash
# View all containers
docker ps -a

# Check logs
docker logs radioapp --tail 50

# Restart container with new env vars
docker stop radioapp && docker rm radioapp
docker run -d --name radioapp --network radio_network_alt -p 3000:3000 [ENV_VARS] radioapp:latest

# Copy files into running container
docker cp file.txt radioapp:/app/
```

### Common Debugging Steps

1. **Connection Issues:**
   - Verify containers are on same network: `docker inspect [container] | grep Network`
   - Test connectivity: `docker exec radioapp nc -zv [hostname] [port]`
   - Check environment variables: `docker exec radioapp printenv | grep [VAR]`

2. **Database Issues:**
   - Test connection: `docker exec radio_mysql_alt mysql -u root -p[password] -e "SELECT 1"`
   - Check tables: `docker exec radio_mysql_alt mysql -u root -p[password] radio_db -e "SHOW TABLES"`

3. **Storage Issues:**
   - Verify bucket exists
   - Check MinIO console at http://server:9003
   - Test with simple hostname (no underscores)

### Deployment Checklist

Before deploying:
- [ ] Build Docker image with production dependencies
- [ ] Verify environment variables match production services
- [ ] Ensure all containers are on the same Docker network
- [ ] Create necessary buckets in MinIO
- [ ] Run database migrations
- [ ] Test health endpoints after deployment

### Quick Deploy Script Location
- `/Users/cemalkurt/Projects/trendankara/webapp/production/quick-deploy.sh`
- Updates and deploys the application with correct configuration