import enum
from datetime import datetime
from sqlalchemy import String, Enum, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class ScanResult(str, enum.Enum):
    valid = "valid"
    invalid = "invalid"
    already_used = "already_used"
    expired = "expired"

class ScanLog(Base):
    __tablename__ = "scan_logs"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"), nullable=False)
    scan_result: Mapped[ScanResult] = mapped_column(Enum(ScanResult), nullable=False)
    scanned_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    location: Mapped[str | None] = mapped_column(String(100), nullable=True)
    scanned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    booking = relationship("Booking", back_populates="scan_logs")
    staff = relationship("User", foreign_keys=[scanned_by])
