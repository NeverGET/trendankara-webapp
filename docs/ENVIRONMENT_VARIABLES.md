# Environment Variables Documentation

This document provides detailed information about all environment variables used in the TrendAnkara webapp.

## Overview

Environment variables are used to configure the application for different environments (development, staging, production) without changing the code. Copy `.env.example` to `.env.local` and update the values according to your setup.

## Required Variables

### Database Configuration

#### DATABASE_URL or Individual Database Variables

**Option 1: Connection String**
```bash
DATABASE_URL=mysql://user:password@localhost:3306/radio_db
```

**Option 2: Individual Variables**
```bash
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=radio_db
```

- **Description**: Database connection configuration
- **Required**: Yes (one of the options)
- **Default**: None
- **Notes**: Use connection string for simplified configuration

#### DATABASE_CONNECTION_LIMIT
```bash
DATABASE_CONNECTION_LIMIT=10
```
- **Description**: Maximum number of database connections in the pool
- **Required**: No
- **Default**: 10
- **Notes**: Adjust based on expected load

#### DATABASE_TIMEOUT
```bash
DATABASE_TIMEOUT=10000
```
- **Description**: Database connection timeout in milliseconds
- **Required**: No
- **Default**: 10000 (10 seconds)

### Authentication Configuration

#### NEXTAUTH_URL
```bash
NEXTAUTH_URL=http://localhost:3000
```
- **Description**: Base URL for NextAuth.js callbacks
- **Required**: Yes
- **Environment Specific**:
  - Development: `http://localhost:3000`
  - Production: `https://your-domain.com`

#### NEXTAUTH_SECRET / AUTH_SECRET
```bash
NEXTAUTH_SECRET=your-nextauth-secret-key-minimum-32-characters-long
AUTH_SECRET=your-auth-secret-key-minimum-32-characters-long
```
- **Description**: Secret key for JWT token encryption
- **Required**: Yes
- **Length**: Minimum 32 characters
- **Security**: Use a strong, randomly generated secret
- **Notes**: Both variables serve the same purpose for compatibility

### Storage Configuration (MinIO)

#### MINIO_ENDPOINT
```bash
MINIO_ENDPOINT=localhost
```
- **Description**: MinIO server hostname or IP
- **Required**: Yes
- **Default**: localhost

#### MINIO_PORT
```bash
MINIO_PORT=9000
```
- **Description**: MinIO server port
- **Required**: No
- **Default**: 9000

#### MINIO_ACCESS_KEY
```bash
MINIO_ACCESS_KEY=your_access_key
```
- **Description**: MinIO access key
- **Required**: Yes
- **Security**: Keep secret, use strong credentials

#### MINIO_SECRET_KEY
```bash
MINIO_SECRET_KEY=your_secret_key
```
- **Description**: MinIO secret key
- **Required**: Yes
- **Security**: Keep secret, use strong credentials

#### MINIO_BUCKET
```bash
MINIO_BUCKET=media
```
- **Description**: Default bucket name for media storage
- **Required**: No
- **Default**: media

#### MINIO_USE_SSL
```bash
MINIO_USE_SSL=false
```
- **Description**: Whether to use SSL for MinIO connections
- **Required**: No
- **Default**: false
- **Values**: true, false
- **Notes**: Set to true in production

#### MINIO_REGION
```bash
MINIO_REGION=us-east-1
```
- **Description**: MinIO region configuration
- **Required**: No
- **Default**: us-east-1

## Radio Configuration

### Core Radio Settings

#### RADIO_STREAM_URL
```bash
RADIO_STREAM_URL=https://your-radio-stream-url
```
- **Description**: Primary stream URL used as fallback when database settings are unavailable
- **Required**: Yes
- **Format**: Valid HTTP/HTTPS URL
- **Notes**: This serves as the ultimate fallback for radio streaming

#### RADIO_METADATA_URL
```bash
RADIO_METADATA_URL=https://your-radio-metadata-url
```
- **Description**: Endpoint for fetching now playing information
- **Required**: No
- **Format**: Valid HTTP/HTTPS URL
- **Notes**: Optional, used for displaying current track information

#### RADIO_BACKUP_STREAM_URL
```bash
RADIO_BACKUP_STREAM_URL=https://your-backup-stream-url
```
- **Description**: Backup stream URL for automatic failover
- **Required**: No
- **Format**: Valid HTTP/HTTPS URL
- **Notes**: Used when primary stream fails, new in v1.1

