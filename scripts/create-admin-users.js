const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createAdminUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'radiopass123',
    database: 'radio_db'
  });

  try {
    // First, update the role enum to include super_admin
    console.log('Updating user roles enum...');
    await connection.execute(`
      ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'super_admin', 'editor') DEFAULT 'editor'
    `);
    console.log('✅ Role enum updated');

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('admin', 10);
    const superAdminPasswordHash = await bcrypt.hash('superadmin', 10);

    // Check if admin user exists
    const [adminRows] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['admin@trendankara.com']
    );

    if (adminRows.length === 0) {
      // Create admin user
      await connection.execute(
        `INSERT INTO users (email, password, name, role, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        ['admin@trendankara.com', adminPasswordHash, 'Admin User', 'admin', 1]
      );
      console.log('✅ Admin user created');
      console.log('   Email: admin@trendankara.com');
      console.log('   Password: admin');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Check if superadmin user exists
    const [superAdminRows] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['superadmin@trendankara.com']
    );

    if (superAdminRows.length === 0) {
      // Create superadmin user
      await connection.execute(
        `INSERT INTO users (email, password, name, role, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        ['superadmin@trendankara.com', superAdminPasswordHash, 'Super Admin', 'super_admin', 1]
      );
      console.log('✅ Super Admin user created');
      console.log('   Email: superadmin@trendankara.com');
      console.log('   Password: superadmin');
    } else {
      console.log('ℹ️ Super Admin user already exists');
    }

    // Show all users
    const [users] = await connection.execute(
      'SELECT id, email, name, role, is_active FROM users'
    );

    console.log('\n📋 Current users in database:');
    console.table(users);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createAdminUsers();