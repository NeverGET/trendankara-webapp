# Local Storage Setup - Implementation Guide

## Quick Start
1. **Restart Claude Code**: Run `claude --continue` to load new commands
2. **Start Implementation**: Begin with `/local-storage-setup-task-1`
3. **Track Progress**: Use `/spec-status local-storage-setup`

## Implementation Order & Dependencies

### Phase 1: Foundation (Tasks 1-7)
**Do these first - they set up the base environment**

```bash
/local-storage-setup-task-1   # Remove conflicting Docker container
/local-storage-setup-task-2   # Install MySQL & MinIO packages
/local-storage-setup-task-3   # Install Sharp & Multer for uploads
/local-storage-setup-task-4   # Create database TypeScript types
/local-storage-setup-task-5   # Create storage TypeScript types
/local-storage-setup-task-6   # Create environment validator
/local-storage-setup-task-7   # Create logger utility
```

### Phase 2: Core Services (Tasks 8-14)
**Build the main database and storage clients**

```bash
/local-storage-setup-task-8   # MySQL client with connection pooling
/local-storage-setup-task-9   # Database schema initialization
/local-storage-setup-task-10  # MinIO storage client
/local-storage-setup-task-11  # Image upload with thumbnails
/local-storage-setup-task-12  # Multer configuration
/local-storage-setup-task-13  # Database query utilities
/local-storage-setup-task-14  # Media-specific queries
```

### Phase 3: Initialization (Tasks 15-17)
**Auto-start services in development**

```bash
/local-storage-setup-task-15  # Database init module
/local-storage-setup-task-16  # Storage init module
/local-storage-setup-task-17  # Wire to app startup
```

### Phase 4: API & Testing (Tasks 18-24)
**Add endpoints and verify everything works**

```bash
/local-storage-setup-task-18  # Test database API endpoint
/local-storage-setup-task-19  # Test storage API endpoint
/local-storage-setup-task-20  # Media upload API endpoint
/local-storage-setup-task-21  # Docker compose for dev
/local-storage-setup-task-22  # Development documentation
/local-storage-setup-task-23  # Upload service tests
/local-storage-setup-task-24  # Database query tests
```

## Docker Setup Commands

Before starting the implementation, ensure Docker is running:

```bash
# Start Docker services
cd docker
docker-compose up -d

# Verify services are running
docker ps

# Check MySQL connection (after task 8)
curl http://localhost:3000/api/test/db

# Check MinIO connection (after task 10)
curl http://localhost:3000/api/test/storage
```

## Environment Variables Check

Ensure `.env.local` has these variables:

```env
# Database
DATABASE_URL=mysql://root:radiopass123@localhost:3306/radio_db

# Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=media
MINIO_USE_SSL=false
```

## Testing the Implementation

After completing all tasks:

1. **Test Database Connection**:
   ```bash
   curl http://localhost:3000/api/test/db
   ```
   Should return: `{"status": "connected", "tables": [...]}`

2. **Test Storage Connection**:
   ```bash
   curl http://localhost:3000/api/test/storage
   ```
   Should return: `{"status": "connected", "bucket": "media"}`

3. **Test Image Upload**:
   ```bash
   # Use any test image
   curl -X POST -F "image=@test.jpg" http://localhost:3000/api/media/upload
   ```
   Should return upload result with thumbnail URLs

## Troubleshooting

### Docker Issues
- If MySQL won't connect: Check if using `localhost` (not Docker) or `radiodb` (Docker)
- If MinIO won't connect: Ensure ports 9000-9001 are not in use
- Run `docker-compose logs -f` to see service logs

### Package Installation Issues
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Connection Issues
- Check environment variables are loaded
- Verify Docker services are healthy: `docker ps`
- Check network connectivity between services

## Success Indicators

✅ You'll know everything is working when:
1. Console shows: "✅ MySQL connected (Docker/Local)"
2. Console shows: "✅ MinIO connected"
3. Tables are auto-created on first run
4. MinIO bucket is auto-created
5. Test endpoints return success
6. Image upload creates 3 thumbnail sizes

## Production Notes

The implementation is for **development only**. For production:
- Use managed database service
- Use S3 or managed object storage
- Update connection strings in `.env.production`
- Remove auto-initialization code
- Add proper authentication to upload endpoints

## Command Reference

- **Check Status**: `/spec-status local-storage-setup`
- **View Spec**: `cat .claude/specs/local-storage-setup/*.md`
- **Run Specific Task**: `/local-storage-setup-task-{number}`
- **Continue Session**: `claude --continue`

---

Remember to restart Claude Code with `claude --continue` before starting!