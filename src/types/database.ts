import { FieldPacket, OkPacket, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

/**
 * Database connection configuration
 * Supports both Docker and localhost environments
 */
export interface DatabaseConfig {
  host: string;                    // Docker: 'radiodb' | Local: 'localhost'
  port: number;                   // Default: 3306
  user: string;                   // Database user from env
  password: string;               // Database password from env
  database: string;               // Database name: 'radio_db'
  connectionLimit: number;        // Min: 5, Max: 20
  waitForConnections: boolean;    // true - wait for available connection
  queueLimit: number;            // 0 = unlimited queue
  acquireTimeout: number;        // Connection acquisition timeout (ms)
  timeout: number;               // Query timeout (ms)
  enableKeepAlive: boolean;      // true - keep connections alive
  keepAliveInitialDelay: number; // Delay before first keepalive packet
}

/**
 * Generic query result interface for MySQL2 promise-based API
 */
export interface QueryResult<T = any> {
  rows: T[];
  fields: FieldPacket[];
  affectedRows?: number;
  insertId?: number;
  changedRows?: number;
  warningCount?: number;
}

/**
 * Database row data packet extending MySQL2's RowDataPacket
 */
export interface DatabaseRow extends RowDataPacket {
  id?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

/**
 * Insert result for CREATE operations
 */
export interface InsertResult extends ResultSetHeader {
  insertId: number;
  affectedRows: number;
}

/**
 * Update/Delete result for UPDATE/DELETE operations
 */
export interface UpdateResult extends ResultSetHeader {
  affectedRows: number;
  changedRows: number;
}

/**
 * Connection pool interface for MySQL2
 */
export interface ConnectionPool {
  query<T extends RowDataPacket[]>(sql: string): Promise<[T, FieldPacket[]]>;
  query<T extends RowDataPacket[]>(sql: string, values: any[]): Promise<[T, FieldPacket[]]>;
  query<T extends ResultSetHeader>(sql: string): Promise<[T, FieldPacket[]]>;
  query<T extends ResultSetHeader>(sql: string, values: any[]): Promise<[T, FieldPacket[]]>;
  execute<T extends RowDataPacket[]>(sql: string): Promise<[T, FieldPacket[]]>;
  execute<T extends RowDataPacket[]>(sql: string, values: any[]): Promise<[T, FieldPacket[]]>;
  execute<T extends ResultSetHeader>(sql: string): Promise<[T, FieldPacket[]]>;
  execute<T extends ResultSetHeader>(sql: string, values: any[]): Promise<[T, FieldPacket[]]>;
  getConnection(): Promise<import('mysql2/promise').PoolConnection>;
  end(): Promise<void>;
}

/**
 * Transaction callback function type
 */
export type TransactionCallback<T> = (connection: import('mysql2/promise').PoolConnection) => Promise<T>;

/**
 * Pagination parameters for query operations
 */
export interface PaginationParams {
  page: number;      // Page number (1-based)
  limit: number;     // Items per page
  offset?: number;   // Calculated offset (optional)
}

/**
 * Paginated query result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Database client interface for connection management
 */
export interface DatabaseClient {
  /**
   * Execute a SELECT query with type safety
   */
  query<T extends RowDataPacket = RowDataPacket>(
    sql: string,
    params?: any[]
  ): Promise<QueryResult<T>>;

  /**
   * Execute an INSERT query
   */
  insert(sql: string, params?: any[]): Promise<InsertResult>;

  /**
   * Execute an UPDATE query
   */
  update(sql: string, params?: any[]): Promise<UpdateResult>;

  /**
   * Execute a DELETE query
   */
  delete(sql: string, params?: any[]): Promise<UpdateResult>;

  /**
   * Execute a transaction with automatic rollback on error
   */
  transaction<T>(callback: TransactionCallback<T>): Promise<T>;

  /**
   * Get a connection from the pool
   */
  getConnection(): Promise<import('mysql2/promise').PoolConnection>;

  /**
   * Close all connections in the pool
   */
  close(): Promise<void>;

  /**
   * Check if running in Docker environment
   */
  isDockerEnvironment(): Promise<boolean>;
}

/**
 * Schema validation result
 */
export interface SchemaValidationResult {
  isValid: boolean;
  missingTables: string[];
  missingIndexes: string[];
  errors: string[];
}

/**
 * Database initialization options
 */
export interface DatabaseInitOptions {
  createTables: boolean;      // Whether to create missing tables
  createIndexes: boolean;     // Whether to create missing indexes
  seedData: boolean;          // Whether to insert seed data
  force: boolean;             // Force recreation of existing tables
}

/**
 * Common database entity fields
 */
export interface BaseEntity extends DatabaseRow {
  id: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Soft delete entity fields
 */
export interface SoftDeleteEntity extends BaseEntity {
  deleted_at: Date | null;
}

/**
 * User entity from users table
 */
export interface UserEntity extends BaseEntity {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'editor';
  is_active: boolean;
}

/**
 * Media entity from media table
 */
export interface MediaEntity extends SoftDeleteEntity {
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  thumbnails: Record<string, string> | null;
  width: number | null;
  height: number | null;
  uploaded_by: number | null;
}

/**
 * Settings entity from settings table
 */
export interface SettingsEntity extends BaseEntity {
  setting_key: string;
  setting_value: string | null;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  updated_by: number | null;
}

/**
 * Environment configuration for database connection
 */
export interface DatabaseEnvironment {
  DATABASE_HOST?: string;
  DATABASE_PORT?: string;
  DATABASE_USER?: string;
  DATABASE_PASSWORD?: string;
  DATABASE_NAME?: string;
  DATABASE_CONNECTION_LIMIT?: string;
  DATABASE_TIMEOUT?: string;
  NODE_ENV?: string;
}

/**
 * Database error types
 */
export interface DatabaseError extends Error {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
  sql?: string;
}

/**
 * Query builder interface for common operations
 */
export interface QueryBuilder {
  select(columns?: string[]): QueryBuilder;
  from(table: string): QueryBuilder;
  where(column: string, operator: string, value: any): QueryBuilder;
  whereIn(column: string, values: any[]): QueryBuilder;
  whereNull(column: string): QueryBuilder;
  whereNotNull(column: string): QueryBuilder;
  orderBy(column: string, direction?: 'ASC' | 'DESC'): QueryBuilder;
  limit(count: number): QueryBuilder;
  offset(count: number): QueryBuilder;
  join(table: string, on: string): QueryBuilder;
  leftJoin(table: string, on: string): QueryBuilder;
  build(): { sql: string; params: any[] };
}

/**
 * Health check result for database connection
 */
export interface DatabaseHealthCheck {
  isConnected: boolean;
  connectionCount?: number;
  uptime?: number;
  lastQuery?: Date;
  error?: string;
}