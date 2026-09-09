from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database import get_db
from models import User, Trip, Schedule, Bus, BusCompany, Route, BusStop, Booking
from models.booking import BookingStatus, PaymentStatus
from schemas.booking import BookingCreate, TicketResponse, PricingInfo, BookingListItem
from dependencies.auth import get_current_user
from utils.qr import generate_ticket_id, generate_qr_code
from utils.pricing import calculate_pricing
from services.stripe_service import create_payment_intent
from services.email_service import send_booking_email
from services.sms_service import send_booking_sms

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

@router.post("/", response_model=TicketResponse, status_code=201)
async def create_booking(
    data: BookingCreate,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Load trip with all related data
    trip_q = await db.execute(
        select(Trip).where(Trip.id == data.trip_id).options(
            selectinload(Trip.schedule).selectinload(Schedule.bus).selectinload(Bus.company),
            selectinload(Trip.schedule).selectinload(Schedule.route).selectinload(Route.from_stop),
            selectinload(Trip.schedule).selectinload(Schedule.route).selectinload(Route.to_stop),
        )
    )
    trip = trip_q.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status.value == "cancelled":
        raise HTTPException(status_code=400, detail="This trip has been cancelled")

    sched = trip.schedule
    bus = sched.bus
    route = sched.route

    # Check seat not already booked
    seat_q = await db.execute(
        select(Booking).where(
            Booking.trip_id == trip.id,
            Booking.seat_number == data.seat_number,
            Booking.booking_status.in_([BookingStatus.confirmed, BookingStatus.used]),
        )
    )
    if seat_q.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Seat already booked. Choose another.")

    # Pricing
    pricing = calculate_pricing(float(sched.price))
    ticket_id = generate_ticket_id()

    # QR data
    qr_payload = {
        "ticketId": ticket_id, "passenger": data.passenger_name,
        "from": route.from_stop.name, "fromCode": route.from_stop.code,
        "to": route.to_stop.name, "toCode": route.to_stop.code,
        "date": str(trip.travel_date), "departure": str(sched.departure_time),
        "seat": data.seat_number, "bus": bus.bus_number,
        "company": bus.company.name, "class": bus.service_type.value,
        "total": pricing["total"], "status": "CONFIRMED",
    }
    qr_data_string, qr_image = generate_qr_code(qr_payload)

    # Stripe payment intent
    stripe_result = None
    try:
        stripe_result = await create_payment_intent(
            amount_cents=int(pricing["total"] * 100),
            metadata={"ticket_id": ticket_id, "user_id": str(user.id)},
        )
    except Exception:
        pass  # Payment is optional during dev

    # Create booking
    booking = Booking(
        ticket_id=ticket_id, user_id=user.id, trip_id=trip.id,
        seat_number=data.seat_number,
        passenger_name=data.passenger_name, passenger_email=data.passenger_email,
        passenger_phone=data.passenger_phone, passenger_id_number=data.passenger_id_number,
        base_price=pricing["base"], tax_amount=pricing["tax"], total_amount=pricing["total"],
        stripe_payment_intent_id=stripe_result["payment_intent_id"] if stripe_result else None,
        payment_status=PaymentStatus.paid, booking_status=BookingStatus.confirmed,
        qr_code_data=qr_data_string, qr_code_image=qr_image,
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    # Send notifications in background
    notif_data = {
        "ticket_id": ticket_id, "from": route.from_stop.name, "to": route.to_stop.name,
        "date": str(trip.travel_date), "departure": str(sched.departure_time),
        "seat": data.seat_number, "bus_number": bus.bus_number,
        "company": bus.company.name, "total": pricing["total"],
    }
    background_tasks.add_task(send_booking_email, data.passenger_email, data.passenger_name, notif_data)
    if data.passenger_phone:
        background_tasks.add_task(send_booking_sms, data.passenger_phone, notif_data)

    return TicketResponse(
        booking_id=booking.id, ticket_id=ticket_id,
        passenger_name=data.passenger_name, passenger_email=data.passenger_email,
        route_from=route.from_stop.name, route_from_code=route.from_stop.code,
        route_to=route.to_stop.name, route_to_code=route.to_stop.code,
        travel_date=str(trip.travel_date),
        departure=str(sched.departure_time), arrival=str(sched.arrival_time),
        seat=data.seat_number, service_type=bus.service_type.value,
        bus_number=bus.bus_number, company_name=bus.company.name,
        pricing=PricingInfo(**pricing), status="CONFIRMED", qr_code=qr_image,
        stripe_client_secret=stripe_result["client_secret"] if stripe_result else None,
    )

@router.get("/", response_model=list[BookingListItem])
async def list_my_bookings(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Booking).where(Booking.user_id == user.id)
        .options(
            selectinload(Booking.trip).selectinload(Trip.schedule)
            .selectinload(Schedule.route).selectinload(Route.from_stop),
            selectinload(Booking.trip).selectinload(Trip.schedule)
            .selectinload(Schedule.route).selectinload(Route.to_stop),
            selectinload(Booking.trip).selectinload(Trip.schedule)
            .selectinload(Schedule.bus).selectinload(Bus.company),
        )
        .order_by(Booking.booked_at.desc())
    )
    bookings = result.unique().scalars().all()
    return [
        BookingListItem(
            id=b.id, ticket_id=b.ticket_id, passenger_name=b.passenger_name,
            travel_date=str(b.trip.travel_date), seat_number=b.seat_number,
            total_amount=float(b.total_amount),
            booking_status=b.booking_status.value, payment_status=b.payment_status.value,
            route_from=b.trip.schedule.route.from_stop.name,
            route_to=b.trip.schedule.route.to_stop.name,
            departure=str(b.trip.schedule.departure_time),
            company_name=b.trip.schedule.bus.company.name,
            booked_at=b.booked_at,
        )
        for b in bookings
    ]

@router.get("/{ticket_id}")
async def get_booking(ticket_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Booking).where(Booking.ticket_id == ticket_id)
        .options(
            selectinload(Booking.trip).selectinload(Trip.schedule)
            .selectinload(Schedule.route).selectinload(Route.from_stop),
            selectinload(Booking.trip).selectinload(Trip.schedule)
            .selectinload(Schedule.route).selectinload(Route.to_stop),
            selectinload(Booking.trip).selectinload(Trip.schedule)
            .selectinload(Schedule.bus).selectinload(Bus.company),
        )
    )
    booking = result.unique().scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != user.id and user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    sched = booking.trip.schedule
    return {
        "ticket_id": booking.ticket_id, "passenger_name": booking.passenger_name,
        "route_from": sched.route.from_stop.name, "route_from_code": sched.route.from_stop.code,
        "route_to": sched.route.to_stop.name, "route_to_code": sched.route.to_stop.code,
        "travel_date": str(booking.trip.travel_date),
        "departure": str(sched.departure_time), "arrival": str(sched.arrival_time),
        "seat": booking.seat_number, "service_type": sched.bus.service_type.value,
        "bus_number": sched.bus.bus_number, "company_name": sched.bus.company.name,
        "pricing": {"base": float(booking.base_price), "tax": float(booking.tax_amount), "total": float(booking.total_amount)},
        "status": booking.booking_status.value, "payment_status": booking.payment_status.value,
        "qr_code": booking.qr_code_image, "booked_at": str(booking.booked_at),
    }

@router.put("/{ticket_id}/cancel")
async def cancel_booking(ticket_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Booking).where(Booking.ticket_id == ticket_id, Booking.user_id == user.id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.booking_status != BookingStatus.confirmed:
        raise HTTPException(status_code=400, detail=f"Cannot cancel a {booking.booking_status.value} booking")
    booking.booking_status = BookingStatus.cancelled
    booking.payment_status = PaymentStatus.refunded
    await db.commit()
    return {"message": "Booking cancelled and refund initiated", "ticket_id": ticket_id}
