/**
 * Custom MySQL adapter for NextAuth.js v5
 *
 * NOTE: This adapter is NOT USED in the current implementation.
 * We use JWT strategy instead of database sessions.
 * The adapter is kept here for reference but is not functional.
 * To avoid TypeScript errors during build, we export a stub implementation.
 */

import type { Adapter } from 'next-auth/adapters';

/**
 * Stub MySQL adapter - NOT USED
 *
 * The actual authentication uses JWT strategy with Credentials provider.
 * Database sessions are not implemented as they're incompatible with
 * the Credentials provider in NextAuth.js.
 *
 * See src/lib/auth/config.ts for the actual authentication configuration.
 */
export function MySQLAdapter(): Adapter {
  throw new Error(
    'MySQLAdapter is not implemented. This application uses JWT strategy instead of database sessions.'
  );
}