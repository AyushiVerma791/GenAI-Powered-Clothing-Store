from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class ShippingAddress(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    address_line1: str = Field(..., min_length=5, max_length=200)
    address_line2: Optional[str] = Field(None, max_length=200)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    postal_code: str = Field(..., min_length=3, max_length=20)
    country: str = Field(default="United States", min_length=2, max_length=100)
    phone: str = Field(..., min_length=7, max_length=20)

class OrderCreateRequest(BaseModel):
    shipping_address: ShippingAddress
    payment_method: str = Field(
        default="mock_card",
        description="Supported values: 'mock_card' or 'cash_on_delivery'"
    )
    # Optional direct purchase single item (or standard checkout from cart)
    from_cart: bool = True

class OrderItemSnapshot(BaseModel):
    product_id: str
    title: str
    unit_price: float
    quantity: int
    size: str
    color: str
    image: str
    subtotal: float

class OrderResponse(BaseModel):
    id: str
    order_number: str
    user_id: str
    items: List[OrderItemSnapshot]
    shipping_address: ShippingAddress
    payment_method: str
    payment_status: str
    order_status: str
    subtotal: float
    tax: float
    shipping_fee: float
    total: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    order_status: str = Field(..., description="'placed', 'processing', 'shipped', 'delivered', 'cancelled'")
    payment_status: Optional[str] = Field(None, description="'pending', 'paid', 'failed'")
