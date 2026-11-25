import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import { getDrizzleToken } from '@nestjs/drizzle';
import { InMemoryMailTransport, MailTransport } from '@nestjs/mail';
import { Test } from '@nestjs/testing';
import { eq, inArray } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { generateTicketId } from '../src/bookings/ticket-id.js';
import { addDays, todayInSriLanka } from '../src/common/dates.js';
import type { Database } from '../src/db/relations.js';
import { bookings, scanLogs, users } from '../src/db/schema.js';

// Inserts its own bookings straight into the database (to control travel
// dates), and deletes them and their scan logs afterwards.
const GATE = `E2E Gate ${Date.now()}`;

describe('QR ticket validation (e2e)', () => {
  let app: INestApplication<App>;
  let db: Database;
  let staff: string;
  let admin: string;
  let passenger: string;
  let passengerId: number;
  let normalRouteId: number; // Colombo → Kandy 06:00 (same-day)
  let overnightRouteId: number; // Colombo → Jaffna 21:00 (arrives 05:00)
  const created: number[] = [];
  const today = todayInSriLanka();

  const http = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const login = async (email: string, password: string) =>
    (await http().post('/auth/login').send({ email, password }).expect(200))
      .body.accessToken as string;

  /** A booking in the database, skipping the booking rules on purpose. */
  async function makeBooking(opts: {
    travelDate: string;
    routeId?: number;
    status?: 'confirmed' | 'cancelled';
    seat: string;
  }) {
    const ticketId = generateTicketId();
    const [row] = await db
      .insert(bookings)
      .values({
        ticketId,
        userId: passengerId,
        routeId: opts.routeId ?? normalRouteId,
        travelDate: opts.travelDate,
        seatNumber: opts.seat,
        passengerName: 'Saman Kumara',
        passengerEmail: 'saman@example.lk',
        passengerPhone: '0771234567',
        basePrice: '420.00',
        serviceFee: '100.00',
        totalAmount: '520.00',
        paymentStatus: 'paid',
        bookingStatus: opts.status ?? 'confirmed',
        qrPayload: { ticketId },
      })
      .returning();
    created.push(row.id);
    return ticketId;
  }

  const scan = (code: string, token = staff) =>
    http().post('/qr/validate').set(auth(token)).send({ code, location: GATE });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailTransport)
      .useValue(new InMemoryMailTransport())
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
    db = app.get(getDrizzleToken());

    staff = await login('staff@busgo.lk', 'Demo@12345');
    admin = await login('admin@busgo.lk', 'Admin@12345');
    passenger = await login('passenger@busgo.lk', 'Demo@12345');
    [{ id: passengerId }] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, 'passenger@busgo.lk'));

    const kandy = await http()
      .get('/routes?from=CMB&to=KDY&serviceType=normal')
      .expect(200);
    normalRouteId = kandy.body[0].id;
    const jaffna = await http()
      .get('/routes?from=CMB&to=JFN&serviceType=luxury')
      .expect(200);
    overnightRouteId = jaffna.body[0].id;
  });

  afterAll(async () => {
    await db.delete(scanLogs).where(eq(scanLogs.location, GATE));
    if (created.length) {
      await db.delete(bookings).where(inArray(bookings.id, created));
    }
    await app.close();
  });

  it('is only for gate staff and admins', async () => {
    const ticketId = await makeBooking({ travelDate: today, seat: 'J1' });
    await http().post('/qr/validate').send({ code: ticketId }).expect(401);
    await scan(ticketId, passenger).expect(403);
    await http().get(`/qr/lookup/${ticketId}`).set(auth(passenger)).expect(403);
  });

  it('lets a valid ticket through once, then reports it as used', async () => {
    const ticketId = await makeBooking({ travelDate: today, seat: 'J2' });

    const first = await scan(ticketId).expect(200);
    expect(first.body).toMatchObject({
      valid: true,
      result: 'valid',
      ticket: {
        ticketId,
        status: 'used',
        seatNumber: 'J2',
        passenger: { name: 'Saman Kumara' },
      },
    });

    const second = await scan(ticketId).expect(200);
    expect(second.body).toMatchObject({
      valid: false,
      result: 'already_used',
      message: 'Ticket already used',
    });
    expect(new Date(second.body.firstScannedAt).getTime()).toBeLessThanOrEqual(
      Date.now(),
    );
  });

  it('reads the JSON inside a real ticket QR code', async () => {
    const ticketId = await makeBooking({ travelDate: today, seat: 'J3' });
    const qrText = JSON.stringify({
      ticketId,
      seat: 'J3',
      route: '01 CMB-KDY',
    });
    const res = await scan(qrText).expect(200);
    expect(res.body.result).toBe('valid');
  });

  it('lets only one of two simultaneous scans through', async () => {
    const ticketId = await makeBooking({ travelDate: today, seat: 'J4' });
    const results = await Promise.all([scan(ticketId), scan(ticketId, admin)]);
    const outcomes = results.map((r) => r.body.result as string);
    expect(outcomes.sort((a, b) => a.localeCompare(b))).toEqual([
      'already_used',
      'valid',
    ]);
  });

  it.each([
    [
      'a cancelled booking',
      { status: 'cancelled' as const },
      'invalid',
      /cancelled/,
    ],
    [
      'a ticket for a future date',
      { travelDate: addDays(today, 3) },
      'invalid',
      /Ticket is for/,
    ],
    [
      'a ticket whose date has passed',
      { travelDate: addDays(today, -2) },
      'expired',
      /passed/,
    ],
  ])('rejects %s', async (_name, opts, result, message) => {
    const ticketId = await makeBooking({
      travelDate: today,
      seat: 'H5',
      ...opts,
    });
    const res = await scan(ticketId).expect(200);
    expect(res.body).toMatchObject({ valid: false, result });
    expect(res.body.message).toMatch(message);
    expect(res.body.ticket.ticketId).toBe(ticketId);
  });

  it("accepts last night's overnight bus the next morning", async () => {
    const ticketId = await makeBooking({
      travelDate: addDays(today, -1),
      routeId: overnightRouteId,
      seat: 'A1',
    });
    const res = await scan(ticketId).expect(200);
    expect(res.body.result).toBe('valid');
  });

  it('rejects codes that are not BusGo tickets', async () => {
    const junk = await scan('https://example.com/not-a-ticket').expect(200);
    expect(junk.body).toMatchObject({
      valid: false,
      result: 'invalid',
      message: 'Not a BusGo ticket',
    });
    expect(junk.body).not.toHaveProperty('ticket');

    const unknown = await scan('BG-AAAAAAAA').expect(200);
    expect(unknown.body.message).toBe('Ticket not found');
  });

  it('looks up a ticket without using it, and shows the scan history', async () => {
    const ticketId = await makeBooking({ travelDate: today, seat: 'J5' });

    const look = await http()
      .get(`/qr/lookup/${ticketId}`)
      .set(auth(staff))
      .expect(200);
    expect(look.body).toMatchObject({
      ticket: { ticketId, status: 'confirmed' },
      scanCount: 0,
      lastScan: null,
    });

    await scan(ticketId).expect(200);
    await scan(ticketId).expect(200);

    const history = await http()
      .get(`/qr/history/${ticketId}`)
      .set(auth(staff))
      .expect(200);
    expect(history.body.map((h: { result: string }) => h.result)).toEqual([
      'already_used',
      'valid',
    ]);
    expect(history.body[0]).toMatchObject({
      scannedBy: 'Gate Staff',
      location: GATE,
    });

    await http().get('/qr/history/BG-AAAAAAAA').set(auth(staff)).expect(404);
  });
});
