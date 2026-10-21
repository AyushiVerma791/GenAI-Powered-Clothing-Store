from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database
from app.core.config import settings

router = APIRouter()

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Health check endpoint used by AWS ALB/ECS and Docker Compose to monitor service health."""
    db_status = "connected"
    try:
        await db.command("ping")
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "ai_mock_mode": settings.AI_MOCK_MODE,
    }
