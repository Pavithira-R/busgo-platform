from pydantic import BaseModel, EmailStr
from typing import Optional

class CompanyCreate(BaseModel):
    name: str
    code: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None

class CompanyResponse(BaseModel):
    id: int
    name: str
    code: str
    logo_url: Optional[str]
    description: Optional[str]
    contact_phone: Optional[str]
    contact_email: Optional[str]
    avg_rating: float
    total_reviews: int
    is_active: bool
    class Config:
        from_attributes = True
