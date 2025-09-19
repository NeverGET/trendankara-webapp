const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 3306,
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'radiopass123',
    database: process.env.DATABASE_NAME || 'radio_db',
    multipleStatements: true
  });

  try {
    // Run the media table migration
    const migrationPath = path.join(__dirname, 'docker/migrations/003_add_media_table.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    await connection.execute(migration);
    console.log('✅ Media table migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await connection.end();
  }
}

runMigration();