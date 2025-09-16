# Development Setup Guide

This guide will help you set up the Trend Ankara Radio CMS development environment on your local machine. The development environment uses Docker to provide consistent and isolated services including MySQL database, MinIO object storage, Redis caching, and the Next.js application.

## Prerequisites

Before starting, ensure you have the following installed on your system:

### Required Software

1. **Docker Desktop** (version 4.0 or later)
   - Download from: https://www.docker.com/products/docker-desktop
   - Ensure Docker is running before proceeding

2. **Node.js** (version 18 or later)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

3. **Git**
   - Most systems have this pre-installed
   - Verify installation: `git --version`

### Optional but Recommended

1. **VS Code** with the following extensions:
   - Docker extension
   - Remote - Containers extension
   - TypeScript and JavaScript support

2. **Postman** or similar API testing tool
   - For testing API endpoints

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd webapp
```

### 2. Initialize Development Environment

The easiest way to get started is using the development script:

```bash
# Make the script executable (first time only)
chmod +x docker/dev.sh

# Initialize the complete development environment
./docker/dev.sh init
```

This command will:
- Create a `.env.local` file with default development settings
- Start all Docker services (database, storage, cache, web app)
- Wait for services to be ready
- Run health checks to verify everything is working

### 3. Verify Installation

Once the initialization completes, you should be able to access:

- **Web Application**: http://localhost:3000
- **PHPMyAdmin** (Database Admin): http://localhost:8080
- **MinIO Console** (Storage Admin): http://localhost:9001
- **API Health Checks**:
  - Database: http://localhost:3000/api/test/db
  - Storage: http://localhost:3000/api/test/storage

## Manual Setup

If you prefer to set up the environment manually:

### 1. Environment Configuration

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local  # If example exists
# OR create manually:
```

**.env.local** content:
```env
# Development Environment Variables
NODE_ENV=development

# Database Configuration
DATABASE_URL=mysql://root:radiopass123@localhost:3306/radio_db
DATABASE_CONNECTION_LIMIT=10
DATABASE_TIMEOUT=5000

# MinIO Storage Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=media
MINIO_USE_SSL=false
MINIO_REGION=us-east-1

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production

# Radio Stream Configuration
RADIO_STREAM_URL=https://radyo.yayin.com.tr:5132/stream
RADIO_METADATA_URL=https://radyo.yayin.com.tr:5132/
RADIO_CORS_PROXY=https://cros9.yayin.com.tr

# API Configuration
API_VERSION=v1
MOBILE_API_KEY=dev-api-key-change-in-production
RATE_LIMIT_MOBILE=100

# Site Configuration
SITE_NAME=Trend Ankara Radio Dev
SITE_URL=http://localhost:3000
SITE_DESCRIPTION=Professional Turkish Radio Station (Development)

# Development Settings
DEBUG=true
```

### 2. Start Services

```bash
# Start all development services
./docker/dev.sh up

# Or use docker-compose directly
cd docker
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Install Dependencies (if needed)

```bash
npm install
```

## Development Workflow

### Managing Services

The development script provides convenient commands for managing your environment:

```bash
# Start all services
./docker/dev.sh up

# Stop all services
./docker/dev.sh down

# Restart all services
./docker/dev.sh restart

# View logs from all services
./docker/dev.sh logs

# View logs from specific service
./docker/dev.sh logs webapp

# Check service status
./docker/dev.sh status

# Run health checks
./docker/dev.sh test
```

### Working with Individual Services

```bash
# Start specific service
./docker/dev.sh start radiodb

# Stop specific service
./docker/dev.sh stop radiodb

# Restart specific service
./docker/dev.sh restart radio_minio
```

### Development Tools

```bash
# Open shell in webapp container
./docker/dev.sh shell

# Open MySQL shell
./docker/dev.sh mysql

# Rebuild all services
./docker/dev.sh build
```

## Service Details

### Available Services

| Service | Container Name | Port | Purpose |
|---------|---------------|------|---------|
| webapp | webapp_dev | 3000 | Next.js application |
| radiodb | radiodb_dev | 3306 | MySQL database |
| radio_minio | radio_minio_dev | 9000, 9001 | MinIO object storage |
| radio_phpmyadmin | radio_phpmyadmin_dev | 8080 | Database administration |
| redis | redis_dev | 6379 | Cache and sessions |

### Service URLs

- **Web Application**: http://localhost:3000
- **PHPMyAdmin**: http://localhost:8080
  - Username: `root`
  - Password: `radiopass123`
- **MinIO Console**: http://localhost:9001
  - Username: `minioadmin`
  - Password: `minioadmin123`

### Database Access

**Via PHPMyAdmin**: http://localhost:8080

**Via Command Line**:
```bash
# Using development script
./docker/dev.sh mysql

# Or directly with docker
docker exec -it radiodb_dev mysql -u root -pradiopass123 radio_db
```

**Connection Details**:
- Host: `localhost` (from host machine) or `radiodb` (from containers)
- Port: `3306`
- Username: `root`
- Password: `radiopass123`
- Database: `radio_db`

### Storage Access

**MinIO Console**: http://localhost:9001

**API Endpoint**: http://localhost:9000

**Bucket**: `media` (auto-created)

## API Endpoints

### Health Check Endpoints

- **Database Health**: `GET /api/test/db`
- **Storage Health**: `GET /api/test/storage`

### Media Upload

- **Upload Configuration**: `GET /api/media/upload`
- **Upload File**: `POST /api/media/upload`

Example file upload using curl:
```bash
curl -X POST \
  -F "file=@/path/to/image.jpg" \
  -F "alt=Test image" \
  -F "description=Test upload" \
  http://localhost:3000/api/media/upload
