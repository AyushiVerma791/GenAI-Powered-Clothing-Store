from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database
from app.schemas.product import ProductResponse, ProductFilterParams
from app.schemas.common import PaginatedResponse
from app.services.product_service import ProductService

router = APIRouter()

@router.get("", response_model=PaginatedResponse[ProductResponse])
async def list_products(
    query: Optional[str] = Query(None, description="Search keyword in title, description, or tags"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    size: Optional[str] = Query(None),
    color: Optional[str] = Query(None),
    sort: Optional[str] = Query("newest", description="newest, price_asc, price_desc, rating"),
    is_featured: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Retrieves paginated, filtered catalog products."""
    params = ProductFilterParams(
        query=query,
        category=category,
        min_price=min_price,
        max_price=max_price,
        size=size,
        color=color,
        sort=sort,
        is_featured=is_featured,
    )
    return await ProductService.list_products(db, params=params, page=page, limit=limit, active_only=True)

@router.get("/categories", response_model=List[str])
async def get_categories(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Retrieves distinct categories with active products."""
    return await ProductService.get_categories(db)

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Retrieves single product details by MongoDB ObjectId."""
    return await ProductService.get_by_id(db, product_id)
