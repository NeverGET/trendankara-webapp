/**
 * MinIO Storage Client
 * Singleton MinIO client instance with retry logic and bucket management
 */

import { Client as MinioClient } from 'minio';
import { StorageConfig, StorageClient, UploadResult, UploadOptions, FileMetadata, FileListResult, StorageStats, StorageHealthCheck } from '@/types/storage';
import { logSuccess, logError, logWarning, createPrefixedLogger } from '@/lib/utils/logger';

const logger = createPrefixedLogger('Storage');

/**
 * MinIO client singleton instance
 */
let minioClient: MinioClient | null = null;
let storageConfig: StorageConfig | null = null;

/**
 * Retry configuration for MinIO operations
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  delays: [500, 1000, 2000], // Exponential backoff: 500ms, 1s, 2s
};

/**
 * Default bucket name
 */
const DEFAULT_BUCKET = 'media';

/**
 * Pre-signed URL expiry (7 days in seconds)
 */
const PRESIGNED_URL_EXPIRY = 7 * 24 * 60 * 60;

/**
 * Get storage configuration from environment variables
 */
function getStorageConfig(): StorageConfig {
  if (storageConfig) {
    return storageConfig;
  }

  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const port = parseInt(process.env.MINIO_PORT || '9000', 10);
  const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
  const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin123';
  const bucket = process.env.MINIO_BUCKET || DEFAULT_BUCKET;
  const useSSL = process.env.MINIO_USE_SSL === 'true';
  const region = process.env.MINIO_REGION || 'us-east-1';

  storageConfig = {
    endpoint,
    port,
    accessKey,
    secretKey,
    bucket,
    useSSL,
    region,
    partSize: 5 * 1024 * 1024, // 5MB part size
  };

  return storageConfig;
}

/**
 * Initialize MinIO client with configuration
 */
function initializeMinioClient(): MinioClient {
  const config = getStorageConfig();

  return new MinioClient({
    endPoint: config.endpoint,
    port: config.port,
    useSSL: config.useSSL,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    region: config.region,
    partSize: config.partSize,
  });
}

/**
 * Get singleton MinIO client instance
 */
