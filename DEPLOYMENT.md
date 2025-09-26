# Deployment Configuration Guide

## Overview
This application is configured for cross-compatible deployment:
- **Development**: Uses remote production database/storage directly
- **Production**: Uses Docker network for internal service communication

## Environment Detection Strategy

The application uses the `IS_DOCKER_DEPLOYMENT` environment variable to distinguish between environments:
- When `IS_DOCKER_DEPLOYMENT=true`: Uses Docker network names (radio_mysql_alt, minio)
- When not set or false: Uses values from .env.local (remote production servers)

## Configuration Summary

### Development Environment (.env.local)
```bash
# Direct connection to production server
DATABASE_HOST=82.29.169.180
DATABASE_PORT=3307  # External port
MINIO_ENDPOINT=82.29.169.180
MINIO_PORT=9002     # External port
```

### Production Environment (Docker)
```bash
# Set via deploy.yml
IS_DOCKER_DEPLOYMENT=true
DATABASE_HOST=radio_mysql_alt  # Docker network name
DATABASE_PORT=3306              # Internal port
MINIO_ENDPOINT=minio           # Docker network name
MINIO_PORT=9000                 # Internal port
```

## Key Changes Made

### 1. Database Client (`src/lib/db/client.ts`)
- Added `IS_DOCKER_DEPLOYMENT` detection
- Automatically uses correct host/port based on environment
- Fallback logic: Environment vars → Docker defaults → localhost

### 2. Storage Client (`src/lib/storage/client.ts`)
- Added `isDockerDeployment()` function
- Automatically configures MinIO endpoint and port
- Compatible with both environments

### 3. Dockerfile
- Sets `NODE_ENV=production` for build
- Sets `IS_DOCKER_DEPLOYMENT=true` in runtime stage
- Maintains standalone output for optimized deployment

### 4. GitHub Actions (`deploy.yml`)
- Includes `IS_DOCKER_DEPLOYMENT=true` in docker run command
- Maintains all necessary environment variables

## Building the Application

### Local Development
```bash
# Uses .env.local automatically
npm run dev
```

### Production Build
```bash
# Must set NODE_ENV=production to avoid Html import error
export NODE_ENV=production && npm run build
```

### Docker Build
```bash
docker build -t radioapp .
```

## Deployment Process

1. **GitHub Push to main branch** triggers GitHub Actions
2. **GitHub Actions** runs deploy.yml which:
   - SSHs into production server
   - Pulls latest code
   - Builds Docker image
   - Runs container with IS_DOCKER_DEPLOYMENT=true

## Testing

### Verify Development Connection
```bash
# Should connect to 82.29.169.180:3307
npm run dev
# Check console logs for connection details
```

### Verify Production Build
```bash
export NODE_ENV=production && npm run build
# Should complete without Html import errors
```

### Verify Docker Deployment
```bash
# SSH to server
ssh root@82.29.169.180

# Check container logs
docker logs radioapp

# Should show connections to:
# - radio_mysql_alt:3306
# - minio:9000
```

## Troubleshooting

### Issue: Html Import Error
**Solution**: Always use `NODE_ENV=production` when building

### Issue: Wrong Database Connection in Docker
**Solution**: Ensure `IS_DOCKER_DEPLOYMENT=true` is set in container

### Issue: MinIO Connection Failed
**Solution**: Verify `minio` container name (no underscores)

## Environment Variables Reference

| Variable | Development | Production (Docker) |
|----------|------------|-------------------|
| NODE_ENV | development | production |
| IS_DOCKER_DEPLOYMENT | (not set) | true |
| DATABASE_HOST | 82.29.169.180 | radio_mysql_alt |
| DATABASE_PORT | 3307 | 3306 |
| MINIO_ENDPOINT | 82.29.169.180 | minio |
| MINIO_PORT | 9002 | 9000 |
| MINIO_PUBLIC_ENDPOINT | - | 82.29.169.180 |
| MINIO_PUBLIC_PORT | - | 9002 |

## Important Notes

1. **Never** commit .env.local to repository
2. **Always** test builds with `NODE_ENV=production` before deployment
3. **Standalone output** is required for Docker deployment
4. **IS_DOCKER_DEPLOYMENT** flag ensures correct service discovery