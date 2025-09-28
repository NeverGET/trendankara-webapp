#!/usr/bin/env tsx
/**
 * Standalone Mobile Cards Database Test
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

class MobileCardsTestRunner {
  private performanceResults: QueryPerformance[] = [];

  /**
   * Helper function to measure query performance
   */
  private async measureQueryPerformance<T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ): Promise<T> {
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

    this.performanceResults.push({
      queryName,
      executionTime,
      rowCount,
      passed
    });

    return result;
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection(): Promise<boolean> {
    try {
      console.log('Testing database connection...');
      const query = 'SELECT 1 as test, NOW() as server_time';

      const result = await this.measureQueryPerformance(
        'Database connection test',
        () => db.query<RowDataPacket>(query)
      );

      if (result.rows.length === 1 && result.rows[0].test === 1) {
        console.log('✅ Database connection successful');
        return true;
      } else {
        console.log('❌ Database connection failed - invalid response');
        return false;
      }
    } catch (error) {
      console.log('❌ Database connection failed:', error);
      return false;
    }
  }

  /**
   * Test table existence and structure
   */
  async testTableStructure(): Promise<boolean> {
    try {
      console.log('\nTesting table structure...');

      // Check table exists
      const tableQuery = `
        SELECT TABLE_NAME, TABLE_COMMENT
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mobile_cards'
      `;

      const tableResult = await this.measureQueryPerformance(
        'Table existence check',
        () => db.query<RowDataPacket>(tableQuery)
      );

      if (tableResult.rows.length !== 1) {
        console.log('❌ mobile_cards table does not exist');
        return false;
      }

      console.log('✅ mobile_cards table exists');

      // Check columns
      const columnQuery = `
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mobile_cards'
        ORDER BY ORDINAL_POSITION
      `;

      const columnResult = await this.measureQueryPerformance(
        'Column structure check',
        () => db.query<RowDataPacket>(columnQuery)
      );

      const columnNames = columnResult.rows.map(col => col.COLUMN_NAME);
      const requiredColumns = [
        'id', 'title', 'description', 'image_url', 'redirect_url',
        'is_featured', 'display_order', 'is_active', 'created_at',
        'updated_at', 'created_by', 'deleted_at'
      ];

      const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
      if (missingColumns.length > 0) {
        console.log('❌ Missing columns:', missingColumns);
        return false;
      }

      console.log('✅ All required columns present');
      return true;
    } catch (error) {
      console.log('❌ Table structure test failed:', error);
      return false;
    }
  }

  /**
   * Test indexes
   */
  async testIndexes(): Promise<boolean> {
    try {
      console.log('\nTesting indexes...');

      const indexQuery = `
        SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mobile_cards'
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `;

      const indexResult = await this.measureQueryPerformance(
        'Index structure check',
        () => db.query<RowDataPacket>(indexQuery)
      );

      const indexNames = [...new Set(indexResult.rows.map(idx => idx.INDEX_NAME))];
      const requiredIndexes = ['idx_featured_order', 'idx_active', 'idx_deleted'];

      const missingIndexes = requiredIndexes.filter(idx => !indexNames.includes(idx));
      if (missingIndexes.length > 0) {
        console.log('❌ Missing indexes:', missingIndexes);
        return false;
      }

      console.log('✅ All required indexes present');
      return true;
    } catch (error) {
      console.log('❌ Index test failed:', error);
      return false;
    }
  }

  /**
   * Test active cards query performance
   */
  async testActiveCardsQuery(): Promise<boolean> {
    try {
      console.log('\nTesting active cards queries...');

      // Test getAllActive
      const allCards = await this.measureQueryPerformance(
        'Get all active cards',
        () => MobileCardQueries.getAllActive()
      );

      console.log(`✅ Retrieved ${allCards.length} active cards`);

      if (allCards.length > 0) {
        // Verify card structure
        const firstCard = allCards[0];
        const requiredProps = ['id', 'title', 'isFeatured', 'displayOrder', 'isActive'];
        const missingProps = requiredProps.filter(prop => !(prop in firstCard));

        if (missingProps.length > 0) {
          console.log('❌ Missing card properties:', missingProps);
          return false;
        }

        // Verify all cards are active
        const inactiveCards = allCards.filter(card => !card.isActive);
        if (inactiveCards.length > 0) {
          console.log('❌ Found inactive cards in active query');
          return false;
        }

        // Verify ordering (featured first, then by display order)
        let lastWasFeatured = true;
        let lastDisplayOrder = -1;

        for (const card of allCards) {
          if (lastWasFeatured && !card.isFeatured) {
            lastWasFeatured = false;
            lastDisplayOrder = -1;
          }

          if (lastWasFeatured === card.isFeatured) {
            if (card.displayOrder < lastDisplayOrder) {
              console.log('❌ Incorrect ordering found');
              return false;
            }
            lastDisplayOrder = card.displayOrder;
          }
        }

        console.log('✅ Card ordering is correct');
      }

      // Test featured cards only
      const featuredCards = await this.measureQueryPerformance(
        'Get featured cards only',
        () => MobileCardQueries.getByType(true)
      );

      console.log(`✅ Retrieved ${featuredCards.length} featured cards`);

      // Test normal cards only
      const normalCards = await this.measureQueryPerformance(
        'Get normal cards only',
        () => MobileCardQueries.getByType(false)
      );

      console.log(`✅ Retrieved ${normalCards.length} normal cards`);

      return true;
    } catch (error) {
      console.log('❌ Active cards query test failed:', error);
      return false;
    }
  }

  /**
   * Test count queries
   */
  async testCountQueries(): Promise<boolean> {
    try {
      console.log('\nTesting count queries...');

      const totalCount = await this.measureQueryPerformance(
        'Count all active cards',
        () => MobileCardQueries.countByType()
      );

      const featuredCount = await this.measureQueryPerformance(
        'Count featured cards',
        () => MobileCardQueries.countByType(true)
      );

      const normalCount = await this.measureQueryPerformance(
        'Count normal cards',
        () => MobileCardQueries.countByType(false)
      );

      console.log(`✅ Total: ${totalCount}, Featured: ${featuredCount}, Normal: ${normalCount}`);

      if (totalCount !== featuredCount + normalCount) {
        console.log('❌ Count mismatch: total should equal featured + normal');
        return false;
      }

      console.log('✅ Count queries consistent');
      return true;
    } catch (error) {
      console.log('❌ Count queries test failed:', error);
      return false;
    }
  }

  /**
   * Test raw SQL query performance
   */
  async testRawQueryPerformance(): Promise<boolean> {
    try {
      console.log('\nTesting raw SQL query performance...');

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

      const result = await this.measureQueryPerformance(
        'Optimized ordering query',
        () => db.query<RowDataPacket>(query)
      );

      console.log(`✅ Raw query returned ${result.rows.length} rows`);

      // Verify ordering
      const rows = result.rows;
      if (rows.length > 1) {
        for (let i = 1; i < rows.length; i++) {
          const prev = rows[i - 1];
          const curr = rows[i];

          if (prev.is_featured === 1 && curr.is_featured === 0) {
            // Featured before normal - correct
            continue;
          } else if (prev.is_featured === curr.is_featured) {
            // Same type, check display order
            if (curr.display_order < prev.display_order) {
              console.log('❌ Incorrect display order in raw query');
              return false;
            }
          }
        }
      }

      console.log('✅ Raw query ordering correct');
      return true;
    } catch (error) {
      console.log('❌ Raw query performance test failed:', error);
      return false;
    }
  }

  /**
   * Print performance report
   */
  printPerformanceReport(): void {
    console.log('\n=== Mobile Cards Query Performance Report ===');
    this.performanceResults.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.queryName}: ${result.executionTime}ms (${result.rowCount} rows)`);
    });

    const failedQueries = this.performanceResults.filter(r => !r.passed);
    if (failedQueries.length > 0) {
      console.log(`\n❌ ${failedQueries.length} queries failed sub-100ms requirement`);
    } else {
      console.log('\n✅ All queries met sub-100ms performance requirement');
    }

    const avgTime = this.performanceResults.reduce((sum, r) => sum + r.executionTime, 0) / this.performanceResults.length;
    console.log(`📊 Average query time: ${Math.round(avgTime)}ms`);
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<boolean> {
    console.log('🚀 Starting Mobile Cards Database Tests\n');

    try {
      // Initialize database
      console.log('Initializing database connection...');
      await db.initialize();

      const tests = [
        this.testDatabaseConnection(),
        this.testTableStructure(),
        this.testIndexes(),
        this.testActiveCardsQuery(),
        this.testCountQueries(),
        this.testRawQueryPerformance()
      ];

      const results = await Promise.all(tests);
      const allPassed = results.every(result => result);

      this.printPerformanceReport();

      if (allPassed) {
        console.log('\n🎉 All tests passed! Mobile cards database functionality verified.');
        return true;
      } else {
        console.log('\n💥 Some tests failed. Check the output above for details.');
        return false;
      }
    } catch (error) {
      console.log('💥 Test runner failed:', error);
      return false;
    } finally {
      await db.close();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testRunner = new MobileCardsTestRunner();
  testRunner.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default MobileCardsTestRunner;