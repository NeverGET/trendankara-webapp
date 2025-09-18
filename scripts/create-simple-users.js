const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createSimpleUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'radiopass123',
    database: 'radio_db'
  });

  try {
    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('admin', 10);
    const superAdminPasswordHash = await bcrypt.hash('superadmin', 10);

    // Check if "admin" user exists (using simple username as email)
    const [adminRows] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['admin']
    );

    if (adminRows.length === 0) {
      // Create admin user with simple username
      await connection.execute(
        `INSERT INTO users (email, password, name, role, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        ['admin', adminPasswordHash, 'Admin', 'admin', 1]
      );
      console.log('✅ Simple admin user created');
      console.log('   Username: admin');
      console.log('   Password: admin');
    } else {
      console.log('ℹ️ Simple admin user already exists');
    }

    // Check if "superadmin" user exists
    const [superAdminRows] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['superadmin']
    );

    if (superAdminRows.length === 0) {
      // Create superadmin user with simple username
      await connection.execute(
        `INSERT INTO users (email, password, name, role, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        ['superadmin', superAdminPasswordHash, 'Super Admin', 'super_admin', 1]
      );
      console.log('✅ Simple superadmin user created');
      console.log('   Username: superadmin');
      console.log('   Password: superadmin');
    } else {
      console.log('ℹ️ Simple superadmin user already exists');
    }

    // Show all users
    const [users] = await connection.execute(
      'SELECT id, email, name, role, is_active FROM users ORDER BY id'
    );

    console.log('\n📋 All users in database:');
    console.table(users);

    console.log('\n✨ You can now login with:');
    console.log('   Admin: username "admin", password "admin"');
    console.log('   Super Admin: username "superadmin", password "superadmin"');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createSimpleUsers();