import { NextRequest, NextResponse } from 'next/server';
import { checkStorageHealth, testStorageOperations, getStorageInfo } from '@/lib/init/storage';
import { healthCheck, getStorageClient } from '@/lib/storage/client';

/**
 * Storage Test API Route
 * GET /api/test/storage
 *
 * Tests MinIO storage connection, bucket status, and provides detailed information
 * Useful for health checks, debugging, and monitoring
 */

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Get health check information
    const healthCheckResult = await checkStorageHealth();
    const latency = Date.now() - startTime;

    // Get storage information
    const storageInfo = await getStorageInfo();

    // Get basic storage statistics (only if connected)
    let storageStats = null;
    let bucketInfo = null;

    if (healthCheckResult.connected) {
      try {
        const storageClient = getStorageClient();
        storageStats = await storageClient.getStorageStats();
      } catch (error) {
        console.warn('Failed to get storage stats:', error);
      }

      try {
        // Get bucket information
        const minioHealthCheck = await healthCheck();
        bucketInfo = {
          exists: minioHealthCheck.bucketExists,
          canRead: minioHealthCheck.canRead,
          canWrite: minioHealthCheck.canWrite,
          latency: minioHealthCheck.latency
        };
      } catch (error) {
        console.warn('Failed to get bucket info:', error);
      }
    }

    // Build response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      latency: `${latency}ms`,
      health: {
        isHealthy: healthCheckResult.isHealthy,
        connected: healthCheckResult.connected,
        bucketExists: healthCheckResult.bucketExists,
        canRead: healthCheckResult.canRead,
        canWrite: healthCheckResult.canWrite
      },
      connection: {
        status: healthCheckResult.connected ? 'connected' : 'disconnected',
        info: healthCheckResult.storageInfo
      },
      bucket: bucketInfo,
      statistics: storageStats,
      configuration: storageInfo.config,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isDevelopment: process.env.NODE_ENV === 'development'
      },
      lastError: healthCheckResult.lastError || null
    };

    // Set appropriate status code
    const statusCode = healthCheckResult.isHealthy ? 200 : 503;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    const storageError = error as Error;
    console.error('Storage test API error:', storageError.message);

    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: {
        message: storageError.message,
        type: 'StorageTestError'
      },
      health: {
        isHealthy: false,
        connected: false,
        bucketExists: false,
        canRead: false,
        canWrite: false
      },
      connection: {
        status: 'error'
      },
      bucket: null,
      statistics: null,
      configuration: null,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isDevelopment: process.env.NODE_ENV === 'development'
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
 * POST /api/test/storage
 * Performs detailed storage tests (development only)
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Storage testing is only available in development mode',
        type: 'NotAllowedError'
      }
    }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { operation = 'test' } = body;

    const startTime = Date.now();
    const results: any = {
      success: true,
      timestamp: new Date().toISOString(),
      operation,
      tests: {}
    };

    switch (operation) {
      case 'test':
        // Perform comprehensive storage tests

        // Test 1: Basic connection and health check
        try {
          const healthCheck = await checkStorageHealth();
          results.tests.connection = {
            success: healthCheck.connected,
            health: healthCheck,
            message: healthCheck.connected ? 'Connection test passed' : 'Connection test failed'
          };
        } catch (error) {
          results.tests.connection = {
            success: false,
            error: error instanceof Error ? error.message : 'Connection test failed'
          };
        }

        // Test 2: Storage operations (upload, read, delete)
        try {
          const operationsTest = await testStorageOperations();
          results.tests.operations = {
            success: operationsTest.success,
            operations: operationsTest.operations,
            errors: operationsTest.errors,
            message: operationsTest.success ? 'All storage operations passed' : 'Some storage operations failed'
          };
        } catch (error) {
          results.tests.operations = {
            success: false,
            error: error instanceof Error ? error.message : 'Storage operations test failed'
          };
        }

        // Test 3: Storage statistics
        try {
          const storageInfo = await getStorageInfo();
          results.tests.statistics = {
            success: storageInfo.success,
            data: storageInfo,
            message: storageInfo.success ? 'Storage statistics retrieved' : 'Failed to get storage statistics'
          };
        } catch (error) {
          results.tests.statistics = {
            success: false,
            error: error instanceof Error ? error.message : 'Storage statistics test failed'
          };
        }

        // Test 4: File listing (if bucket exists and has files)
        try {
          const healthCheckResult = await checkStorageHealth();

          if (healthCheckResult.connected && healthCheckResult.bucketExists) {
            const storageClient = getStorageClient();
            const fileList = await storageClient.listFiles('', 10); // List first 10 files

            results.tests.fileListing = {
              success: true,
              data: {
                totalFiles: fileList.totalCount,
                sampleFiles: fileList.files.slice(0, 5).map(file => ({
                  key: file.key,
                  size: file.size,
                  lastModified: file.lastModified
                })),
                isTruncated: fileList.isTruncated
              },
              message: `Found ${fileList.totalCount} files in storage`
            };
          } else {
            results.tests.fileListing = {
              success: false,
              message: 'Cannot list files - storage not connected or bucket does not exist'
            };
          }
        } catch (error) {
          results.tests.fileListing = {
            success: false,
            error: error instanceof Error ? error.message : 'File listing test failed'
          };
        }

        break;

      case 'bucket-info':
        // Get detailed bucket information
        try {
          const storageClient = getStorageClient();
          const storageInfo = await getStorageInfo();

          if (storageInfo.config) {
            // Try to get bucket policy (if supported)
            let bucketPolicy = null;
            try {
              // Note: This might not be supported in all MinIO setups
              bucketPolicy = 'Policy information not available';
            } catch {
              bucketPolicy = 'Policy information not available';
            }

            results.tests.bucketInfo = {
              success: true,
              data: {
                bucketName: storageInfo.config.bucket,
                endpoint: `${storageInfo.config.endpoint}:${storageInfo.config.port}`,
                ssl: storageInfo.config.useSSL,
                region: storageInfo.config.region,
                policy: bucketPolicy,
                ...storageInfo.stats
              }
            };
          } else {
            results.tests.bucketInfo = {
              success: false,
              error: 'Storage configuration not available'
            };
          }
        } catch (error) {
          results.tests.bucketInfo = {
            success: false,
            error: error instanceof Error ? error.message : 'Bucket info retrieval failed'
          };
        }
        break;

      case 'upload-test':
        // Test file upload with a small test file
        try {
          const testContent = Buffer.from(`Test file created at ${new Date().toISOString()}`);
          const testFileName = `test-upload-${Date.now()}.txt`;

          const storageClient = getStorageClient();
          const uploadResult = await storageClient.uploadFile(testContent, testFileName, {
            contentType: 'text/plain',
            metadata: {
              'test': 'true',
              'created-by': 'storage-test-api'
            }
          });

          // Try to verify the upload
          const fileExists = await storageClient.fileExists(`uploads/${Date.now()}-${testFileName}`);

          // Clean up test file
          try {
            await storageClient.deleteFile(`uploads/${Date.now()}-${testFileName}`);
          } catch (cleanupError) {
            console.warn('Failed to clean up test file:', cleanupError);
          }

          results.tests.uploadTest = {
            success: true,
            data: {
              fileName: testFileName,
              uploadResult: {
                originalUrl: uploadResult.originalUrl,
                originalSize: uploadResult.originalSize,
                mimeType: uploadResult.mimeType
              },
              fileExists,
              cleanedUp: true
            },
            message: 'Upload test completed successfully'
          };

        } catch (error) {
          results.tests.uploadTest = {
            success: false,
            error: error instanceof Error ? error.message : 'Upload test failed'
          };
        }
        break;

      default:
        return NextResponse.json({
          success: false,
          error: {
            message: `Unknown operation: ${operation}`,
            type: 'ValidationError',
            supportedOperations: ['test', 'bucket-info', 'upload-test']
          }
        }, { status: 400 });
    }

    results.latency = `${Date.now() - startTime}ms`;
    results.success = Object.values(results.tests).every((test: any) => test.success);

    const statusCode = results.success ? 200 : 207; // 207 = Multi-Status (partial success)

    return NextResponse.json(results, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    const testError = error as Error;
    console.error('Storage test POST error:', testError.message);

    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: {
        message: testError.message,
        type: 'StorageTestError'
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