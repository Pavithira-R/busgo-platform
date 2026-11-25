# BusGo website

The React website for BusGo: bus search, seat booking, e-tickets and the admin area, in English, Sinhala and Tamil. See the [main README](../README.md) for the whole project.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
```

The website calls the API through `/api`; during development Vite forwards these calls to the API at http://localhost:3000, so start the API first (see `busgo-backend`).

## Scripts

| Script                   | What it does                                          |
| ------------------------ | ----------------------------------------------------- |
| `dev`                    | Development server with live reload                   |
| `build`, `preview`       | Type-check and build to `dist/`, then serve the build |
| `test`, `test:watch`     | Vitest and Testing Library                            |
| `typecheck`, `lint`      | TypeScript and Oxlint                                 |
| `format`, `format:check` | Prettier                                              |

## Where things are

```
src/
  pages/        Passenger pages: home, search results, route, booking, ticket, my bookings, login...
  search/       Search form, date strip, result cards
  booking/      Seat map, passenger and payment steps, cancellation
  admin/        Admin area (loaded only when an admin opens it): dashboard, operators, routes, bookings, people
  auth/         Login state and page guards
  components/   Layout and shared building blocks
  i18n/         Text in English (en.ts), Sinhala (si.ts) and Tamil (ta.ts)
  lib/          API client, dates in Sri Lanka time, prices, form validation
  test/         Test helpers and sample data
```

## Languages

All text lives in `src/i18n`. `en.ts` is the source; `si.ts` and `ta.ts` translate it. A test fails if a Sinhala or Tamil text is missing or a `{{placeholder}}` is broken. Bus type names stay in English in every language, as passengers in Sri Lanka use them.
