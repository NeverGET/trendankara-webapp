import { initializeSchema, checkSchema } from '@/lib/db/schema';
import { db } from '@/lib/db/client';
import { validateDatabaseEnv, checkEnvironmentHealth } from '@/lib/config/validator';
import { logSuccess, logError, logInfo, logWarning } from '@/lib/utils/logger';

/**
 * Database Initialization Module
 * Handles database connection and schema initialization for app startup
 * Auto-initializes in development mode with comprehensive error handling
 */

/**
 * Database initialization result
 */
export interface DatabaseInitResult {
  success: boolean;
  connected: boolean;
  schemaValid: boolean;
  message: string;
  errors: string[];
}

/**
 * Initialize database connection and schema
 * Checks environment, connects to database, and validates/creates schema
 *
 * @param options - Initialization options
 * @returns Promise<DatabaseInitResult> - Initialization result with detailed status
 */
export async function initDatabase(options: {
  createSchema?: boolean;
  skipSchemaCheck?: boolean;
  retryAttempts?: number;
} = {}): Promise<DatabaseInitResult> {
  const {
    createSchema = process.env.NODE_ENV === 'development',
    skipSchemaCheck = false,
    retryAttempts = 3
  } = options;

  const result: DatabaseInitResult = {
    success: false,
    connected: false,
    schemaValid: false,
    message: '',
    errors: []
  };

  try {
    logInfo('Starting database initialization', { prefix: 'Database' });

    // Step 1: Validate environment configuration
    const envHealth = checkEnvironmentHealth();
    if (!envHealth.isValid) {
      result.errors.push('Environment validation failed');
      envHealth.errors.forEach(error => result.errors.push(error));

      if (envHealth.missingVariables.length > 0) {
        result.errors.push(`Missing variables: ${envHealth.missingVariables.join(', ')}`);
      }

      logError('Database initialization failed: Invalid environment configuration', { prefix: 'Database' });
      result.message = 'Invalid environment configuration';
      return result;
    }

    // Step 2: Get and validate database configuration
    let dbConfig;
    try {
      dbConfig = validateDatabaseEnv();
      logInfo(`Database config validated: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`, { prefix: 'Database' });
    } catch (error) {
      const configError = error as Error;
      result.errors.push(`Database configuration error: ${configError.message}`);
      logError(`Database configuration validation failed: ${configError.message}`, { prefix: 'Database' });
      result.message = 'Database configuration validation failed';
      return result;
    }

    // Step 3: Initialize database connection with retry logic
    let connectionAttempts = 0;
    while (connectionAttempts < retryAttempts) {
      try {
        connectionAttempts++;
        logInfo(`Attempting database connection (attempt ${connectionAttempts}/${retryAttempts})`, { prefix: 'Database' });

        // Initialize the database client (this handles connection pooling)
        await db.initialize();

        // Test the connection
        await db.query('SELECT 1 as connection_test');

        result.connected = true;
        logSuccess('Database connection established successfully', { prefix: 'Database' });
        break;

      } catch (error) {
        const connectionError = error as Error;
        const errorMessage = `Connection attempt ${connectionAttempts} failed: ${connectionError.message}`;

        logWarning(errorMessage, { prefix: 'Database' });
        result.errors.push(errorMessage);

        if (connectionAttempts >= retryAttempts) {
          logError(`Database connection failed after ${retryAttempts} attempts`, { prefix: 'Database' });
          result.message = `Database connection failed after ${retryAttempts} attempts`;
          return result;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, connectionAttempts - 1), 10000);
        logInfo(`Waiting ${delay}ms before retry...`, { prefix: 'Database' });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Step 4: Check and initialize schema if requested
    if (!skipSchemaCheck) {
      try {
        logInfo('Checking database schema', { prefix: 'Database' });

        const schemaValidation = await checkSchema();

        if (schemaValidation.isValid) {
          result.schemaValid = true;
          logSuccess('Database schema is valid', { prefix: 'Database' });
        } else {
          logWarning('Database schema validation failed', { prefix: 'Database' });

          if (schemaValidation.missingTables.length > 0) {
            logWarning(`Missing tables: ${schemaValidation.missingTables.join(', ')}`, { prefix: 'Database' });
          }

          if (schemaValidation.missingIndexes.length > 0) {
            logWarning(`Missing indexes: ${schemaValidation.missingIndexes.join(', ')}`, { prefix: 'Database' });
          }

          // Auto-create schema in development mode
          if (createSchema) {
            logInfo('Attempting to create missing schema components', { prefix: 'Database' });

            const schemaCreated = await initializeSchema({
              createTables: true,
              createIndexes: true,
              seedData: false,
              force: false
            });

            if (schemaCreated) {
              result.schemaValid = true;
              logSuccess('Database schema created successfully', { prefix: 'Database' });
            } else {
              result.errors.push('Failed to create database schema');
              logError('Failed to create database schema', { prefix: 'Database' });
              result.message = 'Schema creation failed';
              return result;
            }
          } else {
            result.errors.push('Database schema is invalid and auto-creation is disabled');
            result.message = 'Invalid database schema';
            return result;
          }
        }
      } catch (error) {
        const schemaError = error as Error;
        result.errors.push(`Schema validation error: ${schemaError.message}`);
        logError(`Schema validation failed: ${schemaError.message}`, { prefix: 'Database' });
        result.message = 'Schema validation failed';
        return result;
      }
    } else {
      logInfo('Schema check skipped by options', { prefix: 'Database' });
      result.schemaValid = true; // Assume valid if skipped
    }

    // Step 5: Final success
    result.success = true;
    result.message = 'Database initialization completed successfully';

    const environment = await db.isDockerEnvironment() ? 'Docker' : 'Local';
    const poolStatus = db.getPoolStatus();

    logSuccess(`Database initialization complete (${environment})`, { prefix: 'Database' });

    if (poolStatus) {
      logInfo(`Connection pool: ${poolStatus.total} connections configured`, { prefix: 'Database' });
    }

    // Log configuration summary in development
    if (process.env.NODE_ENV === 'development') {
      logInfo(`Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`, { prefix: 'Database' });
      logInfo(`Connection limit: ${dbConfig.connectionLimit}`, { prefix: 'Database' });
      logInfo(`Query timeout: ${dbConfig.timeout}ms`, { prefix: 'Database' });
    }

    return result;

  } catch (error) {
    const initError = error as Error;
    result.errors.push(`Initialization error: ${initError.message}`);
    result.message = `Database initialization failed: ${initError.message}`;

    logError(`Database initialization failed: ${initError.message}`, { prefix: 'Database' });

    return result;
  }
}

/**
 * Check database health and connectivity
 * Useful for health check endpoints and monitoring
 */
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  connected: boolean;
  schemaValid: boolean;
  connectionInfo: {
    host?: string;
    port?: number;
    database?: string;
    poolStatus?: { total: number; active: number; idle: number } | null;
  };
  lastError?: string;
}> {
  try {
    // Check if database client is initialized
    const poolStatus = db.getPoolStatus();
    const isInitialized = poolStatus !== null;

    if (!isInitialized) {
      return {
        isHealthy: false,
        connected: false,
        schemaValid: false,
        connectionInfo: {},
        lastError: 'Database client not initialized'
      };
    }

    // Test database connection
    let connected = false;
    try {
      await db.query('SELECT 1 as health_check');
      connected = true;
    } catch (error) {
      return {
        isHealthy: false,
        connected: false,
        schemaValid: false,
        connectionInfo: { poolStatus },
        lastError: error instanceof Error ? error.message : 'Connection test failed'
      };
    }

    // Check schema validity
    let schemaValid = false;
    try {
      const schemaValidation = await checkSchema();
      schemaValid = schemaValidation.isValid;
    } catch (error) {
      // Schema check failed, but connection is still valid
    }

    // Get configuration info
    let connectionInfo: any = { poolStatus };
    try {
      const dbConfig = validateDatabaseEnv();
      connectionInfo = {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        poolStatus
      };
    } catch {
      // Config validation failed, but we still have pool status
    }

    return {
      isHealthy: connected && schemaValid,
      connected,
      schemaValid,
      connectionInfo
    };

  } catch (error) {
    return {
      isHealthy: false,
      connected: false,
      schemaValid: false,
      connectionInfo: {},
      lastError: error instanceof Error ? error.message : 'Health check failed'
    };
  }
}