#### RADIO_CORS_PROXY
```bash
RADIO_CORS_PROXY=https://your-cors-proxy-url
```
- **Description**: CORS proxy for client-side stream access
- **Required**: No
- **Format**: Valid HTTP/HTTPS URL
- **Notes**: Optional, for browser compatibility

## Site Configuration

#### SITE_NAME
```bash
SITE_NAME=Your Radio Station Name
```
- **Description**: Name of the radio station/website
- **Required**: No
- **Default**: "TrendAnkara Radio"
- **Usage**: Used in page titles and meta tags

#### SITE_URL
```bash
SITE_URL=http://localhost:3000
```
- **Description**: Base URL of the website
- **Required**: No
- **Environment Specific**: Should match actual domain in production

#### SITE_DESCRIPTION
```bash
SITE_DESCRIPTION=Your Radio Station Description
```
- **Description**: Site description for SEO
- **Required**: No
- **Usage**: Used in meta tags

## Feature Flags

### FEATURE_CONFIRM_DELETIONS
```bash
FEATURE_CONFIRM_DELETIONS=true
```
- **Description**: Enable/disable confirmation dialogs for deletions
- **Required**: No
- **Default**: true
- **Values**: true, false
- **Notes**: When false, deletions happen without confirmation

### FEATURE_RADIO_SETTINGS
```bash
FEATURE_RADIO_SETTINGS=true
```
- **Description**: Enable/disable radio settings management UI
- **Required**: No
- **Default**: true
- **Values**: true, false
- **Notes**: Disables entire radio settings feature when false

### FEATURE_REALTIME_UPDATES
```bash
FEATURE_REALTIME_UPDATES=true
```
- **Description**: Enable/disable real-time updates for radio player
- **Required**: No
- **Default**: true
- **Values**: true, false
- **Notes**: Disables automatic reconnection and update events

### FEATURE_RATE_LIMITING
```bash
FEATURE_RATE_LIMITING=true
```
- **Description**: Enable/disable API rate limiting
- **Required**: No
- **Default**: true
- **Values**: true, false
- **Notes**: Useful to disable in development

## Rate Limiting Configuration

#### STREAM_TEST_RATE_LIMIT
```bash
STREAM_TEST_RATE_LIMIT=10
```
- **Description**: Rate limit for stream test endpoint (requests per minute)
- **Required**: No
- **Default**: 10
- **Notes**: Prevents abuse of stream testing

#### GENERAL_API_RATE_LIMIT
```bash
GENERAL_API_RATE_LIMIT=100
```
- **Description**: General API rate limit (requests per minute)
- **Required**: No
- **Default**: 100
- **Notes**: Applied to most API endpoints

## Cache Configuration

#### RADIO_CONFIG_CACHE_TIMEOUT
```bash
RADIO_CONFIG_CACHE_TIMEOUT=30
```
- **Description**: Cache timeout for radio configuration in seconds
- **Required**: No
- **Default**: 30
- **Notes**: Balance between performance and real-time updates

#### CONTENT_CACHE_TIMEOUT
```bash
CONTENT_CACHE_TIMEOUT=300
```
- **Description**: Cache timeout for content (news, polls) in seconds
- **Required**: No
- **Default**: 300 (5 minutes)

## Admin Configuration

#### DEFAULT_ADMIN_ROLE
```bash
DEFAULT_ADMIN_ROLE=admin
```
- **Description**: Default role assigned to new admin users
- **Required**: No
- **Default**: admin
- **Values**: admin, super_admin
- **Notes**: super_admin has additional privileges

#### REQUIRE_SUPER_ADMIN_FOR_STREAMS
```bash
REQUIRE_SUPER_ADMIN_FOR_STREAMS=true
```
- **Description**: Require super admin role for stream URL changes
- **Required**: No
- **Default**: true
- **Values**: true, false
- **Security**: Recommended to keep true in production

## Development Settings

#### NODE_ENV
```bash
NODE_ENV=development
```
- **Description**: Node.js environment
- **Required**: Yes
- **Values**: development, production, test
- **Notes**: Affects logging, error handling, and performance optimizations

#### DEBUG
```bash
DEBUG=true
```
- **Description**: Enable debug mode
- **Required**: No
- **Default**: false
- **Values**: true, false
- **Notes**: Enables additional logging and development features

## Logging Configuration

#### LOG_LEVEL
```bash
LOG_LEVEL=info
```
- **Description**: Logging level
- **Required**: No
- **Default**: info
- **Values**: error, warn, info, debug
- **Notes**:
  - error: Only error messages
  - warn: Warnings and errors
  - info: General information (recommended for production)
  - debug: Detailed debugging (development only)

