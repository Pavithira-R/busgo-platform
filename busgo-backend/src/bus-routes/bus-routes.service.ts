import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, count, eq, inArray, ne, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Database } from '../db/relations.js';
import { bookings, busRoutes, busStops } from '../db/schema.js';
import type { SearchRoutesQuery } from './bus-routes.schemas.js';
import { layoutFor, seatLabels, type SeatLayout } from './seat-layout.js';

const fromStop = alias(busStops, 'from_stop');
const toStop = alias(busStops, 'to_stop');

const routeColumns = {
  id: busRoutes.id,
  routeNumber: busRoutes.routeNumber,
  departureTime: busRoutes.departureTime,
  arrivalTime: busRoutes.arrivalTime,
  durationMinutes: busRoutes.durationMinutes,
  price: busRoutes.price,
  serviceType: busRoutes.serviceType,
  totalSeats: busRoutes.totalSeats,
  busNumber: busRoutes.busNumber,
  from: { code: fromStop.code, name: fromStop.name, city: fromStop.city },
  to: { code: toStop.code, name: toStop.name, city: toStop.city },
};

type RouteRow = Awaited<ReturnType<BusRoutesService['selectRoutes']>>[number];

/** Shape the API returns: "06:00" times and a numeric LKR price. */
function present(row: RouteRow) {
  return {
    ...row,
    departureTime: row.departureTime.slice(0, 5),
    arrivalTime: row.arrivalTime.slice(0, 5),
    price: Number(row.price),
  };
}
export type RouteView = ReturnType<typeof present>;

export interface SeatMap {
  routeId: number;
  date: string;
  layout: SeatLayout;
  totalSeats: number;
  availableSeats: number;
  seats: { number: string; status: 'available' | 'booked' }[];
}

@Injectable()
export class BusRoutesService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  listStops() {
    return this.db
      .select({ code: busStops.code, name: busStops.name, city: busStops.city })
      .from(busStops)
      .orderBy(asc(busStops.city));
  }

  async search(
    query: SearchRoutesQuery,
  ): Promise<(RouteView & { availableSeats?: number })[]> {
    const filters: SQL[] = [eq(busRoutes.isActive, true)];
    if (query.from) filters.push(eq(fromStop.code, query.from));
    if (query.to) filters.push(eq(toStop.code, query.to));
    if (query.serviceType) {
      filters.push(eq(busRoutes.serviceType, query.serviceType));
    }

    const routes = (await this.selectRoutes(and(...filters))).map(present);
    if (!query.date || routes.length === 0) return routes;

    const booked = await this.bookedCounts(
      routes.map((r) => r.id),
      query.date,
    );
    return routes.map((r) => ({
      ...r,
      availableSeats: r.totalSeats - (booked.get(r.id) ?? 0),
    }));
  }

  async findOne(id: number): Promise<RouteView> {
    const [route] = await this.selectRoutes(
      and(eq(busRoutes.id, id), eq(busRoutes.isActive, true)),
    );
    if (!route) throw new NotFoundException('Route not found');
    return present(route);
  }

  async seatMap(id: number, date: string): Promise<SeatMap> {
    const route = await this.findOne(id);
    const layout = layoutFor(route.serviceType);

    const taken = await this.db
      .select({ seat: bookings.seatNumber })
      .from(bookings)
      .where(this.activeBookingsOn([id], date));
    const takenSet = new Set(taken.map((t) => t.seat));

    const seats = seatLabels(layout).map((number) => ({
      number,
      status: takenSet.has(number) ? ('booked' as const) : ('available' as const),
    }));
    return {
      routeId: id,
      date,
      layout,
      totalSeats: seats.length,
      availableSeats: seats.filter((s) => s.status === 'available').length,
      seats,
    };
  }

  private selectRoutes(where: SQL | undefined) {
    return this.db
      .select(routeColumns)
      .from(busRoutes)
      .innerJoin(fromStop, eq(busRoutes.fromStopId, fromStop.id))
      .innerJoin(toStop, eq(busRoutes.toStopId, toStop.id))
      .where(where)
      .orderBy(asc(busRoutes.departureTime), asc(busRoutes.id));
  }

  /** Bookings that hold a seat: everything except cancelled ones. */
  private activeBookingsOn(routeIds: number[], date: string) {
    return and(
      inArray(bookings.routeId, routeIds),
      eq(bookings.travelDate, date),
      ne(bookings.bookingStatus, 'cancelled'),
    );
  }

  private async bookedCounts(routeIds: number[], date: string) {
    const rows = await this.db
      .select({ routeId: bookings.routeId, booked: count() })
      .from(bookings)
      .where(this.activeBookingsOn(routeIds, date))
      .groupBy(bookings.routeId);
    return new Map(rows.map((r) => [r.routeId, r.booked]));
  }
}
