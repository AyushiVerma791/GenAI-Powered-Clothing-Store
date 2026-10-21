from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database
from app.api.deps import get_current_user
from app.schemas.order import OrderCreateRequest, OrderResponse
from app.schemas.common import PaginatedResponse
from app.services.order_service import OrderService

router = APIRouter()

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    request: OrderCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Places an order, verifies inventory atomically, creates historical price snapshot, and clears cart."""
    user_id = str(current_user["_id"])
    return await OrderService.create_order(db, user_id=user_id, request=request)

@router.get("", response_model=PaginatedResponse[OrderResponse])
async def get_my_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Retrieves order history for the current authenticated user."""
    user_id = str(current_user["_id"])
    return await OrderService.get_user_orders(db, user_id=user_id, page=page, limit=limit)

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_detail(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Retrieves full details of a specific order."""
    user_id = str(current_user["_id"])
    return await OrderService.get_order_by_id(db, order_id=order_id, user_id=user_id, is_admin=False)
