# BusGo — Bus E-Ticket Checkout System

FastAPI + Supabase PostgreSQL + Gemini AI + Stripe

## Quick Start

```bash
# 1. Clone and setup
cd busgo-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 2. Configure
cp .env.example .env
# Edit .env with your Supabase, Stripe, Gemini keys

# 3. Seed database
python seed.py

# 4. Run
python main.py
# or: uvicorn main:app --reload
```

API docs at http://localhost:8000/docs

## Docker

```bash
cp .env.example .env
docker compose up --build
```

## Data Model

```
BusCompany → Bus → Schedule → Trip → Booking → ScanLog
                      ↑                  ↑
               Route ─┘           User ──┘──→ Review
                 ↑
          BusStop ─┘ (from/to)
```

## Default Users

| Role       | Email              | Password |
|------------|--------------------|----------|
| Admin      | admin@busgo.com    | admin123 |
| Passenger  | demo@busgo.com     | demo123  |
| Gate Staff | gate@busgo.com     | gate123  |

## API Endpoints

- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login (JWT)
- `GET /api/routes/search?from_code=CMB&to_code=KDY&travel_date=2026-09-10` — Search trips
- `GET /api/routes/trips/{trip_id}/seats` — Seat availability
- `POST /api/bookings` — Book ticket (QR + Stripe)
- `POST /api/qr/validate` — Scan QR at gate
- `POST /api/chat` — Gemini chatbot
- `POST /api/reviews` — Leave a review
- `GET /api/admin/dashboard` — Admin stats
- Full CRUD for companies, buses, routes, schedules, trips
