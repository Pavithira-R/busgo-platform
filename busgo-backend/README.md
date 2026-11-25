# BusGo API

The NestJS backend for BusGo: accounts, bus search, seat bookings, e-tickets with QR codes, refunds, gate scanning and the admin area. See the [main README](../README.md) for the whole project.

## Setup

```bash
cp .env.example .env      # set JWT_SECRET to a long random value
npm install
npm run db:migrate        # create the tables
npm run db:seed           # sample stops, operators, routes and demo accounts
npm run start:dev         # http://localhost:3000, docs at /docs
```

Requires Node.js 24 and PostgreSQL 16+ (see the main README for creating the database).

## Scripts

| Script                | What it does                                         |
| --------------------- | ---------------------------------------------------- |
| `start:dev`           | Run with reload on change                            |
| `build`, `start:prod` | Compile to `dist/` and run it                        |
| `test`                | Unit tests                                           |
| `test:e2e`            | End-to-end tests against the database in `.env`      |
| `lint`, `format`      | Oxlint and Prettier                                  |
| `db:migrate`          | Apply migrations in `drizzle/`                       |
| `db:generate`         | Create a migration after changing `src/db/schema.ts` |
| `db:seed`             | Add the sample data (safe to run again)              |
| `db:reset`            | Empty the database and seed it again                 |
| `db:studio`           | Browse the data in Drizzle Studio                    |
| `db:up`, `db:down`    | Start or stop a PostgreSQL container (Docker)        |

## Settings (`.env`)

| Name                                                            | Purpose                                                                |
| --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`                                                  | PostgreSQL connection string                                           |
| `PORT`                                                          | API port (default 3000)                                                |
| `CORS_ORIGIN`                                                   | Website address allowed to call the API                                |
| `JWT_SECRET`                                                    | Signs login tokens; at least 32 characters (`openssl rand -base64 32`) |
| `JWT_TTL`                                                       | How long a login lasts (default `1h`)                                  |
| `MAIL_TRANSPORT`                                                | `file` saves emails to `MAIL_DIR`; `log` prints them                   |
| `MAIL_DIR`, `MAIL_FROM`                                         | Where emails are saved, and their sender                               |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_DEMO_PASSWORD` | Accounts created by `db:seed`                                          |

Settings are checked at start-up; the API refuses to start with a missing or invalid value.

## API overview

All routes are under `/api`. Full, interactive documentation is at `/docs` while the API runs.

| Area     | Routes                                                                                                                                                                          | Who                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Accounts | `POST /auth/register`, `POST /auth/login`, `GET` / `PATCH /auth/me`                                                                                                             | Anyone / signed in |
| Search   | `GET /routes/stops`, `/routes/operators`, `/routes?from=&to=&date=`, `/routes/:id`, `/routes/:id/seats?date=`                                                                   | Anyone             |
| Bookings | `POST /bookings`, `GET /bookings`, `GET /bookings/:ticketId`, `GET /bookings/:ticketId/cancellation`, `PUT /bookings/:ticketId/cancel`                                          | Signed in          |
| Gate     | `POST /qr/validate`, `GET /qr/lookup/:ticketId`, `GET /qr/history/:ticketId`                                                                                                    | Gate staff, admins |
| Admin    | `/admin/dashboard`, `/admin/operators`, `/admin/routes` (boarding points, trip cancellation), `/admin/bookings`, `/admin/passengers`, `/admin/staff`, `/admin/users/:id/status` | Admins             |
| Health   | `GET /health`                                                                                                                                                                   | Anyone             |

## Rules worth knowing

- **Seats can't be double-booked**: a unique database index on (route, date, seat) for active bookings settles simultaneous requests.
- **Booking window**: today up to 30 days ahead, Sri Lanka time (UTC+05:30), and not after the bus has left.
- **Price**: fare + LKR 100 service fee.
- **Passenger cancellations** deduct from the fare: more than 7 days before departure 5% + LKR 300; 3–7 days 10% + LKR 300; 24–72 hours 12% + LKR 350; under 24 hours 15% + LKR 350; none after departure. The service fee is not refunded.
- **Operator cancels a trip**: everyone booked gets the full amount back, service fee included.
- **QR codes** can be used once, on the travel date (overnight buses: until the next day, for towns reached after midnight).
