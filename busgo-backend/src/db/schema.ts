import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  time,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

// ---------- Enums ----------

export const userRole = pgEnum('user_role', ['passenger', 'staff', 'admin']);

// Sri Lankan bus classes. Luxury and Super Luxury are air-conditioned.
export const serviceType = pgEnum('service_type', [
  'normal',
  'semi_luxury',
  'luxury',
  'super_luxury',
]);

export const paymentStatus = pgEnum('payment_status', [
  'pending',
  'paid',
  'refunded',
  'failed',
]);

export const bookingStatus = pgEnum('booking_status', [
  'confirmed',
  'cancelled',
  'used',
  'expired',
]);

export const scanResult = pgEnum('scan_result', [
  'valid',
  'invalid',
  'already_used',
  'expired',
]);

// ---------- Tables ----------

export const users = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  idNumber: varchar('id_number', { length: 50 }), // NIC or passport
  role: userRole('role').notNull().default('passenger'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const busStops = pgTable('bus_stops', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 10 }).notNull().unique(), // CMB, KDY, GLE...
  city: varchar('city', { length: 100 }).notNull(),
});

/** Private bus companies whose services are sold on BusGo. */
export const operators = pgTable('operators', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const busRoutes = pgTable(
  'bus_routes',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    routeNumber: varchar('route_number', { length: 20 }).notNull(),
    operatorId: integer('operator_id')
      .notNull()
      .references(() => operators.id),
    fromStopId: integer('from_stop_id')
      .notNull()
      .references(() => busStops.id),
    toStopId: integer('to_stop_id')
      .notNull()
      .references(() => busStops.id),
    departureTime: time('departure_time').notNull(),
    arrivalTime: time('arrival_time').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(), // LKR
    serviceType: serviceType('service_type').notNull().default('normal'),
    totalSeats: integer('total_seats').notNull().default(50),
    busNumber: varchar('bus_number', { length: 20 }),
    isActive: boolean('is_active').notNull().default(true),
  },
  (t) => [
    index('bus_routes_from_to_idx').on(t.fromStopId, t.toStopId),
    index('bus_routes_operator_idx').on(t.operatorId),
    check('bus_routes_different_stops', sql`${t.fromStopId} <> ${t.toStopId}`),
  ],
);

export const bookings = pgTable(
  'bookings',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    ticketId: varchar('ticket_id', { length: 20 }).notNull().unique(), // BG-XXXXXXXX
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    routeId: integer('route_id')
      .notNull()
      .references(() => busRoutes.id),
    travelDate: date('travel_date').notNull(),
    seatNumber: varchar('seat_number', { length: 5 }).notNull(),
    passengerName: varchar('passenger_name', { length: 100 }).notNull(),
    passengerEmail: varchar('passenger_email', { length: 150 }).notNull(),
    passengerPhone: varchar('passenger_phone', { length: 20 }),
    passengerIdNumber: varchar('passenger_id_number', { length: 50 }),
    basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull(),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    paymentStatus: paymentStatus('payment_status').notNull().default('pending'),
    bookingStatus: bookingStatus('booking_status')
      .notNull()
      .default('confirmed'),
    // Ticket details encoded into the QR. The PNG is generated on demand
    // from this, so we don't store large base64 images in the database.
    qrPayload: jsonb('qr_payload').notNull(),
    bookedAt: timestamp('booked_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // A seat can only be held by one non-cancelled booking per trip.
    // Cancelled bookings stay for history but free the seat for rebooking.
    uniqueIndex('bookings_active_seat_uq')
      .on(t.routeId, t.travelDate, t.seatNumber)
      .where(sql`${t.bookingStatus} <> 'cancelled'`),
    index('bookings_user_idx').on(t.userId),
  ],
);

export const scanLogs = pgTable(
  'scan_logs',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    // Nullable: scans of unknown/forged ticket IDs are logged too.
    bookingId: integer('booking_id').references(() => bookings.id),
    scannedTicketId: varchar('scanned_ticket_id', { length: 50 }).notNull(),
    scannedAt: timestamp('scanned_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    result: scanResult('result').notNull(),
    scannedBy: integer('scanned_by').references(() => users.id),
    location: varchar('location', { length: 100 }), // e.g. Gate A
  },
  (t) => [index('scan_logs_booking_idx').on(t.bookingId)],
);

// ---------- Row types ----------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type BusStop = typeof busStops.$inferSelect;
export type Operator = typeof operators.$inferSelect;
export type NewOperator = typeof operators.$inferInsert;
export type BusRoute = typeof busRoutes.$inferSelect;
export type NewBusRoute = typeof busRoutes.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type ScanLog = typeof scanLogs.$inferSelect;
