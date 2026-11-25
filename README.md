# BusGo

Book intercity bus seats across Sri Lanka: search a route, pick a seat, choose where to board, pay, and get an e-ticket with a QR code. Gate staff scan the QR code when passengers board; admins manage operators, routes and bookings.

The website works in **English, සිංහල and தமிழ்**.

> Payments are simulated (card, eZ Cash, bank transfer): no real money is taken. Operators in the sample data are fictional.

## Features

**Passengers**

- Search between 10 major towns, with a 30-day date strip and filters for bus type and operator
- Seat maps for the usual Sri Lankan layouts: Normal (2+3), Semi-Luxury (2+2), Luxury AC (2+2) and Super Luxury AC (2+1)
- Board at the starting bus stand or any town on the way, with estimated times
- Price = fare + LKR 100 service fee
- E-ticket by email, with a QR code; print-friendly ticket page
- Cancel online and see the refund first (the deduction depends on how close departure is; the service fee is not refunded)
- Sri Lankan mobile number and NIC (old and new) checks

**Admins**

- Dashboard: revenue, bookings, top routes and bookings per operator, for the last 7, 30 or 90 days
- Operators, routes and boarding points; take a route on or off sale
- Cancel a day's trip: everyone booked is refunded in full and emailed
- Search all bookings; manage passenger and gate staff accounts

**Gate staff** (API, used by the upcoming Android app)

- Validate a ticket's QR code at boarding; each ticket can be used once

## Tech stack

| Part     | Built with                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| Website  | React 19, Vite, TypeScript, Tailwind CSS, TanStack Query, React Router, i18next, Recharts                       |
| API      | NestJS (TypeScript), Drizzle ORM, Zod, JWT login, Swagger docs                                                  |
| Database | PostgreSQL                                                                                                      |
| Tests    | Vitest and Testing Library (website), Vitest and Supertest (API, including end-to-end tests on a real database) |

## Repository layout

```
busgo-backend/    NestJS API (port 3000), database schema, migrations and seed data
busgo-frontend/   React website (port 5173); calls the API through /api
```

## Running it locally

You need **Node.js 24** and **PostgreSQL 16 or later**.

1. **Create the database** (in `psql` as an admin user):

   ```sql
   CREATE ROLE busgo LOGIN PASSWORD 'busgo';
   CREATE DATABASE busgo OWNER busgo;
   ```

   Or, with Docker: `npm run db:up` inside `busgo-backend`.

2. **Start the API**

   ```bash
   cd busgo-backend
   cp .env.example .env      # then set JWT_SECRET to a long random value
   npm install
   npm run db:migrate
   npm run db:seed
   npm run start:dev
   ```

   API documentation: http://localhost:3000/docs

3. **Start the website** (in a second terminal)

   ```bash
   cd busgo-frontend
   npm install
   npm run dev
   ```

   Open http://localhost:5173

Emails (e-tickets, cancellations) are saved as files in `busgo-backend/mail-outbox/`, so you can open them in a browser.

### Demo accounts

| Role       | Email              | Password    |
| ---------- | ------------------ | ----------- |
| Admin      | admin@busgo.lk     | Admin@12345 |
| Gate staff | staff@busgo.lk     | Demo@12345  |
| Passenger  | passenger@busgo.lk | Demo@12345  |

These are for local development only. `npm run db:reset` (in `busgo-backend`) restores the sample data.

## Tests

```bash
cd busgo-backend
npm test            # unit tests
npm run test:e2e    # end-to-end tests (needs the database)

cd ../busgo-frontend
npm test
```

## Status

- [x] API: accounts, search, bookings, QR codes, refunds, admin
- [x] Website: passenger and admin areas, three languages
- [ ] Android app for passengers and gate staff (Kotlin)
- [ ] Deployment on AWS
