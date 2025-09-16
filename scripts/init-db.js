#!/usr/bin/env node

/**
 * Database Initialization Script
 * Run this to initialize the database schema
 */

const mysql = require('mysql2/promise');

async function initDatabase() {
  let connection;

  try {
    // Parse DATABASE_URL or use individual env vars
    const dbUrl = process.env.DATABASE_URL || 'mysql://root:radiopass123@localhost:3306/radio_db';
    const url = new URL(dbUrl.replace('mysql://', 'http://'));

    console.log('🔄 Connecting to MySQL...');

    // Create connection
    connection = await mysql.createConnection({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL');

    // Create tables
    const schema = `
      -- Users table (admin users)
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'editor') DEFAULT 'editor',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- Media table (for uploaded files)
      CREATE TABLE IF NOT EXISTS media (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(500) NOT NULL,
        original_name VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size BIGINT NOT NULL,
        url VARCHAR(1000) NOT NULL,
        thumbnails JSON,
        width INT,
        height INT,
        uploaded_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (uploaded_by) REFERENCES users(id),
        INDEX idx_created (created_at),
        INDEX idx_deleted (deleted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- Settings table (application settings)
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
        updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id),
        INDEX idx_key (setting_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    console.log('🔄 Creating database schema...');
    await connection.query(schema);
    console.log('✅ Database schema created successfully');

    // Check tables
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()"
    );

    console.log('📊 Created tables:');
    tables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });

    // Insert a test admin user (password: admin123)
    console.log('🔄 Creating test admin user...');
    await connection.query(
      "INSERT IGNORE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
      ['admin@radio.com', 'admin123', 'Admin User', 'admin']
    );
    console.log('✅ Test admin user created (email: admin@radio.com, password: admin123)');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Database connection closed');
    }
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Run initialization
initDatabase().then(() => {
  console.log('✨ Database initialization complete!');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});