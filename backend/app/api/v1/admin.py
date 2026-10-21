from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database
from app.api.deps import get_current_admin
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.schemas.order import OrderResponse, OrderStatusUpdate
from app.schemas.common import PaginatedResponse
from app.services.product_service import ProductService
from app.services.order_service import OrderService
from app.services.storage_service import StorageService

router = APIRouter()

# ----------------- Product Management -----------------

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: Creates a new catalog product."""
    return await ProductService.create_product(db, data)

@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: Updates an existing catalog product."""
    return await ProductService.update_product(db, product_id, data)

@router.delete("/products/{product_id}", status_code=status.HTTP_200_OK)
async def delete_product(
    product_id: str,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: Deletes a product from the catalog."""
    await ProductService.delete_product(db, product_id)
    return {"message": "Product successfully deleted."}

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_admin: dict = Depends(get_current_admin),
):
    """Admin: Securely uploads product media (local or S3)."""
    image_url = await StorageService.upload_file(file)
    return {"url": image_url}

# ----------------- Order Management -----------------

@router.get("/orders", response_model=PaginatedResponse[OrderResponse])
async def list_all_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: Retrieves all store orders across all users."""
    return await OrderService.list_all_orders(db, page=page, limit=limit)

@router.put("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: Updates fulfillment and payment status of an order."""
    return await OrderService.update_order_status(db, order_id=order_id, data=data)
