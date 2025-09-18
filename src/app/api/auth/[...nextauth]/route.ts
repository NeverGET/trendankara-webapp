/**
 * NextAuth.js API route handler
 * Handles all authentication API requests
 * SIMPLE implementation - just export the handlers
 */

import { handlers } from '@/lib/auth/config';

// Export GET and POST handlers from NextAuth
export const { GET, POST } = handlers;