```

## Development Features

### Auto-Initialization

The application automatically initializes database schema and storage buckets in development mode. You'll see initialization logs in the browser console when the app starts.

### Health Checks

All services include health checks:
- **Database**: Connection and schema validation
- **Storage**: Bucket existence and read/write permissions
- **Web App**: API endpoint availability

### Hot Reload

The development environment supports hot reload for:
- Source code changes (`src/` directory)
- Configuration files
- Static assets (`public/` directory)

### Development Logging

Enhanced logging is enabled in development mode:
- Database query logging
- Storage operation logging
- Application initialization status
- Error details and stack traces

## Troubleshooting

### Common Issues

#### 1. Docker Not Running
**Error**: `Cannot connect to the Docker daemon`
**Solution**: Start Docker Desktop and wait for it to be ready

#### 2. Port Already in Use
**Error**: `Port xxxx is already allocated`
**Solution**:
```bash
# Stop conflicting services
./docker/dev.sh down

# Or find and stop the conflicting process
lsof -ti:3000 | xargs kill -9  # Replace 3000 with the conflicting port
```

#### 3. Database Connection Failed
**Error**: Database initialization fails
**Solution**:
```bash
# Restart database service
./docker/dev.sh restart radiodb

# Check database logs
./docker/dev.sh logs radiodb

# Reset database (DESTRUCTIVE)
./docker/dev.sh clean && ./docker/dev.sh up
```

#### 4. Storage Connection Failed
**Error**: MinIO connection fails
**Solution**:
```bash
# Restart storage service
./docker/dev.sh restart radio_minio

# Check storage logs
./docker/dev.sh logs radio_minio

# Test storage health
curl http://localhost:9000/minio/health/live
```

#### 5. Services Not Starting
**Error**: Services fail to start or are unhealthy
**Solution**:
```bash
# Check service status
./docker/dev.sh status

# View logs for failing service
./docker/dev.sh logs <service-name>

# Rebuild services
./docker/dev.sh build

# Reset entire environment (DESTRUCTIVE)
./docker/dev.sh reset
```

### Health Check Commands

```bash
# Run comprehensive health check
./docker/dev.sh test

# Check individual service health
curl http://localhost:3000/api/test/db      # Database
curl http://localhost:3000/api/test/storage # Storage
curl http://localhost:3000                  # Web App
```

### Reset Environment

If you encounter persistent issues:

```bash
# Clean restart (preserves data)
./docker/dev.sh restart

# Full reset (DESTRUCTIVE - removes all data)
./docker/dev.sh reset
```

## Environment Variables Reference

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development` |
| `DATABASE_URL` | MySQL connection string | `mysql://root:radiopass123@localhost:3306/radio_db` |
| `MINIO_ENDPOINT` | MinIO server endpoint | `localhost` |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO secret key | `minioadmin123` |
| `NEXTAUTH_URL` | NextAuth base URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth secret key | `dev-secret-change-in-production` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MINIO_BUCKET` | Storage bucket name | `media` |
| `MINIO_PORT` | MinIO port | `9000` |
| `MINIO_USE_SSL` | Use SSL for MinIO | `false` |
| `DATABASE_CONNECTION_LIMIT` | Max DB connections | `10` |
| `DATABASE_TIMEOUT` | Query timeout (ms) | `5000` |
| `DEBUG` | Enable debug logging | `true` |

## Advanced Configuration

### Custom Docker Configuration

To modify the Docker setup:

1. Edit `docker/docker-compose.dev.yml`
2. Rebuild services: `./docker/dev.sh build`
3. Restart: `./docker/dev.sh restart`

### Database Configuration

MySQL configuration is in `docker/mysql-dev.cnf`. Key settings:
- Character set: `utf8mb4`
- Buffer pool: `256M`
- Logging: Enabled for debugging
- Performance schema: Enabled

### Storage Configuration

MinIO is configured with:
- Public bucket policy for development
- Browser console enabled
- Prometheus metrics (public access)

## Production Differences

The development environment differs from production in:

1. **Auto-initialization**: Enabled in development only
2. **Logging**: More verbose in development
3. **Security**: Relaxed settings for ease of development
4. **Performance**: Optimized for development, not production load
5. **SSL**: Disabled in development
6. **Data persistence**: Uses named volumes (can be reset)

## Getting Help

### Documentation

- **API Documentation**: Check `/api/test/` endpoints for examples
- **Database Schema**: See `src/lib/db/schema.ts`
- **Storage Client**: See `src/lib/storage/client.ts`

### Debugging

1. **Check logs**: `./docker/dev.sh logs [service]`
2. **Health checks**: `./docker/dev.sh test`
3. **Service status**: `./docker/dev.sh status`
4. **Shell access**: `./docker/dev.sh shell`

### Support

If you encounter issues not covered in this guide:

1. Check the service logs for error details
2. Verify all prerequisites are installed and up to date
3. Try resetting the environment: `./docker/dev.sh reset`
4. Review the Docker and application configuration files

## Next Steps

Once your development environment is running:

1. **Explore the API**: Try the test endpoints at `/api/test/`
2. **Upload a test image**: Use the media upload endpoint
3. **Check the database**: Browse tables in PHPMyAdmin
4. **Review the code**: Start with `src/app/layout.tsx` for the application entry point
5. **Make changes**: Edit code and see hot reload in action

Happy developing! 🚀