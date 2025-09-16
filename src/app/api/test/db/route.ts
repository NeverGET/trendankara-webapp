import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/init/database';
import { db } from '@/lib/db/client';
import { getSchemaInfo, checkSchema } from '@/lib/db/schema';

/**
 * Database Test API Route
 * GET /api/test/db
 *
 * Tests database connection, schema validity, and provides detailed information
 * Useful for health checks, debugging, and monitoring
 */

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Get health check information
    const healthCheck = await checkDatabaseHealth();
    const latency = Date.now() - startTime;

    // Get basic connection info
    let connectionInfo = null;
    let poolStatus = null;
    let schemaInfo = null;
    let tableList = [];

    if (healthCheck.connected) {
      try {
        // Get pool status
        poolStatus = db.getPoolStatus();

        // Get database connection info
        connectionInfo = healthCheck.connectionInfo;

        // Get schema validation
        const schemaValidation = await checkSchema();

        // Get detailed schema info (only in development)
        if (process.env.NODE_ENV === 'development') {
          try {
            schemaInfo = await getSchemaInfo();
          } catch (error) {
            console.warn('Failed to get detailed schema info:', error);
          }
        }

        // Get table list
        try {
          const tablesResult = await db.query<{ TABLE_NAME: string }>(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
          `);
          tableList = tablesResult.rows.map(row => row.TABLE_NAME);
        } catch (error) {
          console.warn('Failed to get table list:', error);
        }

        // Combine schema info
        schemaInfo = {
          validation: schemaValidation,
          tables: tableList,
          detailed: process.env.NODE_ENV === 'development' ? schemaInfo : null
        };

      } catch (error) {
        console.error('Error getting additional database info:', error);
      }
    }

    // Build response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      latency: `${latency}ms`,
      health: {
        isHealthy: healthCheck.isHealthy,
        connected: healthCheck.connected,
        schemaValid: healthCheck.schemaValid
      },
      connection: {
        status: healthCheck.connected ? 'connected' : 'disconnected',
        info: connectionInfo,
        poolStatus: poolStatus
      },
      schema: schemaInfo,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isDevelopment: process.env.NODE_ENV === 'development'
      },
      lastError: healthCheck.lastError || null
    };

    // Set appropriate status code
    const statusCode = healthCheck.isHealthy ? 200 : 503;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    const dbError = error as Error;
    console.error('Database test API error:', dbError.message);

    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: {
        message: dbError.message,
        type: 'DatabaseTestError'
      },
      health: {
        isHealthy: false,
        connected: false,
        schemaValid: false
      },
      connection: {
        status: 'error'
      },
      schema: null,
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
 * POST /api/test/db
 * Performs more detailed database tests (development only)
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Database testing is only available in development mode',
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
        // Perform comprehensive database tests

        // Test 1: Basic connection
        try {
          await db.query('SELECT 1 as test');
          results.tests.connection = { success: true, message: 'Connection test passed' };
        } catch (error) {
          results.tests.connection = {
            success: false,
            error: error instanceof Error ? error.message : 'Connection test failed'
          };
        }

        // Test 2: Database info query
        try {
          const dbInfoResult = await db.query(`
            SELECT
              DATABASE() as database_name,
              VERSION() as mysql_version,
              USER() as current_user,
              CONNECTION_ID() as connection_id
          `);
          results.tests.databaseInfo = {
            success: true,
            data: dbInfoResult.rows[0]
          };
        } catch (error) {
          results.tests.databaseInfo = {
            success: false,
            error: error instanceof Error ? error.message : 'Database info query failed'
          };
        }

        // Test 3: Schema validation
        try {
          const schemaValidation = await checkSchema();
          results.tests.schema = {
            success: schemaValidation.isValid,
            validation: schemaValidation
          };
        } catch (error) {
          results.tests.schema = {
            success: false,
            error: error instanceof Error ? error.message : 'Schema validation failed'
          };
        }

        // Test 4: Table operations (if tables exist)
        try {
          const tableExistsResult = await db.query(`
            SELECT COUNT(*) as table_count
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
          `);

          const tableCount = tableExistsResult.rows[0]?.table_count || 0;

          if (tableCount > 0) {
            // Try to query a table (users table if it exists)
            try {
              const userTableResult = await db.query(`
                SELECT COUNT(*) as user_count
                FROM users
                LIMIT 1
              `);
              results.tests.tableOperations = {
                success: true,
                tableCount,
                sampleQuery: `Users table has ${userTableResult.rows[0]?.user_count || 0} records`
              };
            } catch (error) {
              // Try settings table instead
              try {
                const settingsTableResult = await db.query(`
                  SELECT COUNT(*) as settings_count
                  FROM settings
                  LIMIT 1
                `);
                results.tests.tableOperations = {
                  success: true,
                  tableCount,
                  sampleQuery: `Settings table has ${settingsTableResult.rows[0]?.settings_count || 0} records`
                };
              } catch (settingsError) {
                results.tests.tableOperations = {
                  success: false,
                  tableCount,
                  error: 'Unable to query any existing tables'
                };
              }
            }
          } else {
            results.tests.tableOperations = {
              success: true,
              tableCount: 0,
              message: 'No tables exist in database'
            };
          }
        } catch (error) {
          results.tests.tableOperations = {
            success: false,
            error: error instanceof Error ? error.message : 'Table operations test failed'
          };
        }

        break;

      case 'schema-info':
        // Get detailed schema information
        try {
          const detailedSchema = await getSchemaInfo();
          results.tests.schemaInfo = {
            success: true,
            data: detailedSchema
          };
        } catch (error) {
          results.tests.schemaInfo = {
            success: false,
            error: error instanceof Error ? error.message : 'Schema info retrieval failed'
          };
        }
        break;

      default:
        return NextResponse.json({
          success: false,
          error: {
            message: `Unknown operation: ${operation}`,
            type: 'ValidationError',
            supportedOperations: ['test', 'schema-info']
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
    console.error('Database test POST error:', testError.message);

    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: {
        message: testError.message,
        type: 'DatabaseTestError'
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