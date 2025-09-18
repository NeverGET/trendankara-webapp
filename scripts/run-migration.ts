/**
 * Script to run database migrations
 * Run with: npx tsx scripts/run-migration.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Import after env vars are loaded
import { migrate } from '../src/lib/db/migrate';

async function runMigration() {
  try {
    console.log('Starting database migration...');
    console.log('Database:', process.env.DATABASE_NAME);
    console.log('Host:', process.env.DATABASE_HOST);
    console.log('Port:', process.env.DATABASE_PORT);

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