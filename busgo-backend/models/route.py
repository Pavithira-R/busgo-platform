from datetime import datetime
from sqlalchemy import String, Boolean, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class Route(Base):
    __tablename__ = "routes"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    route_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    from_stop_id: Mapped[int] = mapped_column(ForeignKey("bus_stops.id"), nullable=False)
    to_stop_id: Mapped[int] = mapped_column(ForeignKey("bus_stops.id"), nullable=False)
    distance_km: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estimated_duration: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    from_stop = relationship("BusStop", foreign_keys=[from_stop_id], lazy="joined")
    to_stop = relationship("BusStop", foreign_keys=[to_stop_id], lazy="joined")
    schedules = relationship("Schedule", back_populates="route", lazy="selectin")
