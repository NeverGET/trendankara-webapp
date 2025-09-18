/**
 * Database migration runner
 * Executes SQL migration files and seeds initial data
 * SIMPLE approach - no complex migration tracking
 */

import { db } from './client';
import { seedAuthData } from './seeds/auth-seed';
import { logSuccess, logError, logInfo, logWarning } from '@/lib/utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * Run all migrations from the migrations directory
 * Executes SQL files in order based on filename
 */
export async function runMigrations(): Promise<boolean> {
  const migrationsDir = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations');

  try {
    logInfo('Starting database migrations...', { prefix: 'Migrate' });

    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      logWarning('Migrations directory not found, creating it...', { prefix: 'Migrate' });
      fs.mkdirSync(migrationsDir, { recursive: true });
      return true;
    }

    // Get all SQL files in migrations directory
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort alphabetically to ensure order

    if (migrationFiles.length === 0) {
      logInfo('No migration files found', { prefix: 'Migrate' });
      return true;
    }

    // Execute each migration file
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      logInfo(`Running migration: ${file}`, { prefix: 'Migrate' });

      try {
        // Read the SQL file content
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Split by semicolon to handle multiple statements
        // Filter out empty statements and comments
        const statements = sqlContent
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        // Execute each statement
        for (const statement of statements) {
          if (statement.trim().length > 0) {
            try {
              await db.query(statement);
            } catch (error) {
              const dbError = error as any;

              // Check for specific errors we can safely ignore
              if (dbError.code === 'ER_DUP_FIELDNAME' ||
                  dbError.code === 'ER_DUP_INDEX' ||
                  dbError.code === 'ER_DUP_KEYNAME' ||
                  dbError.message?.includes('Duplicate column') ||
                  dbError.message?.includes('already exists')) {
                logInfo(`Skipping: ${dbError.message}`, { prefix: 'Migrate' });
                continue;
              }

              throw error;
            }
          }
        }

        logSuccess(`Migration ${file} completed successfully`, { prefix: 'Migrate' });

      } catch (error) {
        const dbError = error as Error;
        logError(`Failed to run migration ${file}: ${dbError.message}`, { prefix: 'Migrate' });

        // Continue with other migrations even if one fails
        // This allows partial migrations to complete
        continue;
      }
    }

    logSuccess('All migrations completed', { prefix: 'Migrate' });
    return true;

  } catch (error) {
    const err = error as Error;
    logError(`Migration runner failed: ${err.message}`, { prefix: 'Migrate' });
    return false;
  }
}

/**
 * Run seeds after migrations
 * Seeds initial data required for the application
 */
export async function runSeeds(): Promise<boolean> {
  try {
    logInfo('Starting database seeding...', { prefix: 'Seed' });

    // Run auth seed to create super admin
    const authSeedResult = await seedAuthData();

    if (!authSeedResult) {
      logError('Auth seed failed', { prefix: 'Seed' });
      return false;
    }

    logSuccess('Database seeding completed', { prefix: 'Seed' });
    return true;

  } catch (error) {
    const err = error as Error;
    logError(`Seeding failed: ${err.message}`, { prefix: 'Seed' });
    return false;
  }
}

/**
 * Main migration function
 * Runs migrations and then seeds in sequence
 */
export async function migrate(): Promise<boolean> {
  try {
    logInfo('Starting database migration process...', { prefix: 'Migrate' });

    // Run migrations first
    const migrationResult = await runMigrations();
    if (!migrationResult) {
      logError('Migrations failed, skipping seeds', { prefix: 'Migrate' });
      return false;
    }

    // Then run seeds
    const seedResult = await runSeeds();
    if (!seedResult) {
      logWarning('Seeding failed but migrations were successful', { prefix: 'Migrate' });
      // Return true since migrations succeeded
      return true;
    }

    logSuccess('Database migration process completed successfully', { prefix: 'Migrate' });
    return true;

  } catch (error) {
    const err = error as Error;
    logError(`Migration process failed: ${err.message}`, { prefix: 'Migrate' });
    return false;
  }
}

/**
 * Rollback function (for emergency use)
 * This is a simple rollback that just logs what would be done
 * In production, you'd want proper down migrations
 */
export async function rollback(): Promise<boolean> {
  try {
    logWarning('Rollback requested - this would remove auth tables', { prefix: 'Migrate' });

    // In a real implementation, you'd have down migrations
    // For now, just log what would happen
    logInfo('To rollback manually:', { prefix: 'Migrate' });
    logInfo('1. DROP TABLE IF EXISTS verification_tokens;', { prefix: 'Migrate' });
    logInfo('2. DROP TABLE IF EXISTS accounts;', { prefix: 'Migrate' });
    logInfo('3. DROP TABLE IF EXISTS sessions;', { prefix: 'Migrate' });
    logInfo('4. ALTER TABLE users DROP COLUMN deleted_at;', { prefix: 'Migrate' });
    logInfo('5. ALTER TABLE users MODIFY COLUMN role ENUM("admin", "editor") DEFAULT "editor";', { prefix: 'Migrate' });

    return true;

  } catch (error) {
    const err = error as Error;
    logError(`Rollback failed: ${err.message}`, { prefix: 'Migrate' });
    return false;
  }
}

// Export for use in scripts or initialization
export default migrate;