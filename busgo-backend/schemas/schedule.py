from pydantic import BaseModel
from typing import Optional
from datetime import time

class ScheduleCreate(BaseModel):
    route_id: int
    bus_id: int
    departure_time: time
    arrival_time: time
    price: float
    days_of_week: str = "mon,tue,wed,thu,fri,sat,sun"

class ScheduleUpdate(BaseModel):
    departure_time: Optional[time] = None
    arrival_time: Optional[time] = None
    price: Optional[float] = None
    days_of_week: Optional[str] = None
    is_active: Optional[bool] = None

class ScheduleResponse(BaseModel):
    id: int
    route_id: int
    bus_id: int
    departure_time: time
    arrival_time: time
    price: float
    days_of_week: str
    is_active: bool
    class Config:
        from_attributes = True
