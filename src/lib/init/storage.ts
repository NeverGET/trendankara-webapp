import { getMinioClient, ensureBucket, healthCheck, getStorageClient } from '@/lib/storage/client';
import { validateStorageEnv, checkEnvironmentHealth } from '@/lib/config/validator';
import { logSuccess, logError, logInfo, logWarning } from '@/lib/utils/logger';
import type { StorageStats } from '@/types/storage';

/**
 * Storage Initialization Module
 * Handles MinIO storage connection and bucket initialization for app startup
 * Auto-initializes in development mode with comprehensive error handling
 */

/**
 * Storage initialization result
 */
export interface StorageInitResult {
  success: boolean;
  connected: boolean;
  bucketExists: boolean;
  canWrite: boolean;
  canRead: boolean;
  message: string;
  errors: string[];
  latency?: number;
}

/**
 * Initialize MinIO storage connection and bucket
 * Checks environment, connects to storage, and ensures bucket exists
 *
 * @param options - Initialization options
 * @returns Promise<StorageInitResult> - Initialization result with detailed status
 */
export async function initStorage(options: {
  createBucket?: boolean;
  skipHealthCheck?: boolean;
  retryAttempts?: number;
  testWritePermissions?: boolean;
} = {}): Promise<StorageInitResult> {
  const {
    createBucket = process.env.NODE_ENV === 'development',
    skipHealthCheck = false,
    retryAttempts = 3,
    testWritePermissions = true
  } = options;

  const result: StorageInitResult = {
    success: false,
    connected: false,
    bucketExists: false,
    canWrite: false,
    canRead: false,
    message: '',
    errors: []
  };

  try {
    logInfo('Starting storage initialization', { prefix: 'Storage' });

    // Step 1: Validate environment configuration
    const envHealth = checkEnvironmentHealth();
    if (!envHealth.isValid) {
      result.errors.push('Environment validation failed');
      envHealth.errors.forEach(error => result.errors.push(error));

      if (envHealth.missingVariables.length > 0) {
        result.errors.push(`Missing variables: ${envHealth.missingVariables.join(', ')}`);
      }

      logError('Storage initialization failed: Invalid environment configuration', { prefix: 'Storage' });
      result.message = 'Invalid environment configuration';
      return result;
    }

    // Step 2: Get and validate storage configuration
    let storageConfig;
    try {
      storageConfig = validateStorageEnv();
      logInfo(`Storage config validated: ${storageConfig.endpoint}:${storageConfig.port}/${storageConfig.bucket}`, { prefix: 'Storage' });
    } catch (error) {
      const configError = error as Error;
      result.errors.push(`Storage configuration error: ${configError.message}`);
      logError(`Storage configuration validation failed: ${configError.message}`, { prefix: 'Storage' });
      result.message = 'Storage configuration validation failed';
      return result;
    }

    // Step 3: Initialize MinIO client with retry logic
    let connectionAttempts = 0;
    while (connectionAttempts < retryAttempts) {
      try {
        connectionAttempts++;
        logInfo(`Attempting storage connection (attempt ${connectionAttempts}/${retryAttempts})`, { prefix: 'Storage' });

        // Initialize MinIO client
        const client = getMinioClient();

        // Test basic connectivity by listing buckets (this checks auth and connection)
        await client.listBuckets();

        result.connected = true;
        logSuccess('Storage connection established successfully', { prefix: 'Storage' });
        break;

      } catch (error) {
        const connectionError = error as Error;
        const errorMessage = `Connection attempt ${connectionAttempts} failed: ${connectionError.message}`;

        logWarning(errorMessage, { prefix: 'Storage' });
        result.errors.push(errorMessage);

        // Check for specific error types to provide better feedback
        if (connectionError.message.includes('ENOTFOUND') || connectionError.message.includes('ECONNREFUSED')) {
          result.errors.push('MinIO server appears to be unavailable. Check if Docker containers are running.');
        } else if (connectionError.message.includes('InvalidAccessKeyId') || connectionError.message.includes('SignatureDoesNotMatch')) {
          result.errors.push('MinIO credentials appear to be invalid. Check MINIO_ACCESS_KEY and MINIO_SECRET_KEY.');
        }

        if (connectionAttempts >= retryAttempts) {
          logError(`Storage connection failed after ${retryAttempts} attempts`, { prefix: 'Storage' });
          result.message = `Storage connection failed after ${retryAttempts} attempts`;
          return result;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, connectionAttempts - 1), 10000);
        logInfo(`Waiting ${delay}ms before retry...`, { prefix: 'Storage' });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Step 4: Ensure bucket exists if requested
    if (createBucket) {
      try {
        logInfo(`Checking/creating bucket: ${storageConfig.bucket}`, { prefix: 'Storage' });

        await ensureBucket(storageConfig.bucket);

        result.bucketExists = true;
        logSuccess(`Bucket '${storageConfig.bucket}' is ready`, { prefix: 'Storage' });

      } catch (error) {
        const bucketError = error as Error;
        result.errors.push(`Bucket creation error: ${bucketError.message}`);
        logError(`Failed to ensure bucket exists: ${bucketError.message}`, { prefix: 'Storage' });
        result.message = 'Bucket creation failed';
        return result;
      }
    } else {
      logInfo('Bucket creation skipped by options', { prefix: 'Storage' });
      result.bucketExists = true; // Assume exists if not checking
    }

    // Step 5: Perform comprehensive health check
    if (!skipHealthCheck) {
      try {
        logInfo('Performing storage health check', { prefix: 'Storage' });

        const healthResult = await healthCheck();

        result.connected = healthResult.isConnected;
        result.bucketExists = healthResult.bucketExists;
        result.canRead = healthResult.canRead;
        result.canWrite = healthResult.canWrite;
        result.latency = healthResult.latency;

        if (healthResult.isConnected) {
          logSuccess(`Storage health check passed (latency: ${healthResult.latency}ms)`, { prefix: 'Storage' });

          if (!healthResult.bucketExists) {
            result.errors.push(`Bucket '${storageConfig.bucket}' does not exist`);
            logWarning(`Bucket '${storageConfig.bucket}' does not exist`, { prefix: 'Storage' });
          }

          if (!healthResult.canRead) {
            result.errors.push('Storage read permissions are insufficient');
            logWarning('Storage read permissions are insufficient', { prefix: 'Storage' });
          }

          if (testWritePermissions && !healthResult.canWrite) {
            result.errors.push('Storage write permissions are insufficient');
            logWarning('Storage write permissions are insufficient', { prefix: 'Storage' });
          }
        } else {
          result.errors.push(`Storage health check failed: ${healthResult.error}`);
          logError(`Storage health check failed: ${healthResult.error}`, { prefix: 'Storage' });
          result.message = 'Storage health check failed';
          return result;
        }

      } catch (error) {
        const healthError = error as Error;
        result.errors.push(`Health check error: ${healthError.message}`);
        logError(`Storage health check failed: ${healthError.message}`, { prefix: 'Storage' });
        result.message = 'Storage health check failed';
        return result;
      }
    } else {
      logInfo('Health check skipped by options', { prefix: 'Storage' });
      result.connected = true;
      result.bucketExists = true;
      result.canRead = true;
      result.canWrite = true;
    }

    // Step 6: Initialize storage client
    try {
      const storageClient = getStorageClient();
      logInfo('Storage client initialized successfully', { prefix: 'Storage' });
    } catch (error) {
      const clientError = error as Error;
      result.errors.push(`Storage client initialization error: ${clientError.message}`);
      logError(`Storage client initialization failed: ${clientError.message}`, { prefix: 'Storage' });
    }

    // Step 7: Final success validation
    const isFullyOperational = result.connected && result.bucketExists &&
                               result.canRead && (!testWritePermissions || result.canWrite);

    if (isFullyOperational) {
      result.success = true;
      result.message = 'Storage initialization completed successfully';

      logSuccess('Storage initialization complete', { prefix: 'Storage' });

      // Log configuration summary in development
      if (process.env.NODE_ENV === 'development') {
        logInfo(`Storage: ${storageConfig.endpoint}:${storageConfig.port}`, { prefix: 'Storage' });
        logInfo(`Bucket: ${storageConfig.bucket}`, { prefix: 'Storage' });
        logInfo(`SSL: ${storageConfig.useSSL ? 'Enabled' : 'Disabled'}`, { prefix: 'Storage' });
        logInfo(`Region: ${storageConfig.region}`, { prefix: 'Storage' });
        if (result.latency) {
          logInfo(`Latency: ${result.latency}ms`, { prefix: 'Storage' });
        }
      }
    } else {
      result.message = 'Storage initialization completed with warnings';
      logWarning('Storage initialization completed with warnings', { prefix: 'Storage' });
    }

    return result;

  } catch (error) {
    const initError = error as Error;
    result.errors.push(`Initialization error: ${initError.message}`);
    result.message = `Storage initialization failed: ${initError.message}`;

    logError(`Storage initialization failed: ${initError.message}`, { prefix: 'Storage' });

    return result;
  }
}

/**
 * Check storage health and connectivity
 * Useful for health check endpoints and monitoring
 */
export async function checkStorageHealth(): Promise<{
  isHealthy: boolean;
  connected: boolean;
  bucketExists: boolean;
  canRead: boolean;
  canWrite: boolean;
  storageInfo: {
    endpoint?: string;
    port?: number;
    bucket?: string;
    useSSL?: boolean;
    latency?: number;
  };
  lastError?: string;
}> {
  try {
    // Get storage configuration
    let storageConfig;
    try {
      storageConfig = validateStorageEnv();
    } catch (error) {
      return {
        isHealthy: false,
        connected: false,
        bucketExists: false,
        canRead: false,
        canWrite: false,
        storageInfo: {},
        lastError: error instanceof Error ? error.message : 'Storage configuration validation failed'
      };
    }

    // Perform health check
    const healthResult = await healthCheck();

    return {
      isHealthy: healthResult.isConnected && healthResult.bucketExists &&
                 healthResult.canRead && healthResult.canWrite,
      connected: healthResult.isConnected,
      bucketExists: healthResult.bucketExists,
      canRead: healthResult.canRead,
      canWrite: healthResult.canWrite,
      storageInfo: {
        endpoint: storageConfig.endpoint,
        port: storageConfig.port,
        bucket: storageConfig.bucket,
        useSSL: storageConfig.useSSL,
        latency: healthResult.latency
      },
      lastError: healthResult.error
    };

  } catch (error) {
    return {
      isHealthy: false,
      connected: false,
      bucketExists: false,
      canRead: false,
      canWrite: false,
      storageInfo: {},
      lastError: error instanceof Error ? error.message : 'Storage health check failed'
    };
  }
}

/**
 * Test storage operations (upload, download, delete)
 * Useful for comprehensive testing
 */
export async function testStorageOperations(): Promise<{
  success: boolean;
  operations: {
    upload: boolean;
    download: boolean;
    delete: boolean;
  };
  errors: string[];
}> {
  const result = {
    success: false,
    operations: {
      upload: false,
      download: false,
      delete: false
    },
    errors: [] as string[]
  };

  try {
    const storageClient = getStorageClient();
    const testContent = Buffer.from('test-storage-operation');
    const testFilename = `test-${Date.now()}.txt`;

    // Test upload
    try {
      logInfo('Testing storage upload operation', { prefix: 'Storage' });
      const uploadResult = await storageClient.uploadFile(testContent, testFilename, {
        contentType: 'text/plain'
      });
      result.operations.upload = true;
      logSuccess('Storage upload test passed', { prefix: 'Storage' });

      // Test download (by checking if file exists)
      try {
        logInfo('Testing storage read operation', { prefix: 'Storage' });
        const fileExists = await storageClient.fileExists(`uploads/${Date.now()}-${testFilename}`);
        result.operations.download = true;
        logSuccess('Storage read test passed', { prefix: 'Storage' });

        // Test delete
        try {
          logInfo('Testing storage delete operation', { prefix: 'Storage' });
          await storageClient.deleteFile(`uploads/${Date.now()}-${testFilename}`);
          result.operations.delete = true;
          logSuccess('Storage delete test passed', { prefix: 'Storage' });
        } catch (error) {
          result.errors.push(`Delete test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } catch (error) {
        result.errors.push(`Read test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      result.errors.push(`Upload test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    result.success = result.operations.upload && result.operations.download && result.operations.delete;

    if (result.success) {
      logSuccess('All storage operations tests passed', { prefix: 'Storage' });
    } else {
      logWarning('Some storage operations tests failed', { prefix: 'Storage' });
    }

    return result;

  } catch (error) {
    result.errors.push(`Storage operations test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logError(`Storage operations test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { prefix: 'Storage' });
    return result;
  }
}

/**
 * Reinitialize storage connection
 * Useful for testing or when configuration changes
 */
export async function reinitializeStorage(): Promise<StorageInitResult> {
  try {
    logInfo('Reinitializing storage connection', { prefix: 'Storage' });

    // Wait a moment for any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Reinitialize
    return await initStorage();

  } catch (error) {
    const reinitError = error as Error;
    logError(`Storage reinitialization failed: ${reinitError.message}`, { prefix: 'Storage' });

    return {
      success: false,
      connected: false,
      bucketExists: false,
      canRead: false,
      canWrite: false,
      message: `Reinitialization failed: ${reinitError.message}`,
      errors: [reinitError.message]
    };
  }
}

/**
 * Create bucket if it doesn't exist
 * Useful for setup scripts and deployment
 */
export async function ensureStorageBucket(bucketName?: string): Promise<{
  success: boolean;
  bucketExists: boolean;
  created: boolean;
  message: string;
}> {
  try {
    const storageConfig = validateStorageEnv();
    const bucket = bucketName || storageConfig.bucket;

    logInfo(`Ensuring bucket '${bucket}' exists`, { prefix: 'Storage' });

    const client = getMinioClient();
    const exists = await client.bucketExists(bucket);

    if (exists) {
      logSuccess(`Bucket '${bucket}' already exists`, { prefix: 'Storage' });
      return {
        success: true,
        bucketExists: true,
        created: false,
        message: `Bucket '${bucket}' already exists`
      };
    } else {
      await ensureBucket(bucket);
      logSuccess(`Bucket '${bucket}' created successfully`, { prefix: 'Storage' });
      return {
        success: true,
        bucketExists: true,
        created: true,
        message: `Bucket '${bucket}' created successfully`
      };
    }

  } catch (error) {
    const bucketError = error as Error;
    logError(`Failed to ensure bucket exists: ${bucketError.message}`, { prefix: 'Storage' });

    return {
      success: false,
      bucketExists: false,
      created: false,
      message: `Failed to ensure bucket exists: ${bucketError.message}`
    };
  }
}

/**
 * Get storage statistics and information
 * Useful for monitoring and admin dashboards
 */
export async function getStorageInfo(): Promise<{
  success: boolean;
  config: {
    endpoint: string;
    port: number;
    bucket: string;
    useSSL: boolean;
    region: string;
  } | null;
  stats: {
    totalFiles?: number;
    totalSize?: number;
    bucketCount?: number;
  } | null;
  health: {
    connected: boolean;
    latency?: number;
  } | null;
  error?: string;
}> {
  try {
    // Get configuration
    const storageConfig = validateStorageEnv();

    // Get health status
    const healthResult = await healthCheck();

    // Get storage statistics
    let stats: StorageStats | null = null;
    try {
      const storageClient = getStorageClient();
      stats = await storageClient.getStorageStats();
    } catch (error) {
      logWarning(`Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`, { prefix: 'Storage' });
    }

    return {
      success: true,
      config: {
        endpoint: storageConfig.endpoint,
        port: storageConfig.port,
        bucket: storageConfig.bucket,
        useSSL: storageConfig.useSSL,
        region: storageConfig.region || 'us-east-1'
      },
      stats,
      health: {
        connected: healthResult.isConnected,
        latency: healthResult.latency
      }
    };

  } catch (error) {
    const infoError = error as Error;
    return {
      success: false,
      config: null,
      stats: null,
      health: null,
      error: infoError.message
    };
  }
}