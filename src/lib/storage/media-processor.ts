/**
 * Media processing utilities
 * Generate multiple thumbnail sizes on upload
 */

import sharp from 'sharp';
import { getStorageClient } from './client';
import { db } from '@/lib/db/client';

export interface ThumbnailSize {
  name: string;
  width: number;
  height: number;
  quality?: number;
}

export interface ProcessedMedia {
  originalUrl: string;
  thumbnails: {
    [key: string]: string;
  };
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

// Default thumbnail sizes
const DEFAULT_THUMBNAIL_SIZES: ThumbnailSize[] = [
  { name: 'small', width: 150, height: 150, quality: 80 },
  { name: 'medium', width: 400, height: 400, quality: 85 },
  { name: 'large', width: 800, height: 800, quality: 90 },
  { name: 'preview', width: 1200, height: 1200, quality: 92 }
];

/**
 * Process and upload image with thumbnails
 */
export async function processAndUploadImage(
  fileBuffer: Buffer,
  filename: string,
  options: {
    contentType?: string;
    thumbnailSizes?: ThumbnailSize[];
    metadata?: Record<string, any>;
  } = {}
): Promise<ProcessedMedia> {
  const {
    contentType = 'image/jpeg',
    thumbnailSizes = DEFAULT_THUMBNAIL_SIZES,
    metadata = {}
  } = options;

  const storageClient = getStorageClient();

  // Get image metadata
  const sharpImage = sharp(fileBuffer);
  const imageMetadata = await sharpImage.metadata();

  if (!imageMetadata.width || !imageMetadata.height) {
    throw new Error('Invalid image file');
  }

  // Generate base filename without extension
  const baseFilename = filename.replace(/\.[^/.]+$/, '');
  const extension = filename.split('.').pop() || 'jpg';

  // Upload original image
  const originalResult = await storageClient.uploadFile(
    fileBuffer,
    filename,
    {
      contentType,
      metadata: {
        ...metadata,
        width: String(imageMetadata.width),
        height: String(imageMetadata.height),
        format: imageMetadata.format || 'unknown',
        isOriginal: 'true'
      }
    }
  );

  // Generate and upload thumbnails
  const thumbnails: { [key: string]: string } = {};

  for (const size of thumbnailSizes) {
    try {
      // Generate thumbnail
      const thumbnailBuffer = await sharp(fileBuffer)
        .resize(size.width, size.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: size.quality || 85 })
        .toBuffer();

      // Upload thumbnail
      const thumbnailFilename = `${baseFilename}_${size.name}.jpg`;
      const thumbnailResult = await storageClient.uploadFile(
        thumbnailBuffer,
        thumbnailFilename,
        {
          contentType: 'image/jpeg',
          metadata: {
            ...metadata,
            width: String(size.width),
            height: String(size.height),
            thumbnailOf: filename,
            thumbnailSize: size.name
          }
        }
      );

      thumbnails[size.name] = thumbnailResult.originalUrl;
    } catch (error) {
      console.error(`Error generating ${size.name} thumbnail:`, error);
      // Continue with other thumbnails even if one fails
    }
  }

  return {
    originalUrl: originalResult.originalUrl,
    thumbnails,
    metadata: {
      width: imageMetadata.width,
      height: imageMetadata.height,
      format: imageMetadata.format || 'unknown',
      size: fileBuffer.length
    }
  };
}

/**
 * Store media information in database
 */
