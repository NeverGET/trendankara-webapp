import mysql from 'mysql2/promise';
import { promisify } from 'util';
import {
  DatabaseClient,
  DatabaseConfig,
  QueryResult,
  InsertResult,
  UpdateResult,
  TransactionCallback,
  ConnectionPool,
  DatabaseError
} from '@/types/database';
import { logSuccess, logError, logInfo, logWarning } from '@/lib/utils/logger';

/**
 * MySQL Database Client with Connection Pooling
 * Implements singleton pattern with automatic Docker/localhost detection
 * Features: connection pooling, prepared statements, exponential backoff retry
 */
class MySQLClient implements DatabaseClient {
  private static instance: MySQLClient | null = null;
  private pool: ConnectionPool | null = null;
  private config: DatabaseConfig | null = null;
  private isInitialized = false;
  private retryCount = 0;
  private readonly maxRetries = 5;
  private readonly baseRetryDelay = 1000; // 1 second

  /**
   * Get singleton instance
   */
  public static getInstance(): MySQLClient {
    if (!MySQLClient.instance) {
      MySQLClient.instance = new MySQLClient();
    }
    return MySQLClient.instance;
  }

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Initialize the database connection pool
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.config = await this.createConfig();
      this.pool = this.createPool(this.config);

      // Test the connection
      await this.testConnection();

      this.isInitialized = true;
      this.retryCount = 0;

