import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, desc, eq, or } from 'drizzle-orm';
import {
  BookingsService,
  type TicketView,
} from '../bookings/bookings.service.js';
import { BusRoutesService } from '../bus-routes/bus-routes.service.js';
import { formatTravelDate } from '../common/format.js';
import { todayInSriLanka } from '../common/dates.js';
import type { Database } from '../db/relations.js';
import {
  type Booking,
  bookings,
  type ScanLog,
  scanLogs,
  users,
} from '../db/schema.js';
import type { PublicUser } from '../users/users.service.js';
import type { ValidateScanDto } from './qr.schemas.js';
import { isOvernight, ticketIdFromScan, travelWindow } from './scan-rules.js';

export interface ScanResult {
  valid: boolean;
  result: ScanLog['result'];
  /** A short message to show the gate staff. */
  message: string;
  scannedAt: Date;
  /** For already-used tickets: when it was first let through. */
  firstScannedAt?: Date;
  /** Ticket details to check against the passenger, when the ticket exists. */
  ticket?: TicketView;
}

interface Decision {
  result: ScanLog['result'];
  message: string;
  booking?: Booking;
  firstScannedAt?: Date;
}

@Injectable()
export class QrService {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly bookingsService: BookingsService,
    private readonly busRoutes: BusRoutesService,
  ) {}

  /** Checks a scanned ticket, marks it used if valid, and logs the scan. */
  async validate(staff: PublicUser, dto: ValidateScanDto): Promise<ScanResult> {
    const ticketId = ticketIdFromScan(dto.code);
    const scannedTicketId = (ticketId ?? dto.code.trim()).slice(0, 50);

    const decision = await this.db.transaction(async (tx) => {
      const decide = async (): Promise<Decision> => {
        if (!ticketId) {
          return { result: 'invalid', message: 'Not a BusGo ticket' };
        }
        // Lock the booking row so two gates scanning the same ticket at the
        // same moment can't both let the passenger through.
        const [booking] = await tx
          .select()
          .from(bookings)
          .where(eq(bookings.ticketId, ticketId))
          .for('update');
        if (!booking) {
          return { result: 'invalid', message: 'Ticket not found' };
        }

        if (booking.bookingStatus === 'cancelled') {
          return {
            result: 'invalid',
            message: 'This booking was cancelled',
            booking,
          };
        }
        if (booking.bookingStatus === 'used') {
          const [first] = await tx
            .select({ scannedAt: scanLogs.scannedAt })
            .from(scanLogs)
            .where(
              and(
                eq(scanLogs.bookingId, booking.id),
                eq(scanLogs.result, 'valid'),
              ),
            )
            .orderBy(asc(scanLogs.scannedAt))
            .limit(1);
          return {
            result: 'already_used',
            message: 'Ticket already used',
            booking,
            firstScannedAt: first?.scannedAt,
          };
        }

        const route = (
          await this.busRoutes.findForBookings([booking.routeId])
        ).get(booking.routeId)!;
        const window = travelWindow(
          booking.travelDate,
          todayInSriLanka(),
          isOvernight(route.departureTime, route.arrivalTime),
        );
        if (window === 'too_early') {
          return {
            result: 'invalid',
            message: `Ticket is for ${formatTravelDate(booking.travelDate)}`,
            booking,
          };
        }
        if (window === 'expired') {
          return {
            result: 'expired',
            message: 'Travel date has passed',
            booking,
          };
        }

        const [used] = await tx
          .update(bookings)
          .set({ bookingStatus: 'used' })
          .where(eq(bookings.id, booking.id))
          .returning();
        return {
          result: 'valid',
          message: 'Valid ticket: let the passenger board',
          booking: used,
        };
      };

      const outcome = await decide();
      await tx.insert(scanLogs).values({
        bookingId: outcome.booking?.id ?? null,
        scannedTicketId: scannedTicketId || '(empty)',
        result: outcome.result,
        scannedBy: staff.id,
        location: dto.location ?? null,
      });
      return outcome;
    });

    return {
      valid: decision.result === 'valid',
      result: decision.result,
      message: decision.message,
      scannedAt: new Date(),
      ...(decision.firstScannedAt && {
        firstScannedAt: decision.firstScannedAt,
      }),
      ...(decision.booking && {
        ticket: await this.bookingsService.viewOf(decision.booking),
      }),
    };
  }

  /** Ticket details for a dispute, without marking it used. */
  async lookup(ticketId: string) {
    const booking = await this.findBooking(ticketId);
    const scans = await this.history(ticketId);
    return {
      ticket: await this.bookingsService.viewOf(booking),
      scanCount: scans.length,
      lastScan: scans[0] ?? null,
    };
  }

  /** Every scan attempt for a ticket ID, newest first. */
  async history(ticketId: string) {
    const booking = await this.findBooking(ticketId);
    return this.db
      .select({
        scannedAt: scanLogs.scannedAt,
        result: scanLogs.result,
        location: scanLogs.location,
        scannedBy: users.fullName,
      })
      .from(scanLogs)
      .leftJoin(users, eq(users.id, scanLogs.scannedBy))
      .where(
        or(
          eq(scanLogs.bookingId, booking.id),
          eq(scanLogs.scannedTicketId, ticketId),
        ),
      )
      .orderBy(desc(scanLogs.scannedAt), desc(scanLogs.id));
  }

  private async findBooking(ticketId: string): Promise<Booking> {
    const [booking] = await this.db
      .select()
      .from(bookings)
      .where(eq(bookings.ticketId, ticketId));
    if (!booking) throw new NotFoundException('Ticket not found');
    return booking;
  }
}
