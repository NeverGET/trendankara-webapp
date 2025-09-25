/**
 * Database migration runner
 * Executes SQL migration files and seeds initial data
 * Enhanced with migration tracking and rollback capability
 */

import { db } from './client';
import { seedAuthData } from './seeds/auth-seed';
import { logSuccess, logError, logInfo, logWarning } from '@/lib/utils/logger';
import fs from 'fs';
import path from 'path';
import type { RowDataPacket } from 'mysql2';

/**
 * Migration record interface
 */
interface MigrationRecord extends RowDataPacket {
  id: number;
  filename: string;
  executed_at: Date;
  checksum: string;
}

/**
 * Migration status type
 */
type MigrationStatus = 'pending' | 'executed' | 'failed';

/**
 * Create migration tracking table if it doesn't exist
 */
async function ensureMigrationTable(): Promise<void> {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS migrations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      checksum VARCHAR(64) NOT NULL,
      INDEX idx_migrations_filename (filename),
      INDEX idx_migrations_executed (executed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  try {
    await db.query(createTableSQL);
    logInfo('Migration tracking table ready', { prefix: 'Migrate' });
  } catch (error) {
    const err = error as Error;
    logError(`Failed to create migration table: ${err.message}`, { prefix: 'Migrate' });
    throw error;
  }
}

/**
 * Generate checksum for migration file content
 */
function generateChecksum(content: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Get executed migrations from database
 */
async function getExecutedMigrations(): Promise<MigrationRecord[]> {
  try {
    const result = await db.query<MigrationRecord>(
      'SELECT id, filename, executed_at, checksum FROM migrations ORDER BY filename'
    );
    return result.rows;
  } catch (error) {
    logError(`Failed to get executed migrations: ${(error as Error).message}`, { prefix: 'Migrate' });
    return [];
  }
}

/**
 * Record successful migration execution
 */
async function recordMigration(filename: string, checksum: string): Promise<void> {
  try {
    await db.insert(
      'INSERT INTO migrations (filename, checksum) VALUES (?, ?) ON DUPLICATE KEY UPDATE executed_at = CURRENT_TIMESTAMP, checksum = VALUES(checksum)',
      [filename, checksum]
    );
    logInfo(`Recorded migration: ${filename}`, { prefix: 'Migrate' });
  } catch (error) {
    logError(`Failed to record migration ${filename}: ${(error as Error).message}`, { prefix: 'Migrate' });
    throw error;
  }
}

/**
 * Execute a single migration file within a transaction
 */
async function executeMigration(filePath: string, filename: string): Promise<boolean> {
  try {
    // Read and validate migration file
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    const checksum = generateChecksum(sqlContent);

    // Execute migration within transaction
    const success = await db.transaction(async (connection) => {
      // Split by semicolon to handle multiple statements
      // Filter out empty statements and comments
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      // Execute each statement within the transaction
      for (const statement of statements) {
        if (statement.trim().length > 0) {
          try {
            await connection.execute(statement);
          } catch (error) {
            const dbError = error as any;

            // Check for specific errors we can safely ignore
            if (dbError.code === 'ER_DUP_FIELDNAME' ||
                dbError.code === 'ER_DUP_INDEX' ||
                dbError.code === 'ER_DUP_KEYNAME' ||
                dbError.code === 'ER_TABLE_EXISTS_ERROR' ||
                dbError.message?.includes('Duplicate column') ||
                dbError.message?.includes('already exists')) {
              logInfo(`Skipping in ${filename}: ${dbError.message}`, { prefix: 'Migrate' });
              continue;
            }

            // For other errors, rethrow to trigger rollback
            throw error;
          }
        }
      }

      return true;
    });

    if (success) {
      // Record successful migration outside the transaction
      await recordMigration(filename, checksum);
      logSuccess(`Migration ${filename} completed successfully`, { prefix: 'Migrate' });
      return true;
    }

    return false;

  } catch (error) {
    const dbError = error as Error;
    logError(`Failed to execute migration ${filename}: ${dbError.message}`, { prefix: 'Migrate' });
    return false;
  }
}

/**
 * Run all pending migrations from the migrations directory
 * Enhanced with tracking and rollback capability
 */
export async function runMigrations(): Promise<boolean> {
  const migrationsDir = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations');

  try {
    logInfo('Starting database migrations...', { prefix: 'Migrate' });

    // Ensure migration tracking table exists
    await ensureMigrationTable();

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

    // Get already executed migrations
    const executedMigrations = await getExecutedMigrations();
    const executedFilenames = new Set(executedMigrations.map(m => m.filename));

    // Filter to only pending migrations
    const pendingMigrations = migrationFiles.filter(file => !executedFilenames.has(file));

    if (pendingMigrations.length === 0) {
      logInfo('All migrations already executed', { prefix: 'Migrate' });
      return true;
    }

    logInfo(`Found ${pendingMigrations.length} pending migrations`, { prefix: 'Migrate' });

    let successCount = 0;
    let failureCount = 0;

    // Execute each pending migration
    for (const file of pendingMigrations) {
      const filePath = path.join(migrationsDir, file);
      logInfo(`Running migration: ${file}`, { prefix: 'Migrate' });

      const success = await executeMigration(filePath, file);
      if (success) {
        successCount++;
      } else {
        failureCount++;
        // Continue with other migrations but track failures
      }
    }

    logInfo(`Migrations completed: ${successCount} successful, ${failureCount} failed`, { prefix: 'Migrate' });

    if (failureCount > 0) {
      logWarning(`${failureCount} migrations failed - please check logs`, { prefix: 'Migrate' });
      return false;
    }

    logSuccess('All pending migrations completed successfully', { prefix: 'Migrate' });
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
 * Get last executed migration
 */
async function getLastMigration(): Promise<MigrationRecord | null> {
  try {
    const result = await db.query<MigrationRecord>(
      'SELECT id, filename, executed_at, checksum FROM migrations ORDER BY executed_at DESC LIMIT 1'
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    logError(`Failed to get last migration: ${(error as Error).message}`, { prefix: 'Migrate' });
    return null;
  }
}

/**
 * Remove migration record
 */
async function removeMigrationRecord(filename: string): Promise<void> {
  try {
    await db.delete('DELETE FROM migrations WHERE filename = ?', [filename]);
    logInfo(`Removed migration record: ${filename}`, { prefix: 'Migrate' });
  } catch (error) {
    logError(`Failed to remove migration record ${filename}: ${(error as Error).message}`, { prefix: 'Migrate' });
    throw error;
  }
}

/**
 * Enhanced rollback function with migration tracking
 * Provides instructions for manual rollback of the last migration
 */
export async function rollback(migrationFilename?: string): Promise<boolean> {
  try {
    logWarning('Rollback requested', { prefix: 'Migrate' });

    // Ensure migration tracking table exists
    await ensureMigrationTable();

    let targetMigration: MigrationRecord | null = null;

    if (migrationFilename) {
      // Rollback specific migration
      const result = await db.query<MigrationRecord>(
        'SELECT id, filename, executed_at, checksum FROM migrations WHERE filename = ?',
        [migrationFilename]
      );
      targetMigration = result.rows.length > 0 ? result.rows[0] : null;
    } else {
      // Rollback last migration
      targetMigration = await getLastMigration();
    }

    if (!targetMigration) {
      logWarning('No migration found to rollback', { prefix: 'Migrate' });
      return true;
    }

    logInfo(`Target migration for rollback: ${targetMigration.filename}`, { prefix: 'Migrate' });

    // Generate rollback instructions based on migration
    const rollbackInstructions = generateRollbackInstructions(targetMigration.filename);

    logWarning('MANUAL ROLLBACK REQUIRED - Execute these SQL statements manually:', { prefix: 'Migrate' });
    rollbackInstructions.forEach((instruction, index) => {
      logInfo(`${index + 1}. ${instruction}`, { prefix: 'Migrate' });
    });

    // Ask for confirmation before removing migration record
    logWarning('After manual rollback, run this function again with confirm=true to remove migration record', { prefix: 'Migrate' });
    logInfo('Example: await rollback("' + targetMigration.filename + '", true)', { prefix: 'Migrate' });

    return true;

  } catch (error) {
    const err = error as Error;
    logError(`Rollback failed: ${err.message}`, { prefix: 'Migrate' });
    return false;
  }
}

/**
 * Confirm rollback and remove migration record
 */
export async function confirmRollback(migrationFilename: string): Promise<boolean> {
  try {
    logInfo(`Confirming rollback of migration: ${migrationFilename}`, { prefix: 'Migrate' });
    await removeMigrationRecord(migrationFilename);
    logSuccess(`Migration ${migrationFilename} rollback confirmed`, { prefix: 'Migrate' });
    return true;
  } catch (error) {
    const err = error as Error;
    logError(`Failed to confirm rollback: ${err.message}`, { prefix: 'Migrate' });
    return false;
  }
}

/**
 * Generate rollback instructions for a specific migration
 */
function generateRollbackInstructions(filename: string): string[] {
  const instructions: string[] = [];

  switch (filename) {
    case '001_auth_tables.sql':
      instructions.push('DROP TABLE IF EXISTS verification_tokens;');
      instructions.push('DROP TABLE IF EXISTS accounts;');
      instructions.push('DROP TABLE IF EXISTS sessions;');
      instructions.push('ALTER TABLE users DROP COLUMN IF EXISTS deleted_at;');
      instructions.push('ALTER TABLE users MODIFY COLUMN role ENUM("admin", "editor") DEFAULT "editor";');
      break;

    case '002_create_news_tables.sql':
      instructions.push('DROP TABLE IF EXISTS news_images;');
      instructions.push('DROP TABLE IF EXISTS news;');
      instructions.push('DROP TABLE IF EXISTS news_categories;');
      break;

    case '003_create_polls_tables.sql':
      instructions.push('DROP TABLE IF EXISTS poll_votes;');
      instructions.push('DROP TABLE IF EXISTS poll_items;');
      instructions.push('DROP TABLE IF EXISTS polls;');
      break;

    case '004_create_content_audit_tables.sql':
      instructions.push('DROP TABLE IF EXISTS audit_log;');
      instructions.push('DROP TABLE IF EXISTS content_pages;');
      break;

    case '005_extend_users_table.sql':
      instructions.push('ALTER TABLE users DROP COLUMN IF EXISTS bio;');
      instructions.push('ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;');
      instructions.push('ALTER TABLE users DROP COLUMN IF EXISTS last_login_at;');
      instructions.push('ALTER TABLE users DROP COLUMN IF EXISTS login_count;');
      instructions.push('ALTER TABLE users DROP COLUMN IF EXISTS preferences;');
      break;

    default:
      instructions.push(`-- Manual rollback required for ${filename}`);
      instructions.push('-- Review the migration file and create appropriate DROP/ALTER statements');
      break;
  }

  return instructions;
}

/**
 * Get migration status for all migrations
 */
export async function getMigrationStatus(): Promise<{filename: string, status: MigrationStatus, executed_at?: Date}[]> {
  const migrationsDir = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations');

  try {
    // Ensure migration tracking table exists
    await ensureMigrationTable();

    // Get all migration files
    const migrationFiles = fs.existsSync(migrationsDir)
      ? fs.readdirSync(migrationsDir)
          .filter(file => file.endsWith('.sql'))
          .sort()
      : [];

    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    const executedMap = new Map(executedMigrations.map(m => [m.filename, m]));

    // Build status list
    const status = migrationFiles.map(filename => {
      const executed = executedMap.get(filename);
      return {
        filename,
        status: (executed ? 'executed' : 'pending') as MigrationStatus,
        executed_at: executed?.executed_at
      };
    });

    return status;

  } catch (error) {
    logError(`Failed to get migration status: ${(error as Error).message}`, { prefix: 'Migrate' });
    return [];
  }
}

// Export for use in scripts or initialization
export default migrate;