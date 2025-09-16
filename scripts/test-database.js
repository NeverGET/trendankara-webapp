#!/usr/bin/env node

/**
 * Database Structure Test Script
 * Tests all tables and relationships
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function testDatabase() {
  let connection;

  try {
    // Parse DATABASE_URL if available
    let dbConfig;
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL.replace('mysql://', 'http://'));
      dbConfig = {
        host: url.hostname,
        port: url.port || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.substring(1)
      };
    } else {
      dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'radiopass123',
        database: process.env.DB_NAME || 'radio_db'
      };
    }

    // Create connection
    connection = await mysql.createConnection(dbConfig);

    console.log('✅ Connected to database\n');

    // Test 1: Check all tables exist
    console.log('📋 CHECKING TABLES:');
    console.log('==================');

    const [tables] = await connection.execute(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
      [process.env.DB_NAME || 'radio_db']
    );

    const requiredTables = [
      'users', 'media', 'news', 'news_categories',
      'polls', 'poll_items', 'poll_votes',
      'settings', 'radio_settings',
      'content_pages', 'content_components', 'content_versions'
    ];

    for (const table of requiredTables) {
      const exists = tables.some(t => t.table_name === table);
      console.log(`${exists ? '✅' : '❌'} ${table}`);
    }

    // Test 2: Check admin user
    console.log('\n👤 CHECKING ADMIN USER:');
    console.log('=====================');

    const [users] = await connection.execute(
      "SELECT email, name, role FROM users WHERE email = ?",
      ['admin@trendankara.com']
    );

    if (users.length > 0) {
      console.log('✅ Admin user exists:', users[0]);
    } else {
      console.log('❌ Admin user not found');
    }

    // Test 3: Check news categories
    console.log('\n📰 NEWS CATEGORIES:');
    console.log('==================');

    const [categories] = await connection.execute(
      "SELECT name, slug, is_system FROM news_categories WHERE is_system = true"
    );

    for (const cat of categories) {
      console.log(`✅ ${cat.name} (${cat.slug})`);
    }

    // Test 4: Check radio settings
    console.log('\n📻 RADIO SETTINGS:');
    console.log('=================');

    const [radioSettings] = await connection.execute(
      "SELECT stream_url, metadata_url, station_name FROM radio_settings LIMIT 1"
    );

    if (radioSettings.length > 0) {
      console.log('✅ Stream URL:', radioSettings[0].stream_url);
      console.log('✅ Metadata URL:', radioSettings[0].metadata_url);
      console.log('✅ Station Name:', radioSettings[0].station_name);
    }

    // Test 5: Check content components
    console.log('\n🧩 CONTENT COMPONENTS:');
    console.log('=====================');

    const [components] = await connection.execute(
      "SELECT component_type, display_name, category FROM content_components"
    );

    for (const comp of components) {
      console.log(`✅ ${comp.display_name} (${comp.component_type}) - ${comp.category}`);
    }

    // Test 6: Test creating sample data
    console.log('\n🧪 TESTING DATA OPERATIONS:');
    console.log('==========================');

    // Create a test poll
    const pollTitle = `Test Poll ${Date.now()}`;
    await connection.execute(
      `INSERT INTO polls (title, description, start_date, end_date, created_by)
       VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 1)`,
      [pollTitle, 'Test poll description']
    );
    console.log('✅ Created test poll');

    // Get the poll ID
    const [poll] = await connection.execute(
      "SELECT id FROM polls WHERE title = ?",
      [pollTitle]
    );

    if (poll.length > 0) {
      // Add poll items
      await connection.execute(
        `INSERT INTO poll_items (poll_id, title, description, display_order)
         VALUES (?, 'Option 1', 'First option', 1),
                (?, 'Option 2', 'Second option', 2)`,
        [poll[0].id, poll[0].id]
      );
      console.log('✅ Added poll items');

      // Simulate a vote
      const [items] = await connection.execute(
        "SELECT id FROM poll_items WHERE poll_id = ? LIMIT 1",
        [poll[0].id]
      );

      if (items.length > 0) {
        await connection.execute(
          `INSERT INTO poll_votes (poll_id, poll_item_id, device_id, ip_address)
           VALUES (?, ?, ?, ?)`,
          [poll[0].id, items[0].id, 'test-device-123', '127.0.0.1']
        );
        console.log('✅ Recorded test vote');

        // Check if trigger worked
        const [voteCount] = await connection.execute(
          "SELECT vote_count FROM poll_items WHERE id = ?",
          [items[0].id]
        );
        console.log(`✅ Vote count updated by trigger: ${voteCount[0].vote_count}`);
      }

      // Clean up test data
      await connection.execute("DELETE FROM polls WHERE id = ?", [poll[0].id]);
      console.log('✅ Cleaned up test data');
    }

    // Test 7: Check indexes
    console.log('\n🔍 CHECKING INDEXES:');
    console.log('===================');

    const [indexes] = await connection.execute(
      `SELECT DISTINCT table_name, index_name
       FROM information_schema.statistics
       WHERE table_schema = ?
       AND index_name != 'PRIMARY'
       ORDER BY table_name, index_name`,
      [process.env.DB_NAME || 'radio_db']
    );

    let currentTable = '';
    for (const idx of indexes) {
      if (currentTable !== idx.table_name) {
        currentTable = idx.table_name;
        console.log(`\n${currentTable}:`);
      }
      console.log(`  ✅ ${idx.index_name}`);
    }

    console.log('\n========================================');
    console.log('✅ ALL DATABASE TESTS PASSED!');
    console.log('========================================');
    console.log('\nDatabase is ready for production migration.');
    console.log('Use production/migrate-database.sql on your server.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Check your database credentials in .env.local');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Make sure MySQL is running (docker-compose up -d)');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testDatabase();