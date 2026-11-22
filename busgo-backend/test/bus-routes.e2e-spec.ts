import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import { getDrizzleToken } from '@nestjs/drizzle';
import { Test } from '@nestjs/testing';
import { and, eq, like } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import type { Database } from '../src/db/relations.js';
import { bookings, busRoutes, busStops, users } from '../src/db/schema.js';

// Uses the seeded data (npm run db:seed). Test bookings use a unique
// ticket prefix and are deleted afterwards.
const PREFIX = `T${Date.now().toString(36).toUpperCase()}`;

/** A date N days from now as YYYY-MM-DD. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

describe('Bus routes (e2e)', () => {
  let app: INestApplication<App>;
  let db: Database;
  let cmbKdyNormalId: number;
  const travelDate = daysFromNow(30);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
    db = app.get(getDrizzleToken());

    // Seeded route 01: Colombo → Kandy, normal bus (50 seats).
    const [route] = await db
      .select({ id: busRoutes.id })
      .from(busRoutes)
      .innerJoin(busStops, eq(busStops.id, busRoutes.fromStopId))
      .where(
        and(
          eq(busRoutes.routeNumber, '01'),
          eq(busStops.code, 'CMB'),
          eq(busRoutes.serviceType, 'normal'),
        ),
      );
    cmbKdyNormalId = route.id;

    // Two bookings on that route: one active (A1), one cancelled (A2).
    const [passenger] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, 'passenger@busgo.lk'));
    const base = {
      userId: passenger.id,
      routeId: cmbKdyNormalId,
      travelDate,
      passengerName: 'E2E',
      passengerEmail: 'e2e@test.lk',
      basePrice: '420.00',
      taxAmount: '21.00',
      totalAmount: '441.00',
      qrPayload: {},
    };
    await db.insert(bookings).values([
      { ...base, ticketId: `${PREFIX}-1`, seatNumber: 'A1' },
      {
        ...base,
        ticketId: `${PREFIX}-2`,
        seatNumber: 'A2',
        bookingStatus: 'cancelled',
      },
    ]);
  });

  afterAll(async () => {
    await db.delete(bookings).where(like(bookings.ticketId, `${PREFIX}-%`));
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('lists the 10 bus stops without signing in', async () => {
    const res = await http().get('/routes/stops').expect(200);
    expect(res.body).toHaveLength(10);
    expect(res.body).toContainEqual(
      expect.objectContaining({ code: 'CMB', city: 'Colombo' }),
    );
  });

  it('lists the 5 private operators', async () => {
    const res = await http().get('/routes/operators').expect(200);
    expect(res.body).toHaveLength(5);
    expect(res.body[0]).toEqual({
      id: expect.any(Number),
      name: expect.any(String),
    });
  });

  describe('GET /routes', () => {
    it('filters by origin and destination (codes are case-insensitive)', async () => {
      const res = await http().get('/routes?from=cmb&to=KDY').expect(200);
      expect(res.body.length).toBeGreaterThan(0);
      for (const r of res.body) {
        expect(r.from.code).toBe('CMB');
        expect(r.to.code).toBe('KDY');
      }
    });

    it('filters by service type and returns friendly fields', async () => {
      const res = await http()
        .get('/routes?from=CMB&to=KDY&serviceType=luxury')
        .expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        serviceType: 'luxury',
        departureTime: '08:00',
        price: 950,
        totalSeats: 40,
        operator: { name: 'Ceylon Comfort Lines' },
      });
    });

    it('includes available seats when a date is given', async () => {
      const res = await http()
        .get(`/routes?from=CMB&to=KDY&serviceType=normal&date=${travelDate}`)
        .expect(200);
      const route = res.body.find(
        (r: { id: number }) => r.id === cmbKdyNormalId,
      );
      // 50 seats - 1 active booking (the cancelled one doesn't count)
      expect(route.availableSeats).toBe(49);
    });

    it('filters by operator', async () => {
      const ops = await http().get('/routes/operators').expect(200);
      const northern = ops.body.find(
        (o: { name: string }) => o.name === 'Northern Star Coaches',
      );
      const res = await http()
        .get(`/routes?operatorId=${northern.id}`)
        .expect(200);
      expect(res.body.length).toBeGreaterThan(0);
      for (const r of res.body)
        expect(r.operator.name).toBe('Northern Star Coaches');
    });

    it('rejects past dates and bad values', async () => {
      await http().get('/routes?date=2020-01-01').expect(400);
      await http().get('/routes?date=not-a-date').expect(400);
      await http().get('/routes?serviceType=rocket').expect(400);
      await http().get('/routes?serviceType=standard').expect(400); // old name
    });

    it('returns an empty list when nothing matches', async () => {
      const res = await http().get('/routes?from=JFN&to=GLE').expect(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /routes/:id', () => {
    it('returns one route', async () => {
      const res = await http().get(`/routes/${cmbKdyNormalId}`).expect(200);
      expect(res.body).toMatchObject({ id: cmbKdyNormalId, routeNumber: '01' });
    });

    it('returns 404 for unknown and 400 for invalid ids', async () => {
      await http().get('/routes/999999').expect(404);
      await http().get('/routes/abc').expect(400);
    });
  });

  describe('GET /routes/:id/seats', () => {
    it('shows booked and free seats; cancelled seats are free again', async () => {
      const res = await http()
        .get(`/routes/${cmbKdyNormalId}/seats?date=${travelDate}`)
        .expect(200);
      // Normal bus: 2 + aisle + 3, 10 rows
      expect(res.body.layout).toEqual({
        rows: 10,
        seatsPerRow: 5,
        aisleAfter: 2,
      });
      expect(res.body.totalSeats).toBe(50);
      expect(res.body.availableSeats).toBe(49);
      const status = (n: string) =>
        res.body.seats.find((s: { number: string }) => s.number === n).status;
      expect(status('A1')).toBe('booked');
      expect(status('A2')).toBe('available');
    });

    it('requires a valid future date', async () => {
      await http().get(`/routes/${cmbKdyNormalId}/seats`).expect(400);
      await http()
        .get(`/routes/${cmbKdyNormalId}/seats?date=2020-01-01`)
        .expect(400);
    });
  });
});
