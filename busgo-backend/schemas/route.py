from pydantic import BaseModel
from typing import Optional

class StopResponse(BaseModel):
    id: int
    name: str
    code: str
    city: str
    class Config:
        from_attributes = True

class RouteCreate(BaseModel):
    route_number: str
    from_stop_id: int
    to_stop_id: int
    distance_km: Optional[int] = None
    estimated_duration: str

class RouteResponse(BaseModel):
    id: int
    route_number: str
    from_stop: StopResponse
    to_stop: StopResponse
    distance_km: Optional[int]
    estimated_duration: str
    is_active: bool
    class Config:
        from_attributes = True
