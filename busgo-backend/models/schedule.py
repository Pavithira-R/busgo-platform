from datetime import datetime, time
from sqlalchemy import String, Boolean, Numeric, ForeignKey, DateTime, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class Schedule(Base):
    __tablename__ = "schedules"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("routes.id"), nullable=False)
    bus_id: Mapped[int] = mapped_column(ForeignKey("buses.id"), nullable=False)
    departure_time: Mapped[time] = mapped_column(Time, nullable=False)
    arrival_time: Mapped[time] = mapped_column(Time, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    days_of_week: Mapped[str] = mapped_column(String(50), nullable=False, default="mon,tue,wed,thu,fri,sat,sun")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    route = relationship("Route", back_populates="schedules")
    bus = relationship("Bus", back_populates="schedules")
    trips = relationship("Trip", back_populates="schedule", lazy="selectin")
