/** npm run db:reset: wipes ALL data, then seeds. Local development only. */
import { sql } from 'drizzle-orm';
import { seed } from '../seed.js';
import { withScriptDb } from './script-db.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('db:reset is disabled when NODE_ENV=production');
}

await withScriptDb(async (db) => {
  await db.execute(sql`
    TRUNCATE scan_logs, bookings, boarding_points, bus_routes, operators, bus_stops, users
    RESTART IDENTITY CASCADE
  `);
  console.log('All data removed.');
  await seed(db);
});
