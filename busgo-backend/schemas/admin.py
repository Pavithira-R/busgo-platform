from pydantic import BaseModel
from typing import Optional

class DashboardStats(BaseModel):
    total_bookings: int
    today_bookings: int
    total_revenue: float
    today_revenue: float
    total_passengers: int
    active_routes: int
    active_companies: int
    active_buses: int

class RevenueByCompany(BaseModel):
    company: str
    revenue: float

class StopCreate(BaseModel):
    name: str
    code: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
