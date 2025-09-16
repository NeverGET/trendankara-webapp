import { RowDataPacket } from 'mysql2/promise';
import {
  DatabaseRow,
  PaginationParams,
  PaginatedResult,
  QueryResult,
  InsertResult,
  UpdateResult,
  BaseEntity,
  SoftDeleteEntity
} from '@/types/database';
import { db } from '@/lib/db/client';

/**
 * Database Query Utility Functions
 * Provides reusable query helpers with pagination support
 * Leverages existing database client and type system
 */

/**
 * Find a single record by ID with type safety
 */
export async function findById<T extends BaseEntity>(
  table: string,
  id: number,
  columns: string[] = ['*']
): Promise<T | null> {
  const columnList = columns.join(', ');
  const sql = `SELECT ${columnList} FROM ${table} WHERE id = ? AND deleted_at IS NULL LIMIT 1`;

  const result = await db.query<T & RowDataPacket>(sql, [id]);

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Find multiple records with optional filtering and pagination
 */
export async function findAll<T extends BaseEntity>(
  table: string,
  options: {
    columns?: string[];
    where?: { column: string; operator: string; value: any }[];
    orderBy?: { column: string; direction: 'ASC' | 'DESC' }[];
    pagination?: PaginationParams;
    includeSoftDeleted?: boolean;
  } = {}
): Promise<PaginatedResult<T> | T[]> {
  const {
    columns = ['*'],
    where = [],
    orderBy = [{ column: 'created_at', direction: 'DESC' }],
    pagination,
    includeSoftDeleted = false
  } = options;

  // Build SELECT clause
  const columnList = columns.join(', ');
  let sql = `SELECT ${columnList} FROM ${table}`;
  const params: any[] = [];

  // Build WHERE clause
  const whereConditions: string[] = [];

  // Add soft delete filter unless explicitly disabled
  if (!includeSoftDeleted) {
    whereConditions.push('deleted_at IS NULL');
  }

  // Add custom WHERE conditions
  where.forEach(condition => {
    whereConditions.push(`${condition.column} ${condition.operator} ?`);
    params.push(condition.value);
  });

  if (whereConditions.length > 0) {
    sql += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  // Build ORDER BY clause
  if (orderBy.length > 0) {
    const orderClauses = orderBy.map(order => `${order.column} ${order.direction}`);
    sql += ` ORDER BY ${orderClauses.join(', ')}`;
  }

  // Handle pagination
  if (pagination) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    // Count total records for pagination metadata
    let countSql = `SELECT COUNT(*) as total FROM ${table}`;
    if (whereConditions.length > 0) {
      countSql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    const countResult = await db.query<{ total: number } & RowDataPacket>(countSql, params);
    const total = countResult.rows[0]?.total || 0;

    // Add LIMIT and OFFSET
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Execute paginated query
    const result = await db.query<T & RowDataPacket>(sql, params);

    const totalPages = Math.ceil(total / limit);

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  // Execute regular query without pagination
  const result = await db.query<T & RowDataPacket>(sql, params);
  return result.rows;
}

/**
 * Insert a new record with automatic timestamp handling
 */
export async function insert<T extends Partial<BaseEntity>>(
  table: string,
  data: Omit<T, 'id' | 'created_at' | 'updated_at'>
): Promise<InsertResult> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = new Array(values.length).fill('?').join(', ');

  // Add created_at and updated_at automatically
  columns.push('created_at', 'updated_at');
  values.push(new Date(), new Date());

  const columnList = columns.join(', ');
  const valueList = new Array(values.length).fill('?').join(', ');

  const sql = `INSERT INTO ${table} (${columnList}) VALUES (${valueList})`;

  return await db.insert(sql, values);
}

/**
 * Update a record by ID with automatic updated_at timestamp
 */
export async function updateById<T extends BaseEntity>(
  table: string,
  id: number,
  data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>
): Promise<UpdateResult> {
  const columns = Object.keys(data);
  const values = Object.values(data);

  // Add updated_at automatically
  columns.push('updated_at');
  values.push(new Date());

  const setClause = columns.map(column => `${column} = ?`).join(', ');
  values.push(id); // Add ID for WHERE clause

  const sql = `UPDATE ${table} SET ${setClause} WHERE id = ? AND deleted_at IS NULL`;

  return await db.update(sql, values);
}

/**
 * Soft delete a record by setting deleted_at timestamp
 */
export async function softDeleteById(
  table: string,
  id: number
): Promise<UpdateResult> {
  const sql = `UPDATE ${table} SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`;
  const now = new Date();

  return await db.update(sql, [now, now, id]);
}

/**
 * Hard delete a record permanently
 */
export async function hardDeleteById(
  table: string,
  id: number
): Promise<UpdateResult> {
  const sql = `DELETE FROM ${table} WHERE id = ?`;

  return await db.delete(sql, [id]);
}

/**
 * Restore a soft-deleted record
 */
export async function restoreById(
  table: string,
  id: number
): Promise<UpdateResult> {
  const sql = `UPDATE ${table} SET deleted_at = NULL, updated_at = ? WHERE id = ?`;

  return await db.update(sql, [new Date(), id]);
}

/**
 * Count records with optional filtering
 */
export async function count(
  table: string,
  where: { column: string; operator: string; value: any }[] = [],
  includeSoftDeleted: boolean = false
): Promise<number> {
  let sql = `SELECT COUNT(*) as total FROM ${table}`;
  const params: any[] = [];
  const whereConditions: string[] = [];

  // Add soft delete filter unless explicitly disabled
  if (!includeSoftDeleted) {
    whereConditions.push('deleted_at IS NULL');
  }

  // Add custom WHERE conditions
  where.forEach(condition => {
    whereConditions.push(`${condition.column} ${condition.operator} ?`);
    params.push(condition.value);
  });

  if (whereConditions.length > 0) {
    sql += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  const result = await db.query<{ total: number } & RowDataPacket>(sql, params);
  return result.rows[0]?.total || 0;
}

/**
 * Check if a record exists
 */
export async function exists(
  table: string,
  where: { column: string; operator: string; value: any }[],
  includeSoftDeleted: boolean = false
): Promise<boolean> {
  const total = await count(table, where, includeSoftDeleted);
  return total > 0;
}

/**
 * Find records by multiple IDs
 */
export async function findByIds<T extends BaseEntity>(
  table: string,
  ids: number[],
  columns: string[] = ['*']
): Promise<T[]> {
  if (ids.length === 0) {
    return [];
  }

  const columnList = columns.join(', ');
  const placeholders = ids.map(() => '?').join(', ');
  const sql = `SELECT ${columnList} FROM ${table} WHERE id IN (${placeholders}) AND deleted_at IS NULL`;

  const result = await db.query<T & RowDataPacket>(sql, ids);
  return result.rows;
}

/**
 * Find records with LIKE search
 */
export async function findBySearch<T extends BaseEntity>(
  table: string,
  searchColumn: string,
  searchTerm: string,
  options: {
    columns?: string[];
    orderBy?: { column: string; direction: 'ASC' | 'DESC' }[];
    pagination?: PaginationParams;
    exactMatch?: boolean;
  } = {}
): Promise<PaginatedResult<T> | T[]> {
  const {
    columns = ['*'],
    orderBy = [{ column: 'created_at', direction: 'DESC' }],
    pagination,
    exactMatch = false
  } = options;

  const searchValue = exactMatch ? searchTerm : `%${searchTerm}%`;
  const operator = exactMatch ? '=' : 'LIKE';

  return findAll<T>(table, {
    columns,
    where: [{ column: searchColumn, operator, value: searchValue }],
    orderBy,
    pagination
  });
}

/**
 * Batch insert multiple records
 */
export async function batchInsert<T extends Partial<BaseEntity>>(
  table: string,
  records: Omit<T, 'id' | 'created_at' | 'updated_at'>[]
): Promise<InsertResult> {
  if (records.length === 0) {
    throw new Error('No records to insert');
  }

  // Get columns from first record
  const firstRecord = records[0];
  const columns = Object.keys(firstRecord);

  // Add timestamp columns
  columns.push('created_at', 'updated_at');

  const columnList = columns.join(', ');
  const now = new Date();

  // Build values for all records
  const allValues: any[] = [];
  const valuePlaceholders: string[] = [];

  records.forEach(record => {
    const recordValues = Object.values(record);
    recordValues.push(now, now); // Add timestamps
    allValues.push(...recordValues);

    const placeholders = new Array(recordValues.length).fill('?').join(', ');
    valuePlaceholders.push(`(${placeholders})`);
  });

  const sql = `INSERT INTO ${table} (${columnList}) VALUES ${valuePlaceholders.join(', ')}`;

  return await db.insert(sql, allValues);
}

/**
 * Get pagination parameters with defaults
 */
export function getPaginationParams(
  page?: string | number,
  limit?: string | number
): PaginationParams {
  const pageNum = typeof page === 'string' ? parseInt(page) : (page || 1);
  const limitNum = typeof limit === 'string' ? parseInt(limit) : (limit || 10);

  return {
    page: Math.max(1, pageNum),
    limit: Math.min(100, Math.max(1, limitNum)), // Enforce max 100 items per page
    offset: (Math.max(1, pageNum) - 1) * Math.min(100, Math.max(1, limitNum))
  };
}

/**
 * Execute raw SQL with parameters (for complex queries)
 */
export async function executeRaw<T extends RowDataPacket = RowDataPacket>(
  sql: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  return await db.query<T>(sql, params);
}

/**
 * Transaction helper for multiple operations
 */
export async function executeTransaction<T>(
  operations: (client: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(async (connection) => {
    // Create a temporary client that uses the transaction connection
    const transactionClient = {
      query: async <T extends RowDataPacket = RowDataPacket>(sql: string, params: any[] = []) => {
        const [rows, fields] = await connection.execute<T[]>(sql, params);
        return { rows, fields, affectedRows: 0, insertId: 0, changedRows: 0, warningCount: 0 };
      },
      insert: async (sql: string, params: any[] = []) => {
        const [result] = await connection.execute<any>(sql, params);
        return result;
      },
      update: async (sql: string, params: any[] = []) => {
        const [result] = await connection.execute<any>(sql, params);
        return result;
      },
      delete: async (sql: string, params: any[] = []) => {
        const [result] = await connection.execute<any>(sql, params);
        return result;
      }
    };

    return await operations(transactionClient as any);
  });
}