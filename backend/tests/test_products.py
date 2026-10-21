import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_list_products_all(client: AsyncClient, seeded_products):
    response = await client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 4
    assert len(data["items"]) == 4

@pytest.mark.asyncio
async def test_filter_products_by_category(client: AsyncClient, seeded_products):
    response = await client.get("/api/v1/products?category=Jackets%20%26%20Coats")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    for item in data["items"]:
        assert item["category"] == "Jackets & Coats"

@pytest.mark.asyncio
async def test_filter_products_by_price_range(client: AsyncClient, seeded_products):
    response = await client.get("/api/v1/products?min_price=60&max_price=120")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Waterproof Outdoor Rain Jacket"
    assert data["items"][0]["price"] == 95.00

@pytest.mark.asyncio
async def test_get_product_by_id(client: AsyncClient, seeded_products):
    pid = seeded_products[0]
    response = await client.get(f"/api/v1/products/{pid}")
    assert response.status_code == 200
    assert response.json()["id"] == pid
    assert response.json()["title"] == "Classic Wool Trench Coat"

@pytest.mark.asyncio
async def test_get_product_not_found(client: AsyncClient, seeded_products):
    fake_id = "507f1f77bcf86cd799439011"
    response = await client.get(f"/api/v1/products/{fake_id}")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_admin_create_product(client: AsyncClient, seeded_users):
    admin_headers = seeded_users["admin"]["headers"]
    payload = {
        "title": "Cashmere Knit Beanie",
        "description": "Ultra warm ribbed cashmere beanie for freezing weather.",
        "category": "Accessories",
        "price": 38.00,
        "stock": 50,
        "sizes": ["One Size"],
        "colors": ["Grey", "Navy"],
        "tags": ["beanie", "winter", "accessories", "warm"],
    }
    response = await client.post("/api/v1/admin/products", json=payload, headers=admin_headers)
    assert response.status_code == 201
    created = response.json()
    assert created["title"] == "Cashmere Knit Beanie"
    assert created["price"] == 38.00

@pytest.mark.asyncio
async def test_customer_cannot_create_product(client: AsyncClient, seeded_users):
    customer_headers = seeded_users["customer"]["headers"]
    payload = {
        "title": "Hacked Product",
        "description": "Attempting unauthorized product creation.",
        "category": "Accessories",
        "price": 10.00,
        "stock": 10,
    }
    response = await client.post("/api/v1/admin/products", json=payload, headers=customer_headers)
    assert response.status_code == 403
    assert "Administrator privileges required" in response.json()["detail"]
