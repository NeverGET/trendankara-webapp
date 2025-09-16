/**
 * Database schema initialization and validation
 * Auto-creates required tables on first run with proper indexes
 * Validates schema integrity and reports missing components
 */

import { db } from './client';
import { SchemaValidationResult, DatabaseInitOptions } from '@/types/database';
import { logSuccess, logError, logInfo, logWarning } from '@/lib/utils/logger';

/**
 * SQL CREATE TABLE statements for all required tables
 */
const CREATE_TABLES = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role ENUM('admin', 'editor') NOT NULL DEFAULT 'editor',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_users_email (email),
      INDEX idx_users_role (role),
      INDEX idx_users_active (is_active),
      INDEX idx_users_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  media: `
    CREATE TABLE IF NOT EXISTS media (
      id INT PRIMARY KEY AUTO_INCREMENT,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      size INT NOT NULL,
      url TEXT NOT NULL,
      thumbnails JSON NULL COMMENT 'Store thumbnail URLs as JSON object',
      width INT NULL,
      height INT NULL,
      uploaded_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_media_filename (filename),
      INDEX idx_media_mime_type (mime_type),
      INDEX idx_media_uploaded_by (uploaded_by),
      INDEX idx_media_created (created_at),
      INDEX idx_media_deleted (deleted_at),
      INDEX idx_media_size (size)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  settings: `
    CREATE TABLE IF NOT EXISTS settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      setting_key VARCHAR(255) NOT NULL UNIQUE,
      setting_value TEXT NULL,
      setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
      updated_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_settings_key (setting_key),
      INDEX idx_settings_type (setting_type),
      INDEX idx_settings_updated_by (updated_by),
      INDEX idx_settings_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `
};

/**
 * Expected tables and their required indexes
 */
const EXPECTED_SCHEMA = {
  tables: ['users', 'media', 'settings'],
  indexes: {
    users: ['idx_users_email', 'idx_users_role', 'idx_users_active', 'idx_users_created'],
    media: ['idx_media_filename', 'idx_media_mime_type', 'idx_media_uploaded_by', 'idx_media_created', 'idx_media_deleted', 'idx_media_size'],
    settings: ['idx_settings_key', 'idx_settings_type', 'idx_settings_updated_by', 'idx_settings_created']
  }
};

/**
 * Initialize database schema by creating all required tables
 * Creates tables only if they don't exist
 *
 * @param options - Initialization options for schema creation
 * @returns Promise<boolean> - True if schema was initialized successfully
 */
export async function initializeSchema(options: DatabaseInitOptions = {
  createTables: true,
  createIndexes: true,
  seedData: false,
  force: false
}): Promise<boolean> {
  try {
    logInfo('Starting database schema initialization', { prefix: 'Schema' });

    const { createTables, force } = options;

    if (!createTables) {
      logInfo('Table creation skipped by options', { prefix: 'Schema' });
      return true;
    }

    // Check if tables exist if not forcing recreation
    if (!force) {
      const validation = await checkSchema();
      if (validation.isValid) {
        logSuccess('Database schema already initialized and valid', { prefix: 'Schema' });
        return true;
      }
    }

    // Create tables in dependency order (users first, then media and settings)
    const tableOrder = ['users', 'media', 'settings'];

    for (const tableName of tableOrder) {
      try {
        logInfo(`Creating table: ${tableName}`, { prefix: 'Schema' });

        await db.query(CREATE_TABLES[tableName as keyof typeof CREATE_TABLES]);

        logSuccess(`Table '${tableName}' created successfully`, { prefix: 'Schema' });
      } catch (error) {
        const dbError = error as Error;

        // If table already exists and we're not forcing, that's ok
        if (dbError.message.includes('already exists') && !force) {
          logInfo(`Table '${tableName}' already exists`, { prefix: 'Schema' });
          continue;
        }

        logError(`Failed to create table '${tableName}': ${dbError.message}`, { prefix: 'Schema' });
        return false;
      }
    }

    // Verify schema after creation
    const finalValidation = await checkSchema();
    if (finalValidation.isValid) {
      logSuccess('Database schema initialization completed successfully', { prefix: 'Schema' });
      return true;
    } else {
      logError('Schema validation failed after initialization', { prefix: 'Schema' });
      logError(`Missing tables: ${finalValidation.missingTables.join(', ')}`, { prefix: 'Schema' });
      logError(`Missing indexes: ${finalValidation.missingIndexes.join(', ')}`, { prefix: 'Schema' });
      return false;
    }

  } catch (error) {
    const dbError = error as Error;
    logError(`Schema initialization failed: ${dbError.message}`, { prefix: 'Schema' });
    return false;
  }
}

/**
 * Check if all required tables and indexes exist
 * Validates the current database schema against expected structure
 *
 * @returns Promise<SchemaValidationResult> - Detailed validation result
 */
export async function checkSchema(): Promise<SchemaValidationResult> {
  const result: SchemaValidationResult = {
    isValid: true,
    missingTables: [],
    missingIndexes: [],
    errors: []
  };

  try {
    logInfo('Validating database schema', { prefix: 'Schema' });

    // Check for existing tables
    const tablesResult = await db.query<any>(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
    `);

    const existingTables = tablesResult.rows.map((row: any) => row.TABLE_NAME.toLowerCase());

    // Check for missing tables
    for (const expectedTable of EXPECTED_SCHEMA.tables) {
      if (!existingTables.includes(expectedTable)) {
        result.missingTables.push(expectedTable);
        result.isValid = false;
      }
    }

    // Check for existing indexes only if tables exist
    for (const tableName of EXPECTED_SCHEMA.tables) {
      if (existingTables.includes(tableName)) {
        try {
          const indexesResult = await db.query<any>(`
            SELECT INDEX_NAME
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
              AND INDEX_NAME != 'PRIMARY'
          `, [tableName]);

          const existingIndexes = indexesResult.rows.map((row: any) => row.INDEX_NAME);
          const expectedIndexes = EXPECTED_SCHEMA.indexes[tableName as keyof typeof EXPECTED_SCHEMA.indexes];

          // Check for missing indexes
          for (const expectedIndex of expectedIndexes) {
            if (!existingIndexes.includes(expectedIndex)) {
              result.missingIndexes.push(`${tableName}.${expectedIndex}`);
              result.isValid = false;
            }
          }
        } catch (error) {
          const dbError = error as Error;
          result.errors.push(`Failed to check indexes for table '${tableName}': ${dbError.message}`);
          result.isValid = false;
        }
      }
    }

    // Log validation results
    if (result.isValid) {
      logSuccess('Database schema validation passed', { prefix: 'Schema' });
    } else {
      logWarning('Database schema validation failed', { prefix: 'Schema' });

      if (result.missingTables.length > 0) {
        logWarning(`Missing tables: ${result.missingTables.join(', ')}`, { prefix: 'Schema' });
      }

      if (result.missingIndexes.length > 0) {
        logWarning(`Missing indexes: ${result.missingIndexes.join(', ')}`, { prefix: 'Schema' });
      }

      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          logError(error, { prefix: 'Schema' });
        });
      }
    }

    return result;

  } catch (error) {
    const dbError = error as Error;
    result.isValid = false;
    result.errors.push(`Schema validation error: ${dbError.message}`);

    logError(`Schema validation failed: ${dbError.message}`, { prefix: 'Schema' });

    return result;
  }
}

