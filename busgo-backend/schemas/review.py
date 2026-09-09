from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReviewCreate(BaseModel):
    trip_id: int
    rating: int  # 1-5
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: int
    user_name: str
    rating: int
    comment: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True
