from pydantic import BaseModel
from typing import Optional

class QRValidateRequest(BaseModel):
    ticket_id: str
    location: Optional[str] = None

class TicketInfo(BaseModel):
    ticket_id: str
    passenger: str
    route: str
    date: str
    departure: str
    seat: str
    service_type: str
    company: str

class QRValidateResponse(BaseModel):
    valid: bool
    result: str
    message: str
    ticket: Optional[TicketInfo] = None

class ScanHistoryItem(BaseModel):
    id: int
    scan_result: str
    scanned_at: str
    scanned_by_name: Optional[str]
    location: Optional[str]
