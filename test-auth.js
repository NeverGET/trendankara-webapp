const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testAuth() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'radiopass123',
    database: 'radio_db'
  });

  // Test admin password
  const [adminRows] = await connection.execute(
    'SELECT id, email, password, role FROM users WHERE email = ?',
    ['admin']
  );

  if (adminRows.length > 0) {
    const admin = adminRows[0];
    const isValid = await bcrypt.compare('admin', admin.password);
    console.log('Admin password valid:', isValid);
    console.log('Admin hash:', admin.password);
  }

  // Test superadmin password
  const [superRows] = await connection.execute(
    'SELECT id, email, password, role FROM users WHERE email = ?',
    ['superadmin']
  );

  if (superRows.length > 0) {
    const superadmin = superRows[0];
    const isValid = await bcrypt.compare('superadmin', superadmin.password);
    console.log('Superadmin password valid:', isValid);
    console.log('Superadmin hash:', superadmin.password);
  }

  await connection.end();
}

testAuth().catch(console.error);