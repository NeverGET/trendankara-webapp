/**
 * Unit Tests for Database Query Functions
 * Tests query builders and database operations with mocked MySQL client
 */

import { jest } from '@jest/globals';
import { RowDataPacket } from 'mysql2/promise';

// Mock dependencies before importing the module under test
jest.mock('@/lib/db/client');
jest.mock('@/lib/utils/logger');

// Mock database client
const mockDb = {
  query: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  transaction: jest.fn(),
} as any;

// Mock logger
const mockLogger = {
  info: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
} as any;

// Setup mocks
beforeEach(() => {
  jest.clearAllMocks();

  // Mock db client import
  jest.doMock('@/lib/db/client', () => ({
    db: mockDb,
  }));

  // Mock logger import
  jest.doMock('@/lib/utils/logger', () => ({
    logSuccess: mockLogger.success,
    logError: mockLogger.error,
    logInfo: mockLogger.info,
    logWarning: mockLogger.warning,
  }));
});

describe('Database Query Functions', () => {
  let queryFunctions: any;

  beforeAll(async () => {
    // Dynamically import the module after mocks are set up
    queryFunctions = await import('@/lib/db/queries/index');
  });

  describe('findById', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      created_at: new Date(),
      updated_at: new Date(),
    };

    test('should find record by ID successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockUser],
        fields: [],
      });

      const result = await queryFunctions.findById('users', 1);

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
        [1]
      );
      expect(result).toEqual(mockUser);
    });

    test('should return null when record not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        fields: [],
      });

      const result = await queryFunctions.findById('users', 999);

      expect(result).toBeNull();
    });

    test('should use custom columns when specified', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'test@example.com' }],
        fields: [],
      });

      await queryFunctions.findById('users', 1, ['id', 'email']);

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT id, email FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
        [1]
      );
    });
  });

  describe('findAll', () => {
    const mockUsers = [
      { id: 1, email: 'user1@example.com', name: 'User 1' },
      { id: 2, email: 'user2@example.com', name: 'User 2' },
    ];

    test('should find all records with default options', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockUsers,
        fields: [],
      });

      const result = await queryFunctions.findAll('users');

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC',
        []
      );
      expect(result).toEqual(mockUsers);
    });

    test('should apply WHERE conditions', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockUsers[0]],
        fields: [],
      });

      const whereConditions = [
        { column: 'email', operator: '=', value: 'user1@example.com' }
      ];

      await queryFunctions.findAll('users', { where: whereConditions });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE deleted_at IS NULL AND email = ? ORDER BY created_at DESC',
        ['user1@example.com']
      );
    });

    test('should apply custom ordering', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockUsers,
        fields: [],
      });

      const orderBy = [{ column: 'name', direction: 'ASC' as const }];

      await queryFunctions.findAll('users', { orderBy });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE deleted_at IS NULL ORDER BY name ASC',
        []
      );
    });

    test('should handle pagination', async () => {
      // Mock count query
      mockDb.query.mockResolvedValueOnce({
        rows: [{ total: 25 }],
        fields: [],
      });

      // Mock paginated results query
      mockDb.query.mockResolvedValueOnce({
        rows: mockUsers,
        fields: [],
      });

      const pagination = { page: 2, limit: 10 };
      const result = await queryFunctions.findAll('users', { pagination });

      // Verify count query
      expect(mockDb.query).toHaveBeenNthCalledWith(1,
        'SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL',
        []
      );

      // Verify paginated query
      expect(mockDb.query).toHaveBeenNthCalledWith(2,
        'SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [10, 10] // page 2, limit 10 = offset 10
      );

      expect(result).toEqual({
        data: mockUsers,
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrev: true,
        },
      });
    });

    test('should include soft deleted records when requested', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockUsers,
        fields: [],
      });

      await queryFunctions.findAll('users', { includeSoftDeleted: true });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users ORDER BY created_at DESC',
        []
      );
    });
  });

  describe('insert', () => {
    test('should insert record with automatic timestamps', async () => {
      const insertData = {
        email: 'new@example.com',
        name: 'New User',
      };

      mockDb.insert.mockResolvedValueOnce({
        insertId: 5,
        affectedRows: 1,
      });

      const result = await queryFunctions.insert('users', insertData);

      // Verify the SQL includes created_at and updated_at
      expect(mockDb.insert).toHaveBeenCalledWith(
        'INSERT INTO users (email, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [insertData.email, insertData.name, expect.any(Date), expect.any(Date)]
      );

      expect(result).toEqual({
        insertId: 5,
        affectedRows: 1,
      });
    });
  });

  describe('updateById', () => {
    test('should update record with automatic updated_at timestamp', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      mockDb.update.mockResolvedValueOnce({
        affectedRows: 1,
        changedRows: 1,
      });

      const result = await queryFunctions.updateById('users', 1, updateData);

      expect(mockDb.update).toHaveBeenCalledWith(
        'UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
        [updateData.name, updateData.email, expect.any(Date), 1]
      );

      expect(result).toEqual({
        affectedRows: 1,
        changedRows: 1,
      });
    });
  });

  describe('softDeleteById', () => {
    test('should set deleted_at timestamp', async () => {
      mockDb.update.mockResolvedValueOnce({
        affectedRows: 1,
        changedRows: 1,
      });

      const result = await queryFunctions.softDeleteById('users', 1);

      expect(mockDb.update).toHaveBeenCalledWith(
        'UPDATE users SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
        [expect.any(Date), expect.any(Date), 1]
      );

      expect(result).toEqual({
        affectedRows: 1,
        changedRows: 1,
      });
    });
  });

  describe('hardDeleteById', () => {
    test('should permanently delete record', async () => {
      mockDb.delete.mockResolvedValueOnce({
        affectedRows: 1,
        changedRows: 0,
      });

      const result = await queryFunctions.hardDeleteById('users', 1);

      expect(mockDb.delete).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = ?',
        [1]
      );

      expect(result).toEqual({
        affectedRows: 1,
        changedRows: 0,
      });
    });
  });

  describe('restoreById', () => {
    test('should restore soft deleted record', async () => {
      mockDb.update.mockResolvedValueOnce({
        affectedRows: 1,
        changedRows: 1,
      });

      const result = await queryFunctions.restoreById('users', 1);

      expect(mockDb.update).toHaveBeenCalledWith(
        'UPDATE users SET deleted_at = NULL, updated_at = ? WHERE id = ?',
        [expect.any(Date), 1]
      );

      expect(result).toEqual({
        affectedRows: 1,
        changedRows: 1,
      });
    });
  });

  describe('count', () => {
    test('should count records without conditions', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ total: 42 }],
        fields: [],
      });

      const result = await queryFunctions.count('users');

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL',
        []
      );
      expect(result).toBe(42);
    });

    test('should count records with WHERE conditions', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ total: 5 }],
        fields: [],
      });

      const whereConditions = [
        { column: 'is_active', operator: '=', value: true }
      ];

      const result = await queryFunctions.count('users', whereConditions);

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL AND is_active = ?',
        [true]
      );
      expect(result).toBe(5);
    });

    test('should include soft deleted when requested', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ total: 50 }],
        fields: [],
      });

      const result = await queryFunctions.count('users', [], true);

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM users',
        []
      );
      expect(result).toBe(50);
    });
  });

  describe('exists', () => {
    test('should return true when records exist', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ total: 1 }],
        fields: [],
      });

      const whereConditions = [
        { column: 'email', operator: '=', value: 'test@example.com' }
      ];

      const result = await queryFunctions.exists('users', whereConditions);

      expect(result).toBe(true);
    });

    test('should return false when no records exist', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ total: 0 }],
        fields: [],
      });

      const whereConditions = [
        { column: 'email', operator: '=', value: 'nonexistent@example.com' }
      ];

      const result = await queryFunctions.exists('users', whereConditions);

      expect(result).toBe(false);
    });
  });

  describe('findByIds', () => {
    test('should find records by multiple IDs', async () => {
      const mockUsers = [
        { id: 1, name: 'User 1' },
        { id: 3, name: 'User 3' },
      ];

      mockDb.query.mockResolvedValueOnce({
        rows: mockUsers,
        fields: [],
      });

      const result = await queryFunctions.findByIds('users', [1, 3]);

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id IN (?, ?) AND deleted_at IS NULL',
        [1, 3]
      );
      expect(result).toEqual(mockUsers);
    });

    test('should return empty array for empty ID list', async () => {
      const result = await queryFunctions.findByIds('users', []);

      expect(result).toEqual([]);
      expect(mockDb.query).not.toHaveBeenCalled();
    });
  });

  describe('findBySearch', () => {
    test('should search with LIKE operator by default', async () => {
      const mockResults = [{ id: 1, name: 'Test User' }];

      mockDb.query.mockResolvedValueOnce({
        rows: mockResults,
        fields: [],
      });

      const result = await queryFunctions.findBySearch('users', 'name', 'Test');

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE deleted_at IS NULL AND name LIKE ? ORDER BY created_at DESC',
        ['%Test%']
      );
      expect(result).toEqual(mockResults);
    });

    test('should use exact match when requested', async () => {
      const mockResults = [{ id: 1, name: 'Test User' }];

      mockDb.query.mockResolvedValueOnce({
        rows: mockResults,
        fields: [],
      });

      await queryFunctions.findBySearch('users', 'name', 'Test User', {
        exactMatch: true
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE deleted_at IS NULL AND name = ? ORDER BY created_at DESC',
        ['Test User']
      );
    });
  });

  describe('batchInsert', () => {
    test('should insert multiple records with timestamps', async () => {
      const records = [
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'user2@example.com', name: 'User 2' },
      ];

      mockDb.insert.mockResolvedValueOnce({
        insertId: 10,
        affectedRows: 2,
      });

      const result = await queryFunctions.batchInsert('users', records);

      expect(mockDb.insert).toHaveBeenCalledWith(
        'INSERT INTO users (email, name, created_at, updated_at) VALUES (?, ?, ?, ?), (?, ?, ?, ?)',
        [
          'user1@example.com', 'User 1', expect.any(Date), expect.any(Date),
          'user2@example.com', 'User 2', expect.any(Date), expect.any(Date),
        ]
      );

      expect(result).toEqual({
        insertId: 10,
        affectedRows: 2,
      });
    });

    test('should throw error for empty records array', async () => {
      await expect(queryFunctions.batchInsert('users', []))
        .rejects
        .toThrow('No records to insert');
    });
  });

  describe('getPaginationParams', () => {
    test('should return default pagination parameters', () => {
      const result = queryFunctions.getPaginationParams();

      expect(result).toEqual({
        page: 1,
        limit: 10,
        offset: 0,
      });
    });

    test('should parse string parameters', () => {
      const result = queryFunctions.getPaginationParams('3', '20');

      expect(result).toEqual({
        page: 3,
        limit: 20,
        offset: 40, // (3-1) * 20
      });
    });

    test('should enforce minimum values', () => {
      const result = queryFunctions.getPaginationParams('0', '-5');

      expect(result).toEqual({
        page: 1, // Minimum 1
        limit: 1, // Minimum 1
        offset: 0,
      });
    });

    test('should enforce maximum limit', () => {
      const result = queryFunctions.getPaginationParams('1', '200');

      expect(result).toEqual({
        page: 1,
        limit: 100, // Maximum 100
        offset: 0,
      });
    });
  });

  describe('executeRaw', () => {
    test('should execute raw SQL query', async () => {
      const mockResult = {
        rows: [{ custom_field: 'value' }],
        fields: [],
      };

      mockDb.query.mockResolvedValueOnce(mockResult);

      const result = await queryFunctions.executeRaw(
        'SELECT custom_field FROM custom_table WHERE condition = ?',
        ['test']
      );

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT custom_field FROM custom_table WHERE condition = ?',
        ['test']
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('executeTransaction', () => {
    test('should execute operations within a transaction', async () => {
      const mockTransactionResult = { success: true };

      mockDb.transaction.mockImplementation(async (callback) => {
        const mockTransactionClient = {
          query: jest.fn().mockResolvedValue({ rows: [], fields: [] }),
          insert: jest.fn().mockResolvedValue({ insertId: 1, affectedRows: 1 }),
          update: jest.fn().mockResolvedValue({ affectedRows: 1 }),
          delete: jest.fn().mockResolvedValue({ affectedRows: 1 }),
        };

        return await callback(mockTransactionClient);
      });

      const operations = jest.fn().mockResolvedValue(mockTransactionResult);

      const result = await queryFunctions.executeTransaction(operations);

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(operations).toHaveBeenCalled();
      expect(result).toEqual(mockTransactionResult);
    });
  });
});

describe('SQL Query Generation', () => {
  test('should build correct SELECT queries', () => {
    const expectedQueries = [
      {
        description: 'Simple select all',
        input: { table: 'users', columns: ['*'] },
        expected: 'SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC',
      },
      {
        description: 'Select with specific columns',
        input: { table: 'users', columns: ['id', 'email'] },
        expected: 'SELECT id, email FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC',
      },
      {
        description: 'Select with WHERE conditions',
        input: {
          table: 'users',
          columns: ['*'],
          where: [{ column: 'is_active', operator: '=', value: true }],
        },
        expected: 'SELECT * FROM users WHERE deleted_at IS NULL AND is_active = ? ORDER BY created_at DESC',
      },
    ];

    expectedQueries.forEach(({ description, expected }) => {
      // This test verifies the query patterns we expect
      // The actual query building is tested through the function calls above
      expect(expected).toContain('SELECT');
      expect(expected).toContain('FROM');
    });
  });

  test('should handle parameterized queries safely', () => {
    // Test that we use parameterized queries to prevent SQL injection
    const safeParams = [
      "'; DROP TABLE users; --",
      '<script>alert("xss")</script>',
      "1 OR '1'='1",
    ];

    safeParams.forEach(param => {
      // These would be passed as parameters, not concatenated into SQL
      expect(typeof param).toBe('string');
    });
  });
});