import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import { getDrizzleToken } from '@nestjs/drizzle';
import { InMemoryMailTransport, MailTransport } from '@nestjs/mail';
import { Test } from '@nestjs/testing';
import { eq, inArray, like } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { addDays, todayInSriLanka } from '../src/common/dates.js';
import type { Database } from '../src/db/relations.js';
import { bookings, busRoutes, operators, users } from '../src/db/schema.js';

// Creates its own operator, routes, passenger and bookings, and removes
// them afterwards. Seeded data is only read.
const RUN = Date.now();
const OPERATOR = `Test Coaches ${RUN}`;
const SUFFIX = `@admin-${RUN}.test`;

describe('Admin catalog (e2e)', () => {
  let app: INestApplication<App>;
  let db: Database;
  let admin: string;
  let staff: string;
  let rider: string;
  let operatorId: number;
  let routeId: number;
  const mailbox = new InMemoryMailTransport();
  const travelDate = addDays(todayInSriLanka(), 5);

  const http = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });
  const login = async (email: string, password: string) =>
    (await http().post('/auth/login').send({ email, password }).expect(200))
      .body.accessToken as string;

  const newRoute = (overrides: object = {}) => ({
    routeNumber: 'T-1',
    operatorId,
    fromCode: 'CMB',
    toCode: 'GLE',
    departureTime: '10:00',
    arrivalTime: '12:30',
    price: 1300,
    serviceType: 'super_luxury',
    busNumber: 'nd-1234',
    ...overrides,
  });

  const book = (seatNumber: string, boardingPointId?: number) =>
    http()
      .post('/bookings')
      .set(as(rider))
      .send({
        routeId,
        travelDate,
        seatNumber,
        boardingPointId,
        passengerName: 'Ruwan Jayasinghe',
        passengerEmail: `ruwan${SUFFIX}`,
        passengerPhone: '0712345678',
        paymentMethod: 'card',
      });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailTransport)
      .useValue(mailbox)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
    db = app.get(getDrizzleToken());

    admin = await login('admin@busgo.lk', 'Admin@12345');
    staff = await login('staff@busgo.lk', 'Demo@12345');
    rider = (
      await http()
        .post('/auth/register')
        .send({
          fullName: 'Ruwan',
          email: `ruwan${SUFFIX}`,
          password: 'Passw0rd!',
        })
        .expect(201)
    ).body.accessToken;
  });

  afterAll(async () => {
    const ops = await db
      .select({ id: operators.id })
      .from(operators)
      .where(like(operators.name, `%${RUN}%`));
    const opIds = ops.map((o) => o.id);
    if (opIds.length) {
      const routes = await db
        .select({ id: busRoutes.id })
        .from(busRoutes)
        .where(inArray(busRoutes.operatorId, opIds));
      const routeIds = routes.map((r) => r.id);
      if (routeIds.length) {
        await db.delete(bookings).where(inArray(bookings.routeId, routeIds));
        await db.delete(busRoutes).where(inArray(busRoutes.id, routeIds));
      }
      await db.delete(operators).where(inArray(operators.id, opIds));
    }
    await db.delete(users).where(like(users.email, `%${SUFFIX}`));
    await app.close();
  });

  it('is for admins only', async () => {
    await http().get('/admin/operators').expect(401);
    await http().get('/admin/operators').set(as(staff)).expect(403);
    await http().get('/admin/routes').set(as(rider)).expect(403);
  });

  describe('operators', () => {
    it('adds an operator, and refuses a duplicate name', async () => {
      const res = await http()
        .post('/admin/operators')
        .set(as(admin))
        .send({ name: OPERATOR, phone: '0112345678' })
        .expect(201);
      operatorId = res.body.id;
      expect(res.body).toMatchObject({ name: OPERATOR, isActive: true });

      await http()
        .post('/admin/operators')
        .set(as(admin))
        .send({ name: OPERATOR })
        .expect(409);
    });

    it('lists operators with their route counts', async () => {
      const res = await http()
        .get('/admin/operators')
        .set(as(admin))
        .expect(200);
      const mine = res.body.find((o: { id: number }) => o.id === operatorId);
      expect(mine).toMatchObject({ routeCount: 0, phone: '0112345678' });
    });
  });

  describe('routes', () => {
    it('creates a route with seats and duration worked out', async () => {
      const res = await http()
        .post('/admin/routes')
        .set(as(admin))
        .send(newRoute())
        .expect(201);
      routeId = res.body.id;
      expect(res.body).toMatchObject({
        totalSeats: 30, // Super Luxury 2+1
        durationMinutes: 150,
        busNumber: 'ND-1234',
        isActive: true,
        upcomingBookings: 0,
        boardingPoints: [],
      });
      const search = await http().get('/routes?from=CMB&to=GLE').expect(200);
      expect(search.body.map((r: { id: number }) => r.id)).toContain(routeId);
    });

    it.each([
      ['an unknown stop', { toCode: 'XYZ' }, 400],
      ['the same start and end', { toCode: 'CMB' }, 400],
      ['a badly formatted time', { departureTime: '9am' }, 400],
      ['a missing operator', { operatorId: 999999 }, 404],
    ])('rejects %s', async (_name, overrides, status) => {
      await http()
        .post('/admin/routes')
        .set(as(admin))
        .send(newRoute(overrides))
        .expect(status);
    });

    it('updates the price for new bookings only', async () => {
      const res = await http()
        .patch(`/admin/routes/${routeId}`)
        .set(as(admin))
        .send({ price: 1450 })
        .expect(200);
      expect(res.body.price).toBe(1450);
    });
  });

  describe('boarding points', () => {
    it('sets ordered boarding points with estimated times', async () => {
      const res = await http()
        .put(`/admin/routes/${routeId}/boarding-points`)
        .set(as(admin))
        .send({
          points: [
            { name: 'Panadura', minutesFromStart: 40 },
            { name: 'Aluthgama', minutesFromStart: 80 },
          ],
        })
        .expect(200);
      expect(res.body.boardingPoints).toEqual([
        expect.objectContaining({ name: 'Panadura', order: 1, time: '10:40' }),
        expect.objectContaining({ name: 'Aluthgama', order: 2, time: '11:20' }),
      ]);
    });

    it('reorders and renames, keeping existing points by id', async () => {
      const before = await http()
        .get(`/admin/routes/${routeId}`)
        .set(as(admin));
      const [panadura, aluthgama] = before.body.boardingPoints;
      const res = await http()
        .put(`/admin/routes/${routeId}/boarding-points`)
        .set(as(admin))
        .send({
          points: [
            { id: panadura.id, name: 'Panadura Town', minutesFromStart: 35 },
            { name: 'Kalutara', minutesFromStart: 55 },
            { id: aluthgama.id, name: 'Aluthgama', minutesFromStart: 85 },
          ],
        })
        .expect(200);
      expect(
        res.body.boardingPoints.map((p: { id: number; name: string }) => [
          p.name,
          p.id,
        ]),
      ).toEqual([
        ['Panadura Town', panadura.id],
        ['Kalutara', expect.any(Number)],
        ['Aluthgama', aluthgama.id],
      ]);
    });

    it.each([
      [
        'out of travel order',
        [
          { name: 'Moratuwa', minutesFromStart: 60 },
          { name: 'Wadduwa', minutesFromStart: 30 },
        ],
        /travel order/,
      ],
      [
        'after the bus arrives',
        [{ name: 'Galle Fort', minutesFromStart: 200 }],
        /after the bus arrives/,
      ],
    ])('rejects points %s', async (_name, points, message) => {
      const res = await http()
        .put(`/admin/routes/${routeId}/boarding-points`)
        .set(as(admin))
        .send({ points })
        .expect(400);
      expect(res.body.message).toMatch(message);
    });
  });

  describe('protecting existing bookings', () => {
    let kalutaraId: number;

    beforeAll(async () => {
      const route = await http().get(`/admin/routes/${routeId}`).set(as(admin));
      kalutaraId = route.body.boardingPoints[1].id;
      const res = await book('A1', kalutaraId).expect(201);
      expect(res.body.price.fare).toBe(1450); // the updated price
    });

    it('will not change the bus type while seats are sold', async () => {
      const res = await http()
        .patch(`/admin/routes/${routeId}`)
        .set(as(admin))
        .send({ serviceType: 'normal' })
        .expect(409);
      expect(res.body.message).toMatch(/upcoming booking/);
    });

    it('will not remove a boarding point someone is booked to board at', async () => {
      const route = await http().get(`/admin/routes/${routeId}`).set(as(admin));
      const others = route.body.boardingPoints
        .filter((p: { id: number }) => p.id !== kalutaraId)
        .map((p: { id: number; name: string; minutesFromStart: number }) => ({
          id: p.id,
          name: p.name,
          minutesFromStart: p.minutesFromStart,
        }));
      const res = await http()
        .put(`/admin/routes/${routeId}/boarding-points`)
        .set(as(admin))
        .send({ points: others })
        .expect(409);
      expect(res.body.message).toMatch(/Kalutara/);
    });

    it('will not shorten the trip below its boarding points', async () => {
      await http()
        .patch(`/admin/routes/${routeId}`)
        .set(as(admin))
        .send({ arrivalTime: '11:00' })
        .expect(409);
    });
  });

  describe('deactivating', () => {
    it('hides a deactivated route from passengers but keeps it for admins', async () => {
      await http()
        .patch(`/admin/routes/${routeId}`)
        .set(as(admin))
        .send({ isActive: false })
        .expect(200);
      const search = await http().get('/routes?from=CMB&to=GLE').expect(200);
      expect(search.body.map((r: { id: number }) => r.id)).not.toContain(
        routeId,
      );
      await http().get(`/routes/${routeId}`).expect(404);

      const adminList = await http()
        .get(`/admin/routes?operatorId=${operatorId}`)
        .set(as(admin))
        .expect(200);
      expect(adminList.body[0]).toMatchObject({ id: routeId, isActive: false });

      await http()
        .patch(`/admin/routes/${routeId}`)
        .set(as(admin))
        .send({ isActive: true })
        .expect(200);
    });

    it('hides every route of a deactivated operator', async () => {
      await http()
        .patch(`/admin/operators/${operatorId}`)
        .set(as(admin))
        .send({ isActive: false })
        .expect(200);
      const search = await http().get('/routes?from=CMB&to=GLE').expect(200);
      expect(search.body.map((r: { id: number }) => r.id)).not.toContain(
        routeId,
      );
      await http()
        .post('/admin/routes')
        .set(as(admin))
        .send(newRoute())
        .expect(409);
      await http()
        .patch(`/admin/operators/${operatorId}`)
        .set(as(admin))
        .send({ isActive: true })
        .expect(200);
    });
  });

  describe('operator cancels a trip', () => {
    it('cancels all bookings that day with a full refund and emails passengers', async () => {
      await book('B1').expect(201);
      mailbox.clear();

      const res = await http()
        .post(`/admin/routes/${routeId}/cancel-trip`)
        .set(as(admin))
        .send({ travelDate, reason: 'Bus breakdown' })
        .expect(200);
      // Two bookings (A1, B1), each LKR 1450 + 100 fee.
      expect(res.body).toEqual({ cancelledBookings: 2, totalRefunded: 3100 });

      const rows = await db
        .select()
        .from(bookings)
        .where(eq(bookings.routeId, routeId));
      for (const b of rows) {
        expect(b).toMatchObject({
          bookingStatus: 'cancelled',
          paymentStatus: 'refunded',
          cancellationCharge: '0.00',
          refundAmount: b.totalAmount,
        });
      }

      const mail = await vi.waitFor(() =>
        mailbox.assertSent({
          to: `ruwan${SUFFIX}`,
          subject: /cancelled by the operator/,
        }),
      );
      expect(mail.html).toContain('Bus breakdown');
      expect(mail.html).toContain('LKR 1,550.00');
    });

    it('rejects a past trip date', async () => {
      await http()
        .post(`/admin/routes/${routeId}/cancel-trip`)
        .set(as(admin))
        .send({ travelDate: '2020-01-01', reason: 'Too late' })
        .expect(400);
    });
  });
});
