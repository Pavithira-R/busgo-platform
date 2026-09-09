from twilio.rest import Client
from config import get_settings

settings = get_settings()

async def send_booking_sms(to_phone: str, ticket_data: dict):
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        print(f"[SMS SKIP] Twilio not configured. Would send to {to_phone}")
        return

    body = (
        f"BusGo Booking Confirmed!\n"
        f"Ticket: {ticket_data['ticket_id']}\n"
        f"Route: {ticket_data['from']} → {ticket_data['to']}\n"
        f"Date: {ticket_data['date']} at {ticket_data['departure']}\n"
        f"Seat: {ticket_data['seat']}\n"
        f"Show QR at gate. Safe travels!"
    )

    try:
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        client.messages.create(body=body, from_=settings.twilio_phone_number, to=to_phone)
        print(f"[SMS] Sent to {to_phone}")
    except Exception as e:
        print(f"[SMS ERROR] Failed to send to {to_phone}: {e}")
