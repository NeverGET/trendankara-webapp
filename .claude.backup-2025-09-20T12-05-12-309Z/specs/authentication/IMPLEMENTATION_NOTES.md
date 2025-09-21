# Authentication Implementation Notes

## Overview
This document outlines the actual implementation details and deviations from the original authentication specs. It serves as the source of truth for how authentication is currently implemented in the Trend Ankara Radio application.

## Key Deviations from Original Specs

### 1. Username-Based Login (MAJOR CHANGE)
**Original Spec**: Email-based authentication
**Actual Implementation**: Username-based authentication

#### Rationale
- Simpler for admin users to remember
- Reduces typing for frequent logins
- Aligns with "Keep it basic" philosophy

#### Implementation Details
- Login accepts username instead of email
- Username is stored in the `email` field in database for compatibility
- Login form uses `type="text"` instead of `type="email"`
- Label changed from "E-posta" to "Kullanıcı Adı"

### 2. JWT Strategy Instead of Database Sessions
**Original Spec**: Database-backed sessions using NextAuth adapter
**Actual Implementation**: JWT-based sessions

#### Rationale
- Credentials provider in NextAuth v5 requires JWT strategy
- Simpler implementation without session table management
- Better performance (no database lookup for each request)
- Edge runtime compatibility for middleware

#### Implementation Details
```typescript
// src/lib/auth/config.ts
session: {
  strategy: 'jwt',  // Required for credentials provider
  maxAge: 24 * 60 * 60, // 24 hours
  updateAge: 60 * 60, // 1 hour
}
```

### 3. No Database Adapter
**Original Spec**: Custom MySQL adapter for session storage
**Actual Implementation**: No adapter used (JWT handles session)

#### Rationale
- NextAuth adapters are incompatible with Credentials provider when using JWT
- Reduces database complexity
- No need for sessions/accounts tables

### 4. Simplified Middleware
**Original Spec**: Middleware using NextAuth with database checks
**Actual Implementation**: JWT-based middleware using `getToken`

#### Rationale
- Edge runtime compatibility (no Node.js modules)
- Faster authentication checks (JWT verification only)
- No database queries in middleware layer

#### Implementation Details
```typescript
// src/middleware.ts
import { getToken } from 'next-auth/jwt';

const token = await getToken({
  req: request,
  secret: process.env.NEXTAUTH_SECRET
});
```

### 5. No deleted_at Column
**Original Spec**: Soft delete with deleted_at timestamp
**Actual Implementation**: No soft delete functionality

#### Rationale
- Simplified database schema
- Users are either active or inactive via is_active flag
- Reduces query complexity

## Current User Credentials

### Development Users
| Username | Password | Role | Description |
|----------|----------|------|-------------|
| admin | admin | admin | Standard admin user |
| superadmin | superadmin | super_admin | Super admin with full access |

### Additional Users (Email format)
| Email | Password | Role |
|-------|----------|------|
| admin@trendankara.com | admin | admin |
| superadmin@trendankara.com | superadmin | super_admin |

## Database Schema Changes

### Users Table
```sql
-- Current implementation
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,  -- Stores username or email
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'super_admin', 'editor') DEFAULT 'editor',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  -- No deleted_at column
);
```

### Sessions Table
**Not implemented** - Using JWT instead

### Accounts Table
**Not implemented** - OAuth not currently supported

## Performance Optimizations

### 1. Removed DNS Lookup for Docker Detection
**Issue**: 4-second delay during database initialization
**Solution**: Use environment variables only, skip DNS resolution

### 2. Removed Google Fonts
**Issue**: Multiple timeout attempts adding delays
**Solution**: Commented out font imports, using system fonts

### 3. Database Connection Pool
**Optimization**: Singleton pattern ensures connection reuse
**Result**: First connection ~200ms, subsequent connections instant

## Environment Variables

### Required for Authentication
```env
# JWT Secret (both work)
NEXTAUTH_SECRET=your-secret-here
AUTH_SECRET=your-secret-here  # NextAuth v5 compatibility

# NextAuth URL
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=radiopass123
DATABASE_NAME=radio_db
```

## API Response Times

### Before Optimizations
- Login request: 8337ms
- Database initialization: 4000ms per request
- Font loading: 3x timeout attempts

### After Optimizations
- Login request: <500ms
- Database initialization: 200ms (first), instant (subsequent)
- Font loading: Removed

## Testing Authentication

### Manual Testing
1. Navigate to `/admin` - Should redirect to `/auth/login`
2. Login with `admin`/`admin`
3. Should redirect back to `/admin`
4. Session persists across page navigation
5. Logout functionality (when implemented)

### API Testing
```bash
# Check if redirecting to login
curl -I http://localhost:3000/admin
# Should return 307 with Location: /auth/login?callbackUrl=%2Fadmin

# Test protected API
curl http://localhost:3000/api/admin/users
# Should return {"error":"Unauthorized"} with 401 status
```

## Known Issues & Limitations

1. **No Remember Me**: Sessions expire after 24 hours regardless
2. **No Password Reset**: Must be done manually in database
3. **No Rate Limiting**: Login attempts not limited (security risk)
4. **No Session Management UI**: Cannot view/revoke active sessions
5. **No Audit Trail**: Login attempts not logged

## Future Enhancements

1. **Add Rate Limiting**: Implement login attempt throttling
2. **Session Management**: Add UI to view/revoke sessions
3. **Password Reset**: Email-based password reset flow
4. **Two-Factor Authentication**: Additional security layer
5. **OAuth Support**: Google/GitHub login options
6. **Audit Logging**: Track authentication events

## Migration Path

### From Email to Username Login
Users can login with either:
- Simple username (e.g., "admin")
- Full email format (e.g., "admin@trendankara.com")

Both are stored in the same `email` field for backward compatibility.

### From Database Sessions to JWT
No migration needed - JWT strategy works immediately.
Old session tables can be dropped if they exist.

## Security Considerations

1. **JWT Secret**: Must be long and random in production
2. **HTTPS Only**: JWT can be intercepted over HTTP
3. **Password Hashing**: Using bcrypt with 10 rounds
4. **No Refresh Tokens**: Sessions cannot be extended without re-login
5. **Client-Side Exposure**: JWT contents visible to client (don't store sensitive data)

## Troubleshooting

### Slow Login Response
1. Check database connection (should be <100ms)
2. Verify no DNS lookups in Docker detection
3. Ensure fonts aren't being fetched from external sources
4. Check for middleware compilation on first request

### "Invalid username or password"
1. Verify user exists in database
2. Check password hash matches
3. Ensure is_active = 1
4. Verify role is correct (admin or super_admin)

### Session Not Persisting
1. Check AUTH_SECRET/NEXTAUTH_SECRET is set
2. Verify cookies are enabled
3. Check for HTTPS in production
4. Ensure middleware isn't blocking session endpoints

## Contact & Support
For issues or questions about authentication implementation, check:
- This document for implementation details
- Original specs for intended design
- GitHub issues for known problems