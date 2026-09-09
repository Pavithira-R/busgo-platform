import qrcode
import io
import base64
import json
import secrets
import string

def generate_ticket_id() -> str:
    chars = string.ascii_uppercase.replace("O", "").replace("I", "") + "23456789"
    return "BG-" + "".join(secrets.choice(chars) for _ in range(8))

def generate_qr_code(ticket_data: dict) -> tuple[str, str]:
    qr_data_string = json.dumps(ticket_data)
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=2)
    qr.add_data(qr_data_string)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f1b2d", back_color="#ffffff")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    qr_image = "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode()
    return qr_data_string, qr_image
