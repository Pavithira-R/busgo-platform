from pydantic import BaseModel
from datetime import date
from typing import Optional

class TripCreate(BaseModel):
    schedule_id: int
    travel_date: date

class TripResponse(BaseModel):
    id: int
    schedule_id: int
    travel_date: date
    status: str
    is_manually_created: bool
    class Config:
        from_attributes = True

class SeatInfo(BaseModel):
    seat: str
    status: str  # "available" or "taken"

class SeatAvailabilityResponse(BaseModel):
    trip_id: int
    travel_date: date
    total_seats: int
    available: int
    seats: list[SeatInfo]