export async function storeMediaInDatabase(
  media: ProcessedMedia,
  additionalData: {
    filename: string;
    title?: string;
    alt_text?: string;
    description?: string;
    category?: string;
    created_by: number;
  }
): Promise<number> {
  const {
    filename,
    title,
    alt_text,
    description,
    category,
    created_by
  } = additionalData;

  // Store in media table (if it exists)
  const result = await db.insert(
    `INSERT INTO media (
      filename, url, thumbnail_urls, metadata,
      title, alt_text, description, category,
      width, height, size, mime_type, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      filename,
      media.originalUrl,
      JSON.stringify(media.thumbnails),
      JSON.stringify(media.metadata),
      title || filename,
      alt_text || '',
      description || '',
      category || 'general',
      media.metadata.width,
      media.metadata.height,
      media.metadata.size,
      `image/${media.metadata.format}`,
      created_by
    ]
  );

  return result.insertId;
}

/**
 * Process video and generate thumbnail
 */
export async function processVideoThumbnail(
  videoPath: string,
  outputPath?: string
): Promise<Buffer> {
  // This would require ffmpeg integration
  // For now, return a placeholder implementation
  throw new Error('Video thumbnail generation not yet implemented');
}

/**
 * Optimize image for web
 */
export async function optimizeImageForWeb(
  fileBuffer: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<Buffer> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    format = 'jpeg'
  } = options;

  let sharpInstance = sharp(fileBuffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    });

  // Apply format-specific optimizations
  switch (format) {
    case 'jpeg':
      sharpInstance = sharpInstance.jpeg({
        quality,
        progressive: true,
        optimizeScans: true
      });
      break;
    case 'png':
      sharpInstance = sharpInstance.png({
        quality,
        compressionLevel: 9,
        progressive: true
      });
      break;
    case 'webp':
      sharpInstance = sharpInstance.webp({
        quality,
        lossless: false
      });
      break;
  }

  return sharpInstance.toBuffer();
}

/**
 * Generate responsive image sizes
 */
export async function generateResponsiveImages(
  fileBuffer: Buffer,
  filename: string
): Promise<{
  srcset: string;
  sizes: string;
  urls: { [key: string]: string };
}> {
  const responsiveSizes = [
    { width: 320, suffix: 'sm' },
    { width: 640, suffix: 'md' },
    { width: 1024, suffix: 'lg' },
    { width: 1440, suffix: 'xl' },
    { width: 1920, suffix: '2xl' }
  ];

  const storageClient = getStorageClient();
  const baseFilename = filename.replace(/\.[^/.]+$/, '');
  const urls: { [key: string]: string } = {};
  const srcsetParts: string[] = [];

  for (const size of responsiveSizes) {
    try {
      const resizedBuffer = await sharp(fileBuffer)
        .resize(size.width, null, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      const sizeFilename = `${baseFilename}_${size.suffix}.jpg`;
      const result = await storageClient.uploadFile(
        resizedBuffer,
        sizeFilename,
        {
          contentType: 'image/jpeg',
          metadata: {
            width: String(size.width),
            responsiveSize: size.suffix
          }
        }
      );

      urls[size.suffix] = result.originalUrl;
      srcsetParts.push(`${result.originalUrl} ${size.width}w`);
    } catch (error) {
      console.error(`Error generating ${size.suffix} responsive image:`, error);
    }
  }

  return {
    srcset: srcsetParts.join(', '),
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    urls
  };
}

/**
 * Extract dominant colors from image
 */
export async function extractImageColors(
  fileBuffer: Buffer,
  numColors: number = 5
): Promise<string[]> {
  const { dominant } = await sharp(fileBuffer)
    .stats();

  // This is a simplified version
  // For more accurate color extraction, use a library like node-vibrant
  return [`rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`];
}

/**
 * Validate image file
 */
export async function validateImage(
  fileBuffer: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    maxSizeMB?: number;
    allowedFormats?: string[];
  } = {}
): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const {
    maxWidth = 4096,
    maxHeight = 4096,
    maxSizeMB = 10,
    allowedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif']
  } = options;

  const errors: string[] = [];

  try {
    const metadata = await sharp(fileBuffer).metadata();

    // Check format
    if (metadata.format && !allowedFormats.includes(metadata.format)) {
      errors.push(`Format not allowed: ${metadata.format}`);
    }

    // Check dimensions
    if (metadata.width && metadata.width > maxWidth) {
      errors.push(`Width exceeds maximum: ${metadata.width}px > ${maxWidth}px`);
    }
    if (metadata.height && metadata.height > maxHeight) {
      errors.push(`Height exceeds maximum: ${metadata.height}px > ${maxHeight}px`);
    }

    // Check file size
    const sizeMB = fileBuffer.length / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      errors.push(`File size exceeds maximum: ${sizeMB.toFixed(2)}MB > ${maxSizeMB}MB`);
    }
  } catch (error) {
    errors.push('Invalid image file');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}