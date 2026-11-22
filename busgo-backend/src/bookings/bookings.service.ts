import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from '@nestjs/authorization';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, desc, eq, inArray } from 'drizzle-orm';
import {
  BusRoutesService,
  type RouteView,
} from '../bus-routes/bus-routes.service.js';
import { isValidSeat } from '../bus-routes/seat-layout.js';
import { addDays, sriLankaDateTime, todayInSriLanka } from '../common/dates.js';
import { addMinutes } from '../common/time.js';
import type { Database } from '../db/relations.js';
import { boardingPoints, type Booking, bookings } from '../db/schema.js';
import type { PublicUser } from '../users/users.service.js';
import { BookingPolicy } from './booking.policy.js';
import { type CreateBookingDto, MAX_DAYS_AHEAD } from './bookings.schemas.js';
import { cancellationQuote, priceFor } from './pricing.js';
import { qrDataUrl, type TicketQrPayload } from './qr.js';
import { generateTicketId } from './ticket-id.js';

/** A booking as the API returns it. */
export interface TicketView {
  ticketId: string;
  status: Booking['bookingStatus'];
  paymentStatus: Booking['paymentStatus'];
  paymentMethod: Booking['paymentMethod'];
  travelDate: string;
  seatNumber: string;
  route: Pick<
    RouteView,
    | 'id'
    | 'routeNumber'
    | 'operator'
    | 'from'
    | 'to'
    | 'departureTime'
    | 'arrivalTime'
    | 'serviceType'
    | 'busNumber'
  >;
  /** Where to get on, with the estimated time the bus arrives there. */
  boarding: { name: string; time: string; isStartingStand: boolean };
  passenger: {
    name: string;
    email: string;
    phone: string | null;
    idNumber: string | null;
  };
  price: { fare: number; serviceFee: number; total: number };
  cancellation: {
    cancelledAt: Date;
    charge: number;
    refundAmount: number;
  } | null;
  bookedAt: Date;
  /** PNG data URL, included when viewing a single ticket. */
  qrCode?: string;
}

const PG_UNIQUE_VIOLATION = '23505';

