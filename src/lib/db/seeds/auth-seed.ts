/**
 * Authentication seed script
 * Creates initial super admin user if users table is empty
 * SIMPLE approach - just the essentials
 */

import { db } from '../client';
import bcrypt from 'bcryptjs';
import { logSuccess, logError, logInfo } from '@/lib/utils/logger';

/**
 * Seed initial super admin user
 * Only runs if users table is empty
 */
export async function seedAuthData(): Promise<boolean> {
  try {
    logInfo('Checking for existing users...', { prefix: 'AuthSeed' });

    // Check if any users exist
    const existingUsers = await db.query('SELECT COUNT(*) as count FROM users');
    const userCount = existingUsers.rows[0]?.count || 0;

    if (userCount > 0) {
      logInfo(`Found ${userCount} existing users, skipping seed`, { prefix: 'AuthSeed' });
      return true;
    }

    // Get credentials from environment variables
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

    if (!email || !password) {
      logError('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD environment variables are required', { prefix: 'AuthSeed' });
      return false;
    }

    logInfo('Creating initial super admin user...', { prefix: 'AuthSeed' });

    // Hash the password using bcrypt (10 rounds as per security requirements)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the super admin user
    const result = await db.query(
      `INSERT INTO users (email, password, name, role, is_active)
       VALUES (?, ?, ?, 'super_admin', TRUE)`,
      [email, hashedPassword, name]
    );

    if (result.rows.affectedRows > 0) {
      logSuccess(`Super admin user created with email: ${email}`, { prefix: 'AuthSeed' });
      return true;
    } else {
      logError('Failed to create super admin user', { prefix: 'AuthSeed' });
      return false;
    }

  } catch (error) {
    const dbError = error as Error;

    // Check if it's a duplicate key error
    if (dbError.message.includes('Duplicate entry')) {
      logInfo('Super admin user already exists', { prefix: 'AuthSeed' });
      return true;
    }

    logError(`Auth seed failed: ${dbError.message}`, { prefix: 'AuthSeed' });
    return false;
  }
}

/**
 * Verify that the super admin can be authenticated
 * This is a helper function for testing the seed
 */
export async function verifySuperAdmin(email: string, password: string): Promise<boolean> {
  try {
    const result = await db.query(
      'SELECT id, password, role FROM users WHERE email = ? AND is_active = TRUE AND deleted_at IS NULL',
      [email]
    );

    if (result.rows.length === 0) {
      logError('Super admin user not found', { prefix: 'AuthSeed' });
      return false;
    }

    const user = result.rows[0];

    // Verify the password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      logError('Invalid password for super admin', { prefix: 'AuthSeed' });
      return false;
    }

    if (user.role !== 'super_admin') {
      logError('User exists but is not a super admin', { prefix: 'AuthSeed' });
      return false;
    }

    logSuccess('Super admin credentials verified successfully', { prefix: 'AuthSeed' });
    return true;

  } catch (error) {
    const dbError = error as Error;
    logError(`Failed to verify super admin: ${dbError.message}`, { prefix: 'AuthSeed' });
    return false;
  }
}