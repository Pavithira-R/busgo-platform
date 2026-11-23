import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import { getDrizzleToken } from '@nestjs/drizzle';
import { InMemoryMailTransport, MailTransport } from '@nestjs/mail';
import { Test } from '@nestjs/testing';
import { inArray, like } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { hashPassword } from '../src/common/password.js';
import { addDays, todayInSriLanka } from '../src/common/dates.js';
import type { Database } from '../src/db/relations.js';
import { bookings, users } from '../src/db/schema.js';

// Creates its own passenger, staff and bookings, removed afterwards. The
// dashboard is checked by how much its numbers change, so existing data
// doesn't matter.
const SUFFIX = `@insights-${Date.now()}.test`;

describe('Admin insights (e2e)', () => {
  let app: INestApplication<App>;
  let db: Database;
  let admin: string;
  let rider: string;
  let routeId: number; // Colombo → Kandy luxury, LKR 950
  let operatorId: number;
  const tickets: string[] = [];
  const today = todayInSriLanka();
  const travelDate = addDays(today, 11); // other test files use +10

  const http = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });
  const login = (email: string, password: string) =>
    http().post('/auth/login').send({ email, password });
  const dashboard = async () =>
    (
      await http()
        .get(`/admin/dashboard?from=${today}&to=${today}`)
        .set(as(admin))
        .expect(200)
    ).body;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailTransport)
      .useValue(new InMemoryMailTransport())
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
    db = app.get(getDrizzleToken());

    admin = (await login('admin@busgo.lk', 'Admin@12345').expect(200)).body
      .accessToken;
    rider = (
      await http()
        .post('/auth/register')
        .send({
          fullName: 'Insight Rider',
          email: `rider${SUFFIX}`,
          password: 'Passw0rd!',
          phone: '0779876543',
        })
        .expect(201)
    ).body.accessToken;

    const routes = await http()
      .get('/routes?from=CMB&to=KDY&serviceType=luxury')
      .expect(200);
    routeId = routes.body[0].id;
    operatorId = routes.body[0].operator.id;
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

  it('is for admins only', async () => {
    await http().get('/admin/dashboard').set(as(rider)).expect(403);
    await http().get('/admin/bookings').expect(401);
  });

  describe('dashboard', () => {
    it('counts new bookings, cancellations and revenue', async () => {
      const before = await dashboard();

      for (const seat of ['I1', 'I2', 'I3']) {
        const res = await http()
          .post('/bookings')
          .set(as(rider))
          .send({
            routeId,
            travelDate,
            seatNumber: seat,
            passengerName: 'Insight Rider',
            passengerEmail: `rider${SUFFIX}`,
            passengerPhone: '0779876543',
            paymentMethod: 'card',
          })
          .expect(201);
        tickets.push(res.body.ticketId);
      }
      // Cancel one, more than 7 days ahead: refund 950 − 47.50 − 300 = 602.50.
      await http()
        .put(`/bookings/${tickets[2]}/cancel`)
        .set(as(rider))
        .expect(200);

      const after = await dashboard();
      expect(after.range).toEqual({ from: today, to: today });
      expect(after.bookings.total - before.bookings.total).toBe(3);
      expect(after.bookings.confirmed - before.bookings.confirmed).toBe(2);
      expect(after.bookings.cancelled - before.bookings.cancelled).toBe(1);
      expect(after.revenue.grossSales - before.revenue.grossSales).toBe(3150);
      expect(after.revenue.refunds - before.revenue.refunds).toBe(602.5);
      expect(after.revenue.netRevenue - before.revenue.netRevenue).toBe(2547.5);
      expect(after.today.bookedToday - before.today.bookedToday).toBe(3);
      expect(after.passengers.newInRange - before.passengers.newInRange).toBe(
        0,
      );

      const route = after.popularRoutes.find(
        (r: { routeId: number }) => r.routeId === routeId,
      );
      expect(route).toMatchObject({
        from: 'Colombo',
        to: 'Kandy',
        departureTime: '08:00',
      });
      expect(after.daily).toEqual([expect.objectContaining({ date: today })]);
      expect(after.daily[0].bookings - before.daily[0].bookings).toBe(2);
    });

    it('defaults to the last 30 days and validates the range', async () => {
      const res = await http()
        .get('/admin/dashboard')
        .set(as(admin))
        .expect(200);
      expect(res.body.range).toEqual({ from: addDays(today, -29), to: today });
      expect(res.body.daily).toHaveLength(30);

      await http()
        .get(`/admin/dashboard?from=${today}&to=${addDays(today, -1)}`)
        .set(as(admin))
        .expect(400);
    });
  });

  describe('bookings list', () => {
    it('finds a booking by ticket ID or passenger email', async () => {
      const byTicket = await http()
        .get(`/admin/bookings?search=${tickets[0]}`)
        .set(as(admin))
        .expect(200);
      expect(byTicket.body).toMatchObject({ total: 1, page: 1, limit: 20 });
      expect(byTicket.body.items[0]).toMatchObject({ ticketId: tickets[0] });
      expect(byTicket.body.items[0]).not.toHaveProperty('qrCode');

      const byEmail = await http()
        .get(`/admin/bookings?search=rider${SUFFIX}`)
        .set(as(admin))
        .expect(200);
      expect(byEmail.body.total).toBe(3);
    });

    it('filters by status, date, route and operator', async () => {
      const q = `search=rider${SUFFIX}&travelDate=${travelDate}&routeId=${routeId}&operatorId=${operatorId}`;
      const cancelled = await http()
        .get(`/admin/bookings?${q}&status=cancelled`)
        .set(as(admin))
        .expect(200);
      expect(
        cancelled.body.items.map((t: { ticketId: string }) => t.ticketId),
      ).toEqual([tickets[2]]);
    });

    it('pages through results, newest first', async () => {
      const page2 = await http()
        .get(`/admin/bookings?search=rider${SUFFIX}&limit=1&page=2`)
        .set(as(admin))
        .expect(200);
      expect(page2.body).toMatchObject({ total: 3, page: 2, limit: 1 });
      expect(page2.body.items[0].ticketId).toBe(tickets[1]);
      await http().get('/admin/bookings?limit=500').set(as(admin)).expect(400);
    });
  });

  it('lists passengers with their booking counts', async () => {
    const res = await http()
      .get(`/admin/passengers?search=rider${SUFFIX}`)
      .set(as(admin))
      .expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0]).toMatchObject({
      fullName: 'Insight Rider',
      phone: '0779876543',
      bookings: 3,
      isActive: true,
    });
    expect(res.body.items[0]).not.toHaveProperty('passwordHash');
  });

  describe('staff accounts', () => {
    let staffId: number;
    const staffEmail = `gate${SUFFIX}`;

    it('creates a gate staff account that can scan tickets', async () => {
      const res = await http()
        .post('/admin/staff')
        .set(as(admin))
        .send({
          fullName: 'Kandy Gate',
          email: staffEmail,
          password: 'Gate#2026',
        })
        .expect(201);
      staffId = res.body.id;
      expect(res.body).toMatchObject({ role: 'staff', email: staffEmail });

      const token = (await login(staffEmail, 'Gate#2026').expect(200)).body
        .accessToken;
      await http().get(`/qr/lookup/${tickets[0]}`).set(as(token)).expect(200);
      await http().get('/admin/dashboard').set(as(token)).expect(403);

      const list = await http().get('/admin/staff').set(as(admin)).expect(200);
      expect(list.body.map((u: { email: string }) => u.email)).toContain(
        staffEmail,
      );

      await http()
        .post('/admin/staff')
        .set(as(admin))
        .send({
          fullName: 'Duplicate',
          email: staffEmail,
          password: 'Gate#2026',
        })
        .expect(409);
    });

    it('deactivates an account: no sign-in, and the current login stops working', async () => {
      const token = (await login(staffEmail, 'Gate#2026').expect(200)).body
        .accessToken;
      await http()
        .patch(`/admin/users/${staffId}/status`)
        .set(as(admin))
        .send({ isActive: false })
        .expect(200);
      await login(staffEmail, 'Gate#2026').expect(401);
      await http().get(`/qr/lookup/${tickets[0]}`).set(as(token)).expect(401);

      await http()
        .patch(`/admin/users/${staffId}/status`)
        .set(as(admin))
        .send({ isActive: true })
        .expect(200);
      await login(staffEmail, 'Gate#2026').expect(200);
    });

    it('protects admin accounts, including your own', async () => {
      const [otherAdmin] = await db
        .insert(users)
        .values({
          fullName: 'Second Admin',
          email: `admin2${SUFFIX}`,
          passwordHash: await hashPassword('Admin#2026'),
          role: 'admin',
        })
        .returning();
      await http()
        .patch(`/admin/users/${otherAdmin.id}/status`)
        .set(as(admin))
        .send({ isActive: false })
        .expect(403);

      const me = await http().get('/auth/me').set(as(admin)).expect(200);
      await http()
        .patch(`/admin/users/${me.body.id}/status`)
        .set(as(admin))
        .send({ isActive: false })
        .expect(400);
    });
  });
});