/** Finds the Postgres error inside a Drizzle error, if any. */
function pgError(err: unknown): { code?: string; constraint?: string } {
  const e = err as { cause?: unknown; code?: string; constraint?: string };
  return (e?.cause as typeof e) ?? e ?? {};
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly busRoutes: BusRoutesService,
    private readonly authorization: AuthorizationService,
  ) {}

  async create(user: PublicUser, dto: CreateBookingDto): Promise<TicketView> {
    const route = await this.busRoutes.findDetails(dto.routeId);

    const today = todayInSriLanka();
    if (dto.travelDate < today) {
      throw new BadRequestException('Travel date is in the past');
    }
    if (dto.travelDate > addDays(today, MAX_DAYS_AHEAD)) {
      throw new BadRequestException(
        `Bookings open ${MAX_DAYS_AHEAD} days before travel`,
      );
    }
    if (sriLankaDateTime(dto.travelDate, route.departureTime) <= new Date()) {
      throw new BadRequestException('This bus has already departed');
    }
    if (!isValidSeat(route.serviceType, dto.seatNumber)) {
      throw new BadRequestException(
        `Seat ${dto.seatNumber} does not exist on this bus`,
      );
    }
    if (
      dto.boardingPointId !== undefined &&
      !route.boardingPoints.some((p) => p.id === dto.boardingPointId)
    ) {
      throw new BadRequestException('Boarding point is not on this route');
    }

    const price = priceFor(route.price);
    const values = {
      userId: user.id,
      routeId: route.id,
      travelDate: dto.travelDate,
      seatNumber: dto.seatNumber,
      boardingPointId: dto.boardingPointId ?? null,
      passengerName: dto.passengerName,
      passengerEmail: dto.passengerEmail.toLowerCase(),
      passengerPhone: dto.passengerPhone,
      passengerIdNumber: dto.passengerIdNumber ?? null,
      basePrice: price.fare.toFixed(2),
      serviceFee: price.serviceFee.toFixed(2),
      totalAmount: price.total.toFixed(2),
      // Payment is simulated: treat it as successful straight away.
      paymentStatus: 'paid' as const,
      paymentMethod: dto.paymentMethod,
    };

    // Retry only if the random ticket ID happens to clash (very unlikely).
    for (let attempt = 1; ; attempt++) {
      const ticketId = generateTicketId();
      const qrPayload: TicketQrPayload = {
        ticketId,
        route: `${route.routeNumber} ${route.from.code}-${route.to.code}`,
        date: dto.travelDate,
        departure: route.departureTime,
        seat: dto.seatNumber,
        passenger: dto.passengerName,
      };
      try {
        // The partial unique index on (route, date, seat) is what makes
        // double booking impossible, even with simultaneous requests.
        const [booking] = await this.db
          .insert(bookings)
          .values({ ...values, ticketId, qrPayload })
          .returning();
        return this.toTicket(booking, route, { withQr: true });
      } catch (err) {
        const { code, constraint } = pgError(err);
        if (code !== PG_UNIQUE_VIOLATION) throw err;
        if (constraint === 'bookings_active_seat_uq') {
          throw new ConflictException(
            `Seat ${dto.seatNumber} is already booked for this trip`,
          );
        }
        if (attempt >= 3) throw err;
      }
    }
  }

  async listMine(user: PublicUser): Promise<TicketView[]> {
    const rows = await this.db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, user.id))
      .orderBy(desc(bookings.bookedAt));
    return this.toTickets(rows);
  }

  async findForUser(user: PublicUser, ticketId: string): Promise<TicketView> {
    const booking = await this.findVisible(user, ticketId);
    const [ticket] = await this.toTickets([booking], { withQr: true });
    return ticket;
  }

  /** What the passenger would get back if they cancelled now. */
  async quoteCancellation(user: PublicUser, ticketId: string) {
    const booking = await this.findOwned(user, ticketId);
    return this.quoteFor(booking);
  }

  async cancel(user: PublicUser, ticketId: string): Promise<TicketView> {
    const booking = await this.findOwned(user, ticketId);
    const quote = await this.quoteFor(booking);
    if (!quote.canCancel) throw new ConflictException(quote.reason);

    // Only a still-confirmed booking can change, so two cancel requests
    // at once can't both succeed.
    const [cancelled] = await this.db
      .update(bookings)
      .set({
        bookingStatus: 'cancelled',
        cancelledAt: new Date(),
        cancellationCharge: (
          quote.cancellationFee + quote.processingFee
        ).toFixed(2),
        refundAmount: quote.refundAmount.toFixed(2),
        paymentStatus: quote.refundAmount > 0 ? 'refunded' : 'paid',
      })
      .where(
        and(
          eq(bookings.id, booking.id),
          eq(bookings.bookingStatus, 'confirmed'),
        ),
      )
      .returning();
    if (!cancelled) {
      throw new ConflictException('This booking can no longer be cancelled');
    }
    const [ticket] = await this.toTickets([cancelled]);
    return ticket;
  }

  // ---------- helpers ----------

  private async quoteFor(booking: Booking) {
    if (booking.bookingStatus !== 'confirmed') {
      return {
        canCancel: false as const,
        reason: `This booking is already ${booking.bookingStatus}`,
      };
    }
    const routes = await this.busRoutes.findForBookings([booking.routeId]);
    const route = routes.get(booking.routeId)!;
    return cancellationQuote(
      {
        fare: Number(booking.basePrice),
        serviceFee: Number(booking.serviceFee),
      },
      sriLankaDateTime(booking.travelDate, route.departureTime),
    );
  }

  private async findByTicketId(ticketId: string): Promise<Booking> {
    const [booking] = await this.db
      .select()
      .from(bookings)
      .where(eq(bookings.ticketId, ticketId));
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  /** Other passengers' bookings look "not found" rather than "forbidden". */
  private async findVisible(user: PublicUser, ticketId: string) {
    const booking = await this.findByTicketId(ticketId);
    if (!(await this.authorization.can(BookingPolicy, 'view', user, booking))) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private async findOwned(user: PublicUser, ticketId: string) {
    const booking = await this.findVisible(user, ticketId);
    await this.authorization.authorize(BookingPolicy, 'cancel', user, booking);
    return booking;
  }

  private async toTickets(
    rows: Booking[],
    options: { withQr?: boolean } = {},
  ): Promise<TicketView[]> {
    const routes = await this.busRoutes.findForBookings([
      ...new Set(rows.map((b) => b.routeId)),
    ]);
    const pointIds = rows.flatMap((b) =>
      b.boardingPointId ? [b.boardingPointId] : [],
    );
    const points = pointIds.length
      ? await this.db
          .select()
          .from(boardingPoints)
          .where(inArray(boardingPoints.id, pointIds))
      : [];
    const pointById = new Map(points.map((p) => [p.id, p]));

    return Promise.all(
      rows.map((b) =>
        this.toTicket(b, routes.get(b.routeId)!, options, pointById),
      ),
    );
  }

  private async toTicket(
    b: Booking,
    route: RouteView,
    { withQr = false }: { withQr?: boolean } = {},
    pointById?: Map<number, typeof boardingPoints.$inferSelect>,
  ): Promise<TicketView> {
    const point = b.boardingPointId
      ? (pointById?.get(b.boardingPointId) ??
        (
          await this.db
            .select()
            .from(boardingPoints)
            .where(eq(boardingPoints.id, b.boardingPointId))
        )[0])
      : undefined;

    const ticket: TicketView = {
      ticketId: b.ticketId,
      status: b.bookingStatus,
      paymentStatus: b.paymentStatus,
      paymentMethod: b.paymentMethod,
      travelDate: b.travelDate,
      seatNumber: b.seatNumber,
      route: {
        id: route.id,
        routeNumber: route.routeNumber,
        operator: route.operator,
        from: route.from,
        to: route.to,
        departureTime: route.departureTime,
        arrivalTime: route.arrivalTime,
        serviceType: route.serviceType,
        busNumber: route.busNumber,
      },
      boarding: point
        ? {
            name: point.name,
            time: addMinutes(route.departureTime, point.minutesFromStart),
            isStartingStand: false,
          }
        : {
            name: route.from.name,
            time: route.departureTime,
            isStartingStand: true,
          },
      passenger: {
        name: b.passengerName,
        email: b.passengerEmail,
        phone: b.passengerPhone,
        idNumber: b.passengerIdNumber,
      },
      price: {
        fare: Number(b.basePrice),
        serviceFee: Number(b.serviceFee),
        total: Number(b.totalAmount),
      },
      cancellation: b.cancelledAt
        ? {
            cancelledAt: b.cancelledAt,
            charge: Number(b.cancellationCharge),
            refundAmount: Number(b.refundAmount),
          }
        : null,
      bookedAt: b.bookedAt,
    };
    if (withQr) {
      ticket.qrCode = await qrDataUrl(b.qrPayload as TicketQrPayload);
    }
    return ticket;
  }
}