#### ENABLE_API_LOGGING
```bash
ENABLE_API_LOGGING=false
```
- **Description**: Enable detailed API request/response logging
- **Required**: No
- **Default**: false
- **Values**: true, false
- **Notes**: Can be verbose, use carefully in production

## API Configuration

#### API_VERSION
```bash
API_VERSION=v1
```
- **Description**: API version identifier
- **Required**: No
- **Default**: v1
- **Notes**: Used for API versioning

#### MOBILE_API_KEY
```bash
MOBILE_API_KEY=your-mobile-api-key
```
- **Description**: API key for mobile app access
- **Required**: No
- **Security**: Keep secret if used

#### RATE_LIMIT_MOBILE
```bash
RATE_LIMIT_MOBILE=100
```
- **Description**: Rate limit for mobile API (requests per minute)
- **Required**: No
- **Default**: 100

## Environment-Specific Examples

### Development (.env.local)
```bash
NODE_ENV=development
DEBUG=true
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=mysql://root:password@localhost:3306/radio_dev
MINIO_ENDPOINT=localhost
MINIO_USE_SSL=false
FEATURE_RATE_LIMITING=false
LOG_LEVEL=debug
```

### Production (.env.production)
```bash
NODE_ENV=production
DEBUG=false
NEXTAUTH_URL=https://trendankara.com
DATABASE_URL=mysql://user:secure_password@db.example.com:3306/radio_prod
MINIO_ENDPOINT=storage.example.com
MINIO_USE_SSL=true
FEATURE_RATE_LIMITING=true
LOG_LEVEL=info
ENABLE_API_LOGGING=false
```

### Testing (.env.test)
```bash
NODE_ENV=test
DEBUG=false
DATABASE_URL=mysql://test:test@localhost:3306/radio_test
FEATURE_CONFIRM_DELETIONS=false
FEATURE_RATE_LIMITING=false
LOG_LEVEL=warn
```

## Security Considerations

### Secrets Management

1. **Never commit secrets to version control**
2. **Use strong, randomly generated secrets**
3. **Rotate secrets regularly**
4. **Use different secrets for different environments**

### Recommended Secret Generation

```bash
# Generate a secure NextAuth secret
openssl rand -base64 32

# Generate a secure database password
openssl rand -base64 16
```

### Environment-Specific Security

#### Development
- Use simple passwords for local databases
- Disable SSL for local MinIO
- Enable debug features

#### Production
- Use strong passwords and keys
- Enable SSL for all services
- Disable debug features
- Enable rate limiting
- Use secure session secrets

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Check `DATABASE_URL` format
- Verify database server is running
- Check network connectivity
- Verify credentials

#### MinIO Connection Errors
- Check `MINIO_ENDPOINT` and `MINIO_PORT`
- Verify MinIO server is running
- Check SSL settings
- Verify access keys

#### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set and long enough
- Check `NEXTAUTH_URL` matches your domain
- Ensure session cookies are working

#### Stream Issues
- Test `RADIO_STREAM_URL` manually
- Check network connectivity
- Verify stream server is running
- Test backup URL if configured

### Validation Script

You can create a validation script to check your environment:

```javascript
// scripts/validate-env.js
const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'RADIO_STREAM_URL'
];

const warnings = [];
const errors = [];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    errors.push(`Missing required variable: ${varName}`);
  }
});

if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
  warnings.push('NEXTAUTH_SECRET should be at least 32 characters');
}

if (errors.length > 0) {
  console.error('Environment validation failed:');
  errors.forEach(error => console.error(`❌ ${error}`));
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn('Environment warnings:');
  warnings.forEach(warning => console.warn(`⚠️  ${warning}`));
}

console.log('✅ Environment validation passed');
```

## Migration Notes

### From Version 1.0 to 1.1

New variables added:
- `RADIO_BACKUP_STREAM_URL`
- `STREAM_TEST_RATE_LIMIT`
- `GENERAL_API_RATE_LIMIT`
- `RADIO_CONFIG_CACHE_TIMEOUT`
- `CONTENT_CACHE_TIMEOUT`
- Feature flags for new functionality

### Breaking Changes

None in current version.

### Deprecated Variables

None in current version.

## Support

For questions about environment configuration:
1. Check this documentation
2. Review `.env.example`
3. Contact the development team
4. Check the troubleshooting section

---

**Last Updated**: 2024-01-01
**Version**: 1.1
**Maintainer**: TrendAnkara Development Team