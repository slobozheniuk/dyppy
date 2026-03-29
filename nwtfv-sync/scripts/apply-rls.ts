/**
 * Applies RLS grants and policies from prisma/rls-setup.sql.
 * Uses a direct (non-pooled) connection since DDL statements
 * (GRANT, ALTER TABLE, CREATE POLICY) are not supported over PgBouncer.
 *
 * Run via: npm run db:rls
 * Also called automatically by: npm run db:push:reset
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing DIRECT_URL or DATABASE_URL in environment.');
  process.exit(1);
}

const sql = readFileSync(join(__dirname, '../prisma/rls-setup.sql'), 'utf8');

const client = new Client({ connectionString });
await client.connect();

try {
  await client.query(sql);
  console.log('✅ RLS setup applied successfully.');
} catch (err: any) {
  console.error('❌ RLS setup failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
