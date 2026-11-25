import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, count, eq, inArray, ne, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { addMinutes } from '../common/time.js';
import type { Database } from '../db/relations.js';
import {
  boardingPoints,
  bookings,
  busRoutes,
  busStops,
  operators,
} from '../db/schema.js';
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
  operator: { id: operators.id, name: operators.name },
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

export interface BoardingPointView {
  id: number;
  name: string;
  order: number;
  /** Estimated time the bus reaches this town, "HH:MM". */
  time: string;
}

export type RouteDetails = RouteView & { boardingPoints: BoardingPointView[] };

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

  listOperators() {
    return this.db
      .select({ id: operators.id, name: operators.name })
      .from(operators)
      .where(eq(operators.isActive, true))
      .orderBy(asc(operators.name));
  }

  async search(
    query: SearchRoutesQuery,
  ): Promise<(RouteView & { via: string[]; availableSeats?: number })[]> {
    const filters: SQL[] = [
      eq(busRoutes.isActive, true),
      eq(operators.isActive, true),
    ];
    if (query.from) filters.push(eq(fromStop.code, query.from));
    if (query.to) filters.push(eq(toStop.code, query.to));
    if (query.serviceType) {
      filters.push(eq(busRoutes.serviceType, query.serviceType));
    }
    if (query.operatorId) {
      filters.push(eq(busRoutes.operatorId, query.operatorId));
    }

    const found = (await this.selectRoutes(and(...filters))).map(present);
    if (found.length === 0) return [];

    const ids = found.map((r) => r.id);
    const points = await this.boardingPointsFor(ids);
    const routes = found.map((r) => ({
      ...r,
      via: (points.get(r.id) ?? []).map((p) => p.name),
    }));
    if (!query.date) return routes;

    const booked = await this.bookedCounts(ids, query.date);
    return routes.map((r) => ({
      ...r,
      availableSeats: r.totalSeats - (booked.get(r.id) ?? 0),
    }));
  }

  /** Route details including the towns where passengers can board. */
  async findDetails(id: number): Promise<RouteDetails> {
    const route = await this.findOne(id);
    const points = (await this.boardingPointsFor([id])).get(id) ?? [];
    return {
      ...route,
      boardingPoints: points.map((p) => ({
        id: p.id,
        name: p.name,
        order: p.stopOrder,
        time: addMinutes(route.departureTime, p.minutesFromStart),
      })),
    };
  }

  /** Routes for the admin panel: including deactivated ones, with their status. */
  async listForAdmin(filter: { operatorId?: number; routeId?: number }) {
    const conditions: SQL[] = [];
    if (filter.operatorId) {
      conditions.push(eq(busRoutes.operatorId, filter.operatorId));
    }
    if (filter.routeId) conditions.push(eq(busRoutes.id, filter.routeId));
    const rows = await this.db
      .select({
        ...routeColumns,
        isActive: busRoutes.isActive,
        operatorActive: operators.isActive,
      })
      .from(busRoutes)
      .innerJoin(operators, eq(busRoutes.operatorId, operators.id))
      .innerJoin(fromStop, eq(busRoutes.fromStopId, fromStop.id))
      .innerJoin(toStop, eq(busRoutes.toStopId, toStop.id))
      .where(and(...conditions))
      .orderBy(asc(fromStop.code), asc(busRoutes.departureTime));
    return rows.map((r) => ({
      ...present(r),
      isActive: r.isActive,
      operatorActive: r.operatorActive,
    }));
  }

  /**
   * Routes by id for showing existing bookings, including routes that
   * have since been deactivated.
   */
  async findForBookings(ids: number[]): Promise<Map<number, RouteView>> {
    if (ids.length === 0) return new Map();
    const rows = await this.selectRoutes(inArray(busRoutes.id, ids));
    return new Map(rows.map((r) => [r.id, present(r)]));
  }

  async findOne(id: number): Promise<RouteView> {
    const [route] = await this.selectRoutes(
      and(
        eq(busRoutes.id, id),
        eq(busRoutes.isActive, true),
        eq(operators.isActive, true),
      ),
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
      status: takenSet.has(number)
        ? ('booked' as const)
        : ('available' as const),
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
      .innerJoin(operators, eq(busRoutes.operatorId, operators.id))
      .innerJoin(fromStop, eq(busRoutes.fromStopId, fromStop.id))
      .innerJoin(toStop, eq(busRoutes.toStopId, toStop.id))
      .where(where)
      .orderBy(asc(busRoutes.departureTime), asc(busRoutes.id));
  }

  /** Boarding points for several routes, grouped by route, in travel order. */
  private async boardingPointsFor(routeIds: number[]) {
    const rows = await this.db
      .select()
      .from(boardingPoints)
      .where(inArray(boardingPoints.routeId, routeIds))
      .orderBy(asc(boardingPoints.routeId), asc(boardingPoints.stopOrder));
    const byRoute = new Map<number, typeof rows>();
    for (const row of rows) {
      byRoute.set(row.routeId, [...(byRoute.get(row.routeId) ?? []), row]);
    }
    return byRoute;
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
