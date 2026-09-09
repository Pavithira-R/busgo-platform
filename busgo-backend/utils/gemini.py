import google.generativeai as genai
from config import get_settings

settings = get_settings()

SYSTEM_PROMPT = """You are BusGo Assistant, a helpful chatbot for the BusGo bus ticket booking platform.
You help passengers with:
- Finding bus routes and schedules
- Understanding the booking process
- Seat selection tips (window vs aisle, front vs back)
- Payment and refund queries
- QR ticket usage at boarding gates
- General travel tips for Sri Lankan bus routes

Available bus terminals: Colombo (CMB), Kandy (KDY), Galle (GLE), Jaffna (JFN),
Negombo (NGB), Matara (MTR), Anuradhapura (ADP), Trincomalee (TRC), Badulla (BDL), Batticaloa (BTC).

Service types: Standard (48 seats), Semi-Luxury (40 seats), Luxury (24 wider seats).

Keep responses concise, friendly, and helpful. If you don't know something specific about
a booking, suggest the passenger check their booking history or contact support."""

def get_gemini_model():
    if not settings.gemini_api_key:
        return None
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_PROMPT,
    )

async def chat_with_gemini(message: str, history: list[dict] | None = None) -> str:
    model = get_gemini_model()
    if not model:
        return "Chatbot is not configured. Please set GEMINI_API_KEY."
    try:
        chat = model.start_chat(history=history or [])
        response = chat.send_message(message)
        return response.text
    except Exception as e:
        return f"Sorry, I'm having trouble right now. Please try again. ({str(e)})"