export function getMinioClient(): MinioClient {
  if (!minioClient) {
    minioClient = initializeMinioClient();
    logger.success('MinIO client initialized');
  }
  return minioClient;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute operation with retry logic and exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  attempts: number = RETRY_CONFIG.maxAttempts
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        logger.success(`${operationName} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;

      if (attempt === attempts) {
        logger.error(`${operationName} failed after ${attempts} attempts: ${lastError.message}`);
        throw lastError;
      }

      const delay = RETRY_CONFIG.delays[attempt - 1];
      logger.warning(`${operationName} failed on attempt ${attempt}, retrying in ${delay}ms: ${lastError.message}`);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Ensure bucket exists, create if not
 */
export async function ensureBucket(bucketName?: string): Promise<void> {
  const config = getStorageConfig();
  const bucket = bucketName || config.bucket;
  const client = getMinioClient();

  await withRetry(async () => {
    const exists = await client.bucketExists(bucket);

    if (!exists) {
      await client.makeBucket(bucket, config.region);
      logger.success(`Bucket '${bucket}' created successfully`);
    } else {
      logger.success(`Bucket '${bucket}' already exists`);
    }
  }, `ensureBucket(${bucket})`);
}

/**
 * Get public URL for a file
 */
export async function getPublicUrl(key: string, bucketName?: string): Promise<string> {
  const config = getStorageConfig();
  const bucket = bucketName || config.bucket;
  const client = getMinioClient();

  return withRetry(async () => {
    // Generate pre-signed URL with 7-day expiry
    const url = await client.presignedGetObject(bucket, key, PRESIGNED_URL_EXPIRY);
    return url;
  }, `getPublicUrl(${key})`);
}

/**
 * Storage client implementation
 */
class MinioStorageClient implements StorageClient {
  async uploadFile(
    file: Buffer | Uint8Array | string,
    filename: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const config = getStorageConfig();
    const client = getMinioClient();

    // Ensure bucket exists
    await ensureBucket();

    const key = `uploads/${Date.now()}-${filename}`;
    const contentType = options?.contentType || 'application/octet-stream';

    return withRetry(async () => {
      const metadata = {
        'Content-Type': contentType,
        ...options?.metadata,
      };

      // Upload the file
      const uploadResult = await client.putObject(
        config.bucket,
        key,
        file,
        undefined,
        metadata
      );

      // Get file stats for metadata
      const stats = await client.statObject(config.bucket, key);

      // Generate public URL
      const originalUrl = await getPublicUrl(key);

      const result: UploadResult = {
        originalUrl,
        originalSize: stats.size,
        mimeType: contentType,
        thumbnails: {
          thumb: {
            url: originalUrl, // Simplified for now - actual thumbnail generation in upload.ts
            width: 150,
            height: 150,
            size: stats.size,
          },
          medium: {
            url: originalUrl,
            width: 600,
            height: 600,
            size: stats.size,
          },
          full: {
            url: originalUrl,
            width: 1200,
            height: 1200,
            size: stats.size,
          },
        },
        metadata: {
          filename,
          uploadedAt: new Date(),
          bucket: config.bucket,
          key,
          etag: uploadResult.etag,
        },
      };

      logger.success(`File uploaded successfully: ${key}`);
      return result;
    }, `uploadFile(${filename})`);
  }

  async deleteFile(key: string): Promise<void> {
    const config = getStorageConfig();
    const client = getMinioClient();

    await withRetry(async () => {
      await client.removeObject(config.bucket, key);
      logger.success(`File deleted successfully: ${key}`);
    }, `deleteFile(${key})`);
  }

  async getPresignedUrl(key: string, expiresIn: number = PRESIGNED_URL_EXPIRY): Promise<string> {
    return getPublicUrl(key);
  }

  async fileExists(key: string): Promise<boolean> {
    const config = getStorageConfig();
    const client = getMinioClient();

    return withRetry(async () => {
      try {
        await client.statObject(config.bucket, key);
        return true;
      } catch (error: any) {
        if (error.code === 'NotFound') {
          return false;
        }
        throw error;
      }
    }, `fileExists(${key})`);
  }

  async getFileMetadata(key: string): Promise<FileMetadata> {
    const config = getStorageConfig();
    const client = getMinioClient();

    return withRetry(async () => {
      const stats = await client.statObject(config.bucket, key);

      return {
        key,
        size: stats.size,
        lastModified: stats.lastModified,
        etag: stats.etag,
        contentType: stats.metaData['content-type'] || 'application/octet-stream',
        metadata: stats.metaData,
        versionId: stats.versionId,
      };
    }, `getFileMetadata(${key})`);
  }

  async listFiles(prefix?: string, maxKeys: number = 1000): Promise<FileListResult> {
    const config = getStorageConfig();
    const client = getMinioClient();

    return withRetry(async () => {
      const files: FileMetadata[] = [];
      let isTruncated = false;

      const objectStream = client.listObjectsV2(config.bucket, prefix, false, undefined, maxKeys);

      for await (const obj of objectStream) {
        files.push({
          key: obj.name!,
          size: obj.size!,
          lastModified: obj.lastModified!,
          etag: obj.etag!,
          contentType: 'application/octet-stream', // Default, actual type would need stat call
        });
      }

      return {
        files,
        isTruncated,
        totalCount: files.length,
      };
    }, `listFiles(${prefix || 'all'})`);
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    const config = getStorageConfig();
    const client = getMinioClient();

    await withRetry(async () => {
      await client.copyObject(
        config.bucket,
        destinationKey,
        `/${config.bucket}/${sourceKey}`
      );
      logger.success(`File copied: ${sourceKey} -> ${destinationKey}`);
    }, `copyFile(${sourceKey} -> ${destinationKey})`);
  }

  async getStorageStats(): Promise<StorageStats> {
    const config = getStorageConfig();
    const client = getMinioClient();

    return withRetry(async () => {
      let totalFiles = 0;
      let totalSize = 0;

      const objectStream = client.listObjectsV2(config.bucket, '', false);

      for await (const obj of objectStream) {
        totalFiles++;
        totalSize += obj.size!;
      }

      return {
        totalFiles,
        totalSize,
        bucketCount: 1, // We're only using one bucket for now
        lastUpdate: new Date(),
      };
    }, 'getStorageStats');
  }
}

/**
 * Singleton storage client instance
 */
let storageClientInstance: MinioStorageClient | null = null;

/**
 * Get singleton storage client instance
 */
export function getStorageClient(): StorageClient {
  if (!storageClientInstance) {
    storageClientInstance = new MinioStorageClient();
    logger.success('Storage client initialized');
  }
  return storageClientInstance;
}

/**
 * Perform health check on storage connection
 */
export async function healthCheck(): Promise<StorageHealthCheck> {
  const config = getStorageConfig();
  const startTime = Date.now();

  try {
    const client = getMinioClient();

    // Test connection by checking if bucket exists
    const bucketExists = await client.bucketExists(config.bucket);
    const latency = Date.now() - startTime;

    // Test write permission by attempting to put a small test object
    let canWrite = false;
    try {
      const testKey = `health-check-${Date.now()}`;
      await client.putObject(config.bucket, testKey, 'test', 4);
      await client.removeObject(config.bucket, testKey);
      canWrite = true;
    } catch (error) {
      logger.warning('Write permission test failed:', error);
    }

    return {
      isConnected: true,
      bucketExists,
      canWrite,
      canRead: true, // If we can check bucket existence, we can read
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      isConnected: false,
      bucketExists: false,
      canWrite: false,
      canRead: false,
      latency,
      error: (error as Error).message,
    };
  }
}

/**
 * Initialize storage connection and ensure bucket exists
 */
export async function initializeStorage(): Promise<void> {
  try {
    logger.info('Initializing storage connection...');

    // Initialize client
    getMinioClient();

    // Ensure bucket exists
    await ensureBucket();

    // Perform health check
    const health = await healthCheck();

    if (health.isConnected && health.bucketExists) {
      logger.success(`MinIO connected (latency: ${health.latency}ms)`);
    } else {
      throw new Error(`Storage health check failed: ${health.error}`);
    }
  } catch (error) {
    logger.error(`Storage initialization failed: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Default export for convenience
 */
export default {
  getClient: getStorageClient,
  ensureBucket,
  getPublicUrl,
  healthCheck,
  initialize: initializeStorage,
};