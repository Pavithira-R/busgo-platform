from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models import User, Review, Trip, Booking, BusCompany, Schedule, Bus
from models.booking import BookingStatus
from schemas.review import ReviewCreate, ReviewResponse
from dependencies.auth import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

@router.post("/", response_model=ReviewResponse, status_code=201)
async def create_review(data: ReviewCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not 1 <= data.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    # Verify user actually took this trip
    booking_q = await db.execute(
        select(Booking).where(
            Booking.user_id == user.id, Booking.trip_id == data.trip_id,
            Booking.booking_status == BookingStatus.used,
        )
    )
    if not booking_q.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You can only review trips you have completed")
    # Check not already reviewed
    existing = await db.execute(select(Review).where(Review.user_id == user.id, Review.trip_id == data.trip_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="You already reviewed this trip")

    review = Review(user_id=user.id, trip_id=data.trip_id, rating=data.rating, comment=data.comment)
    db.add(review)
    await db.commit()
    await db.refresh(review)

    # Update company avg rating
    trip_q = await db.execute(
        select(Trip).where(Trip.id == data.trip_id)
    )
    trip = trip_q.scalar_one()
    sched_q = await db.execute(select(Schedule).where(Schedule.id == trip.schedule_id))
    sched = sched_q.scalar_one()
    bus_q = await db.execute(select(Bus).where(Bus.id == sched.bus_id))
    bus = bus_q.scalar_one()
    company = await db.get(BusCompany, bus.company_id)
    # Recalculate
    avg_q = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .join(Trip, Review.trip_id == Trip.id)
        .join(Schedule, Trip.schedule_id == Schedule.id)
        .join(Bus, Schedule.bus_id == Bus.id)
        .where(Bus.company_id == company.id)
    )
    row = avg_q.one()
    company.avg_rating = round(float(row[0] or 0), 2)
    company.total_reviews = int(row[1] or 0)
    await db.commit()

    return ReviewResponse(id=review.id, user_name=user.full_name, rating=review.rating, comment=review.comment, created_at=review.created_at)

@router.get("/trip/{trip_id}", response_model=list[ReviewResponse])
async def get_trip_reviews(trip_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review).where(Review.trip_id == trip_id)
        .options(selectinload(Review.user)).order_by(Review.created_at.desc())
    )
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Review).where(Review.trip_id == trip_id).order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    out = []
    for r in reviews:
        user_q = await db.execute(select(User).where(User.id == r.user_id))
        u = user_q.scalar_one()
        out.append(ReviewResponse(id=r.id, user_name=u.full_name, rating=r.rating, comment=r.comment, created_at=r.created_at))
    return out

@router.get("/company/{company_id}", response_model=list[ReviewResponse])
async def get_company_reviews(company_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review).join(Trip, Review.trip_id == Trip.id)
        .join(Schedule, Trip.schedule_id == Schedule.id)
        .join(Bus, Schedule.bus_id == Bus.id)
        .where(Bus.company_id == company_id)
        .order_by(Review.created_at.desc()).limit(50)
    )
    reviews = result.scalars().all()
    out = []
    for r in reviews:
        user_q = await db.execute(select(User).where(User.id == r.user_id))
        u = user_q.scalar_one()
        out.append(ReviewResponse(id=r.id, user_name=u.full_name, rating=r.rating, comment=r.comment, created_at=r.created_at))
    return out
