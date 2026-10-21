import asyncio
from datetime import datetime, timezone
from typing import AsyncGenerator
import pytest
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient
from app.main import app
from app.core.database import get_database
from app.core.security import hash_password, create_access_token, ROLE_ADMIN, ROLE_CUSTOMER

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def mock_db():
    client = AsyncMongoMockClient()
    db = client["test_clothing_db"]
    yield db
    client.close()

@pytest.fixture
async def client(mock_db) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_database():
        return mock_db

    app.dependency_overrides[get_database] = override_get_database
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest.fixture
async def seeded_users(mock_db):
    now = datetime.now(timezone.utc)
    # Admin User
    admin_doc = {
        "email": "admin@example.com",
        "full_name": "Admin User",
        "hashed_password": hash_password("AdminPass123!"),
        "role": ROLE_ADMIN,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    admin_res = await mock_db.users.insert_one(admin_doc)
    admin_id = str(admin_res.inserted_id)

    # Customer User
    customer_doc = {
        "email": "customer@example.com",
        "full_name": "Alice Shopper",
        "hashed_password": hash_password("CustomerPass123!"),
        "role": ROLE_CUSTOMER,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    customer_res = await mock_db.users.insert_one(customer_doc)
    customer_id = str(customer_res.inserted_id)

    # Generate Tokens
    admin_token = create_access_token(admin_id, role=ROLE_ADMIN, email="admin@example.com")
    customer_token = create_access_token(customer_id, role=ROLE_CUSTOMER, email="customer@example.com")

    return {
        "admin": {
            "id": admin_id,
            "email": "admin@example.com",
            "password": "AdminPass123!",
            "token": admin_token,
            "headers": {"Authorization": f"Bearer {admin_token}"},
        },
        "customer": {
            "id": customer_id,
            "email": "customer@example.com",
            "password": "CustomerPass123!",
            "token": customer_token,
            "headers": {"Authorization": f"Bearer {customer_token}"},
        },
    }

@pytest.fixture
async def seeded_products(mock_db):
    now = datetime.now(timezone.utc)
    products = [
        {
            "title": "Classic Wool Trench Coat",
            "slug": "classic-wool-trench-coat-1",
            "description": "Luxurious heavyweight wool trench coat designed for winter warmth and timeless style.",
            "category": "Jackets & Coats",
            "price": 180.00,
            "original_price": 220.00,
            "stock": 10,
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Camel", "Black"],
            "images": ["/placeholder.png"],
            "tags": ["winter", "formal", "warm", "wool", "coat"],
            "is_active": True,
            "is_featured": True,
            "rating": 4.9,
            "reviews_count": 15,
            "created_at": now,
            "updated_at": now,
        },
        {
            "title": "Waterproof Outdoor Rain Jacket",
            "slug": "waterproof-outdoor-rain-jacket-2",
            "description": "Breathable rainproof technical shell jacket with hood and taped seams.",
            "category": "Jackets & Coats",
            "price": 95.00,
            "original_price": 120.00,
            "stock": 15,
            "sizes": ["M", "L", "XL"],
            "colors": ["Navy", "Olive"],
            "images": ["/placeholder.png"],
            "tags": ["rain", "waterproof", "casual", "jacket"],
            "is_active": True,
            "is_featured": False,
            "rating": 4.6,
            "reviews_count": 10,
            "created_at": now,
            "updated_at": now,
        },
        {
            "title": "Organic Cotton White Shirt",
            "slug": "organic-cotton-white-shirt-3",
            "description": "Crisp poplin cotton shirt tailored for business and formal settings.",
            "category": "Shirts & Tops",
            "price": 50.00,
            "original_price": 65.00,
            "stock": 25,
            "sizes": ["S", "M", "L"],
            "colors": ["White", "Light Blue"],
            "images": ["/placeholder.png"],
            "tags": ["formal", "cotton", "shirt", "office"],
            "is_active": True,
            "is_featured": True,
            "rating": 4.8,
            "reviews_count": 22,
            "created_at": now,
            "updated_at": now,
        },
        {
            "title": "Low Stock Limited Edition Silk Dress",
            "slug": "low-stock-limited-edition-silk-dress-4",
            "description": "Exclusive evening silk dress in emerald green.",
            "category": "Dresses",
            "price": 150.00,
            "stock": 2,  # Exactly 2 in stock for testing inventory constraints
            "sizes": ["S", "M"],
            "colors": ["Emerald"],
            "images": ["/placeholder.png"],
            "tags": ["dress", "silk", "evening", "party"],
            "is_active": True,
            "is_featured": False,
            "rating": 5.0,
            "reviews_count": 5,
            "created_at": now,
            "updated_at": now,
        },
    ]

    inserted_ids = []
    for p in products:
        res = await mock_db.products.insert_one(p)
        inserted_ids.append(str(res.inserted_id))

    return inserted_ids
