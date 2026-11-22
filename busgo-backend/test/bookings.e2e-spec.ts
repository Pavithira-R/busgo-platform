import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import { getDrizzleToken } from '@nestjs/drizzle';
import { Test } from '@nestjs/testing';
import { inArray, like } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { addDays, todayInSriLanka } from '../src/common/dates.js';
import type { Database } from '../src/db/relations.js';
import { bookings, users } from '../src/db/schema.js';

// Uses the seeded routes. Creates its own passengers (unique emails) and
// deletes them and their bookings afterwards.
const SUFFIX = `@bk-${Date.now()}.test`;

describe('Bookings (e2e)', () => {
  let app: INestApplication<App>;
  let db: Database;
  let alice: string; // tokens
  let bob: string;
  let staff: string;
  let routeId: number; // Colombo → Kandy luxury: 40 seats, LKR 950
  let kadawathaId: number;
  let otherRoutePointId: number;
  const travelDate = addDays(todayInSriLanka(), 10);

  const http = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function signUp(name: string) {
    const res = await http()
      .post('/auth/register')
      .send({
        fullName: name,
        email: `${name}${SUFFIX}`,
        password: 'Passw0rd!',
      })
      .expect(201);
    return res.body.accessToken as string;
  }

  const booking = (overrides: object = {}) => ({
    routeId,
    travelDate,
    seatNumber: 'C1',
    boardingPointId: kadawathaId,
    passengerName: 'Alice Perera',
    passengerEmail: 'alice@example.lk',
    passengerPhone: '+94 77 123 4567',
    passengerIdNumber: '199512345678',
    paymentMethod: 'ez_cash',
    ...overrides,
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
    db = app.get(getDrizzleToken());

    alice = await signUp('alice');
    bob = await signUp('bob');
    const staffLogin = await http()
      .post('/auth/login')
      .send({ email: 'staff@busgo.lk', password: 'Demo@12345' })
      .expect(200);
    staff = staffLogin.body.accessToken;

    const routes = await http()
      .get('/routes?from=CMB&to=KDY&serviceType=luxury')
      .expect(200);
    routeId = routes.body[0].id;
    const details = await http().get(`/routes/${routeId}`).expect(200);
    kadawathaId = details.body.boardingPoints[0].id;

    const jaffna = await http().get('/routes?from=CMB&to=JFN').expect(200);
    const jaffnaDetails = await http()
      .get(`/routes/${jaffna.body[0].id}`)
      .expect(200);
    otherRoutePointId = jaffnaDetails.body.boardingPoints[0].id;
  });

  afterAll(async () => {
    const testUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(like(users.email, `%${SUFFIX}`));
    const ids = testUsers.map((u) => u.id);
    if (ids.length) {
      await db.delete(bookings).where(inArray(bookings.userId, ids));
      await db.delete(users).where(inArray(users.id, ids));
    }
    await app.close();
  });

  it('requires signing in', async () => {
    await http().post('/bookings').send(booking()).expect(401);
    await http().get('/bookings').expect(401);
  });

  describe('POST /bookings', () => {
    let ticket: Record<string, any>;

    beforeAll(async () => {
      const res = await http()
        .post('/bookings')
        .set(auth(alice))
        .send(booking())
        .expect(201);
      ticket = res.body;
    });

    it('issues an e-ticket with price, boarding point and QR code', () => {
      expect(ticket.ticketId).toMatch(/^BG-[A-Z2-9]{8}$/);
      expect(ticket).toMatchObject({
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'ez_cash',
        travelDate,
        seatNumber: 'C1',
        price: { fare: 950, serviceFee: 100, total: 1050 },
        boarding: { name: 'Kadawatha', isStartingStand: false },
        passenger: { phone: '0771234567', idNumber: '199512345678' },
        route: { id: routeId, operator: { name: 'Ceylon Comfort Lines' } },
        cancellation: null,
      });
      expect(ticket.boarding.time).toMatch(/^\d{2}:\d{2}$/);
      expect(ticket.qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it('marks the seat as booked on the seat map', async () => {
      const res = await http()
        .get(`/routes/${routeId}/seats?date=${travelDate}`)
        .expect(200);
      const seat = res.body.seats.find(
        (s: { number: string }) => s.number === 'C1',
      );
      expect(seat.status).toBe('booked');
    });

    it('rejects a seat that is already booked', async () => {
      const res = await http()
        .post('/bookings')
        .set(auth(bob))
        .send(booking({ passengerName: 'Bob Silva' }))
        .expect(409);
      expect(res.body.message).toMatch(/already booked/);
    });

    it('lets only one of two simultaneous bookings for a seat succeed', async () => {
      const [a, b] = await Promise.all([
        http()
          .post('/bookings')
          .set(auth(alice))
          .send(booking({ seatNumber: 'D2' })),
        http()
          .post('/bookings')
          .set(auth(bob))
          .send(booking({ seatNumber: 'D2' })),
      ]);
      expect([a.status, b.status].sort((x, y) => x - y)).toEqual([201, 409]);
    });

    it('defaults to boarding at the starting bus stand', async () => {
      const res = await http()
        .post('/bookings')
        .set(auth(alice))
        .send(booking({ seatNumber: 'E3', boardingPointId: undefined }))
        .expect(201);
      expect(res.body.boarding).toMatchObject({
        name: 'Colombo Central Bus Stand',
        time: '08:00',
        isStartingStand: true,
      });
    });

    it.each([
      ['a seat not on this bus type', { seatNumber: 'A5' }, /does not exist/],
      [
        'a boarding point from another route',
        'OTHER_POINT',
        /not on this route/,
      ],
      [
        'a date more than 30 days ahead',
        { travelDate: addDays(todayInSriLanka(), 31) },
        /30 days/,
      ],
      ['a past date', { travelDate: '2020-01-01' }, /past/],
      [
        'a non-Sri Lankan phone number',
        { passengerPhone: '0112345678' },
        /mobile/,
      ],
      ['an invalid NIC', { passengerIdNumber: '12345' }, /NIC/],
      [
        'an unknown payment method',
        { paymentMethod: 'bitcoin' },
        /paymentMethod/,
      ],
    ])('rejects %s', async (_name, overrides, message) => {
      const body =
        overrides === 'OTHER_POINT'
          ? booking({ seatNumber: 'F1', boardingPointId: otherRoutePointId })
          : booking({ seatNumber: 'F1', ...(overrides as object) });
      const res = await http()
        .post('/bookings')
        .set(auth(alice))
        .send(body)
        .expect(400);
      expect(JSON.stringify(res.body.message)).toMatch(message);
    });

    it('returns 404 for a route that does not exist', async () => {
      await http()
        .post('/bookings')
        .set(auth(alice))
        .send(booking({ routeId: 999999 }))
        .expect(404);
    });
  });

  describe('viewing bookings', () => {
    let ticketId: string;

    beforeAll(async () => {
      const res = await http()
        .post('/bookings')
        .set(auth(alice))
        .send(booking({ seatNumber: 'G1' }))
        .expect(201);
      ticketId = res.body.ticketId;
    });

    it('lists only my own bookings', async () => {
      const mine = await http().get('/bookings').set(auth(alice)).expect(200);
      expect(mine.body.map((t: { ticketId: string }) => t.ticketId)).toContain(
        ticketId,
      );
      expect(mine.body[0]).not.toHaveProperty('qrCode'); // only on a single ticket

      const bobs = await http().get('/bookings').set(auth(bob)).expect(200);
      expect(
        bobs.body.map((t: { ticketId: string }) => t.ticketId),
      ).not.toContain(ticketId);
    });

    it('shows a ticket to its owner and to gate staff, but not to others', async () => {
      const own = await http()
        .get(`/bookings/${ticketId}`)
        .set(auth(alice))
        .expect(200);
      expect(own.body.qrCode).toMatch(/^data:image\/png/);
      await http().get(`/bookings/${ticketId}`).set(auth(staff)).expect(200);
      await http().get(`/bookings/${ticketId}`).set(auth(bob)).expect(404);
    });

    it('validates the ticket ID format', async () => {
      await http().get('/bookings/not-a-ticket').set(auth(alice)).expect(400);
      await http().get('/bookings/BG-AAAAAAAA').set(auth(alice)).expect(404);
    });
  });

  describe('cancelling', () => {
    let ticketId: string;

    beforeAll(async () => {
      const res = await http()
        .post('/bookings')
        .set(auth(alice))
        .send(booking({ seatNumber: 'H1' }))
        .expect(201);
      ticketId = res.body.ticketId;
    });

    it('quotes the refund for more than 7 days before departure', async () => {
      const res = await http()
        .get(`/bookings/${ticketId}/cancellation`)
        .set(auth(alice))
        .expect(200);
      // LKR 950 fare: 5% (47.50) + LKR 300 processing; service fee kept.
      expect(res.body).toMatchObject({
        canCancel: true,
        cancellationPercent: 5,
        cancellationFee: 47.5,
        processingFee: 300,
        serviceFee: 100,
        refundAmount: 602.5,
      });
    });

    it('does not let another passenger cancel', async () => {
      await http()
        .put(`/bookings/${ticketId}/cancel`)
        .set(auth(bob))
        .expect(404);
    });

    it('cancels, records the refund and frees the seat', async () => {
      const res = await http()
        .put(`/bookings/${ticketId}/cancel`)
        .set(auth(alice))
        .expect(200);
      expect(res.body).toMatchObject({
        status: 'cancelled',
        paymentStatus: 'refunded',
        cancellation: { charge: 347.5, refundAmount: 602.5 },
      });

      const seats = await http()
        .get(`/routes/${routeId}/seats?date=${travelDate}`)
        .expect(200);
      const seat = seats.body.seats.find(
        (s: { number: string }) => s.number === 'H1',
      );
      expect(seat.status).toBe('available');
    });

    it('cannot cancel twice', async () => {
      const res = await http()
        .put(`/bookings/${ticketId}/cancel`)
        .set(auth(alice))
        .expect(409);
      expect(res.body.message).toMatch(/already cancelled/);
    });

    it('lets someone else book the freed seat', async () => {
      await http()
        .post('/bookings')
        .set(auth(bob))
        .send(booking({ seatNumber: 'H1', passengerName: 'Bob Silva' }))
        .expect(201);
    });
  });
});
