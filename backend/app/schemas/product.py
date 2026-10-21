from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class ProductBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    category: str = Field(..., min_length=2, max_length=50)
    price: float = Field(..., gt=0, description="Price must be strictly positive")
    original_price: Optional[float] = Field(None, gt=0)
    stock: int = Field(default=0, ge=0, description="Available stock units")
    sizes: List[str] = Field(default_factory=list, description="Available sizes, e.g. XS, S, M, L, XL")
    colors: List[str] = Field(default_factory=list, description="Available colors, e.g. Black, Beige")
    images: List[str] = Field(default_factory=list, description="Image URLs or paths")
    tags: List[str] = Field(default_factory=list, description="Keywords for search and recommendations")
    is_active: bool = Field(default=True)
    is_featured: bool = Field(default=False)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10, max_length=5000)
    category: Optional[str] = Field(None, min_length=2, max_length=50)
    price: Optional[float] = Field(None, gt=0)
    original_price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    sizes: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    images: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None

class ProductResponse(ProductBase):
    id: str
    slug: str
    rating: float = 5.0
    reviews_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductFilterParams(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    size: Optional[str] = None
    color: Optional[str] = None
    sort: Optional[str] = Field("newest", description="newest, price_asc, price_desc, rating")
    is_featured: Optional[bool] = None
