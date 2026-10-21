import random
from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status
from pymongo import DESCENDING
from app.schemas.order import (
    OrderCreateRequest,
    OrderResponse,
    OrderItemSnapshot,
    ShippingAddress,
    OrderStatusUpdate,
)
from app.schemas.common import PaginatedResponse
from app.services.cart_service import CartService, TAX_RATE, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE

def generate_order_number() -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_str = f"{random.randint(1000, 9999)}"
    return f"ORD-{date_str}-{random_str}"

def serialize_order(doc: dict) -> OrderResponse:
    return OrderResponse(
        id=str(doc["_id"]),
        order_number=doc["order_number"],
        user_id=doc["user_id"],
        items=[OrderItemSnapshot(**i) for i in doc["items"]],
        shipping_address=ShippingAddress(**doc["shipping_address"]),
        payment_method=doc.get("payment_method", "mock_card"),
        payment_status=doc.get("payment_status", "pending"),
        order_status=doc.get("order_status", "placed"),
        subtotal=float(doc["subtotal"]),
        tax=float(doc["tax"]),
        shipping_fee=float(doc["shipping_fee"]),
        total=float(doc["total"]),
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
        updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
    )

class OrderService:
    @staticmethod
    async def create_order(
        db: AsyncIOMotorDatabase,
        user_id: str,
        request: OrderCreateRequest,
    ) -> OrderResponse:
        cart = await CartService.get_or_create_cart(db, user_id)
        if not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your cart is empty. Add products before placing an order.",
            )

        # 1. Atomic Stock Verification & Reservation
        decremented_items = []
        try:
            for item in cart.items:
                pid = ObjectId(item.product_id)
                # Atomically decrement stock if enough units exist
                res = await db.products.update_one(
                    {"_id": pid, "stock": {"$gte": item.quantity}},
                    {"$inc": {"stock": -item.quantity}},
                )
                if res.modified_count == 0:
                    # Insufficient stock for this item! Rollback previous decrements
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Product '{item.title}' does not have enough stock available ({item.quantity} requested).",
                    )
                decremented_items.append((pid, item.quantity))
        except Exception as e:
            # Rollback any stock decremented so far
            for pid, qty in decremented_items:
                await db.products.update_one(
                    {"_id": pid},
                    {"$inc": {"stock": qty}},
                )
            raise e

        # 2. Server-side Snapshot Creation & Price Calculations
        snapshots: List[dict] = []
        subtotal = 0.0

        for item in cart.items:
            # We use verified catalog price from cart enrichment
            item_subtotal = round(item.price * item.quantity, 2)
            subtotal += item_subtotal
            snapshots.append({
                "product_id": item.product_id,
                "title": item.title,
                "unit_price": item.price,
                "quantity": item.quantity,
                "size": item.size,
                "color": item.color,
                "image": item.image,
                "subtotal": item_subtotal,
            })

        subtotal = round(subtotal, 2)
        tax = round(subtotal * TAX_RATE, 2)
        shipping_fee = 0.0 if subtotal >= FREE_SHIPPING_THRESHOLD else STANDARD_SHIPPING_FEE
        total = round(subtotal + tax + shipping_fee, 2)

        # Mock payment status
        payment_status = "paid" if request.payment_method == "mock_card" else "pending"
        now = datetime.now(timezone.utc)
        order_number = generate_order_number()

        order_doc = {
            "order_number": order_number,
            "user_id": user_id,
            "items": snapshots,
            "shipping_address": request.shipping_address.model_dump(),
            "payment_method": request.payment_method,
            "payment_status": payment_status,
            "order_status": "placed",
            "subtotal": subtotal,
            "tax": tax,
            "shipping_fee": shipping_fee,
            "total": total,
            "created_at": now,
            "updated_at": now,
        }

        result = await db.orders.insert_one(order_doc)
        order_doc["_id"] = result.inserted_id

        # 3. Clear user's cart
        await CartService.clear_cart(db, user_id)

        return serialize_order(order_doc)

    @staticmethod
    async def get_user_orders(
        db: AsyncIOMotorDatabase,
        user_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedResponse[OrderResponse]:
        skip = (page - 1) * limit
        filter_query = {"user_id": user_id}
        total = await db.orders.count_documents(filter_query)
        cursor = db.orders.find(filter_query).sort([("created_at", DESCENDING)]).skip(skip).limit(limit)

        items = [serialize_order(doc) async for doc in cursor]
        total_pages = (total + limit - 1) // limit if total > 0 else 1

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    @staticmethod
    async def get_order_by_id(
        db: AsyncIOMotorDatabase,
        order_id: str,
        user_id: Optional[str] = None,
        is_admin: bool = False,
    ) -> OrderResponse:
        if not ObjectId.is_valid(order_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Order ID.")

        query: dict = {"_id": ObjectId(order_id)}
        if not is_admin and user_id:
            query["user_id"] = user_id

        doc = await db.orders.find_one(query)
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        return serialize_order(doc)

    @staticmethod
    async def update_order_status(
        db: AsyncIOMotorDatabase,
        order_id: str,
        data: OrderStatusUpdate,
    ) -> OrderResponse:
        if not ObjectId.is_valid(order_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Order ID.")

        existing = await db.orders.find_one({"_id": ObjectId(order_id)})
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        now = datetime.now(timezone.utc)
        update_fields = {
            "order_status": data.order_status,
            "updated_at": now,
        }
        if data.payment_status:
            update_fields["payment_status"] = data.payment_status

        # If order was cancelled and previous status wasn't cancelled, restore inventory
        if data.order_status == "cancelled" and existing.get("order_status") != "cancelled":
            for item in existing.get("items", []):
                pid = item.get("product_id")
                qty = item.get("quantity", 0)
                if pid and ObjectId.is_valid(pid) and qty > 0:
                    await db.products.update_one(
                        {"_id": ObjectId(pid)},
                        {"$inc": {"stock": qty}},
                    )

        updated = await db.orders.find_one_and_update(
            {"_id": ObjectId(order_id)},
            {"$set": update_fields},
            return_document=True,
        )
        return serialize_order(updated)

    @staticmethod
    async def list_all_orders(
        db: AsyncIOMotorDatabase,
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedResponse[OrderResponse]:
        skip = (page - 1) * limit
        total = await db.orders.count_documents({})
        cursor = db.orders.find({}).sort([("created_at", DESCENDING)]).skip(skip).limit(limit)

        items = [serialize_order(doc) async for doc in cursor]
        total_pages = (total + limit - 1) // limit if total > 0 else 1

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )
