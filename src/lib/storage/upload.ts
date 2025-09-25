/**
 * Image Upload Service with Thumbnail Generation
 * Handles image uploads with automatic thumbnail creation using Sharp
 */

import sharp from 'sharp';
import { getStorageClient, getPublicUrl } from './client';
import { UploadResult, UploadOptions, ThumbnailSizes, ThumbnailInfo } from '@/types/storage';
import { createPrefixedLogger } from '@/lib/utils/logger';

const logger = createPrefixedLogger('Upload');

/**
 * Supported image MIME types
 */
const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);

/**
 * Maximum file size (5MB in bytes)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Default thumbnail sizes configuration
 */
const DEFAULT_THUMBNAIL_SIZES: ThumbnailSizes = {
  thumb: { width: 150, height: 150 },
  medium: { width: 600, height: 600 },
  full: { width: 1200, height: 1200 }
};

/**
 * Image validation errors
 */
export class ImageValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

/**
 * Validate image file before processing
 */
function validateImageFile(buffer: Buffer, filename: string, mimeType?: string): void {
  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new ImageValidationError(
      `File size ${(buffer.length / 1024 / 1024).toFixed(2)}MB exceeds maximum limit of 5MB`,
      'FILE_TOO_LARGE'
    );
  }

  // Check MIME type if provided
  if (mimeType && !SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    throw new ImageValidationError(
      `Unsupported file type: ${mimeType}. Supported types: ${Array.from(SUPPORTED_IMAGE_TYPES).join(', ')}`,
      'UNSUPPORTED_TYPE'
    );
  }

  // Additional validation: check if the buffer is actually an image using Sharp
  try {
    sharp(buffer, { failOnError: false });
  } catch (error) {
    throw new ImageValidationError(
      `Invalid image file: ${filename}`,
      'INVALID_IMAGE'
    );
  }
}

/**
 * Detect image MIME type from buffer using Sharp
 */
async function detectMimeType(buffer: Buffer): Promise<string> {
  try {
    const metadata = await sharp(buffer).metadata();

    switch (metadata.format) {
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      default:
        throw new ImageValidationError(
          `Unsupported image format: ${metadata.format}`,
          'UNSUPPORTED_FORMAT'
        );
    }
  } catch (error) {
    if (error instanceof ImageValidationError) {
      throw error;
    }
    throw new ImageValidationError(
      'Failed to detect image type',
      'DETECTION_FAILED'
    );
  }
}

/**
 * Generate a single thumbnail using Sharp
 */
async function generateThumbnail(
  originalBuffer: Buffer,
  width: number,
  height: number,
  format: 'jpeg' | 'png' | 'webp' = 'jpeg'
): Promise<{ buffer: Buffer; metadata: sharp.OutputInfo }> {
  try {
    const pipeline = sharp(originalBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true
      });

    let outputBuffer: Buffer;
    let metadata: sharp.OutputInfo;

    switch (format) {
      case 'jpeg':
        const jpegResult = await pipeline
          .jpeg({ quality: 85, progressive: true })
          .toBuffer({ resolveWithObject: true });
        outputBuffer = jpegResult.data;
        metadata = jpegResult.info;
        break;

      case 'png':
        const pngResult = await pipeline
          .png({ compressionLevel: 8, progressive: true })
          .toBuffer({ resolveWithObject: true });
        outputBuffer = pngResult.data;
        metadata = pngResult.info;
        break;

      case 'webp':
        const webpResult = await pipeline
          .webp({ quality: 85, effort: 4 })
          .toBuffer({ resolveWithObject: true });
        outputBuffer = webpResult.data;
        metadata = webpResult.info;
        break;

      default:
        throw new Error(`Unsupported output format: ${format}`);
    }

    return { buffer: outputBuffer, metadata };
  } catch (error) {
    logger.error(`Thumbnail generation failed (${width}x${height}): ${(error as Error).message}`);
    throw new Error(`Failed to generate ${width}x${height} thumbnail: ${(error as Error).message}`);
  }
}

/**
 * Generate all thumbnail sizes for an image
 */
async function generateThumbnails(
  originalBuffer: Buffer,
  baseKey: string,
  thumbnailSizes: ThumbnailSizes,
  outputFormat: 'jpeg' | 'png' | 'webp' = 'jpeg'
): Promise<Record<keyof ThumbnailSizes, ThumbnailInfo>> {
  const startTime = Date.now();
  const storageClient = getStorageClient();
  const thumbnails: Record<keyof ThumbnailSizes, ThumbnailInfo> = {} as any;

  try {
    // Generate all thumbnails in parallel for better performance
    const thumbnailPromises = Object.entries(thumbnailSizes).map(async ([size, dimensions]) => {
      const sizeKey = size as keyof ThumbnailSizes;
      const { width, height } = dimensions;

      try {
        // Generate thumbnail
        const { buffer: thumbnailBuffer, metadata } = await generateThumbnail(
          originalBuffer,
          width,
          height,
          outputFormat
        );

        // Create thumbnail key
        const thumbnailKey = `${baseKey}_${size}.${outputFormat === 'jpeg' ? 'jpg' : outputFormat}`;

        // Upload thumbnail to storage
        await storageClient.uploadFile(
          thumbnailBuffer,
          thumbnailKey,
          {
            contentType: `image/${outputFormat === 'jpeg' ? 'jpeg' : outputFormat}`,
            metadata: {
              'thumbnail-size': size,
              'original-key': baseKey,
              'generated-at': new Date().toISOString()
            }
          }
        );

        // Get public URL for thumbnail
        const url = await getPublicUrl(thumbnailKey);

        return {
          size: sizeKey,
          info: {
            url,
            width: metadata.width || width,
            height: metadata.height || height,
            size: thumbnailBuffer.length
          }
        };
      } catch (error) {
        logger.error(`Failed to generate ${size} thumbnail: ${(error as Error).message}`);
        throw error;
      }
    });

    // Wait for all thumbnails to complete
    const results = await Promise.all(thumbnailPromises);

    // Build thumbnails object
    results.forEach(({ size, info }) => {
      thumbnails[size] = info;
    });

    const duration = Date.now() - startTime;
    logger.success(`Generated ${Object.keys(thumbnails).length} thumbnails in ${duration}ms`);

    return thumbnails;
  } catch (error) {
    logger.error(`Thumbnail generation failed after ${Date.now() - startTime}ms: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Main image upload function with thumbnail generation
 */
export async function uploadImage(
  file: Buffer | File,
  filename: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const startTime = Date.now();

  try {
    // Convert File to Buffer if needed
    let buffer: Buffer;
    if (file instanceof File) {
      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
    }

    logger.info(`Processing image upload: ${filename} (${(buffer.length / 1024).toFixed(2)}KB)`);

    // Detect MIME type from buffer
    const detectedMimeType = await detectMimeType(buffer);
    const mimeType = options.contentType || detectedMimeType;

    // Validate the image
    validateImageFile(buffer, filename, mimeType);

    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    // Generate base key for file storage
    const timestamp = Date.now();
    const fileExtension = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const baseName = filename.replace(/\.[^/.]+$/, '');
    const baseKey = `uploads/${timestamp}-${baseName}`;

    // Upload original image
    const storageClient = getStorageClient();
    const originalKey = `${baseKey}.${fileExtension}`;

    const originalUploadResult = await storageClient.uploadFile(
      buffer,
      originalKey,
      {
        contentType: mimeType,
        metadata: {
          'original-filename': filename,
          'upload-timestamp': new Date().toISOString(),
          'image-width': metadata.width?.toString() || '0',
          'image-height': metadata.height?.toString() || '0',
          'image-format': metadata.format || 'unknown',
          ...options.metadata
        }
      }
    );

    // Determine output format for thumbnails (prefer original format, fallback to jpeg)
    let outputFormat: 'jpeg' | 'png' | 'webp' = 'jpeg';
    if (mimeType === 'image/png') outputFormat = 'png';
    else if (mimeType === 'image/webp') outputFormat = 'webp';

    // Generate thumbnails if enabled (default: true)
    let thumbnails: Record<keyof ThumbnailSizes, ThumbnailInfo>;

    if (options.generateThumbnails !== false) {
      const thumbnailSizes = { ...DEFAULT_THUMBNAIL_SIZES, ...options.thumbnailSizes };
      thumbnails = await generateThumbnails(buffer, baseKey, thumbnailSizes, outputFormat);
    } else {
      // If thumbnails disabled, create placeholder entries pointing to original
      const originalUrl = await getPublicUrl(originalKey);
      thumbnails = {
        thumb: {
          url: originalUrl,
          width: Math.min(metadata.width || 150, 150),
          height: Math.min(metadata.height || 150, 150),
          size: buffer.length
        },
        medium: {
          url: originalUrl,
          width: Math.min(metadata.width || 600, 600),
          height: Math.min(metadata.height || 600, 600),
          size: buffer.length
        },
        full: {
          url: originalUrl,
          width: Math.min(metadata.width || 1200, 1200),
          height: Math.min(metadata.height || 1200, 1200),
          size: buffer.length
        }
      };
    }

    const result: UploadResult = {
      originalUrl: await getPublicUrl(originalKey),
      originalSize: buffer.length,
      mimeType,
      thumbnails,
      metadata: {
        filename,
        uploadedAt: new Date(),
        bucket: originalUploadResult.metadata.bucket,
        key: originalKey,
        etag: originalUploadResult.metadata.etag,
        versionId: originalUploadResult.metadata.versionId
      }
    };

    const duration = Date.now() - startTime;
    logger.success(`Image upload completed: ${filename} in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof ImageValidationError) {
      logger.error(`Image validation failed for ${filename}: ${error.message}`);
    } else {
      logger.error(`Image upload failed for ${filename} after ${duration}ms: ${(error as Error).message}`);
    }

    throw error;
  }
}