/**
 * Gracefully close database connections
 * Should be called during application shutdown
 */
export async function closeDatabaseConnections(): Promise<void> {
  try {
    logInfo('Closing database connections', { prefix: 'Database' });
    await db.close();
    logSuccess('Database connections closed successfully', { prefix: 'Database' });
  } catch (error) {
    const closeError = error as Error;
    logError(`Failed to close database connections: ${closeError.message}`, { prefix: 'Database' });
    throw closeError;
  }
}

/**
 * Reset and reinitialize database connection
 * Useful for testing or when configuration changes
 */
export async function reinitializeDatabase(): Promise<DatabaseInitResult> {
  try {
    logInfo('Reinitializing database connection', { prefix: 'Database' });

    // Close existing connections
    await closeDatabaseConnections();

    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 500));

    // Reinitialize
    return await initDatabase();

  } catch (error) {
    const reinitError = error as Error;
    logError(`Database reinitialization failed: ${reinitError.message}`, { prefix: 'Database' });

    return {
      success: false,
      connected: false,
      schemaValid: false,
      message: `Reinitialization failed: ${reinitError.message}`,
      errors: [reinitError.message]
    };
  }
}

/**
 * Development-only function to recreate schema
 * WARNING: This will drop all existing data
 */
export async function recreateSchema(confirmDrop: boolean = false): Promise<DatabaseInitResult> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Schema recreation is not allowed in production');
  }

  if (!confirmDrop) {
    throw new Error('Schema recreation requires explicit confirmation (confirmDrop: true)');
  }

  try {
    logWarning('Recreating database schema - this will delete all data!', { prefix: 'Database' });

    // Import schema functions
    const { dropSchema } = await import('@/lib/db/schema');

    // Drop existing schema
    const dropped = await dropSchema(true);
    if (!dropped) {
      throw new Error('Failed to drop existing schema');
    }

    // Recreate schema
    const created = await initializeSchema({
      createTables: true,
      createIndexes: true,
      seedData: false,
      force: true
    });

    if (!created) {
      throw new Error('Failed to recreate schema');
    }

    logSuccess('Database schema recreated successfully', { prefix: 'Database' });

    return {
      success: true,
      connected: true,
      schemaValid: true,
      message: 'Database schema recreated successfully',
      errors: []
    };

  } catch (error) {
    const recreateError = error as Error;
    logError(`Schema recreation failed: ${recreateError.message}`, { prefix: 'Database' });

    return {
      success: false,
      connected: true, // Connection should still be valid
      schemaValid: false,
      message: `Schema recreation failed: ${recreateError.message}`,
      errors: [recreateError.message]
    };
  }
}