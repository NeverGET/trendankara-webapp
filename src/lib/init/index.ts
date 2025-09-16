import { initDatabase } from './database';
import { initStorage } from './storage';
import { logSuccess, logError, logInfo, logWarning } from '@/lib/utils/logger';

/**
 * Main Application Initialization Module
 * Orchestrates database and storage initialization for app startup
 * Provides both client and server-side initialization functions
 */

export interface ApplicationInitResult {
  success: boolean;
  database: {
    initialized: boolean;
    error?: string;
  };
  storage: {
    initialized: boolean;
    error?: string;
  };
  message: string;
  errors: string[];
}

/**
 * Initialize all application services
 * This is the main entry point for application initialization
 *
 * @param options - Initialization options
 * @returns Promise<ApplicationInitResult> - Complete initialization result
 */
export async function initializeApplication(options: {
  enableDatabase?: boolean;
  enableStorage?: boolean;
  createSchema?: boolean;
  createBucket?: boolean;
  skipHealthChecks?: boolean;
  retryAttempts?: number;
} = {}): Promise<ApplicationInitResult> {
  const {
    enableDatabase = true,
    enableStorage = true,
    createSchema = process.env.NODE_ENV === 'development',
    createBucket = process.env.NODE_ENV === 'development',
    skipHealthChecks = false,
    retryAttempts = 3
  } = options;

  const result: ApplicationInitResult = {
    success: false,
    database: { initialized: false },
    storage: { initialized: false },
    message: '',
    errors: []
  };

  try {
    logInfo('Starting application initialization', { prefix: 'Init' });

    // Initialize database if enabled
    if (enableDatabase) {
      try {
        logInfo('Initializing database services', { prefix: 'Init' });

        const dbResult = await initDatabase({
          createSchema,
          skipSchemaCheck: skipHealthChecks,
          retryAttempts
        });

        result.database.initialized = dbResult.success;

        if (dbResult.success) {
          logSuccess('Database services initialized successfully', { prefix: 'Init' });
        } else {
          result.database.error = dbResult.message;
          result.errors.push(`Database: ${dbResult.message}`);
          result.errors.push(...dbResult.errors);
          logError(`Database initialization failed: ${dbResult.message}`, { prefix: 'Init' });
        }

      } catch (error) {
        const dbError = error as Error;
        result.database.error = dbError.message;
        result.errors.push(`Database initialization error: ${dbError.message}`);
        logError(`Database initialization error: ${dbError.message}`, { prefix: 'Init' });
      }
    } else {
      logInfo('Database initialization skipped', { prefix: 'Init' });
      result.database.initialized = true; // Mark as successful if skipped
    }

    // Initialize storage if enabled
    if (enableStorage) {
      try {
        logInfo('Initializing storage services', { prefix: 'Init' });

        const storageResult = await initStorage({
          createBucket,
          skipHealthCheck: skipHealthChecks,
          retryAttempts,
          testWritePermissions: true
        });

        result.storage.initialized = storageResult.success;

        if (storageResult.success) {
          logSuccess('Storage services initialized successfully', { prefix: 'Init' });
        } else {
          result.storage.error = storageResult.message;
          result.errors.push(`Storage: ${storageResult.message}`);
          result.errors.push(...storageResult.errors);
          logError(`Storage initialization failed: ${storageResult.message}`, { prefix: 'Init' });
        }

      } catch (error) {
        const storageError = error as Error;
        result.storage.error = storageError.message;
        result.errors.push(`Storage initialization error: ${storageError.message}`);
        logError(`Storage initialization error: ${storageError.message}`, { prefix: 'Init' });
      }
    } else {
      logInfo('Storage initialization skipped', { prefix: 'Init' });
      result.storage.initialized = true; // Mark as successful if skipped
    }

    // Determine overall success
    result.success = result.database.initialized && result.storage.initialized;

    if (result.success) {
      result.message = 'Application initialization completed successfully';
      logSuccess('Application initialization completed successfully', { prefix: 'Init' });
    } else {
      result.message = 'Application initialization completed with errors';
      logWarning('Application initialization completed with errors', { prefix: 'Init' });
    }

    // Log summary
    const dbStatus = result.database.initialized ? 'OK' : 'FAILED';
    const storageStatus = result.storage.initialized ? 'OK' : 'FAILED';
    logInfo(`Initialization summary - Database: ${dbStatus}, Storage: ${storageStatus}`, { prefix: 'Init' });

    return result;

  } catch (error) {
    const initError = error as Error;
    result.errors.push(`Application initialization error: ${initError.message}`);
    result.message = `Application initialization failed: ${initError.message}`;

    logError(`Application initialization failed: ${initError.message}`, { prefix: 'Init' });

    return result;
  }
}

/**
 * Quick health check for all services
 * Useful for monitoring and health check endpoints
 */
export async function checkApplicationHealth(): Promise<{
  isHealthy: boolean;
  services: {
    database: boolean;
    storage: boolean;
  };
  details: {
    database?: any;
    storage?: any;
  };
  errors: string[];
}> {
  const result = {
    isHealthy: false,
    services: {
      database: false,
      storage: false
    },
    details: {} as any,
    errors: [] as string[]
  };

  try {
    // Check database health
    try {
      const { checkDatabaseHealth } = await import('./database');
      const dbHealth = await checkDatabaseHealth();
      result.services.database = dbHealth.isHealthy;
      result.details.database = dbHealth;

      if (!dbHealth.isHealthy && dbHealth.lastError) {
        result.errors.push(`Database: ${dbHealth.lastError}`);
      }
    } catch (error) {
      result.errors.push(`Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check storage health
    try {
      const { checkStorageHealth } = await import('./storage');
      const storageHealth = await checkStorageHealth();
      result.services.storage = storageHealth.isHealthy;
      result.details.storage = storageHealth;

      if (!storageHealth.isHealthy && storageHealth.lastError) {
        result.errors.push(`Storage: ${storageHealth.lastError}`);
      }
    } catch (error) {
      result.errors.push(`Storage health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Overall health is good if all services are healthy
    result.isHealthy = result.services.database && result.services.storage;

    return result;

  } catch (error) {
    result.errors.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Initialize application in development mode with full logging
 * This function is designed to be called during app startup in development
 */
export async function initializeForDevelopment(): Promise<ApplicationInitResult> {
  return await initializeApplication({
    enableDatabase: true,
    enableStorage: true,
    createSchema: true,
    createBucket: true,
    skipHealthChecks: false,
    retryAttempts: 3
  });
}

/**
 * Initialize application in production mode with minimal setup
 * This function is designed to be called during app startup in production
 */
export async function initializeForProduction(): Promise<ApplicationInitResult> {
  return await initializeApplication({
    enableDatabase: true,
    enableStorage: true,
    createSchema: false, // Don't auto-create schema in production
    createBucket: false, // Don't auto-create bucket in production
    skipHealthChecks: true, // Skip health checks for faster startup
    retryAttempts: 5 // More retries in production
  });
}

/**
 * Lightweight initialization for testing
 * This function is designed for test environments
 */
export async function initializeForTesting(): Promise<ApplicationInitResult> {
  return await initializeApplication({
    enableDatabase: false, // Tests should use mock database
    enableStorage: false, // Tests should use mock storage
    createSchema: false,
    createBucket: false,
    skipHealthChecks: true,
    retryAttempts: 1
  });
}

// Re-export individual initialization functions for direct use
export { initDatabase } from './database';
export { initStorage } from './storage';

// Re-export health check functions
export { checkDatabaseHealth } from './database';
export { checkStorageHealth } from './storage';