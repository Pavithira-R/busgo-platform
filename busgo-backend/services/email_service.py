import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import get_settings

settings = get_settings()

async def send_booking_email(to_email: str, passenger_name: str, ticket_data: dict):
    if not settings.smtp_user:
        print(f"[EMAIL SKIP] SMTP not configured. Would send to {to_email}")
        return

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{settings.email_from_name} <{settings.email_from}>"
    msg["To"] = to_email
    msg["Subject"] = f"BusGo Booking Confirmed — {ticket_data['ticket_id']}"

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#0f1b2d">🚌 Booking Confirmed!</h2>
        <p>Hi {passenger_name},</p>
        <p>Your bus ticket has been booked successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;color:#666">Ticket ID</td><td style="padding:8px;font-weight:bold">{ticket_data['ticket_id']}</td></tr>
            <tr><td style="padding:8px;color:#666">Route</td><td style="padding:8px">{ticket_data['from']} → {ticket_data['to']}</td></tr>
            <tr><td style="padding:8px;color:#666">Date</td><td style="padding:8px">{ticket_data['date']}</td></tr>
            <tr><td style="padding:8px;color:#666">Departure</td><td style="padding:8px">{ticket_data['departure']}</td></tr>
            <tr><td style="padding:8px;color:#666">Seat</td><td style="padding:8px">{ticket_data['seat']}</td></tr>
            <tr><td style="padding:8px;color:#666">Bus</td><td style="padding:8px">{ticket_data['bus_number']} ({ticket_data['company']})</td></tr>
            <tr><td style="padding:8px;color:#666">Total</td><td style="padding:8px;font-weight:bold">LKR {ticket_data['total']}</td></tr>
        </table>
        <p>Show the QR code on your e-ticket at the boarding gate.</p>
        <p style="color:#999;font-size:12px">BusGo — Your digital bus ticket platform</p>
    </div>
    """
    msg.attach(MIMEText(html, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            use_tls=False,
            start_tls=True,
        )
        print(f"[EMAIL] Sent booking confirmation to {to_email}")
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {e}")