/**
 * Batch upload multiple images
 */
export async function uploadImages(
  files: Array<{ file: Buffer | File; filename: string; options?: UploadOptions }>,
  globalOptions: UploadOptions = {}
): Promise<{ successful: UploadResult[]; failed: Array<{ filename: string; error: string }> }> {
  const startTime = Date.now();
  const successful: UploadResult[] = [];
  const failed: Array<{ filename: string; error: string }> = [];

  logger.info(`Starting batch upload of ${files.length} images`);

  // Process uploads in parallel with concurrency limit
  const CONCURRENCY_LIMIT = 3;
  const chunks: typeof files[] = [];

  for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
    chunks.push(files.slice(i, i + CONCURRENCY_LIMIT));
  }

  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async ({ file, filename, options }) => {
      try {
        const mergedOptions = { ...globalOptions, ...options };
        const result = await uploadImage(file, filename, mergedOptions);
        successful.push(result);
      } catch (error) {
        failed.push({
          filename,
          error: (error as Error).message
        });
      }
    });

    await Promise.all(chunkPromises);
  }

  const duration = Date.now() - startTime;
  logger.success(`Batch upload completed: ${successful.length} successful, ${failed.length} failed in ${duration}ms`);

  return { successful, failed };
}

/**
 * Get supported image types
 */
export function getSupportedImageTypes(): string[] {
  return Array.from(SUPPORTED_IMAGE_TYPES);
}

/**
 * Check if a file type is supported
 */
export function isImageTypeSupported(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.has(mimeType);
}

/**
 * Get maximum file size in bytes
 */
export function getMaxFileSize(): number {
  return MAX_FILE_SIZE;
}

/**
 * Default export with main functions
 */
const uploadUtils = {
  uploadImage,
  uploadImages,
  getSupportedImageTypes,
  isImageTypeSupported,
  getMaxFileSize,
  ImageValidationError
};

export default uploadUtils;