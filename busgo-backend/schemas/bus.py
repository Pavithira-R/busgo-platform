from pydantic import BaseModel
from typing import Optional

class BusCreate(BaseModel):
    company_id: int
    bus_number: str
    service_type: str = "Standard"
    seat_layout: str = "2x2"
    total_seats: int = 48
    amenities: Optional[str] = None

class BusUpdate(BaseModel):
    service_type: Optional[str] = None
    seat_layout: Optional[str] = None
    total_seats: Optional[int] = None
    amenities: Optional[str] = None
    is_active: Optional[bool] = None

class BusResponse(BaseModel):
    id: int
    company_id: int
    bus_number: str
    service_type: str
    seat_layout: str
    total_seats: int
    amenities: Optional[str]
    is_active: bool
    class Config:
        from_attributes = True
