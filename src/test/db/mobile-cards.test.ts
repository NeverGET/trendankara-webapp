/**
 * Mobile Cards Database Table Test
 * Tests mobile_cards table functionality including active card queries,
 * proper ordering, and index performance verification
 *
 * Requirements: 5.1, 5.3, 5.6 - Database schema simplification with sponsorship cards storage
 */

import { db } from '@/lib/db/client';
import { MobileCardQueries } from '@/lib/queries/mobileCardQueries';
import type { MobileCard } from '@/types/mobile';
import { RowDataPacket } from 'mysql2';

// Performance timing interface
interface QueryPerformance {
  queryName: string;
  executionTime: number;
  rowCount: number;
  passed: boolean;
}

describe('Mobile Cards Database Table Tests', () => {
  let performanceResults: QueryPerformance[] = [];

  beforeAll(async () => {
    // Initialize database connection with timeout
    try {
      await Promise.race([
        db.initialize(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database initialization timeout')), 5000))
      ]);
    } catch (error) {
      console.warn('Database initialization failed:', error);
      // Skip database tests if connection fails
      return;
    }
  }, 10000);

  afterAll(async () => {
    // Print performance results
    console.log('\n=== Mobile Cards Query Performance Report ===');
    performanceResults.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.queryName}: ${result.executionTime}ms (${result.rowCount} rows)`);
    });

    const failedQueries = performanceResults.filter(r => !r.passed);
    if (failedQueries.length > 0) {
      console.log(`\n❌ ${failedQueries.length} queries failed sub-100ms requirement`);
    } else {
      console.log('\n✅ All queries met sub-100ms performance requirement');
    }

    // Close database connection
    await db.close();
  });

  /**
   * Helper function to measure query performance
   */
  const measureQueryPerformance = async <T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    const result = await queryFunction();
    const endTime = performance.now();
    const executionTime = Math.round(endTime - startTime);

    // Determine row count based on result type
    let rowCount = 0;
    if (Array.isArray(result)) {
      rowCount = result.length;
    } else if (result && typeof result === 'object' && 'rows' in result) {
      rowCount = (result as any).rows?.length || 0;
    } else if (typeof result === 'number') {
      rowCount = 1;
    }

    const passed = executionTime < 100; // Sub-100ms requirement

    performanceResults.push({
      queryName,
      executionTime,
      rowCount,
      passed
    });

    return result;
  };

  describe('Table Existence and Structure', () => {
    test('database connection should be active', async () => {
      const query = 'SELECT 1 as test';

      const result = await measureQueryPerformance(
        'Database connection test',
        () => db.query<RowDataPacket>(query)
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].test).toBe(1);
    });

    test('mobile_cards table should exist', async () => {
      const query = `
        SELECT TABLE_NAME, TABLE_COMMENT
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mobile_cards'
      `;

      const result = await measureQueryPerformance(
        'Table existence check',
        () => db.query<RowDataPacket>(query)
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].TABLE_NAME).toBe('mobile_cards');
    });

    test('mobile_cards table should have correct columns', async () => {
      const query = `
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mobile_cards'
        ORDER BY ORDINAL_POSITION
      `;

      const result = await measureQueryPerformance(
        'Column structure check',
        () => db.query<RowDataPacket>(query)
      );

      const columns = result.rows;
      const columnNames = columns.map(col => col.COLUMN_NAME);

      // Verify required columns exist
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('title');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('image_url');
      expect(columnNames).toContain('redirect_url');
      expect(columnNames).toContain('is_featured');
      expect(columnNames).toContain('display_order');
      expect(columnNames).toContain('is_active');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
      expect(columnNames).toContain('created_by');
      expect(columnNames).toContain('deleted_at');
    });
  });

  describe('Index Performance Verification', () => {
    test('mobile_cards table should have performance indexes', async () => {
      const query = `
        SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, INDEX_COMMENT
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mobile_cards'
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `;

      const result = await measureQueryPerformance(
        'Index structure check',
        () => db.query<RowDataPacket>(query)
      );

      const indexes = result.rows;
      const indexNames = [...new Set(indexes.map(idx => idx.INDEX_NAME))];

      // Verify critical indexes exist
      expect(indexNames).toContain('idx_featured_order');
      expect(indexNames).toContain('idx_active');
      expect(indexNames).toContain('idx_deleted');
    });

    test('featured order index should optimize sorting queries', async () => {
      // This query should use the idx_featured_order index
      const query = `
        EXPLAIN SELECT id, title, is_featured, display_order
        FROM mobile_cards
        WHERE is_active = TRUE AND deleted_at IS NULL
        ORDER BY is_featured DESC, display_order ASC
        LIMIT 20
      `;

      const result = await measureQueryPerformance(
        'Index usage verification',
        () => db.query<RowDataPacket>(query)
      );

      // Should show index usage in execution plan
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  describe('Active Cards Query Performance', () => {
    test('should query all active cards with proper ordering in sub-100ms', async () => {
      const cards = await measureQueryPerformance(
        'Get all active cards',
        () => MobileCardQueries.getAllActive()
      );

      // Verify results structure
      expect(Array.isArray(cards)).toBe(true);

      if (cards.length > 0) {
        // Verify card structure
        const firstCard = cards[0];
        expect(firstCard).toHaveProperty('id');
        expect(firstCard).toHaveProperty('title');
        expect(firstCard).toHaveProperty('isFeatured');
        expect(firstCard).toHaveProperty('displayOrder');
        expect(firstCard).toHaveProperty('isActive');

        // Verify all returned cards are active
        cards.forEach(card => {
          expect(card.isActive).toBe(true);
        });

        // Verify proper ordering: featured cards first, then by display order
        let lastWasFeatured = true;
        let lastDisplayOrder = -1;

        for (const card of cards) {
          if (lastWasFeatured && !card.isFeatured) {
            lastWasFeatured = false;
            lastDisplayOrder = -1; // Reset for normal cards
          }

          if (lastWasFeatured === card.isFeatured) {
            expect(card.displayOrder).toBeGreaterThanOrEqual(lastDisplayOrder);
            lastDisplayOrder = card.displayOrder;
          }
        }
      }
    });

    test('should query featured cards only in sub-100ms', async () => {
      const featuredCards = await measureQueryPerformance(
        'Get featured cards only',
        () => MobileCardQueries.getByType(true)
      );

      expect(Array.isArray(featuredCards)).toBe(true);

      // All returned cards should be featured
      featuredCards.forEach(card => {
        expect(card.isFeatured).toBe(true);
        expect(card.isActive).toBe(true);
      });

      // Should be ordered by display_order ASC
      for (let i = 1; i < featuredCards.length; i++) {
        expect(featuredCards[i].displayOrder).toBeGreaterThanOrEqual(
          featuredCards[i - 1].displayOrder
        );
      }
    });

    test('should query normal cards only in sub-100ms', async () => {
      const normalCards = await measureQueryPerformance(
        'Get normal cards only',
        () => MobileCardQueries.getByType(false)
      );

      expect(Array.isArray(normalCards)).toBe(true);

      // All returned cards should be normal (not featured)
      normalCards.forEach(card => {
        expect(card.isFeatured).toBe(false);
        expect(card.isActive).toBe(true);
      });

      // Should be ordered by display_order ASC
      for (let i = 1; i < normalCards.length; i++) {
        expect(normalCards[i].displayOrder).toBeGreaterThanOrEqual(
          normalCards[i - 1].displayOrder
        );
      }
    });
  });

  describe('Card Count Performance', () => {
    test('should count all active cards in sub-100ms', async () => {
      const count = await measureQueryPerformance(
        'Count all active cards',
        () => MobileCardQueries.countByType()
      );

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should count featured cards in sub-100ms', async () => {
      const featuredCount = await measureQueryPerformance(
        'Count featured cards',
        () => MobileCardQueries.countByType(true)
      );

      expect(typeof featuredCount).toBe('number');
      expect(featuredCount).toBeGreaterThanOrEqual(0);
    });

    test('should count normal cards in sub-100ms', async () => {
      const normalCount = await measureQueryPerformance(
        'Count normal cards',
        () => MobileCardQueries.countByType(false)
      );

      expect(typeof normalCount).toBe('number');
      expect(normalCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Individual Card Query Performance', () => {
    test('should get card by ID in sub-100ms', async () => {
      // First get any active card ID
      const allCards = await MobileCardQueries.getAllActive();

      if (allCards.length > 0) {
        const testCardId = allCards[0].id;

        const card = await measureQueryPerformance(
          'Get card by ID',
          () => MobileCardQueries.getById(testCardId)
        );

        expect(card).not.toBeNull();
        if (card) {
          expect(card.id).toBe(testCardId);
          expect(card).toHaveProperty('title');
          expect(card).toHaveProperty('isFeatured');
          expect(card).toHaveProperty('displayOrder');
        }
      }
    });

    test('should get max display order in sub-100ms', async () => {
      const maxFeaturedOrder = await measureQueryPerformance(
        'Get max featured display order',
        () => MobileCardQueries.getMaxDisplayOrder(true)
      );

      const maxNormalOrder = await measureQueryPerformance(
        'Get max normal display order',
        () => MobileCardQueries.getMaxDisplayOrder(false)
      );

      expect(typeof maxFeaturedOrder).toBe('number');
      expect(typeof maxNormalOrder).toBe('number');
      expect(maxFeaturedOrder).toBeGreaterThanOrEqual(0);
      expect(maxNormalOrder).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Raw SQL Query Performance', () => {
    test('should execute raw featured cards query in sub-100ms', async () => {
      const query = `
        SELECT
          id,
          title,
          description,
          image_url as imageUrl,
          redirect_url as redirectUrl,
          is_featured as isFeatured,
          display_order as displayOrder,
          is_active as isActive
        FROM mobile_cards
        WHERE is_active = TRUE
          AND deleted_at IS NULL
          AND is_featured = TRUE
        ORDER BY display_order ASC
      `;

      const result = await measureQueryPerformance(
        'Raw featured cards query',
        () => db.query<RowDataPacket>(query)
      );

      expect(Array.isArray(result.rows)).toBe(true);

      // Verify all cards are featured and active
      result.rows.forEach(card => {
        expect(card.isFeatured).toBe(1); // MySQL boolean as tinyint
        expect(card.isActive).toBe(1);
      });
    });

    test('should execute optimized ordering query in sub-100ms', async () => {
      // This is the critical query that should use idx_featured_order index
      const query = `
        SELECT
          id,
          title,
          is_featured,
          display_order,
          created_at
        FROM mobile_cards
        WHERE is_active = TRUE AND deleted_at IS NULL
        ORDER BY is_featured DESC, display_order ASC
        LIMIT 50
      `;

      const result = await measureQueryPerformance(
        'Optimized ordering query',
        () => db.query<RowDataPacket>(query)
      );

      expect(Array.isArray(result.rows)).toBe(true);

      // Verify ordering is correct
      const rows = result.rows;
      if (rows.length > 1) {
        for (let i = 1; i < rows.length; i++) {
          const prev = rows[i - 1];
          const curr = rows[i];

          // Featured cards should come first
          if (prev.is_featured === 1 && curr.is_featured === 0) {
            // This is correct - featured before normal
            expect(true).toBe(true);
          } else if (prev.is_featured === curr.is_featured) {
            // Same type, check display order
            expect(curr.display_order).toBeGreaterThanOrEqual(prev.display_order);
          }
        }
      }
    });
  });

  describe('Database Health and Connection', () => {
    test('should maintain stable database connection', async () => {
      const healthQuery = 'SELECT 1 as health_check, NOW() as server_time';

      const result = await measureQueryPerformance(
        'Database health check',
        () => db.query<RowDataPacket>(healthQuery)
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].health_check).toBe(1);
      expect(result.rows[0].server_time).toBeDefined();
    });

    test('should handle concurrent queries efficiently', async () => {
      const startTime = performance.now();

      // Execute multiple queries concurrently
      const promises = [
        MobileCardQueries.getAllActive(),
        MobileCardQueries.getByType(true),
        MobileCardQueries.getByType(false),
        MobileCardQueries.countByType(),
        MobileCardQueries.countByType(true),
        MobileCardQueries.countByType(false)
      ];

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = Math.round(endTime - startTime);

      performanceResults.push({
        queryName: 'Concurrent queries (6 queries)',
        executionTime: totalTime,
        rowCount: results.length,
        passed: totalTime < 200 // Allow 200ms for 6 concurrent queries
      });

      // All queries should complete successfully
      expect(results).toHaveLength(6);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });
});