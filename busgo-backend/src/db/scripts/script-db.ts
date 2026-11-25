import { existsSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { type Database, relations } from '../relations.js';

/** Opens a database connection for command-line scripts, closing it after `fn`. */
export async function withScriptDb(fn: (db: Database) => Promise<void>) {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const db = drizzle(url, { relations });
  try {
    await fn(db);
  } finally {
    await db.$client.end();
  }
}
