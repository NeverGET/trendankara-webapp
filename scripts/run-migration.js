/**
 * Script to run database migrations
 * Run with: node scripts/run-migration.js
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Import after env vars are loaded
async function runMigration() {
  try {
    console.log('Starting database migration...');

    const { migrate } = await import('../src/lib/db/migrate.ts');

    const result = await migrate();

    if (result) {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    } else {
      console.error('❌ Migration failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigration();