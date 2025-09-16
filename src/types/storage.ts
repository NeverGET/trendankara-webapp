/**
 * Storage configuration for MinIO S3-compatible client
 * Supports both Docker and localhost environments
 */
export interface StorageConfig {
  endpoint: string;           // MinIO endpoint URL
  port: number;              // MinIO port (default: 9000)
  accessKey: string;         // MinIO access key from env
  secretKey: string;         // MinIO secret key from env
  bucket: string;            // Default bucket name
  useSSL: boolean;          // SSL/TLS encryption enabled
  region?: string;          // Optional region (default: 'us-east-1')
  partSize?: number;        // Optional part size for multipart uploads
}

/**
 * Thumbnail size configurations
 */
export interface ThumbnailSizes {
  thumb: {
    width: 150;
    height: 150;
  };
  medium: {
    width: 600;
    height: 600;
  };
  full: {
    width: 1200;
    height: 1200;
  };
}

/**
 * Individual thumbnail information
 */
export interface ThumbnailInfo {
  url: string;              // URL to access the thumbnail
  width: number;            // Actual width of the thumbnail
  height: number;           // Actual height of the thumbnail
  size: number;             // File size in bytes
}

/**
 * Upload result containing original file and generated thumbnails
 */
export interface UploadResult {
  originalUrl: string;                    // URL to access the original file
  originalSize: number;                   // Original file size in bytes
  mimeType: string;                      // MIME type of the uploaded file
  thumbnails: {
    thumb: ThumbnailInfo;                // 150x150 thumbnail
    medium: ThumbnailInfo;               // 600x600 thumbnail
    full: ThumbnailInfo;                 // 1200x1200 thumbnail
  };
  metadata: {
    filename: string;                    // Original filename
    uploadedAt: Date;                    // Upload timestamp
    bucket: string;                      // Bucket name where file is stored
    key: string;                         // Object key in storage
    etag?: string;                       // ETag from MinIO
    versionId?: string;                  // Version ID if versioning enabled
  };
}

/**
 * File upload options
 */
export interface UploadOptions {
  generateThumbnails?: boolean;          // Whether to generate thumbnails (default: true)
  thumbnailSizes?: Partial<ThumbnailSizes>; // Custom thumbnail sizes
  preserveOriginal?: boolean;            // Keep original file (default: true)
  metadata?: Record<string, string>;     // Additional metadata
  contentType?: string;                  // Override content type
  cacheControl?: string;                 // Cache control header
  expires?: Date;                        // Expiration date
}

/**
 * Storage client interface for file operations
 */
export interface StorageClient {
  /**
   * Upload a file to storage with thumbnail generation
   */
  uploadFile(
    file: Buffer | Uint8Array | string,
    filename: string,
    options?: UploadOptions
  ): Promise<UploadResult>;

  /**
   * Delete a file and its thumbnails from storage
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Get a pre-signed URL for file access
   */
  getPresignedUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Check if a file exists in storage
   */
  fileExists(key: string): Promise<boolean>;

  /**
   * Get file metadata without downloading
   */
  getFileMetadata(key: string): Promise<FileMetadata>;

  /**
   * List files in bucket with optional prefix
   */
  listFiles(prefix?: string, maxKeys?: number): Promise<FileListResult>;

  /**
   * Copy a file within storage
   */
  copyFile(sourceKey: string, destinationKey: string): Promise<void>;

  /**
   * Get storage statistics
   */
  getStorageStats(): Promise<StorageStats>;
}

/**
 * File metadata information
 */
export interface FileMetadata {
  key: string;                           // Object key
  size: number;                          // File size in bytes
  lastModified: Date;                    // Last modification date
  etag: string;                          // ETag value
  contentType: string;                   // MIME type
  metadata?: Record<string, string>;     // Custom metadata
  versionId?: string;                    // Version ID if versioning enabled
}

/**
 * File list result for listing operations
 */
export interface FileListResult {
  files: FileMetadata[];                 // Array of file metadata
  isTruncated: boolean;                  // Whether more files exist
  nextMarker?: string;                   // Marker for next page
  totalCount?: number;                   // Total file count (if available)
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalFiles: number;                    // Total number of files
  totalSize: number;                     // Total storage size in bytes
  bucketCount: number;                   // Number of buckets
  lastUpdate: Date;                      // Last statistics update
}

/**
 * Storage error types
 */
export interface StorageError extends Error {
  code?: string;                         // Error code from MinIO
  statusCode?: number;                   // HTTP status code
  region?: string;                       // Region where error occurred
  bucketName?: string;                   // Bucket name related to error
  key?: string;                          // Object key related to error
}

/**
 * Storage environment configuration
 */
export interface StorageEnvironment {
  MINIO_ENDPOINT?: string;               // MinIO endpoint
  MINIO_PORT?: string;                   // MinIO port
  MINIO_ACCESS_KEY?: string;             // MinIO access key
  MINIO_SECRET_KEY?: string;             // MinIO secret key
  MINIO_BUCKET?: string;                 // Default bucket name
  MINIO_USE_SSL?: string;                // SSL enabled flag
  MINIO_REGION?: string;                 // MinIO region
}

/**
 * Health check result for storage connection
 */
export interface StorageHealthCheck {
  isConnected: boolean;                  // Connection status
  bucketExists: boolean;                 // Default bucket exists
  canWrite: boolean;                     // Write permission available
  canRead: boolean;                      // Read permission available
  latency?: number;                      // Response latency in ms
  error?: string;                        // Error message if any
}

/**
 * Thumbnail generation job status
 */
export interface ThumbnailJob {
  id: string;                            // Job identifier
  status: 'pending' | 'processing' | 'completed' | 'failed';
  originalKey: string;                   // Original file key
  thumbnails: Partial<Record<keyof ThumbnailSizes, ThumbnailInfo>>;
  error?: string;                        // Error message if failed
  createdAt: Date;                       // Job creation time
  completedAt?: Date;                    // Job completion time
}

/**
 * Batch upload result for multiple files
 */
export interface BatchUploadResult {
  successful: UploadResult[];            // Successfully uploaded files
  failed: Array<{                       // Failed uploads
    filename: string;
    error: string;
  }>;
  totalFiles: number;                    // Total files processed
  successCount: number;                  // Number of successful uploads
  failureCount: number;                  // Number of failed uploads
}