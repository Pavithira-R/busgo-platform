import enum
from datetime import datetime
from sqlalchemy import String, Boolean, Integer, Enum, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class ServiceType(str, enum.Enum):
    standard = "Standard"
    semi_luxury = "Semi-Luxury"
    luxury = "Luxury"

class SeatLayout(str, enum.Enum):
    layout_2x2 = "2x2"
    layout_2x2_10 = "2x2_10"
    layout_2x1 = "2x1"

class Bus(Base):
    __tablename__ = "buses"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("bus_companies.id"), nullable=False)
    bus_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    service_type: Mapped[ServiceType] = mapped_column(Enum(ServiceType), default=ServiceType.standard)
    seat_layout: Mapped[SeatLayout] = mapped_column(Enum(SeatLayout), default=SeatLayout.layout_2x2)
    total_seats: Mapped[int] = mapped_column(Integer, default=48)
    amenities: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    company = relationship("BusCompany", back_populates="buses")
    schedules = relationship("Schedule", back_populates="bus", lazy="selectin")
