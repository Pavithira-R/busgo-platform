import enum
from datetime import datetime
from sqlalchemy import String, Numeric, Text, Enum, ForeignKey, DateTime, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    refunded = "refunded"
    failed = "failed"

class BookingStatus(str, enum.Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"
    used = "used"
    expired = "expired"

class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (UniqueConstraint("trip_id", "seat_number", name="uq_trip_seat"),)
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticket_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), nullable=False)
    seat_number: Mapped[str] = mapped_column(String(5), nullable=False)
    passenger_name: Mapped[str] = mapped_column(String(100), nullable=False)
    passenger_email: Mapped[str] = mapped_column(String(150), nullable=False)
    passenger_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    passenger_id_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    base_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    tax_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    payment_status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.pending)
    booking_status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus), default=BookingStatus.confirmed)
    qr_code_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    qr_code_image: Mapped[str | None] = mapped_column(Text, nullable=True)
    booked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    user = relationship("User", back_populates="bookings")
    trip = relationship("Trip", back_populates="bookings")
    scan_logs = relationship("ScanLog", back_populates="booking", lazy="selectin")
