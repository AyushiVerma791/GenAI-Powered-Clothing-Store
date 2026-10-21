from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database
from app.api.deps import get_current_user
from app.schemas.cart import CartResponse, CartItemAdd, CartItemUpdate
from app.services.cart_service import CartService

router = APIRouter()

@router.get("", response_model=CartResponse)
async def get_cart(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Retrieves the authenticated user's current shopping cart with verified catalog prices."""
    user_id = str(current_user["_id"])
    return await CartService.get_or_create_cart(db, user_id)

@router.post("/items", response_model=CartResponse, status_code=status.HTTP_200_OK)
async def add_item_to_cart(
    data: CartItemAdd,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Adds a validated item to the user's shopping cart."""
    user_id = str(current_user["_id"])
    return await CartService.add_item(db, user_id, data)

@router.put("/items/{product_id}", response_model=CartResponse)
async def update_cart_item(
    product_id: str,
    data: CartItemUpdate,
    size: str = Query(..., description="Item size variant"),
    color: str = Query(..., description="Item color variant"),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Updates the quantity of a specific item variant in the shopping cart."""
    user_id = str(current_user["_id"])
    return await CartService.update_item_quantity(
        db,
        user_id=user_id,
        product_id=product_id,
        quantity=data.quantity,
        size=size,
        color=color,
    )

@router.delete("/items/{product_id}", response_model=CartResponse)
async def remove_cart_item(
    product_id: str,
    size: str = Query(..., description="Item size variant"),
    color: str = Query(..., description="Item color variant"),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Removes an item variant from the shopping cart."""
    user_id = str(current_user["_id"])
    return await CartService.remove_item(
        db,
        user_id=user_id,
        product_id=product_id,
        size=size,
        color=color,
    )

@router.delete("", status_code=status.HTTP_200_OK)
async def clear_cart(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Empties all items from the user's cart."""
    user_id = str(current_user["_id"])
    await CartService.clear_cart(db, user_id)
    return {"message": "Cart cleared successfully."}
