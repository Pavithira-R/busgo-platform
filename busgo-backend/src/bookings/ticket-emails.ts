import { html, type MailContent, type SafeHtml } from '@nestjs/mail';
import {
  formatLkr,
  formatTravelDate,
  SERVICE_TYPE_LABELS,
} from '../common/format.js';
import type { TicketView } from './bookings.service.js';

const QR_CID = 'ticket-qr';

/** Shared email frame with inline styles (email apps ignore <style> tags). */
function layout(title: string, body: SafeHtml): SafeHtml {
  return html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
      </head>
      <body
        style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a"
      >
        <div
          style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden"
        >
          <div style="background:#0f766e;color:#ffffff;padding:20px 24px">
            <div style="font-size:22px;font-weight:bold">BusGo</div>
            <div style="font-size:14px;opacity:.9">${title}</div>
          </div>
          <div style="padding:24px">${body}</div>
          <div
            style="padding:16px 24px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0"
          >
            This is an automated message from BusGo. Please do not reply.
          </div>
        </div>
      </body>
    </html>`;
}

function row(label: string, value: string): SafeHtml {
  return html`<tr>
    <td style="padding:6px 0;color:#64748b;width:40%">${label}</td>
    <td style="padding:6px 0;font-weight:bold">${value}</td>
  </tr>`;
}

function tripRows(t: TicketView): SafeHtml[] {
  return [
    row('Ticket ID', t.ticketId),
    row(
      'Route',
      `${t.route.from.city} → ${t.route.to.city} (${t.route.routeNumber})`,
    ),
    row('Operator', t.route.operator.name),
    row('Bus type', SERVICE_TYPE_LABELS[t.route.serviceType]),
    row('Date', formatTravelDate(t.travelDate)),
    row('Departs', `${t.route.departureTime} from ${t.route.from.name}`),
    row('Board at', `${t.boarding.name} (about ${t.boarding.time})`),
    row('Seat', t.seatNumber),
    row('Passenger', t.passenger.name),
  ];
}

/** The e-ticket sent right after booking, with the QR code inline. */
export function ticketEmail(t: TicketView, qrPng: Buffer): MailContent {
  const subject = `Your BusGo e-ticket ${t.ticketId}: ${t.route.from.city} → ${t.route.to.city}, ${formatTravelDate(t.travelDate)}`;
  const body = html` <p style="margin:0 0 16px">
      Hi ${t.passenger.name}, your seat is booked. Show this QR code when you
      board.
    </p>
    <div style="text-align:center;margin:0 0 16px">
      <img
        src="cid:${QR_CID}"
        width="220"
        height="220"
        alt="Ticket QR code ${t.ticketId}"
      />
      <div style="font-size:18px;font-weight:bold;letter-spacing:2px">
        ${t.ticketId}
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${tripRows(t)}
    </table>
    <h3 style="font-size:15px;margin:20px 0 8px">Payment</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${row('Fare', formatLkr(t.price.fare))}
      ${row('Service fee', formatLkr(t.price.serviceFee))}
      ${row('Total paid', formatLkr(t.price.total))}
    </table>
    <p style="font-size:12px;color:#64748b;margin:20px 0 0">
      Cancellation: more than 7 days before departure 5% + LKR 300; 3–7 days 10%
      + LKR 300; 24–72 hours 12% + LKR 350; under 24 hours 15% + LKR 350. The
      service fee is not refunded. No refunds after departure.
    </p>`;

  const text = [
    `Hi ${t.passenger.name}, your seat is booked. Show your QR code when you board.`,
    '',
    `Ticket ID: ${t.ticketId}`,
    `Route: ${t.route.from.city} -> ${t.route.to.city} (${t.route.routeNumber})`,
    `Operator: ${t.route.operator.name}`,
    `Bus type: ${SERVICE_TYPE_LABELS[t.route.serviceType]}`,
    `Date: ${formatTravelDate(t.travelDate)}`,
    `Departs: ${t.route.departureTime} from ${t.route.from.name}`,
    `Board at: ${t.boarding.name} (about ${t.boarding.time})`,
    `Seat: ${t.seatNumber}`,
    `Total paid: ${formatLkr(t.price.total)} (fare ${formatLkr(t.price.fare)} + service fee ${formatLkr(t.price.serviceFee)})`,
  ].join('\n');

  return {
    subject,
    html: layout('Your e-ticket', body),
    text,
    attachments: [
      {
        cid: QR_CID,
        filename: `${t.ticketId}.png`,
        content: qrPng,
        contentType: 'image/png',
      },
    ],
  };
}

/** Confirmation after a passenger cancels, showing the refund. */
export function cancellationEmail(t: TicketView): MailContent {
  const c = t.cancellation!;
  const subject = `Booking ${t.ticketId} cancelled: refund ${formatLkr(c.refundAmount)}`;
  const body = html` <p style="margin:0 0 16px">
      Hi ${t.passenger.name}, your booking has been cancelled and your seat
      released.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${tripRows(t)}
    </table>
    <h3 style="font-size:15px;margin:20px 0 8px">Refund</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${row('Amount paid', formatLkr(t.price.total))}
      ${row('Service fee (not refunded)', formatLkr(t.price.serviceFee))}
      ${row('Cancellation charges', formatLkr(c.charge))}
      ${row('Refund', formatLkr(c.refundAmount))}
    </table>
    <p style="font-size:12px;color:#64748b;margin:20px 0 0">
      Refunds go back to your original payment method within about 3 working
      days, plus 2–4 working days for your bank.
    </p>`;

  const text = [
    `Hi ${t.passenger.name}, your booking ${t.ticketId} has been cancelled.`,
    `Route: ${t.route.from.city} -> ${t.route.to.city}, ${formatTravelDate(t.travelDate)}`,
    `Amount paid: ${formatLkr(t.price.total)}`,
    `Service fee (not refunded): ${formatLkr(t.price.serviceFee)}`,
    `Cancellation charges: ${formatLkr(c.charge)}`,
    `Refund: ${formatLkr(c.refundAmount)}`,
  ].join('\n');

  return { subject, html: layout('Booking cancelled', body), text };
}
