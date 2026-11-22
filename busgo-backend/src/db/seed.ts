/**
 * Seeds the database with starter data. Safe to run more than once:
 * existing users, stops and routes are left as they are.
 *
 *   npm run db:seed
 */
import { existsSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { hashPassword } from '../common/password.js';
import { relations } from './relations.js';
import {
  busRoutes,
  busStops,
  type NewBusRoute,
  type NewUser,
  users,
} from './schema.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set');

const db = drizzle(databaseUrl, { relations });

// ---------- Users ----------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (see .env.example)`);
  return value;
}

const seedUsers: (Omit<NewUser, 'passwordHash'> & { password: string })[] = [
  {
    fullName: 'BusGo Admin',
    email: requireEnv('SEED_ADMIN_EMAIL'),
    password: requireEnv('SEED_ADMIN_PASSWORD'),
    role: 'admin',
  },
  {
    fullName: 'Gate Staff',
    email: 'staff@busgo.lk',
    password: requireEnv('SEED_DEMO_PASSWORD'),
    role: 'staff',
  },
  {
    fullName: 'Demo Passenger',
    email: 'passenger@busgo.lk',
    phone: '0771234567',
    password: requireEnv('SEED_DEMO_PASSWORD'),
    role: 'passenger',
  },
];

// ---------- Bus stops ----------

const stops = [
  { code: 'CMB', name: 'Colombo Central Bus Stand', city: 'Colombo' },
  { code: 'KDY', name: 'Kandy Goods Shed Bus Stand', city: 'Kandy' },
  { code: 'GLE', name: 'Galle Bus Stand', city: 'Galle' },
  { code: 'JFN', name: 'Jaffna Bus Stand', city: 'Jaffna' },
  { code: 'NGB', name: 'Negombo Bus Stand', city: 'Negombo' },
  { code: 'MTR', name: 'Matara Bus Stand', city: 'Matara' },
  { code: 'ADP', name: 'Anuradhapura New Bus Stand', city: 'Anuradhapura' },
  { code: 'TRC', name: 'Trincomalee Bus Stand', city: 'Trincomalee' },
  { code: 'BDL', name: 'Badulla Bus Stand', city: 'Badulla' },
  { code: 'BTC', name: 'Batticaloa Bus Stand', city: 'Batticaloa' },
];

// ---------- Routes (sample timetable, fares in LKR) ----------

type ServiceType = NonNullable<NewBusRoute['serviceType']>;

const SEATS: Record<ServiceType, number> = {
  standard: 48,
  semi_luxury: 40,
  luxury: 24,
};

const routes: {
  routeNumber: string;
  from: string;
  to: string;
  departs: string;
  arrives: string;
  price: number;
  serviceType: ServiceType;
  busNumber: string;
}[] = [
  { routeNumber: '01', from: 'CMB', to: 'KDY', departs: '06:00', arrives: '09:30', price: 420, serviceType: 'standard', busNumber: 'NB-4521' },
  { routeNumber: '01-L', from: 'CMB', to: 'KDY', departs: '08:00', arrives: '11:00', price: 950, serviceType: 'luxury', busNumber: 'NC-1188' },
  { routeNumber: '01', from: 'KDY', to: 'CMB', departs: '14:00', arrives: '17:30', price: 420, serviceType: 'standard', busNumber: 'NB-4522' },
  { routeNumber: 'EX1-1', from: 'CMB', to: 'GLE', departs: '07:00', arrives: '08:45', price: 750, serviceType: 'semi_luxury', busNumber: 'ND-3307' },
  { routeNumber: 'EX1-1', from: 'GLE', to: 'CMB', departs: '16:00', arrives: '17:45', price: 750, serviceType: 'semi_luxury', busNumber: 'ND-3308' },
  { routeNumber: 'EX1-2', from: 'CMB', to: 'MTR', departs: '09:00', arrives: '11:15', price: 1100, serviceType: 'luxury', busNumber: 'NC-2290' },
  { routeNumber: '87', from: 'CMB', to: 'JFN', departs: '21:00', arrives: '05:00', price: 2400, serviceType: 'luxury', busNumber: 'NP-7781' },
  { routeNumber: '87', from: 'JFN', to: 'CMB', departs: '20:30', arrives: '04:30', price: 2400, serviceType: 'luxury', busNumber: 'NP-7782' },
  { routeNumber: '240', from: 'CMB', to: 'NGB', departs: '07:30', arrives: '08:45', price: 150, serviceType: 'standard', busNumber: 'WP-6610' },
  { routeNumber: '15', from: 'CMB', to: 'ADP', departs: '05:30', arrives: '10:30', price: 850, serviceType: 'semi_luxury', busNumber: 'NW-1453' },
  { routeNumber: '49', from: 'CMB', to: 'TRC', departs: '22:00', arrives: '05:30', price: 1650, serviceType: 'luxury', busNumber: 'EP-3321' },
  { routeNumber: '99', from: 'CMB', to: 'BDL', departs: '06:30', arrives: '13:00', price: 1200, serviceType: 'semi_luxury', busNumber: 'UP-8874' },
  { routeNumber: '48', from: 'CMB', to: 'BTC', departs: '20:00', arrives: '04:00', price: 1800, serviceType: 'luxury', busNumber: 'EP-5590' },
  { routeNumber: '21', from: 'KDY', to: 'BDL', departs: '10:00', arrives: '14:30', price: 600, serviceType: 'standard', busNumber: 'CP-2214' },
];

/** Minutes between two HH:MM times, crossing midnight if needed. */
function minutesBetween(departs: string, arrives: string): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const diff = toMin(arrives) - toMin(departs);
  return diff > 0 ? diff : diff + 24 * 60;
}

async function main() {
  for (const { password, ...user } of seedUsers) {
    await db
      .insert(users)
      .values({ ...user, passwordHash: await hashPassword(password) })
      .onConflictDoNothing({ target: users.email });
  }

  await db.insert(busStops).values(stops).onConflictDoNothing();
  const stopRows = await db.select().from(busStops);
  const stopId = new Map(stopRows.map((s) => [s.code, s.id]));

  const existingRoutes = await db.$count(busRoutes);
  if (existingRoutes === 0) {
    await db.insert(busRoutes).values(
      routes.map((r) => ({
        routeNumber: r.routeNumber,
        fromStopId: stopId.get(r.from)!,
        toStopId: stopId.get(r.to)!,
        departureTime: r.departs,
        arrivalTime: r.arrives,
        durationMinutes: minutesBetween(r.departs, r.arrives),
        price: r.price.toFixed(2),
        serviceType: r.serviceType,
        totalSeats: SEATS[r.serviceType],
        busNumber: r.busNumber,
      })),
    );
  }

  console.log(
    `Seed complete: ${await db.$count(users)} users, ` +
      `${await db.$count(busStops)} stops, ${await db.$count(busRoutes)} routes`,
  );
}

try {
  await main();
} finally {
  await db.$client.end();
}
