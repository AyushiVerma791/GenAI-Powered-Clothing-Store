import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status
from pymongo import ASCENDING, DESCENDING
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductFilterParams,
)
from app.schemas.common import PaginatedResponse

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")

def serialize_product(doc: dict) -> ProductResponse:
    return ProductResponse(
        id=str(doc["_id"]),
        title=doc["title"],
        slug=doc.get("slug", slugify(doc["title"])),
        description=doc["description"],
        category=doc["category"],
        price=float(doc["price"]),
        original_price=float(doc["original_price"]) if doc.get("original_price") else None,
        stock=int(doc.get("stock", 0)),
        sizes=doc.get("sizes", []),
        colors=doc.get("colors", []),
        images=doc.get("images", []),
        tags=doc.get("tags", []),
        is_active=doc.get("is_active", True),
        is_featured=doc.get("is_featured", False),
        rating=float(doc.get("rating", 5.0)),
        reviews_count=int(doc.get("reviews_count", 0)),
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
        updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
    )

class ProductService:
    @staticmethod
    async def create_product(db: AsyncIOMotorDatabase, data: ProductCreate) -> ProductResponse:
        now = datetime.now(timezone.utc)
        base_slug = slugify(data.title)
        unique_slug = f"{base_slug}-{int(now.timestamp())}"

        doc = data.model_dump()
        doc.update({
            "slug": unique_slug,
            "rating": 5.0,
            "reviews_count": 0,
            "created_at": now,
            "updated_at": now,
        })

        result = await db.products.insert_one(doc)
        doc["_id"] = result.inserted_id
        return serialize_product(doc)

    @staticmethod
    async def get_by_id(db: AsyncIOMotorDatabase, product_id: str) -> ProductResponse:
        if not ObjectId.is_valid(product_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Product ID.")

        doc = await db.products.find_one({"_id": ObjectId(product_id)})
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
        return serialize_product(doc)

    @staticmethod
    async def update_product(
        db: AsyncIOMotorDatabase, product_id: str, data: ProductUpdate
    ) -> ProductResponse:
        if not ObjectId.is_valid(product_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Product ID.")

        update_dict = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
        if not update_dict:
            return await ProductService.get_by_id(db, product_id)

        update_dict["updated_at"] = datetime.now(timezone.utc)
        if "title" in update_dict and update_dict["title"]:
            update_dict["slug"] = f"{slugify(update_dict['title'])}-{product_id[-6:]}"

        result = await db.products.find_one_and_update(
            {"_id": ObjectId(product_id)},
            {"$set": update_dict},
            return_document=True,
        )
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
        return serialize_product(result)

    @staticmethod
    async def delete_product(db: AsyncIOMotorDatabase, product_id: str) -> bool:
        if not ObjectId.is_valid(product_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Product ID.")

        result = await db.products.delete_one({"_id": ObjectId(product_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
        return True

    @staticmethod
    async def list_products(
        db: AsyncIOMotorDatabase,
        params: ProductFilterParams,
        page: int = 1,
        limit: int = 12,
        active_only: bool = True,
    ) -> PaginatedResponse[ProductResponse]:
        query_filter: Dict[str, Any] = {}

        if active_only:
            query_filter["is_active"] = True

        if params.category:
            query_filter["category"] = {"$regex": f"^{re.escape(params.category)}$", "$options": "i"}

        if params.is_featured is not None:
            query_filter["is_featured"] = params.is_featured

        if params.min_price is not None or params.max_price is not None:
            price_query: Dict[str, Any] = {}
            if params.min_price is not None:
                price_query["$gte"] = params.min_price
            if params.max_price is not None:
                price_query["$lte"] = params.max_price
            query_filter["price"] = price_query

        if params.size:
            query_filter["sizes"] = {"$in": [params.size]}

        if params.color:
            query_filter["colors"] = {"$in": [params.color]}

        if params.query:
            clean_q = params.query.strip()
            # Perform regex search across title, description, and tags
            query_filter["$or"] = [
                {"title": {"$regex": clean_q, "$options": "i"}},
                {"description": {"$regex": clean_q, "$options": "i"}},
                {"tags": {"$regex": clean_q, "$options": "i"}},
                {"category": {"$regex": clean_q, "$options": "i"}},
            ]

        # Sorting
        sort_criterion = [("created_at", DESCENDING)]
        if params.sort == "price_asc":
            sort_criterion = [("price", ASCENDING)]
        elif params.sort == "price_desc":
            sort_criterion = [("price", DESCENDING)]
        elif params.sort == "rating":
            sort_criterion = [("rating", DESCENDING)]
        elif params.sort == "newest":
            sort_criterion = [("created_at", DESCENDING)]

        skip = (page - 1) * limit
        total = await db.products.count_documents(query_filter)
        cursor = db.products.find(query_filter).sort(sort_criterion).skip(skip).limit(limit)
        items = [serialize_product(doc) async for doc in cursor]

        total_pages = (total + limit - 1) // limit if total > 0 else 1
        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    @staticmethod
    async def get_categories(db: AsyncIOMotorDatabase) -> List[str]:
        categories = await db.products.distinct("category", {"is_active": True})
        return sorted([c for c in categories if c])
