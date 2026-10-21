from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status
from app.schemas.cart import (
    CartItemAdd,
    CartItemResponse,
    CartResponse,
)

TAX_RATE = 0.08  # 8% estimated sales tax
FREE_SHIPPING_THRESHOLD = 100.00
STANDARD_SHIPPING_FEE = 10.00

class CartService:
    @staticmethod
    async def get_or_create_cart(db: AsyncIOMotorDatabase, user_id: str) -> CartResponse:
        cart_doc = await db.carts.find_one({"user_id": user_id})
        now = datetime.now(timezone.utc)

        if not cart_doc:
            cart_doc = {
                "user_id": user_id,
                "items": [],
                "updated_at": now,
            }
            await db.carts.insert_one(cart_doc)

        return await CartService._enrich_cart(db, cart_doc)

    @staticmethod
    async def _enrich_cart(db: AsyncIOMotorDatabase, cart_doc: dict) -> CartResponse:
        enriched_items: List[CartItemResponse] = []
        raw_items = cart_doc.get("items", [])
        subtotal = 0.0
        total_items = 0

        # Collect product IDs
        product_ids = [
            ObjectId(item["product_id"])
            for item in raw_items
            if ObjectId.is_valid(item.get("product_id", ""))
        ]

        products_cursor = db.products.find({"_id": {"$in": product_ids}})
        product_map = {str(p["_id"]): p async for p in products_cursor}

        for item in raw_items:
            pid = item.get("product_id")
            product = product_map.get(pid)

            if not product or not product.get("is_active", True):
                # Product no longer available, skip
                continue

            unit_price = float(product["price"])
            qty = int(item["quantity"])
            item_subtotal = round(unit_price * qty, 2)
            subtotal += item_subtotal
            total_items += qty

            image_url = product.get("images", ["/placeholder.png"])[0] if product.get("images") else "/placeholder.png"

            enriched_items.append(
                CartItemResponse(
                    product_id=pid,
                    title=product["title"],
                    price=unit_price,
                    quantity=qty,
                    size=item.get("size", "M"),
                    color=item.get("color", "Default"),
                    image=image_url,
                    subtotal=item_subtotal,
                    stock_available=int(product.get("stock", 0)),
                )
            )

        subtotal = round(subtotal, 2)
        estimated_tax = round(subtotal * TAX_RATE, 2)
        estimated_shipping = 0.0 if (subtotal >= FREE_SHIPPING_THRESHOLD or subtotal == 0) else STANDARD_SHIPPING_FEE
        total = round(subtotal + estimated_tax + estimated_shipping, 2)

        return CartResponse(
            user_id=cart_doc["user_id"],
            items=enriched_items,
            total_items=total_items,
            subtotal=subtotal,
            estimated_tax=estimated_tax,
            estimated_shipping=estimated_shipping,
            total=total,
            updated_at=cart_doc.get("updated_at", datetime.now(timezone.utc)),
        )

    @staticmethod
    async def add_item(db: AsyncIOMotorDatabase, user_id: str, data: CartItemAdd) -> CartResponse:
        if not ObjectId.is_valid(data.product_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Product ID.")

        product = await db.products.find_one({"_id": ObjectId(data.product_id), "is_active": True})
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or inactive.")

        available_stock = int(product.get("stock", 0))
        if available_stock <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This product is currently out of stock.")

        cart_doc = await db.carts.find_one({"user_id": user_id})
        now = datetime.now(timezone.utc)
        if not cart_doc:
            cart_doc = {"user_id": user_id, "items": [], "updated_at": now}

        items = cart_doc.get("items", [])
        found = False

        for item in items:
            if (
                item["product_id"] == data.product_id
                and item.get("size") == data.size
                and item.get("color") == data.color
            ):
                new_qty = item["quantity"] + data.quantity
                if new_qty > available_stock:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot add {data.quantity} more. Total in cart ({new_qty}) exceeds available stock ({available_stock}).",
                    )
                item["quantity"] = new_qty
                found = True
                break

        if not found:
            if data.quantity > available_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Requested quantity ({data.quantity}) exceeds available stock ({available_stock}).",
                )
            items.append({
                "product_id": data.product_id,
                "quantity": data.quantity,
                "size": data.size,
                "color": data.color,
            })

        await db.carts.update_one(
            {"user_id": user_id},
            {"$set": {"items": items, "updated_at": now}},
            upsert=True,
        )

        return await CartService.get_or_create_cart(db, user_id)

    @staticmethod
    async def update_item_quantity(
        db: AsyncIOMotorDatabase,
        user_id: str,
        product_id: str,
        quantity: int,
        size: str,
        color: str,
    ) -> CartResponse:
        if not ObjectId.is_valid(product_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Product ID.")

        cart_doc = await db.carts.find_one({"user_id": user_id})
        if not cart_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found.")

        product = await db.products.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

        available_stock = int(product.get("stock", 0))
        if quantity > available_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested quantity ({quantity}) exceeds available stock ({available_stock}).",
            )

        items = cart_doc.get("items", [])
        if quantity <= 0:
            # Remove item
            items = [
                i for i in items
                if not (i["product_id"] == product_id and i.get("size") == size and i.get("color") == color)
            ]
        else:
            for item in items:
                if (
                    item["product_id"] == product_id
                    and item.get("size") == size
                    and item.get("color") == color
                ):
                    item["quantity"] = quantity
                    break

        now = datetime.now(timezone.utc)
        await db.carts.update_one(
            {"user_id": user_id},
            {"$set": {"items": items, "updated_at": now}},
        )
        return await CartService.get_or_create_cart(db, user_id)

    @staticmethod
    async def remove_item(
        db: AsyncIOMotorDatabase,
        user_id: str,
        product_id: str,
        size: str,
        color: str,
    ) -> CartResponse:
        now = datetime.now(timezone.utc)
        await db.carts.update_one(
            {"user_id": user_id},
            {
                "$pull": {
                    "items": {
                        "product_id": product_id,
                        "size": size,
                        "color": color,
                    }
                },
                "$set": {"updated_at": now},
            },
        )
        return await CartService.get_or_create_cart(db, user_id)

    @staticmethod
    async def clear_cart(db: AsyncIOMotorDatabase, user_id: str) -> bool:
        now = datetime.now(timezone.utc)
        await db.carts.update_one(
            {"user_id": user_id},
            {"$set": {"items": [], "updated_at": now}},
            upsert=True,
        )
        return True
