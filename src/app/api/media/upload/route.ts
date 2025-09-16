import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/storage/upload';
import { createMedia } from '@/lib/db/queries/media';
import { handleMulterError, MulterValidationError, validateFile, getSupportedImageTypes, getMaxFileSizeMB } from '@/lib/storage/multer';

/**
 * Media Upload API Route
 * POST /api/media/upload
 *
 * Handles image uploads with automatic thumbnail generation and database persistence
 * Supports multipart/form-data with file validation and error handling
 */

/**
 * Handle file upload from FormData
 */
async function handleFileUpload(formData: FormData): Promise<{
  file: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}> {
  const file = formData.get('file') as File;

  if (!file) {
    throw new MulterValidationError('No file provided', 'NO_FILE');
  }

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Create mock multer file object for validation
  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: file.name,
    encoding: '7bit',
    mimetype: file.type,
    size: file.size,
    buffer: buffer,
    destination: '',
    filename: '',
    path: '',
    stream: null as any
  };

  // Validate the file
  validateFile(mockFile);

  return {
    file: buffer,
    filename: file.name,
    mimeType: file.type,
    size: file.size
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Content-Type must be multipart/form-data',
          type: 'InvalidContentType',
          supportedTypes: ['multipart/form-data']
        }
      }, { status: 400 });
    }

    // Parse form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Failed to parse form data',
          type: 'FormDataError',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }, { status: 400 });
    }

    // Handle file upload
    let uploadData: {
      file: Buffer;
      filename: string;
      mimeType: string;
      size: number;
    };

    try {
      uploadData = await handleFileUpload(formData);
    } catch (error) {
      if (error instanceof MulterValidationError) {
        return NextResponse.json({
          success: false,
          error: {
            message: error.message,
            type: error.code,
            supportedTypes: getSupportedImageTypes(),
            maxFileSize: `${getMaxFileSizeMB()}MB`
          }
        }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        error: {
          message: 'File upload validation failed',
          type: 'ValidationError',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }, { status: 400 });
    }

    // Get optional metadata from form
    const alt = formData.get('alt') as string || '';
    const description = formData.get('description') as string || '';
    const category = formData.get('category') as string || 'general';

    // Upload image with thumbnail generation
    let uploadResult;
    try {
      uploadResult = await uploadImage(uploadData.file, uploadData.filename, {
        originalName: uploadData.filename,
        mimeType: uploadData.mimeType,
        generateThumbnails: true,
        metadata: {
          alt,
          description,
          category,
          uploadedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      const uploadError = error as Error;
      console.error('Image upload failed:', uploadError.message);

      return NextResponse.json({
        success: false,
        error: {
          message: 'Image upload failed',
          type: 'UploadError',
          details: uploadError.message
        }
      }, { status: 500 });
    }

    // Save media record to database
    let mediaRecord;
    try {
      const mediaData = {
        filename: uploadResult.metadata.filename,
        original_name: uploadData.filename,
        mime_type: uploadData.mimeType,
        size: uploadData.size,
        url: uploadResult.originalUrl,
        thumbnails: uploadResult.thumbnails ? {
          thumb: uploadResult.thumbnails.thumb?.url,
          medium: uploadResult.thumbnails.medium?.url,
          full: uploadResult.thumbnails.full?.url
        } : null,
        width: uploadResult.metadata.dimensions?.width || null,
        height: uploadResult.metadata.dimensions?.height || null,
        uploaded_by: null // TODO: Get from session when auth is implemented
      };

      const insertResult = await createMedia(mediaData);
      mediaRecord = {
        id: insertResult.insertId,
        ...mediaData,
        created_at: new Date(),
        updated_at: new Date()
      };

    } catch (error) {
      const dbError = error as Error;
      console.error('Database save failed:', dbError.message);

      // Upload succeeded but database save failed
      // TODO: Consider implementing cleanup of uploaded files in this case
      return NextResponse.json({
        success: false,
        error: {
          message: 'File uploaded but database save failed',
          type: 'DatabaseError',
          details: dbError.message,
          uploadResult: {
            originalUrl: uploadResult.originalUrl,
            filename: uploadResult.metadata.filename
          }
        }
      }, { status: 500 });
    }

    // Build success response
    const response = {
      success: true,
      data: {
        id: mediaRecord.id,
        filename: mediaRecord.filename,
        originalName: mediaRecord.original_name,
        mimeType: mediaRecord.mime_type,
        size: mediaRecord.size,
        dimensions: {
          width: mediaRecord.width,
          height: mediaRecord.height
        },
        urls: {
          original: uploadResult.originalUrl,
          thumbnails: uploadResult.thumbnails ? {
            thumb: uploadResult.thumbnails.thumb?.url,
            medium: uploadResult.thumbnails.medium?.url,
            full: uploadResult.thumbnails.full?.url
          } : null
        },
        metadata: {
          alt,
          description,
          category,
          uploadedAt: mediaRecord.created_at
        }
      },
      message: 'File uploaded successfully'
    };

    return NextResponse.json(response, {
      status: 201,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    const serverError = error as Error;
    console.error('Media upload API error:', serverError.message);

    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
        type: 'ServerError',
        details: process.env.NODE_ENV === 'development' ? serverError.message : 'An unexpected error occurred'
      }
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

/**
 * GET /api/media/upload
 * Returns upload configuration and requirements
 */
export async function GET() {
  try {
    const uploadConfig = {
      success: true,
      data: {
        supportedTypes: getSupportedImageTypes(),
        maxFileSize: {
          bytes: 5 * 1024 * 1024, // 5MB
          mb: getMaxFileSizeMB()
        },
        thumbnailSizes: {
          thumb: { width: 150, height: 150 },
          medium: { width: 600, height: 600 },
          full: { width: 1200, height: 1200 }
        },
        requirements: {
          contentType: 'multipart/form-data',
          fileField: 'file',
          optionalFields: [
            { name: 'alt', type: 'string', description: 'Alternative text for accessibility' },
            { name: 'description', type: 'string', description: 'File description' },
            { name: 'category', type: 'string', description: 'File category (default: general)' }
          ]
        },
        endpoints: {
          upload: '/api/media/upload',
          test: '/api/test/storage'
        }
      },
      message: 'Upload configuration retrieved successfully'
    };

    return NextResponse.json(uploadConfig, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });

  } catch (error) {
    const configError = error as Error;
    console.error('Upload config API error:', configError.message);

    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to retrieve upload configuration',
        type: 'ConfigError'
      }
    }, { status: 500 });
  }
}