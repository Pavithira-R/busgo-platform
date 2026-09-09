from fastapi import APIRouter
from schemas.chat import ChatRequest, ChatResponse
from utils.gemini import chat_with_gemini
import uuid

router = APIRouter(prefix="/api/chat", tags=["AI Chatbot"])

# In-memory conversation store (use Redis in production)
conversations: dict[str, list] = {}

@router.post("/", response_model=ChatResponse)
async def chat(data: ChatRequest):
    conv_id = data.conversation_id or str(uuid.uuid4())
    history = conversations.get(conv_id, [])
    reply = await chat_with_gemini(data.message, history)
    # Update history
    history.append({"role": "user", "parts": [data.message]})
    history.append({"role": "model", "parts": [reply]})
    conversations[conv_id] = history[-20:]  # Keep last 10 exchanges
    return ChatResponse(reply=reply, conversation_id=conv_id)
