from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database
from app.schemas.chat import ChatRequest, ChatResponse
from app.ai.agent import process_chat_message

router = APIRouter()

@router.post("/message", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat_message(
    request: ChatRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Processes natural language shopping inquiries using Pydantic AI agent with Groq or grounded catalog retrieval."""
    return await process_chat_message(
        db=db,
        message=request.message,
        history=request.history,
    )
