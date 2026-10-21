from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1, le=50, description="Quantity to add")
    size: str = Field(..., min_length=1, max_length=20)
    color: str = Field(..., min_length=1, max_length=50)

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1, le=50, description="Updated quantity")

class CartItemResponse(BaseModel):
    product_id: str
    title: str
    price: float
    quantity: int
    size: str
    color: str
    image: str
    subtotal: float
    stock_available: int

class CartResponse(BaseModel):
    user_id: str
    items: List[CartItemResponse]
    total_items: int
    subtotal: float
    estimated_tax: float
    estimated_shipping: float
    total: float
    updated_at: datetime
