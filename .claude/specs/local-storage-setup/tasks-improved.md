# Implementation Plan

## Task Overview
Implementation of MySQL database and MinIO object storage connectivity for local development environment. Tasks are organized to build foundational utilities first, then connection clients, followed by service layers and finally integration with existing API routes.

## Steering Document Compliance
All tasks follow structure.md file locations (`src/lib/db/`, `src/lib/storage/`) and tech.md patterns (MySQL 8.0, MinIO S3-compatible, environment variables). Each task creates or modifies specific files following project naming conventions.

## Atomic Task Requirements
**Each task meets these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Tasks

- [ ] 1. Create Docker cleanup script
  - File: scripts/cleanup-minio.sh
  - Create bash script with: `docker stop cms-minio 2>/dev/null; docker rm cms-minio 2>/dev/null`
  - Make executable and add success/error messages
  - Purpose: Remove conflicting MinIO container as requested
  - _Requirements: 5.3_

- [ ] 2. Install MySQL and MinIO npm packages
  - File: package.json
  - Add dependencies: mysql2@^3.6.0, minio@^7.1.0
  - Add dev dependencies: @types/node@^20.0.0
  - Purpose: Add required database and storage client libraries
  - _Requirements: 1.1, 2.1_

- [ ] 3. Install image processing and upload packages
  - File: package.json
  - Add dependencies: sharp@^0.33.0, multer@^1.4.5-lts.1
  - Add types: @types/multer@^1.4.11
  - Purpose: Enable image processing and file upload handling
  - _Requirements: 4.1, 4.3_

- [ ] 4. Create database type definitions
  - File: src/types/database.ts
  - Define DatabaseConfig, QueryResult, ConnectionPool interfaces
  - Include proper typing for MySQL2 promise-based API
  - Purpose: Establish type safety for database operations
  - _Requirements: 1.1_

- [ ] 5. Create storage type definitions
  - File: src/types/storage.ts
  - Define StorageConfig, UploadResult, ThumbnailSizes interfaces
  - Include MinIO client configuration types
  - Purpose: Establish type safety for storage operations
  - _Requirements: 2.1, 4.3_

- [ ] 6. Create environment configuration validator
  - File: src/lib/config/validator.ts
  - Implement validateEnv() function to check required variables
  - Return typed configuration object with defaults
  - Purpose: Validate environment on startup with helpful errors
  - _Requirements: 5.1, 5.4_

- [ ] 7. Create logger utility for development feedback
  - File: src/lib/utils/logger.ts
  - Create logger utility with colored output
  - Export logSuccess(), logError(), logWarning() functions
  - Purpose: Provide clear development feedback
  - _Requirements: 5.1, 5.4_

- [ ] 8. Implement MySQL database client with connection pooling
  - File: src/lib/db/client.ts
  - Create singleton pool with 5-20 connections
  - Implement query(), transaction(), getConnection() methods
  - Add Docker environment detection logic
  - Purpose: Establish database connectivity with pooling
  - _Leverage: src/types/database.ts, src/lib/utils/logger.ts_
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [ ] 9. Create database schema initialization script
  - File: src/lib/db/schema.ts
  - Define CREATE TABLE statements for users, media, settings
  - Implement initializeSchema() and checkSchema() functions
  - Purpose: Auto-create required tables on first run
  - _Leverage: src/lib/db/client.ts_
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 10. Implement MinIO storage client
  - File: src/lib/storage/client.ts
  - Create singleton MinIO client instance
  - Implement ensureBucket() and getPublicUrl() methods
  - Add retry logic with exponential backoff
  - Purpose: Establish storage connectivity with error handling
  - _Leverage: src/types/storage.ts, src/lib/utils/logger.ts_
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 11. Create image upload service with thumbnail generation
  - File: src/lib/storage/upload.ts
  - Implement uploadImage() with Sharp for resizing
  - Generate thumb (150x150), medium (600x600), full (1200x1200)
  - Add file type and size validation
  - Purpose: Handle image uploads with automatic thumbnail creation
  - _Leverage: src/lib/storage/client.ts, src/types/storage.ts_
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 12. Create multer configuration for file uploads
  - File: src/lib/storage/multer.ts
  - Configure multer with memory storage
  - Add file filter for image types only
  - Set 5MB size limit
  - Purpose: Configure multipart form handling for uploads
  - _Leverage: src/types/storage.ts_
  - _Requirements: 4.2, 4.3_

