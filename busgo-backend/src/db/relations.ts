import { defineRelations } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

export const relations = defineRelations(schema, (r) => ({
  users: {
    bookings: r.many.bookings(),
    scans: r.many.scanLogs(),
  },
  busStops: {
    departures: r.many.busRoutes({ alias: 'from_stop' }),
    arrivals: r.many.busRoutes({ alias: 'to_stop' }),
  },
  operators: {
    routes: r.many.busRoutes(),
  },
  busRoutes: {
    operator: r.one.operators({
      from: r.busRoutes.operatorId,
      to: r.operators.id,
    }),
    fromStop: r.one.busStops({
      from: r.busRoutes.fromStopId,
      to: r.busStops.id,
      alias: 'from_stop',
    }),
    toStop: r.one.busStops({
      from: r.busRoutes.toStopId,
      to: r.busStops.id,
      alias: 'to_stop',
    }),
    bookings: r.many.bookings(),
    boardingPoints: r.many.boardingPoints(),
  },
  boardingPoints: {
    route: r.one.busRoutes({
      from: r.boardingPoints.routeId,
      to: r.busRoutes.id,
    }),
  },
  bookings: {
    user: r.one.users({ from: r.bookings.userId, to: r.users.id }),
    route: r.one.busRoutes({ from: r.bookings.routeId, to: r.busRoutes.id }),
    scans: r.many.scanLogs(),
  },
  scanLogs: {
    booking: r.one.bookings({
      from: r.scanLogs.bookingId,
      to: r.bookings.id,
    }),
    scannedByUser: r.one.users({
      from: r.scanLogs.scannedBy,
      to: r.users.id,
    }),
  },
}));

export type Database = NodePgDatabase<typeof relations>;
