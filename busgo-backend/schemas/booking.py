from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class BookingCreate(BaseModel):
    trip_id: int
    seat_number: str
    passenger_name: str
    passenger_email: EmailStr
    passenger_phone: Optional[str] = None
    passenger_id_number: Optional[str] = None

class PricingInfo(BaseModel):
    base: float
    tax: float
    total: float

class TicketResponse(BaseModel):
    booking_id: int
    ticket_id: str
    passenger_name: str
    passenger_email: str
    route_from: str
    route_from_code: str
    route_to: str
    route_to_code: str
    travel_date: str
    departure: str
    arrival: str
    seat: str
    service_type: str
    bus_number: str
    company_name: str
    pricing: PricingInfo
    status: str
    qr_code: str
    stripe_client_secret: Optional[str] = None

class BookingListItem(BaseModel):
    id: int
    ticket_id: str
    passenger_name: str
    travel_date: str
    seat_number: str
    total_amount: float
    booking_status: str
    payment_status: str
    route_from: str
    route_to: str
    departure: str
    company_name: str
    booked_at: datetime
    class Config:
        from_attributes = True
