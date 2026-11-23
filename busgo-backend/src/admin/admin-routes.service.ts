import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, count, eq, gte, inArray, sql } from 'drizzle-orm';
import { BookingsService } from '../bookings/bookings.service.js';
import { BusRoutesService } from '../bus-routes/bus-routes.service.js';
import { seatCount } from '../bus-routes/seat-layout.js';
import { todayInSriLanka } from '../common/dates.js';
import { addMinutes, minutesBetween } from '../common/time.js';
import type { Database } from '../db/relations.js';
import { boardingPoints, bookings, busRoutes, busStops } from '../db/schema.js';
import { AdminOperatorsService } from './admin-operators.service.js';
import type {
  BoardingPointsDto,
  CancelTripDto,
  CreateRouteDto,
  RouteListQuery,
  UpdateRouteDto,
} from './admin.schemas.js';

@Injectable()
export class AdminRoutesService {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly busRoutes: BusRoutesService,
    private readonly operators: AdminOperatorsService,
    private readonly bookings: BookingsService,
  ) {}

  list(query: RouteListQuery) {
    return this.busRoutes.listForAdmin({ operatorId: query.operatorId });
  }

  /** A route with its boarding points and how many upcoming seats are sold. */
  async details(id: number) {
    const [route] = await this.busRoutes.listForAdmin({ routeId: id });
    if (!route) throw new NotFoundException('Route not found');
    const points = await this.db
      .select()
      .from(boardingPoints)
      .where(eq(boardingPoints.routeId, id))
      .orderBy(asc(boardingPoints.stopOrder));
    return {
      ...route,
      upcomingBookings: await this.upcomingBookings(id),
      boardingPoints: points.map((p) => ({
        id: p.id,
        name: p.name,
        order: p.stopOrder,
        minutesFromStart: p.minutesFromStart,
        time: addMinutes(route.departureTime, p.minutesFromStart),
      })),
    };
  }

  async create(dto: CreateRouteDto) {
    await this.operators.requireActive(dto.operatorId);
    const stops = await this.db
      .select({ id: busStops.id, code: busStops.code })
      .from(busStops)
      .where(inArray(busStops.code, [dto.fromCode, dto.toCode]));
    const stopId = new Map(stops.map((s) => [s.code, s.id]));
    for (const code of [dto.fromCode, dto.toCode]) {
      if (!stopId.has(code)) {
        throw new BadRequestException(`Unknown bus stop "${code}"`);
      }
    }

    const [route] = await this.db
      .insert(busRoutes)
      .values({
        routeNumber: dto.routeNumber,
        operatorId: dto.operatorId,
        fromStopId: stopId.get(dto.fromCode)!,
        toStopId: stopId.get(dto.toCode)!,
        departureTime: dto.departureTime,
        arrivalTime: dto.arrivalTime,
        durationMinutes: minutesBetween(dto.departureTime, dto.arrivalTime),
        price: dto.price.toFixed(2),
        serviceType: dto.serviceType,
        totalSeats: seatCount(dto.serviceType),
        busNumber: dto.busNumber ?? null,
      })
      .returning();
    return this.details(route.id);
  }

  /**
   * Edit a route. Fares already paid don't change; new bookings use the new
   * price. Set isActive to false to stop selling it (existing tickets stay valid).
   */
  async update(id: number, dto: UpdateRouteDto) {
    const [route] = await this.db
      .select()
      .from(busRoutes)
      .where(eq(busRoutes.id, id));
    if (!route) throw new NotFoundException('Route not found');

    if (dto.operatorId && dto.operatorId !== route.operatorId) {
      await this.operators.requireActive(dto.operatorId);
    }
    if (dto.serviceType && dto.serviceType !== route.serviceType) {
      const upcoming = await this.upcomingBookings(id);
      if (upcoming > 0) {
        throw new ConflictException(
          `Cannot change the bus type: ${upcoming} upcoming booking(s) have seats on the current layout`,
        );
      }
    }

    const departure = dto.departureTime ?? route.departureTime.slice(0, 5);
    const arrival = dto.arrivalTime ?? route.arrivalTime.slice(0, 5);
    const duration = minutesBetween(departure, arrival);
    const [last] = await this.db
      .select({ minutes: boardingPoints.minutesFromStart })
      .from(boardingPoints)
      .where(eq(boardingPoints.routeId, id))
      .orderBy(sql`${boardingPoints.minutesFromStart} desc`)
      .limit(1);
    if (last && last.minutes >= duration) {
      throw new ConflictException(
        'The new times are shorter than the boarding points allow; update the boarding points first',
      );
    }

    const { price, serviceType, ...rest } = dto;
    await this.db
      .update(busRoutes)
      .set({
        ...rest,
        durationMinutes: duration,
        ...(price !== undefined && { price: price.toFixed(2) }),
        ...(serviceType && { serviceType, totalSeats: seatCount(serviceType) }),
      })
      .where(eq(busRoutes.id, id));
    return this.details(id);
  }

  /**
   * Replace a route's boarding points with this ordered list. Points with an
   * `id` are kept (and can be renamed or re-timed); missing ones are removed,
   * unless a booking uses them.
   */
  async setBoardingPoints(id: number, dto: BoardingPointsDto) {
    const route = await this.details(id);

    let previous = 0;
    for (const p of dto.points) {
      if (p.minutesFromStart <= previous) {
        throw new BadRequestException(
          'Boarding points must be in travel order, each later than the one before',
        );
      }
      if (p.minutesFromStart >= route.durationMinutes) {
        throw new BadRequestException(
          `"${p.name}" is after the bus arrives (journey is ${route.durationMinutes} minutes)`,
        );
      }
      previous = p.minutesFromStart;
    }

    const existingIds = new Set(route.boardingPoints.map((p) => p.id));
    const keepIds = dto.points.flatMap((p) => (p.id ? [p.id] : []));
    for (const keepId of keepIds) {
      if (!existingIds.has(keepId)) {
        throw new BadRequestException(
          `Boarding point ${keepId} is not on this route`,
        );
      }
    }
    const removeIds = [...existingIds].filter((x) => !keepIds.includes(x));

    await this.db.transaction(async (tx) => {
      if (removeIds.length) {
        const used = await tx
          .select({ id: bookings.boardingPointId })
          .from(bookings)
          .where(inArray(bookings.boardingPointId, removeIds))
          .limit(1);
        if (used.length) {
          const name = route.boardingPoints.find(
            (p) => p.id === used[0].id,
          )?.name;
          throw new ConflictException(
            `Cannot remove "${name}": passengers have booked to board there`,
          );
        }
        await tx
          .delete(boardingPoints)
          .where(inArray(boardingPoints.id, removeIds));
      }

      // Move kept points out of the way first, so re-numbering them can't
      // clash with the unique (route, order) index.
      await tx
        .update(boardingPoints)
        .set({ stopOrder: sql`${boardingPoints.stopOrder} + 1000` })
        .where(eq(boardingPoints.routeId, id));

      for (const [i, p] of dto.points.entries()) {
        const values = {
          name: p.name,
          minutesFromStart: p.minutesFromStart,
          stopOrder: i + 1,
        };
        if (p.id) {
          await tx
            .update(boardingPoints)
            .set(values)
            .where(eq(boardingPoints.id, p.id));
        } else {
          await tx.insert(boardingPoints).values({ ...values, routeId: id });
        }
      }
    });
    return this.details(id);
  }

  /**
   * The operator cancels one day's trip: every passenger gets a full refund,
   * service fee included, and an email.
   */
  async cancelTrip(id: number, dto: CancelTripDto) {
    await this.details(id); // 404 if the route doesn't exist
    if (dto.travelDate < todayInSriLanka()) {
      throw new BadRequestException('That trip date is in the past');
    }
    return this.bookings.cancelTripByOperator(id, dto.travelDate, dto.reason);
  }

  private async upcomingBookings(routeId: number): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.routeId, routeId),
          eq(bookings.bookingStatus, 'confirmed'),
          gte(bookings.travelDate, todayInSriLanka()),
        ),
      );
    return row.n;
  }
}
