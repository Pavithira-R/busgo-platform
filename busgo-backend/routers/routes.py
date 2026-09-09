from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload, aliased
from datetime import date
from database import get_db
from models import BusStop, Route, Schedule, Trip, Booking, Bus, BusCompany
from models.booking import BookingStatus
from schemas.route import StopResponse, RouteResponse
from schemas.trip import SeatInfo, SeatAvailabilityResponse

router = APIRouter(prefix="/api/routes", tags=["Routes & Trips"])

@router.get("/stops", response_model=list[StopResponse])
async def list_stops(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BusStop).order_by(BusStop.name))
    return [StopResponse.model_validate(s) for s in result.scalars().all()]

@router.get("/", response_model=list[RouteResponse])
async def list_routes(
    from_code: str | None = None, to_code: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    from_stop_alias = aliased(BusStop)
    to_stop_alias = aliased(BusStop)
    query = select(Route).where(Route.is_active == True).options(
        joinedload(Route.from_stop), joinedload(Route.to_stop)
    )
    if from_code:
        query = query.join(from_stop_alias, Route.from_stop_id == from_stop_alias.id).where(from_stop_alias.code == from_code.upper())
    if to_code:
        query = query.join(to_stop_alias, Route.to_stop_id == to_stop_alias.id).where(to_stop_alias.code == to_code.upper())
    result = await db.execute(query)
    return [RouteResponse.model_validate(r) for r in result.unique().scalars().all()]

@router.get("/search")
async def search_trips(
    from_code: str, to_code: str, travel_date: date,
    service_type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Search available trips: finds schedules matching route + day, returns trip details."""
    day_name = travel_date.strftime("%a").lower()
    from_stop_alias = aliased(BusStop)
    to_stop_alias = aliased(BusStop)
    query = (
        select(Schedule)
        .join(Route, Schedule.route_id == Route.id)
        .join(from_stop_alias, Route.from_stop_id == from_stop_alias.id)
        .join(to_stop_alias, Route.to_stop_id == to_stop_alias.id)
        .join(Bus, Schedule.bus_id == Bus.id)
        .where(
            Route.is_active == True,
            Schedule.is_active == True,
            Schedule.days_of_week.contains(day_name),
            from_stop_alias.code == from_code.upper(),
            to_stop_alias.code == to_code.upper(),
        )
        .options(
            selectinload(Schedule.route).joinedload(Route.from_stop),
            selectinload(Schedule.route).joinedload(Route.to_stop),
            selectinload(Schedule.bus).joinedload(Bus.company),
        )
    )
    result = await db.execute(query)
    schedules = result.unique().scalars().all()

    # Filter manually for from/to codes and service type
    trips_out = []
    for sched in schedules:
        if sched.route.from_stop.code != from_code.upper():
            continue
        if sched.route.to_stop.code != to_code.upper():
            continue
        if service_type and sched.bus.service_type.value != service_type:
            continue

        # Find or auto-create trip for this date
        trip_q = await db.execute(
            select(Trip).where(Trip.schedule_id == sched.id, Trip.travel_date == travel_date)
        )
        trip = trip_q.scalar_one_or_none()
        if not trip:
            trip = Trip(schedule_id=sched.id, travel_date=travel_date)
            db.add(trip)
            await db.commit()
            await db.refresh(trip)

        if trip.status.value == "cancelled":
            continue

        # Count booked seats
        booked_q = await db.execute(
            select(Booking).where(
                Booking.trip_id == trip.id,
                Booking.booking_status.in_([BookingStatus.confirmed, BookingStatus.used])
            )
        )
        booked_count = len(booked_q.scalars().all())

        trips_out.append({
            "trip_id": trip.id,
            "schedule_id": sched.id,
            "route_number": sched.route.route_number,
            "from_stop": {"name": sched.route.from_stop.name, "code": sched.route.from_stop.code},
            "to_stop": {"name": sched.route.to_stop.name, "code": sched.route.to_stop.code},
            "departure_time": str(sched.departure_time),
            "arrival_time": str(sched.arrival_time),
            "duration": sched.route.estimated_duration,
            "price": float(sched.price),
            "service_type": sched.bus.service_type.value,
            "bus_number": sched.bus.bus_number,
            "seat_layout": sched.bus.seat_layout.value,
            "total_seats": sched.bus.total_seats,
            "available_seats": sched.bus.total_seats - booked_count,
            "company": {"name": sched.bus.company.name, "code": sched.bus.company.code, "rating": sched.bus.company.avg_rating},
            "amenities": sched.bus.amenities,
            "travel_date": str(travel_date),
            "status": trip.status.value,
        })

    return {"trips": sorted(trips_out, key=lambda x: x["departure_time"])}

@router.get("/trips/{trip_id}/seats", response_model=SeatAvailabilityResponse)
async def get_seat_availability(trip_id: int, db: AsyncSession = Depends(get_db)):
    trip_q = await db.execute(
        select(Trip).where(Trip.id == trip_id).options(
            selectinload(Trip.schedule).selectinload(Schedule.bus)
        )
    )
    trip = trip_q.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    bus = trip.schedule.bus
    layout = bus.seat_layout.value
    total = bus.total_seats

    # Generate seat labels based on layout
    if layout == "2x1":
        cols, rows = 3, total // 3
    elif layout == "2x2_10":
        cols, rows = 4, 10
    else:
        cols, rows = 4, total // 4

    all_seats = []
    for r in range(rows):
        for c in range(1, cols + 1):
            all_seats.append(chr(65 + r) + str(c))

    # Get booked seats
    booked_q = await db.execute(
        select(Booking.seat_number).where(
            Booking.trip_id == trip_id,
            Booking.booking_status.in_([BookingStatus.confirmed, BookingStatus.used])
        )
    )
    booked_seats = {row[0] for row in booked_q.all()}

    seats = [SeatInfo(seat=s, status="taken" if s in booked_seats else "available") for s in all_seats]
    available = sum(1 for s in seats if s.status == "available")

    return SeatAvailabilityResponse(
        trip_id=trip_id, travel_date=trip.travel_date,
        total_seats=total, available=available, seats=seats,
    )
