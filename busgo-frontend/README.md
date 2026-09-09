# BusGo Frontend — React + Vite + Tailwind

## Setup

```bash
cd busgo-frontend
npm install
cp .env.example .env   # set API URL
npm run dev             # → http://localhost:3000
```

Proxies `/api` to `http://localhost:8000` (FastAPI backend).

## Pages

- `/` — Home with search form
- `/search?from=CMB&to=KDY&date=2026-09-10` — Results
- `/booking/:tripId` — Seat selection + passenger form
- `/ticket/:ticketId` — E-ticket with QR code
- `/my-bookings` — Booking history
- `/login` / `/register` — Auth
- `/profile` — Edit profile + seat preference
- `/admin` — Admin dashboard (admin only)

## Features

- Responsive (mobile + desktop)
- Gemini AI chatbot (floating bubble)
- Interactive bus seat map
- QR e-ticket display
- Stripe payment integration
- JWT auth with protected routes
