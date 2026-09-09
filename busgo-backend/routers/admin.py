from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import date
from database import get_db
from models import *
from models.user import UserRole
from models.booking import BookingStatus, PaymentStatus
from models.trip import TripStatus
from schemas.admin import DashboardStats, StopCreate
from schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from schemas.bus import BusCreate, BusUpdate, BusResponse
from schemas.route import RouteResponse
from schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleResponse
from schemas.trip import TripCreate, TripResponse
from dependencies.auth import get_admin_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    today = date.today()
    total_b = (await db.execute(select(func.count(Booking.id)))).scalar() or 0
    today_b = (await db.execute(select(func.count(Booking.id)).where(func.date(Booking.booked_at) == today))).scalar() or 0
    total_rev = (await db.execute(select(func.sum(Booking.total_amount)).where(Booking.payment_status == PaymentStatus.paid))).scalar() or 0
    today_rev = (await db.execute(select(func.sum(Booking.total_amount)).where(Booking.payment_status == PaymentStatus.paid, func.date(Booking.booked_at) == today))).scalar() or 0
    passengers = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.passenger))).scalar() or 0
    routes = (await db.execute(select(func.count(Route.id)).where(Route.is_active == True))).scalar() or 0
    companies = (await db.execute(select(func.count(BusCompany.id)).where(BusCompany.is_active == True))).scalar() or 0
    buses = (await db.execute(select(func.count(Bus.id)).where(Bus.is_active == True))).scalar() or 0
    return DashboardStats(
        total_bookings=total_b, today_bookings=today_b,
        total_revenue=float(total_rev), today_revenue=float(today_rev),
        total_passengers=passengers, active_routes=routes,
        active_companies=companies, active_buses=buses,
    )

# ── Companies CRUD ──
@router.get("/companies", response_model=list[CompanyResponse])
async def list_companies(user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BusCompany).order_by(BusCompany.name))
    return [CompanyResponse.model_validate(c) for c in result.scalars().all()]

@router.post("/companies", response_model=CompanyResponse, status_code=201)
async def create_company(data: CompanyCreate, user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    company = BusCompany(**data.model_dump())
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return CompanyResponse.model_validate(company)

@router.put("/companies/{id}", response_model=CompanyResponse)
async def update_company(id: int, data: CompanyUpdate, user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    company = await db.get(BusCompany, id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    await db.commit()
    await db.refresh(company)
    return CompanyResponse.model_validate(company)

# ── Buses CRUD ──
@router.get("/buses", response_model=list[BusResponse])
async def list_buses(company_id: int | None = None, user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    query = select(Bus)
    if company_id:
        query = query.where(Bus.company_id == company_id)
    result = await db.execute(query.order_by(Bus.bus_number))
    return [BusResponse.model_validate(b) for b in result.scalars().all()]

@router.post("/buses", response_model=BusResponse, status_code=201)
async def create_bus(data: BusCreate, user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    bus = Bus(**data.model_dump())
    db.add(bus)
    await db.commit()
    await db.refresh(bus)
    return BusResponse.model_validate(bus)

@router.put("/buses/{id}", response_model=BusResponse)
async def update_bus(id: int, data: BusUpdate, user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    bus = await db.get(Bus, id)
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(bus, field, value)
    await db.commit()
    await db.refresh(bus)
    return BusResponse.model_validate(bus)

# ── Stops ──
@router.post("/stops")
async def create_stop(data: StopCreate, user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    stop = BusStop(**data.model_dump())
    db.add(stop)
    await db.commit()
    await db.refresh(stop)
    return {"id": stop.id, "name": stop.name, "code": stop.code, "city": stop.city}

# ── Routes CRUD ──
@router.post("/routes", status_code=201)
async def create_route(data: dict, user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    route = Route(**data)
    db.add(route)
    await db.commit()
    await db.refresh(route)
    return {"id": route.id, "route_number": route.route_number}

@router.delete("/routes/{id}")
async def deactivate_route(id: int, user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    route = await db.get(Route, id)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    route.is_active = False
    await db.commit()
    return {"message": "Route deactivated"}

# ── Schedules CRUD ──
@router.get("/schedules", response_model=list[ScheduleResponse])
async def list_schedules(route_id: int | None = None, user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    query = select(Schedule)
    if route_id:
        query = query.where(Schedule.route_id == route_id)
    result = await db.execute(query)
    return [ScheduleResponse.model_validate(s) for s in result.scalars().all()]

@router.post("/schedules", response_model=ScheduleResponse, status_code=201)
async def create_schedule(data: ScheduleCreate, user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    schedule = Schedule(**data.model_dump())
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return ScheduleResponse.model_validate(schedule)

@router.put("/schedules/{id}", response_model=ScheduleResponse)
async def update_schedule(id: int, data: ScheduleUpdate, user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    schedule = await db.get(Schedule, id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(schedule, field, value)
    await db.commit()
    await db.refresh(schedule)
    return ScheduleResponse.model_validate(schedule)

# ── Trips ──
@router.post("/trips", response_model=TripResponse, status_code=201)
async def create_trip(data: TripCreate, user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    trip = Trip(schedule_id=data.schedule_id, travel_date=data.travel_date, is_manually_created=True)
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return TripResponse.model_validate(trip)

@router.put("/trips/{id}/cancel")
async def cancel_trip(id: int, user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    trip = await db.get(Trip, id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip.status = TripStatus.cancelled
    await db.commit()
    return {"message": "Trip cancelled"}

# ── All Bookings ──
@router.get("/bookings")
async def all_bookings(
    status: str | None = None, travel_date: date | None = None,
    page: int = 1, limit: int = 20,
    user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db),
):
    query = select(Booking).options(
        selectinload(Booking.trip).selectinload(Trip.schedule)
        .selectinload(Schedule.route).selectinload(Route.from_stop),
        selectinload(Booking.trip).selectinload(Trip.schedule)
        .selectinload(Schedule.route).selectinload(Route.to_stop),
    )
    if status:
        query = query.where(Booking.booking_status == status)
    if travel_date:
        query = query.join(Trip).where(Trip.travel_date == travel_date)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    result = await db.execute(query.order_by(Booking.booked_at.desc()).offset((page-1)*limit).limit(limit))
    bookings = result.unique().scalars().all()
    return {
        "bookings": [
            {
                "ticket_id": b.ticket_id, "passenger_name": b.passenger_name,
                "total_amount": float(b.total_amount), "status": b.booking_status.value,
                "travel_date": str(b.trip.travel_date),
                "route": f"{b.trip.schedule.route.from_stop.code} → {b.trip.schedule.route.to_stop.code}",
                "booked_at": str(b.booked_at),
            } for b in bookings
        ],
        "pagination": {"page": page, "limit": limit, "total": total, "pages": -(-total // limit)},
    }

# ── Passengers ──
@router.get("/passengers")
async def list_passengers(user: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.role == UserRole.passenger).order_by(User.created_at.desc()))
    return [{"id": u.id, "name": u.full_name, "email": u.email, "phone": u.phone, "created_at": str(u.created_at)} for u in result.scalars().all()]