- [ ] 13. Create database query utility functions
  - File: src/lib/db/queries/index.ts
  - Implement common query helpers (findById, findAll, insert, update)
  - Add pagination support
  - Purpose: Provide reusable database query functions
  - _Leverage: src/lib/db/client.ts, src/types/database.ts_
  - _Requirements: 1.3, 1.5_

- [ ] 14. Create media database queries
  - File: src/lib/db/queries/media.ts
  - Implement createMedia(), getMedia(), deleteMedia()
  - Add soft delete support
  - Purpose: Database operations for media records
  - _Leverage: src/lib/db/client.ts, src/lib/db/queries/index.ts_
  - _Requirements: 1.3, 4.4_

- [ ] 15. Create database initialization module
  - File: src/lib/init/database.ts
  - Export async initDatabase() function
  - Check and initialize schema in development mode
  - Log connection status with logger utility
  - Purpose: Auto-initialize database on app start
  - _Leverage: src/lib/db/schema.ts, src/lib/config/validator.ts, src/lib/utils/logger.ts_
  - _Requirements: 3.1, 3.2, 5.1_

- [ ] 16. Create storage initialization module
  - File: src/lib/init/storage.ts
  - Export async initStorage() function
  - Ensure bucket exists in development mode
  - Log storage status with logger utility
  - Purpose: Auto-initialize storage on app start
  - _Leverage: src/lib/storage/client.ts, src/lib/utils/logger.ts_
  - _Requirements: 2.5, 5.1_

- [ ] 17. Wire initialization modules to app startup
  - File: src/app/layout.tsx
  - Import and call initDatabase() and initStorage() in development
  - Add try-catch for graceful error handling
  - Purpose: Auto-initialize services on app start
  - _Leverage: src/lib/init/database.ts, src/lib/init/storage.ts_
  - _Requirements: 3.1, 2.1, 5.1_

- [ ] 18. Create test API route for database connection
  - File: src/app/api/test/db/route.ts
  - Implement GET endpoint to test database connection
  - Return connection status and table list
  - Purpose: Verify database connectivity via API
  - _Leverage: src/lib/db/client.ts, src/lib/db/schema.ts_
  - _Requirements: 1.1, 3.1_

- [ ] 19. Create test API route for storage connection
  - File: src/app/api/test/storage/route.ts
  - Implement GET endpoint to test MinIO connection
  - Return bucket status and configuration
  - Purpose: Verify storage connectivity via API
  - _Leverage: src/lib/storage/client.ts_
  - _Requirements: 2.1, 2.5_

- [ ] 20. Create media upload API endpoint
  - File: src/app/api/media/upload/route.ts
  - Implement POST endpoint for image uploads
  - Use multer middleware and upload service
  - Save media record to database
  - Purpose: Complete upload flow with database persistence
  - _Leverage: src/lib/storage/upload.ts, src/lib/storage/multer.ts, src/lib/db/queries/media.ts_
  - _Requirements: 2.3, 4.1, 4.4_

- [ ] 21. Create Docker compose for development
  - File: docker/docker-compose.dev.yml
  - Copy and modify from docker/docker-compose.yml
  - Add health checks for MySQL and MinIO
  - Configure proper networking and volumes
  - Purpose: Ensure smooth local development setup
  - _Leverage: docker/docker-compose.yml_
  - _Requirements: 5.2, 5.3_

- [ ] 22. Create development setup documentation
  - File: docs/development-setup.md
  - Document Docker setup steps
  - Include environment variable configuration
  - Add troubleshooting guide
  - Purpose: Help developers set up local environment
  - _Leverage: .env.local, docker/docker-compose.dev.yml_
  - _Requirements: 5.1, 5.4_

- [ ] 23. Create unit test for upload service
  - File: tests/unit/upload.test.ts
  - Test uploadImage() function with mock Sharp
  - Verify thumbnail sizes (150x150, 600x600, 1200x1200)
  - Purpose: Ensure upload service works correctly
  - _Leverage: src/lib/storage/upload.ts_
  - _Requirements: 4.1, 4.3_

- [ ] 24. Create unit test for database queries
  - File: tests/unit/queries.test.ts
  - Test query builder functions with mock database
  - Verify parameterized query generation
  - Purpose: Ensure database queries are safe and correct
  - _Leverage: src/lib/db/queries/index.ts_
  - _Requirements: 1.3, 1.5_