/**
 * Drop all tables (use with caution)
 * This function will permanently delete all data
 *
 * @param confirmDrop - Must be true to actually drop tables
 * @returns Promise<boolean> - True if tables were dropped successfully
 */
export async function dropSchema(confirmDrop: boolean = false): Promise<boolean> {
  if (!confirmDrop) {
    logError('Schema drop aborted: confirmDrop must be true', { prefix: 'Schema' });
    return false;
  }

  try {
    logWarning('Dropping database schema - this will delete all data!', { prefix: 'Schema' });

    // Drop tables in reverse dependency order
    const dropOrder = ['settings', 'media', 'users'];

    // Disable foreign key checks temporarily
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const tableName of dropOrder) {
      try {
        await db.query(`DROP TABLE IF EXISTS ${tableName}`);
        logInfo(`Table '${tableName}' dropped`, { prefix: 'Schema' });
      } catch (error) {
        const dbError = error as Error;
        logError(`Failed to drop table '${tableName}': ${dbError.message}`, { prefix: 'Schema' });
      }
    }

    // Re-enable foreign key checks
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    logSuccess('Database schema dropped successfully', { prefix: 'Schema' });
    return true;

  } catch (error) {
    const dbError = error as Error;
    logError(`Schema drop failed: ${dbError.message}`, { prefix: 'Schema' });

    // Ensure foreign key checks are re-enabled even if drop fails
    try {
      await db.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch {
      // Ignore error re-enabling foreign key checks
    }

    return false;
  }
}

/**
 * Get detailed schema information for debugging
 * Returns information about all tables and their structure
 *
 * @returns Promise<any> - Detailed schema information
 */
export async function getSchemaInfo(): Promise<any> {
  try {
    const schemaInfo: any = {
      tables: {},
      database: null
    };

    // Get database name
    const dbResult = await db.query('SELECT DATABASE() as db_name');
    schemaInfo.database = dbResult.rows[0]?.db_name;

    // Get table information
    const tablesResult = await db.query<any>(`
      SELECT
        TABLE_NAME,
        ENGINE,
        TABLE_COLLATION,
        CREATE_TIME,
        TABLE_ROWS,
        DATA_LENGTH,
        INDEX_LENGTH
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    for (const table of tablesResult.rows) {
      const tableName = table.TABLE_NAME;

      // Get columns for this table
      const columnsResult = await db.query<any>(`
        SELECT
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          COLUMN_KEY,
          EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [tableName]);

      // Get indexes for this table
      const indexesResult = await db.query<any>(`
        SELECT
          INDEX_NAME,
          COLUMN_NAME,
          NON_UNIQUE,
          SEQ_IN_INDEX
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `, [tableName]);

      schemaInfo.tables[tableName] = {
        info: table,
        columns: columnsResult.rows,
        indexes: indexesResult.rows
      };
    }

    return schemaInfo;

  } catch (error) {
    const dbError = error as Error;
    logError(`Failed to get schema info: ${dbError.message}`, { prefix: 'Schema' });
    throw dbError;
  }
}

/**
 * Export the CREATE TABLE statements for external use
 */
export { CREATE_TABLES };

/**
 * Export the expected schema structure for validation
 */
export { EXPECTED_SCHEMA };