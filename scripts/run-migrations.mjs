/**
 * One-time migration runner for Supabase.
 * Usage: DB_PASSWORD=your_password node scripts/run-migrations.mjs
 *
 * Get your DB password from:
 * Supabase Dashboard → Settings → Database → Connection string → Password
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;

const password = process.env.DB_PASSWORD;
if (!password) {
  console.error('❌ Missing DB_PASSWORD. Run as:\n   DB_PASSWORD=yourpassword node scripts/run-migrations.mjs');
  process.exit(1);
}

const PROJECT_REF = 'zexrfqlcirzpwqvozhmb';
const dir = dirname(fileURLToPath(import.meta.url));

const migrations = [
  join(dir, '../src/db/migrations/017_count_trials_function.sql'),
  join(dir, '../src/db/migrations/018_fix_zero_coordinates.sql'),
];

const client = new Client({
  host: `db.${PROJECT_REF}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log('✓ Connected to database\n');

  for (const file of migrations) {
    const name = file.split('/').pop();
    const sql = readFileSync(file, 'utf8');
    console.log(`Running ${name}...`);
    await client.query(sql);
    console.log(`✓ ${name} applied\n`);
  }

  console.log('✓ All migrations complete');
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
