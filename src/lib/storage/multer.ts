/**
 * Multer Configuration for File Uploads
 * Configures multipart form handling with memory storage, file filtering, and size limits
 */

import multer from 'multer';
import { Request } from 'express';
import { createPrefixedLogger } from '@/lib/utils/logger';

const logger = createPrefixedLogger('Multer');

/**
 * Supported image MIME types for upload validation
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
 * Multer error types for better error handling
 */
export class MulterValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'MulterValidationError';
  }
}

/**
 * File filter function to validate uploaded files
 * Only allows image files with supported MIME types
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  try {
    logger.info(`Validating file: ${file.originalname} (${file.mimetype})`);

    // Check if the MIME type is supported
    if (!SUPPORTED_IMAGE_TYPES.has(file.mimetype)) {
      const error = new MulterValidationError(
        `Unsupported file type: ${file.mimetype}. Supported types: ${Array.from(SUPPORTED_IMAGE_TYPES).join(', ')}`,
        'UNSUPPORTED_FILE_TYPE'
      );
      logger.error(`File rejected: ${file.originalname} - ${error.message}`);
      cb(error);
      return;
    }

    // Check file extension as additional validation
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      const error = new MulterValidationError(
        `Invalid file extension: ${fileExtension}. Allowed extensions: ${allowedExtensions.join(', ')}`,
        'INVALID_FILE_EXTENSION'
      );
      logger.error(`File rejected: ${file.originalname} - ${error.message}`);
      cb(error);
      return;
    }

    logger.info(`File accepted: ${file.originalname}`);
    cb(null, true);
  } catch (error) {
    logger.error(`File filter error for ${file.originalname}: ${(error as Error).message}`);
    cb(error as Error);
  }
};

/**
 * Multer storage configuration using memory storage
 * Files are stored in memory as Buffer objects for immediate processing
 */
const storage = multer.memoryStorage();

/**
 * Main multer configuration with memory storage, file filtering, and size limits
 */
const multerConfig = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Maximum 10 files per request
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // Field name size limit
    fields: 20 // Maximum number of non-file fields
  },
  preservePath: false // Don't preserve the full path of files
});

/**
 * Error handler middleware for multer errors
 */
export const handleMulterError = (error: any): MulterValidationError => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return new MulterValidationError(
          `File size exceeds the ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB limit`,
          'FILE_TOO_LARGE'
        );
      case 'LIMIT_FILE_COUNT':
        return new MulterValidationError(
          'Too many files uploaded. Maximum 10 files allowed',
          'TOO_MANY_FILES'
        );
      case 'LIMIT_UNEXPECTED_FILE':
        return new MulterValidationError(
          `Unexpected file field: ${error.field}`,
          'UNEXPECTED_FILE_FIELD'
        );
      case 'LIMIT_PART_COUNT':
        return new MulterValidationError(
          'Too many parts in multipart form',
          'TOO_MANY_PARTS'
        );
      case 'LIMIT_FIELD_KEY':
        return new MulterValidationError(
          'Field name too long',
          'FIELD_NAME_TOO_LONG'
        );
      case 'LIMIT_FIELD_VALUE':
        return new MulterValidationError(
          'Field value too long',
          'FIELD_VALUE_TOO_LONG'
        );
      case 'LIMIT_FIELD_COUNT':
        return new MulterValidationError(
          'Too many fields in form',
          'TOO_MANY_FIELDS'
        );
      default:
        return new MulterValidationError(
          `Upload error: ${error.message}`,
          'UPLOAD_ERROR'
        );
    }
  }

  if (error instanceof MulterValidationError) {
    return error;
  }

  return new MulterValidationError(
    `Unexpected upload error: ${error.message}`,
    'UNKNOWN_ERROR'
  );
};

/**
 * Middleware for single file upload
 * Use with: upload.single('fieldName')
 */
export const uploadSingle = (fieldName: string) => {
  return multerConfig.single(fieldName);
};

/**
 * Middleware for multiple files upload (same field name)
 * Use with: upload.array('fieldName', maxCount)
 */
export const uploadArray = (fieldName: string, maxCount: number = 10) => {
  return multerConfig.array(fieldName, maxCount);
};

/**
 * Middleware for multiple files upload (different field names)
 * Use with: upload.fields([{ name: 'field1', maxCount: 1 }, { name: 'field2', maxCount: 5 }])
 */
export const uploadFields = (fields: Array<{ name: string; maxCount?: number }>) => {
  return multerConfig.fields(fields);
};

/**
 * Middleware for forms with no file uploads (only text fields)
 * Use with: upload.none()
 */
export const uploadNone = () => {
  return multerConfig.none();
};

/**
 * Get supported image types
 */
export const getSupportedImageTypes = (): string[] => {
  return Array.from(SUPPORTED_IMAGE_TYPES);
};

/**
 * Check if a MIME type is supported
 */
export const isImageTypeSupported = (mimeType: string): boolean => {
  return SUPPORTED_IMAGE_TYPES.has(mimeType);
};

/**
 * Get maximum file size in bytes
 */
export const getMaxFileSize = (): number => {
  return MAX_FILE_SIZE;
};

/**
 * Get maximum file size in MB for display
 */
export const getMaxFileSizeMB = (): number => {
  return MAX_FILE_SIZE / 1024 / 1024;
};

/**
 * Validate file manually (for programmatic validation)
 */
export const validateFile = (file: Express.Multer.File): void => {
  if (!SUPPORTED_IMAGE_TYPES.has(file.mimetype)) {
    throw new MulterValidationError(
      `Unsupported file type: ${file.mimetype}`,
      'UNSUPPORTED_FILE_TYPE'
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new MulterValidationError(
      `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB limit`,
      'FILE_TOO_LARGE'
    );
  }
};

/**
 * Default configured multer instance
 */
export default multerConfig;

/**
 * Named exports for convenience
 */
export {
  multerConfig as upload,
  storage as memoryStorage,
  fileFilter as imageFileFilter,
  SUPPORTED_IMAGE_TYPES as supportedImageTypes,
  MAX_FILE_SIZE as maxFileSize
};