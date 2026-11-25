import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import { getDrizzleToken } from '@nestjs/drizzle';
import { Test } from '@nestjs/testing';
import { like } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import type { Database } from '../src/db/relations.js';
import { users } from '../src/db/schema.js';

// Runs against the database in .env. Test users use a unique email
// suffix and are deleted afterwards.
const SUFFIX = `@e2e-${Date.now()}.test`;

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let db: Database;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
    db = app.get(getDrizzleToken());
  });

  afterAll(async () => {
    await db.delete(users).where(like(users.email, `%${SUFFIX}`));
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const email = (name: string) => `${name}${SUFFIX}`;

  function register(name: string, extra: object = {}) {
    return http()
      .post('/auth/register')
      .send({
        fullName: 'Test User',
        email: email(name),
        password: 'Passw0rd!',
        ...extra,
      });
  }

  describe('POST /auth/register', () => {
    it('creates a passenger and returns a token without the password hash', async () => {
      const res = await register('new').expect(201);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user).toMatchObject({
        email: email('new'),
        role: 'passenger',
      });
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('rejects a duplicate email with 409', async () => {
      await register('dup').expect(201);
      await register('dup').expect(409);
    });

    it('treats emails case-insensitively', async () => {
      await register('case').expect(201);
      await http()
        .post('/auth/register')
        .send({
          fullName: 'Test User',
          email: email('CASE'),
          password: 'Passw0rd!',
        })
        .expect(409);
    });

    it('rejects invalid input with 400', async () => {
      const res = await http()
        .post('/auth/register')
        .send({ fullName: 'X', email: 'nope', password: '123' })
        .expect(400);
      expect(JSON.stringify(res.body.message)).toMatch(/email/i);
    });

    it('ignores a role sent by the client', async () => {
      const res = await register('sneaky', { role: 'admin' }).expect(201);
      expect(res.body.user.role).toBe('passenger');
    });
  });

  describe('POST /auth/login', () => {
    it('signs in with the right password', async () => {
      await register('login').expect(201);
      const res = await http()
        .post('/auth/login')
        .send({ email: email('login'), password: 'Passw0rd!' })
        .expect(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
    });

    it('returns the same 401 for a wrong password and an unknown email', async () => {
      await register('wrongpw').expect(201);
      const wrong = await http()
        .post('/auth/login')
        .send({ email: email('wrongpw'), password: 'nope' })
        .expect(401);
      const unknown = await http()
        .post('/auth/login')
        .send({ email: email('ghost'), password: 'nope' })
        .expect(401);
      expect(wrong.body.message).toBe(unknown.body.message);
    });
  });

  describe('GET/PATCH /auth/me', () => {
    it('requires a token', async () => {
      await http().get('/auth/me').expect(401);
      await http()
        .get('/auth/me')
        .set('Authorization', 'Bearer not.a.token')
        .expect(401);
    });

    it('returns and updates the signed-in user', async () => {
      const { body } = await register('me').expect(201);
      const auth = { Authorization: `Bearer ${body.accessToken}` };

      const me = await http().get('/auth/me').set(auth).expect(200);
      expect(me.body.email).toBe(email('me'));

      const updated = await http()
        .patch('/auth/me')
        .set(auth)
        .send({ fullName: 'New Name', idNumber: '200012345678' })
        .expect(200);
      expect(updated.body).toMatchObject({
        fullName: 'New Name',
        idNumber: '200012345678',
        email: email('me'),
      });
    });

    it('cannot change email or role through the profile', async () => {
      const { body } = await register('locked').expect(201);
      const res = await http()
        .patch('/auth/me')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .send({ email: 'other@x.lk', role: 'admin' })
        .expect(200);
      expect(res.body).toMatchObject({
        email: email('locked'),
        role: 'passenger',
      });
    });
  });
});
