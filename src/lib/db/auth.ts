/**
 * Authentication Database Queries
 * Provides database operations for authentication using JWT strategy
 * Note: Session CRUD operations are not needed since we use JWT tokens
 */

import { db } from './client';
import { RowDataPacket } from 'mysql2/promise';
import { User, UserRole } from '@/types/auth';
import { logError, logInfo } from '@/lib/utils/logger';

/**
 * Database user interface matching the users table structure
 */
interface DatabaseUser extends RowDataPacket {
  id: number;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get user by email (actually username stored in email field)
 * This function retrieves user by the email field which stores username for compatibility
 *
 * @param email - Username stored in email field
 * @returns Promise<User | null> - User object or null if not found
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    logInfo(`Looking up user by email: ${email}`, { prefix: 'Auth DB' });

    const result = await db.query<DatabaseUser>(
      `SELECT
        id,
        email,
        password,
        name,
        role,
        is_active,
        created_at,
        updated_at
       FROM users
       WHERE email = ? AND is_active = TRUE`,
      [email]
    );

    if (result.rows.length === 0) {
      logInfo(`User not found for email: ${email}`, { prefix: 'Auth DB' });
      return null;
    }

    const dbUser = result.rows[0];

    // Transform database user to application user format
    const user: User = {
      id: dbUser.id.toString(),
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      is_active: dbUser.is_active,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at
    };

    logInfo(`User found: ${user.name} (${user.role})`, { prefix: 'Auth DB' });
    return user;

  } catch (error) {
    const dbError = error as Error;
    logError(`Failed to get user by email: ${dbError.message}`, { prefix: 'Auth DB' });
    throw dbError;
  }
}

/**
 * Get user by ID
 * Retrieves user information by their numeric ID
 *
 * @param id - User ID (string or number)
 * @returns Promise<User | null> - User object or null if not found
 */
export async function getUserById(id: string | number): Promise<User | null> {
  try {
    const userId = typeof id === 'string' ? parseInt(id) : id;

    if (isNaN(userId)) {
      logError(`Invalid user ID provided: ${id}`, { prefix: 'Auth DB' });
      return null;
    }

    logInfo(`Looking up user by ID: ${userId}`, { prefix: 'Auth DB' });

    const result = await db.query<DatabaseUser>(
      `SELECT
        id,
        email,
        password,
        name,
        role,
        is_active,
        created_at,
        updated_at
       FROM users
       WHERE id = ? AND is_active = TRUE`,
      [userId]
    );

    if (result.rows.length === 0) {
      logInfo(`User not found for ID: ${userId}`, { prefix: 'Auth DB' });
      return null;
    }

    const dbUser = result.rows[0];

    // Transform database user to application user format
    const user: User = {
      id: dbUser.id.toString(),
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      is_active: dbUser.is_active,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at
    };

    logInfo(`User found: ${user.name} (${user.role})`, { prefix: 'Auth DB' });
    return user;

  } catch (error) {
    const dbError = error as Error;
    logError(`Failed to get user by ID: ${dbError.message}`, { prefix: 'Auth DB' });
    throw dbError;
  }
}

/**
 * Get user by email with password hash
 * This function is specifically for authentication and includes the password hash
 * Used during login verification process
 *
 * @param email - Username stored in email field
 * @returns Promise<(User & { password: string }) | null> - User with password or null
 */
export async function getUserWithPassword(email: string): Promise<(User & { password: string }) | null> {
  try {
    logInfo(`Looking up user with password for email: ${email}`, { prefix: 'Auth DB' });

    const result = await db.query<DatabaseUser>(
      `SELECT
        id,
        email,
        password,
        name,
        role,
        is_active,
        created_at,
        updated_at
       FROM users
       WHERE email = ? AND is_active = TRUE`,
      [email]
    );

    if (result.rows.length === 0) {
      logInfo(`User not found for authentication: ${email}`, { prefix: 'Auth DB' });
      return null;
    }

    const dbUser = result.rows[0];

    // Transform database user to application user format with password
    const user = {
      id: dbUser.id.toString(),
      email: dbUser.email,
      password: dbUser.password, // Include password hash for authentication
      name: dbUser.name,
      role: dbUser.role,
      is_active: dbUser.is_active,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at
    };

    logInfo(`User found for authentication: ${user.name} (${user.role})`, { prefix: 'Auth DB' });
    return user;

  } catch (error) {
    const dbError = error as Error;
    logError(`Failed to get user with password: ${dbError.message}`, { prefix: 'Auth DB' });
    throw dbError;
  }
}

/**
 * Check if user exists and is active
 * Utility function to verify user existence without returning sensitive data
 *
 * @param email - Username stored in email field
 * @returns Promise<boolean> - True if user exists and is active
 */
export async function userExists(email: string): Promise<boolean> {
  try {
    logInfo(`Checking if user exists: ${email}`, { prefix: 'Auth DB' });

    const result = await db.query<{ count: number } & RowDataPacket>(
      `SELECT COUNT(*) as count
       FROM users
       WHERE email = ? AND is_active = TRUE`,
      [email]
    );

    const exists = result.rows[0]?.count > 0;
    logInfo(`User existence check for ${email}: ${exists}`, { prefix: 'Auth DB' });

    return exists;

  } catch (error) {
    const dbError = error as Error;
    logError(`Failed to check user existence: ${dbError.message}`, { prefix: 'Auth DB' });
    return false;
  }
}