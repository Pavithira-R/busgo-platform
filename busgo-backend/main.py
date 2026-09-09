from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config import get_settings
from database import init_db

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[BusGo] Starting BusGo API...")
    await init_db()
    print("[BusGo] Database tables ready")
    yield
    print("[BusGo] Shutting down BusGo API")

app = FastAPI(
    title=settings.app_name,
    description="Bus E-Ticket Checkout System with QR codes, Gemini AI chatbot, and Stripe payments",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from routers import auth, routes, bookings, qr, chat, reviews, admin
app.include_router(auth.router)
app.include_router(routes.router)
app.include_router(bookings.router)
app.include_router(qr.router)
app.include_router(chat.router)
app.include_router(reviews.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"service": "BusGo API", "version": "1.0.0", "docs": "/docs", "status": "running"}

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": settings.app_name}

@app.get("/api/config/stripe-key")
async def stripe_publishable_key():
    return {"publishable_key": settings.stripe_publishable_key}

# Stripe webhook
import stripe
from services.stripe_service import verify_webhook

@app.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = verify_webhook(payload, sig)
    except Exception as e:
        return {"error": str(e)}
    if event["type"] == "payment_intent.succeeded":
        print(f"[STRIPE] Payment succeeded: {event['data']['object']['id']}")
    return {"received": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=settings.debug)
