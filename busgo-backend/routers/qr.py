from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import date
from database import get_db
from models import User, Booking, Trip, Schedule, Route, Bus, BusCompany, ScanLog
from models.booking import BookingStatus, PaymentStatus
from models.scan_log import ScanResult
from schemas.qr import QRValidateRequest, QRValidateResponse, TicketInfo
from dependencies.auth import get_current_user, get_staff_or_admin

router = APIRouter(prefix="/api/qr", tags=["QR Validation"])

@router.post("/validate", response_model=QRValidateResponse)
async def validate_qr(data: QRValidateRequest, user: User = Depends(get_staff_or_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Booking).where(Booking.ticket_id == data.ticket_id)
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
        return QRValidateResponse(valid=False, result="invalid", message="Ticket not found in the system.")

    sched = booking.trip.schedule
    ticket_info = TicketInfo(
        ticket_id=booking.ticket_id, passenger=booking.passenger_name,
        route=f"{sched.route.from_stop.name} → {sched.route.to_stop.name}",
        date=str(booking.trip.travel_date), departure=str(sched.departure_time),
        seat=booking.seat_number, service_type=sched.bus.service_type.value,
        company=sched.bus.company.name,
    )

    if booking.booking_status == BookingStatus.cancelled:
        await _log_scan(db, booking.id, ScanResult.invalid, user.id, data.location)
        return QRValidateResponse(valid=False, result="invalid", message="This booking has been cancelled.")

    if booking.booking_status == BookingStatus.used:
        await _log_scan(db, booking.id, ScanResult.already_used, user.id, data.location)
        return QRValidateResponse(valid=False, result="already_used", message="This ticket has already been used.", ticket=ticket_info)

    if booking.trip.travel_date < date.today():
        await _log_scan(db, booking.id, ScanResult.expired, user.id, data.location)
        return QRValidateResponse(valid=False, result="expired", message=f"Ticket was for {booking.trip.travel_date} and has expired.")

    if booking.payment_status != PaymentStatus.paid:
        await _log_scan(db, booking.id, ScanResult.invalid, user.id, data.location)
        return QRValidateResponse(valid=False, result="invalid", message="Payment not completed.")

    # Valid — mark as used
    booking.booking_status = BookingStatus.used
    await _log_scan(db, booking.id, ScanResult.valid, user.id, data.location)
    await db.commit()
    return QRValidateResponse(valid=True, result="valid", message="Ticket validated. Passenger may board.", ticket=ticket_info)

@router.get("/lookup/{ticket_id}")
async def lookup_ticket(ticket_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
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
        raise HTTPException(status_code=404, detail="Ticket not found")
    sched = booking.trip.schedule
    return {
        "ticket_id": booking.ticket_id, "passenger": booking.passenger_name,
        "route": f"{sched.route.from_stop.name} → {sched.route.to_stop.name}",
        "date": str(booking.trip.travel_date), "departure": str(sched.departure_time),
        "seat": booking.seat_number, "status": booking.booking_status.value,
        "payment": booking.payment_status.value, "company": sched.bus.company.name,
    }

@router.get("/history/{ticket_id}")
async def scan_history(ticket_id: str, user: User = Depends(get_staff_or_admin), db: AsyncSession = Depends(get_db)):
    booking_q = await db.execute(select(Booking).where(Booking.ticket_id == ticket_id))
    booking = booking_q.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Ticket not found")
    logs_q = await db.execute(
        select(ScanLog).where(ScanLog.booking_id == booking.id)
        .options(selectinload(ScanLog.staff)).order_by(ScanLog.scanned_at.desc())
    )
    return [
        {"id": l.id, "scan_result": l.scan_result.value, "scanned_at": str(l.scanned_at),
         "scanned_by_name": l.staff.full_name if l.staff else None, "location": l.location}
        for l in logs_q.scalars().all()
    ]

async def _log_scan(db, booking_id, result, scanned_by, location):
    db.add(ScanLog(booking_id=booking_id, scan_result=result, scanned_by=scanned_by, location=location))
