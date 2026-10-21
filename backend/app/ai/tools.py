import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic_ai import RunContext

@dataclass
class AgentDependencies:
    db: AsyncIOMotorDatabase

STOP_WORDS = {
    "i", "need", "want", "looking", "for", "find", "show", "me", "a", "an", "the",
    "in", "under", "below", "less", "than", "budget", "with", "size", "color", "please",
    "can", "you", "give", "some", "any", "good", "best", "around", "about"
}

def extract_keywords(text: str) -> List[str]:
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    return [w for w in words if w not in STOP_WORDS]

async def execute_search_products(
    db: AsyncIOMotorDatabase,
    query: Optional[str] = None,
    category: Optional[str] = None,
    max_price: Optional[float] = None,
    min_price: Optional[float] = None,
    size: Optional[str] = None,
    color: Optional[str] = None,
    limit: int = 6,
) -> List[Dict[str, Any]]:
    """Internal helper to retrieve active products matching user constraints."""
    filter_query: Dict[str, Any] = {"is_active": True, "stock": {"$gt": 0}}

    if category:
        filter_query["category"] = {"$regex": f"^{re.escape(category)}$", "$options": "i"}

    if min_price is not None or max_price is not None:
        price_q: Dict[str, Any] = {}
        if min_price is not None:
            price_q["$gte"] = float(min_price)
        if max_price is not None:
            price_q["$lte"] = float(max_price)
        filter_query["price"] = price_q

    if size:
        filter_query["sizes"] = {"$in": [size.upper()]}

    if color:
        filter_query["colors"] = {"$regex": f"^{re.escape(color)}$", "$options": "i"}

    if query:
        keywords = extract_keywords(query)
        if keywords:
            keyword_clauses = []
            for kw in keywords:
                stem = kw.rstrip("s")
                keyword_clauses.extend([
                    {"title": {"$regex": stem, "$options": "i"}},
                    {"description": {"$regex": stem, "$options": "i"}},
                    {"tags": {"$regex": stem, "$options": "i"}},
                    {"category": {"$regex": stem, "$options": "i"}},
                ])
            filter_query["$or"] = keyword_clauses

    cursor = db.products.find(filter_query).limit(limit)
    results = []
    async for p in cursor:
        results.append({
            "id": str(p["_id"]),
            "title": p.get("title"),
            "category": p.get("category"),
            "price": float(p.get("price", 0.0)),
            "sizes": p.get("sizes", []),
            "colors": p.get("colors", []),
            "tags": p.get("tags", []),
            "image": p.get("images", ["/placeholder.png"])[0] if p.get("images") else "/placeholder.png",
            "stock": int(p.get("stock", 0)),
            "description": p.get("description", "")[:200],
        })
    return results

async def execute_get_product_by_id(
    db: AsyncIOMotorDatabase,
    product_id: str,
) -> Optional[Dict[str, Any]]:
    """Internal helper to retrieve detailed info for a specific product ID."""
    if not ObjectId.is_valid(product_id):
        return None
    p = await db.products.find_one({"_id": ObjectId(product_id), "is_active": True})
    if not p:
        return None
    return {
        "id": str(p["_id"]),
        "title": p.get("title"),
        "category": p.get("category"),
        "price": float(p.get("price", 0.0)),
        "sizes": p.get("sizes", []),
        "colors": p.get("colors", []),
        "tags": p.get("tags", []),
        "image": p.get("images", ["/placeholder.png"])[0] if p.get("images") else "/placeholder.png",
        "stock": int(p.get("stock", 0)),
        "description": p.get("description", ""),
    }

async def execute_get_categories(db: AsyncIOMotorDatabase) -> List[str]:
    """Internal helper to retrieve unique active clothing categories."""
    cats = await db.products.distinct("category", {"is_active": True})
    return sorted([c for c in cats if c])
