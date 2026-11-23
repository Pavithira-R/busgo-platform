import type { TicketView } from './bookings.service.js';
import { cancellationEmail, ticketEmail } from './ticket-emails.js';

const ticket: TicketView = {
  ticketId: 'BG-7K2M9QXA',
  status: 'confirmed',
  paymentStatus: 'paid',
  paymentMethod: 'card',
  travelDate: '2026-12-03',
  seatNumber: 'C1',
  route: {
    id: 2,
    routeNumber: '01',
    operator: { id: 1, name: 'Ceylon Comfort Lines' },
    from: { code: 'CMB', name: 'Colombo Central Bus Stand', city: 'Colombo' },
    to: { code: 'KDY', name: 'Kandy Goods Shed Bus Stand', city: 'Kandy' },
    departureTime: '08:00',
    arrivalTime: '11:00',
    serviceType: 'luxury',
    busNumber: 'NC-1188',
  },
  boarding: { name: 'Kadawatha', time: '08:22', isStartingStand: false },
  passenger: {
    name: 'Nimal <script>alert(1)</script>',
    email: 'nimal@example.lk',
    phone: '0771234567',
    idNumber: null,
  },
  price: { fare: 950, serviceFee: 100, total: 1050 },
  cancellation: null,
  bookedAt: new Date('2026-11-23T10:00:00Z'),
};

describe('ticketEmail', () => {
  const mail = ticketEmail(ticket, Buffer.from('png-bytes'));
  const body = String(mail.html);

  it('has a clear subject with ticket, route and date', () => {
    expect(mail.subject).toBe(
      'Your BusGo e-ticket BG-7K2M9QXA: Colombo → Kandy, Thu, 3 Dec 2026',
    );
  });

  it('includes the trip, boarding point and payment details', () => {
    for (const text of [
      'Ceylon Comfort Lines',
      'Luxury (A/C)',
      'Kadawatha (about 08:22)',
      'LKR 1,050.00',
      'LKR 100.00',
    ]) {
      expect(body).toContain(text);
      expect(mail.text).toContain(text.includes('Luxury') ? 'Luxury' : '');
    }
  });

  it('embeds the QR code as an inline image', () => {
    expect(body).toContain('src="cid:ticket-qr"');
    expect(mail.attachments).toEqual([
      expect.objectContaining({ cid: 'ticket-qr', contentType: 'image/png' }),
    ]);
  });

  it('escapes passenger input so it cannot inject HTML', () => {
    expect(body).not.toContain('<script>');
    expect(body).toContain('&lt;script&gt;');
  });
});

describe('cancellationEmail', () => {
  it('shows the refund breakdown', () => {
    const mail = cancellationEmail({
      ...ticket,
      status: 'cancelled',
      cancellation: {
        cancelledAt: new Date(),
        charge: 347.5,
        refundAmount: 602.5,
      },
    });
    expect(mail.subject).toBe(
      'Booking BG-7K2M9QXA cancelled: refund LKR 602.50',
    );
    expect(String(mail.html)).toContain('LKR 347.50');
    expect(mail.text).toContain('Refund: LKR 602.50');
  });
});
