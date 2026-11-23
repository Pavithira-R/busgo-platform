import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  ne,
  or,
  type SQL,
  sql,
  sum,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { BookingsService } from '../bookings/bookings.service.js';
import { addDays, todayInSriLanka } from '../common/dates.js';
import type { Database } from '../db/relations.js';
import {
  bookings,
  busRoutes,
  busStops,
  operators,
  users,
} from '../db/schema.js';
import type {
  BookingListQuery,
  DashboardQuery,
  UserListQuery,
} from './admin.schemas.js';

/** The Sri Lankan calendar date a booking was made. */
const bookedOn = sql<string>`(${bookings.bookedAt} AT TIME ZONE 'Asia/Colombo')::date`;
const notCancelled = ne(bookings.bookingStatus, 'cancelled');
const money = (value: unknown) => Number(value ?? 0);

const fromStop = alias(busStops, 'from_stop');
const toStop = alias(busStops, 'to_stop');

@Injectable()
export class AdminInsightsService {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly bookingsService: BookingsService,
  ) {}

  /** Sales overview for a date range (default: the last 30 days). */
  async dashboard(query: DashboardQuery) {
    const today = todayInSriLanka();
    const to = query.to ?? today;
    const from = query.from ?? addDays(to, -29);
    const inRange = and(gte(bookedOn, from), lte(bookedOn, to)) as SQL;

    const [totals] = await this.db
      .select({
        total: count(),
        confirmed: count(
          sql`case when ${bookings.bookingStatus} = 'confirmed' then 1 end`,
        ),
        used: count(
          sql`case when ${bookings.bookingStatus} = 'used' then 1 end`,
        ),
        cancelled: count(
          sql`case when ${bookings.bookingStatus} = 'cancelled' then 1 end`,
        ),
        grossSales: sum(bookings.totalAmount),
        refunds: sum(bookings.refundAmount),
      })
      .from(bookings)
      .where(inRange);

    const [todayStats] = await this.db
      .select({
        bookedToday: count(sql`case when ${bookedOn} = ${today} then 1 end`),
        travellingToday: count(
          sql`case when ${bookings.travelDate} = ${today} and ${bookings.bookingStatus} <> 'cancelled' then 1 end`,
        ),
      })
      .from(bookings);

    const [passengers] = await this.db
      .select({
        total: count(),
        newInRange: count(
          sql`case when (${users.createdAt} AT TIME ZONE 'Asia/Colombo')::date between ${from} and ${to} then 1 end`,
        ),
      })
      .from(users)
      .where(eq(users.role, 'passenger'));

    const revenue = sql<string>`coalesce(sum(${bookings.totalAmount}) - sum(coalesce(${bookings.refundAmount}, 0)), 0)`;

    const popularRoutes = await this.db
      .select({
        routeId: busRoutes.id,
        routeNumber: busRoutes.routeNumber,
        from: fromStop.city,
        to: toStop.city,
        departureTime: busRoutes.departureTime,
        operator: operators.name,
        bookings: count(),
        revenue,
      })
      .from(bookings)
      .innerJoin(busRoutes, eq(bookings.routeId, busRoutes.id))
      .innerJoin(operators, eq(busRoutes.operatorId, operators.id))
      .innerJoin(fromStop, eq(busRoutes.fromStopId, fromStop.id))
      .innerJoin(toStop, eq(busRoutes.toStopId, toStop.id))
      .where(and(inRange, notCancelled))
      .groupBy(busRoutes.id, operators.name, fromStop.city, toStop.city)
      .orderBy(desc(count()), asc(busRoutes.id))
      .limit(5);

    const byOperator = await this.db
      .select({
        operatorId: operators.id,
        operator: operators.name,
        bookings: count(),
        revenue,
      })
      .from(bookings)
      .innerJoin(busRoutes, eq(bookings.routeId, busRoutes.id))
      .innerJoin(operators, eq(busRoutes.operatorId, operators.id))
      .where(and(inRange, notCancelled))
      .groupBy(operators.id)
      .orderBy(desc(count()));

    const dailyRows = await this.db
      .select({
        date: bookedOn,
        bookings: count(),
        revenue,
      })
      .from(bookings)
      .where(and(inRange, notCancelled))
      .groupBy(bookedOn);
    const byDate = new Map(
      dailyRows.map((d) => [String(d.date).slice(0, 10), d]),
    );
    const daily: { date: string; bookings: number; revenue: number }[] = [];
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const row = byDate.get(d);
      daily.push({
        date: d,
        bookings: row?.bookings ?? 0,
        revenue: money(row?.revenue),
      });
    }

    const gross = money(totals.grossSales);
    const refunds = money(totals.refunds);
    return {
      range: { from, to },
      bookings: {
        total: totals.total,
        confirmed: totals.confirmed,
        used: totals.used,
        cancelled: totals.cancelled,
      },
      revenue: { grossSales: gross, refunds, netRevenue: gross - refunds },
      today: todayStats,
      passengers,
      popularRoutes: popularRoutes.map((r) => ({
        ...r,
        departureTime: r.departureTime.slice(0, 5),
        revenue: money(r.revenue),
      })),
      byOperator: byOperator.map((o) => ({ ...o, revenue: money(o.revenue) })),
      daily,
    };
  }

  /** All bookings, newest first, with filters and paging. */
  async bookings(query: BookingListQuery) {
    const conditions: SQL[] = [];
    if (query.status) conditions.push(eq(bookings.bookingStatus, query.status));
    if (query.travelDate) {
      conditions.push(eq(bookings.travelDate, query.travelDate));
    }
    if (query.routeId) conditions.push(eq(bookings.routeId, query.routeId));
    if (query.operatorId) {
      conditions.push(eq(busRoutes.operatorId, query.operatorId));
    }
    if (query.search) {
      const term = `%${escapeLike(query.search)}%`;
      conditions.push(
        or(
          ilike(bookings.ticketId, term),
          ilike(bookings.passengerName, term),
          ilike(bookings.passengerEmail, term),
          ilike(bookings.passengerPhone, term),
        ) as SQL,
      );
    }
    const where = and(...conditions);

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(bookings)
      .innerJoin(busRoutes, eq(bookings.routeId, busRoutes.id))
      .where(where);
    const rows = await this.db
      .select({ booking: bookings })
      .from(bookings)
      .innerJoin(busRoutes, eq(bookings.routeId, busRoutes.id))
      .where(where)
      .orderBy(desc(bookings.bookedAt), desc(bookings.id))
      .limit(query.limit)
      .offset((query.page - 1) * query.limit);

    return {
      items: await this.bookingsService.viewsOf(rows.map((r) => r.booking)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  /** Registered passengers with how many seats they've booked. */
  async passengers(query: UserListQuery) {
    const conditions: SQL[] = [eq(users.role, 'passenger')];
    if (query.search) {
      const term = `%${escapeLike(query.search)}%`;
      conditions.push(
        or(
          ilike(users.fullName, term),
          ilike(users.email, term),
          ilike(users.phone, term),
        ) as SQL,
      );
    }
    const where = and(...conditions);

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(users)
      .where(where);
    const items = await this.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        isActive: users.isActive,
        createdAt: users.createdAt,
        bookings: count(bookings.id),
        lastBookedAt: sql<Date | null>`max(${bookings.bookedAt})`,
      })
      .from(users)
      .leftJoin(bookings, eq(bookings.userId, users.id))
      .where(where)
      .groupBy(users.id)
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(query.limit)
      .offset((query.page - 1) * query.limit);

    return { items, total, page: query.page, limit: query.limit };
  }
}

/** Searches treat % and _ as ordinary characters. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}
