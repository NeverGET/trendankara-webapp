#!/usr/bin/env node

/**
 * Script to create admin and superadmin users in the database
 * Usage: node scripts/create-users.js
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

// User data to create
const users = [
  {
    email: 'admin',
    password: 'admin',
    name: 'Admin User',
    role: 'admin'
  },
  {
    email: 'superadmin',
    password: 'superadmin',
    name: 'Super Admin',
    role: 'super_admin'
  }
];

async function createUsers() {
  let connection;

  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'radio_db'
    });

    console.log('Connected to database');

    for (const userData of users) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Check if user already exists
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [userData.email]
      );

      if (existing.length > 0) {
        // Update existing user
        await connection.execute(
          'UPDATE users SET password = ?, name = ?, role = ?, is_active = 1, updated_at = NOW() WHERE email = ?',
          [hashedPassword, userData.name, userData.role, userData.email]
        );
        console.log(`✅ Updated user: ${userData.email}`);
      } else {
        // Insert new user
        await connection.execute(
          'INSERT INTO users (email, password, name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, NOW(), NOW())',
          [userData.email, hashedPassword, userData.name, userData.role]
        );
        console.log(`✅ Created user: ${userData.email}`);
      }
    }

    // Verify users were created
    const [results] = await connection.execute(
      'SELECT id, email, name, role, is_active FROM users WHERE email IN (?, ?)',
      ['admin', 'superadmin']
    );

    console.log('\n📋 Users in database:');
    console.table(results);

    console.log('\n🔐 Login credentials:');
    console.log('=====================================');
    console.log('Admin User:');
    console.log('  Username: admin');
    console.log('  Password: admin');
    console.log('  Role: admin');
    console.log('');
    console.log('Super Admin User:');
    console.log('  Username: superadmin');
    console.log('  Password: superadmin');
    console.log('  Role: super_admin');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Error creating users:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Run the script
createUsers().catch(console.error);