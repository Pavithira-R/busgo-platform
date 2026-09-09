import enum
from datetime import datetime, date
from sqlalchemy import Date, Enum, Boolean, ForeignKey, DateTime, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class TripStatus(str, enum.Enum):
    scheduled = "scheduled"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"

class Trip(Base):
    __tablename__ = "trips"
    __table_args__ = (UniqueConstraint("schedule_id", "travel_date", name="uq_schedule_date"),)
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    schedule_id: Mapped[int] = mapped_column(ForeignKey("schedules.id"), nullable=False)
    travel_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[TripStatus] = mapped_column(Enum(TripStatus), default=TripStatus.scheduled)
    is_manually_created: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    schedule = relationship("Schedule", back_populates="trips")
    bookings = relationship("Booking", back_populates="trip", lazy="selectin")
    reviews = relationship("Review", back_populates="trip", lazy="selectin")