      const environment = await this.isDockerEnvironment() ? 'Docker' : 'Local';
      logSuccess(`Database connection pool initialized (${environment})`, {
        prefix: 'MySQL'
      });

    } catch (error) {
      const dbError = error as DatabaseError;
      logError(`Failed to initialize database: ${dbError.message}`, {
        prefix: 'MySQL'
      });

      // Implement exponential backoff retry
      if (this.retryCount < this.maxRetries) {
        await this.retryWithBackoff();
      } else {
        throw new Error(`Database initialization failed after ${this.maxRetries} attempts: ${dbError.message}`);
      }
    }
  }

  /**
   * Create database configuration based on environment
   */
  private async createConfig(): Promise<DatabaseConfig> {
    const isDocker = await this.isDockerEnvironment();

    // Parse DATABASE_URL or use individual env vars
    const databaseUrl = process.env.DATABASE_URL;
    let host = 'localhost';
    let port = 3306;
    let user = 'root';
    let password = '';
    let database = 'radio_db';

    if (databaseUrl) {
      const url = new URL(databaseUrl);
      host = url.hostname;
      port = url.port ? parseInt(url.port) : 3306;
      user = url.username;
      password = url.password;
      database = url.pathname.slice(1); // Remove leading /
    } else {
      // Fallback to individual environment variables
      host = process.env.DATABASE_HOST || (isDocker ? 'radio_mysql_alt' : 'localhost');
      port = parseInt(process.env.DATABASE_PORT || '3306');
      user = process.env.DATABASE_USER || 'root';
      password = process.env.DATABASE_PASSWORD || '';
      database = process.env.DATABASE_NAME || 'radio_db';
    }

    return {
      host,
      port,
      user,
      password,
      database,
      connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
      waitForConnections: true,
      queueLimit: 0,
      acquireTimeout: 60000, // 60 seconds
      timeout: parseInt(process.env.DATABASE_TIMEOUT || '5000'), // 5 seconds query timeout
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    };
  }

  /**
   * Create MySQL connection pool
   */
  private createPool(config: DatabaseConfig): ConnectionPool {
    return mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: config.waitForConnections,
      connectionLimit: Math.max(5, Math.min(20, config.connectionLimit)), // Enforce 5-20 range
      queueLimit: config.queueLimit,
      // Standard mysql2 options
      namedPlaceholders: true,
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: false,
    }) as ConnectionPool;
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    if (!this.pool) {
      throw new Error('Connection pool not initialized');
    }

    const connection = await this.pool.getConnection();
    try {
      await connection.execute('SELECT 1 as test');
      logInfo('Database connection test successful', { prefix: 'MySQL' });
    } finally {
      connection.release();
    }
  }

  /**
   * Retry connection with exponential backoff
   */
  private async retryWithBackoff(): Promise<void> {
    this.retryCount++;
    const delay = this.baseRetryDelay * Math.pow(2, this.retryCount - 1);

    logWarning(`Retrying database connection in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`, {
      prefix: 'MySQL'
    });

    await new Promise(resolve => setTimeout(resolve, delay));
    await this.initialize();
  }

  /**
   * Check if running in Docker environment
   */
  public async isDockerEnvironment(): Promise<boolean> {
    // Quick check: Skip DNS lookup and use environment indicators only
    return (
      process.env.DOCKER_ENV === 'true' ||
      process.env.NODE_ENV === 'production' ||
      process.env.DATABASE_URL?.includes('radiodb') ||
      process.env.DATABASE_URL?.includes('radio_mysql_alt') ||
      process.env.DATABASE_HOST === 'radiodb' ||
      process.env.DATABASE_HOST === 'radio_mysql_alt' ||
      false
    );
  }

  /**
   * Ensure pool is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.pool) {
      await this.initialize();
    }
  }

  /**
   * Execute a SELECT query with type safety
   */
  public async query<T extends mysql.RowDataPacket = mysql.RowDataPacket>(
    sql: string,
    params: any[] = []
  ): Promise<QueryResult<T>> {
    await this.ensureInitialized();

    if (!this.pool) {
      throw new Error('Database pool not available');
    }

    try {
      const [rows, fields] = await this.pool.execute<T[]>(sql, params);

      return {
        rows,
        fields,
        affectedRows: 0,
        insertId: 0,
        changedRows: 0,
        warningCount: 0,
      };
    } catch (error) {
      const dbError = error as DatabaseError;
      logError(`Query failed: ${dbError.message}`, { prefix: 'MySQL' });
      throw dbError;
    }
  }

  /**
   * Execute an INSERT query
   */
  public async insert(sql: string, params: any[] = []): Promise<InsertResult> {
    await this.ensureInitialized();

    if (!this.pool) {
      throw new Error('Database pool not available');
    }

    try {
      const [result] = await this.pool.execute<mysql.ResultSetHeader>(sql, params);

      return {
        insertId: result.insertId,
        affectedRows: result.affectedRows,
        ...result,
      } as InsertResult;
    } catch (error) {
      const dbError = error as DatabaseError;
      logError(`Insert failed: ${dbError.message}`, { prefix: 'MySQL' });
      throw dbError;
    }
  }

  /**
   * Execute an UPDATE query
   */
  public async update(sql: string, params: any[] = []): Promise<UpdateResult> {
    await this.ensureInitialized();

    if (!this.pool) {
      throw new Error('Database pool not available');
    }

    try {
      const [result] = await this.pool.execute<mysql.ResultSetHeader>(sql, params);

      return {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows || 0,
        ...result,
      } as UpdateResult;
    } catch (error) {
      const dbError = error as DatabaseError;
      logError(`Update failed: ${dbError.message}`, { prefix: 'MySQL' });
      throw dbError;
    }
  }

  /**
   * Execute a DELETE query
   */
  public async delete(sql: string, params: any[] = []): Promise<UpdateResult> {
    await this.ensureInitialized();

    if (!this.pool) {
      throw new Error('Database pool not available');
    }

    try {
      const [result] = await this.pool.execute<mysql.ResultSetHeader>(sql, params);

      return {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows || 0,
        ...result,
      } as UpdateResult;
    } catch (error) {
      const dbError = error as DatabaseError;
      logError(`Delete failed: ${dbError.message}`, { prefix: 'MySQL' });
      throw dbError;
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  public async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
    await this.ensureInitialized();

    if (!this.pool) {
      throw new Error('Database pool not available');
    }

    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const result = await callback(connection);

      await connection.commit();

      logInfo('Transaction completed successfully', { prefix: 'MySQL' });
      return result;

    } catch (error) {
      await connection.rollback();

      const dbError = error as DatabaseError;
      logError(`Transaction failed, rolled back: ${dbError.message}`, { prefix: 'MySQL' });
      throw dbError;

    } finally {
      connection.release();
    }
  }

  /**
   * Get a connection from the pool
   */
  public async getConnection(): Promise<mysql.PoolConnection> {
    await this.ensureInitialized();

    if (!this.pool) {
      throw new Error('Database pool not available');
    }

    return this.pool.getConnection();
  }

  /**
   * Close all connections in the pool
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isInitialized = false;
      logInfo('Database connection pool closed', { prefix: 'MySQL' });
    }
  }

  /**
   * Get pool status for health checks
   */
  public getPoolStatus(): { total: number; active: number; idle: number } | null {
    if (!this.pool || !this.isInitialized) {
      return null;
    }

    // Note: mysql2 doesn't expose pool stats directly,
    // but we can provide basic info based on configuration
    return {
      total: this.config?.connectionLimit || 0,
      active: 0, // Not available in mysql2
      idle: 0,   // Not available in mysql2
    };
  }
}

// Export singleton instance
export const db = MySQLClient.getInstance();

// Export class for testing
export default MySQLClient;

/**
 * Initialize database connection on module load
 * This ensures the connection is ready when the application starts
 */
if (process.env.NODE_ENV !== 'test') {
  // Initialize database connection when module is imported
  // Don't await here to avoid blocking module loading
  db.initialize().catch((error) => {
    logError(`Failed to initialize database on startup: ${error.message}`, {
      prefix: 'MySQL'
    });
  });
}