import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_empty_cart(client: AsyncClient, seeded_users):
    headers = seeded_users["customer"]["headers"]
    response = await client.get("/api/v1/cart", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["subtotal"] == 0.0
    assert data["total"] == 0.0

@pytest.mark.asyncio
async def test_add_item_to_cart(client: AsyncClient, seeded_users, seeded_products):
    headers = seeded_users["customer"]["headers"]
    pid = seeded_products[0]  # Classic Wool Trench Coat, price 180.00

    payload = {
        "product_id": pid,
        "quantity": 1,
        "size": "M",
        "color": "Camel",
    }
    response = await client.post("/api/v1/cart/items", json=payload, headers=headers)
    assert response.status_code == 200
    cart = response.json()
    assert len(cart["items"]) == 1
    assert cart["items"][0]["product_id"] == pid
    assert cart["items"][0]["quantity"] == 1
    assert cart["subtotal"] == 180.00
    # Subtotal >= 100 -> free shipping (0.00), tax = 180 * 0.08 = 14.40
    assert cart["estimated_shipping"] == 0.0
    assert cart["estimated_tax"] == 14.40
    assert cart["total"] == 194.40

@pytest.mark.asyncio
async def test_cart_shipping_fee_under_100(client: AsyncClient, seeded_users, seeded_products):
    headers = seeded_users["customer"]["headers"]
    pid = seeded_products[2]  # Organic Cotton White Shirt, price 50.00

    payload = {
        "product_id": pid,
        "quantity": 1,
        "size": "L",
        "color": "White",
    }
    response = await client.post("/api/v1/cart/items", json=payload, headers=headers)
    assert response.status_code == 200
    cart = response.json()
    assert cart["subtotal"] == 50.00
    assert cart["estimated_shipping"] == 10.00  # < $100 -> flat $10 shipping
    assert cart["estimated_tax"] == 4.00       # 50 * 0.08
    assert cart["total"] == 64.00

@pytest.mark.asyncio
async def test_add_item_exceeding_stock_fails(client: AsyncClient, seeded_users, seeded_products):
    headers = seeded_users["customer"]["headers"]
    pid = seeded_products[3]  # Low Stock Silk Dress, stock is 2

    payload = {
        "product_id": pid,
        "quantity": 5,  # Exceeds available stock 2
        "size": "M",
        "color": "Emerald",
    }
    response = await client.post("/api/v1/cart/items", json=payload, headers=headers)
    assert response.status_code == 400
    assert "exceeds available stock" in response.json()["detail"]

@pytest.mark.asyncio
async def test_remove_item_from_cart(client: AsyncClient, seeded_users, seeded_products):
    headers = seeded_users["customer"]["headers"]
    pid = seeded_products[1]

    # Add item
    await client.post("/api/v1/cart/items", json={
        "product_id": pid, "quantity": 1, "size": "L", "color": "Navy"
    }, headers=headers)

    # Delete item
    response = await client.delete(f"/api/v1/cart/items/{pid}?size=L&color=Navy", headers=headers)
    assert response.status_code == 200
    cart = response.json()
    assert len(cart["items"]) == 0
    assert cart["total"] == 0.0
