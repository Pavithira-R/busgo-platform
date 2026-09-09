from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    id_number: Optional[str] = None
    preferred_seat_position: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    id_number: Optional[str] = None
    preferred_seat_position: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    id_number: Optional[str]
    role: str
    preferred_seat_position: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
