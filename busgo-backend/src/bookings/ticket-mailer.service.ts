import { Injectable, Logger } from '@nestjs/common';
import { Mailer } from '@nestjs/mail';
import type { TicketView } from './bookings.service.js';
import { qrPng, type TicketQrPayload } from './qr.js';
import { cancellationEmail, ticketEmail } from './ticket-emails.js';

/**
 * Emails passengers about their bookings. Sending happens in the
 * background: a mail problem is logged but never fails the booking.
 */
@Injectable()
export class TicketMailer {
  private readonly logger = new Logger(TicketMailer.name);

  constructor(private readonly mailer: Mailer) {}

  sendTicket(ticket: TicketView, qr: TicketQrPayload): void {
    void this.deliver(ticket, async () => ticketEmail(ticket, await qrPng(qr)));
  }

  sendCancellation(ticket: TicketView): void {
    void this.deliver(ticket, () => Promise.resolve(cancellationEmail(ticket)));
  }

  private async deliver(
    ticket: TicketView,
    build: () => Promise<ReturnType<typeof ticketEmail>>,
  ): Promise<void> {
    try {
      await this.mailer.send({
        ...(await build()),
        to: { name: ticket.passenger.name, address: ticket.passenger.email },
      });
    } catch (err) {
      this.logger.error(
        `Could not email ${ticket.ticketId}: ${(err as Error).message}`,
      );
    }
  }
}
