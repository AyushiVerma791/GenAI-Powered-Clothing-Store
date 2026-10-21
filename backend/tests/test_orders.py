import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_order_empty_cart_fails(client: AsyncClient, seeded_users):
    headers = seeded_users["customer"]["headers"]
    payload = {
        "shipping_address": {
            "full_name": "Alice Shopper",
            "address_line1": "123 Fashion Blvd",
            "city": "New York",
            "state": "NY",
            "postal_code": "10001",
            "country": "United States",
            "phone": "+1-555-0199",
        },
        "payment_method": "mock_card",
    }
    response = await client.post("/api/v1/orders", json=payload, headers=headers)
    assert response.status_code == 400
    assert "Your cart is empty" in response.json()["detail"]

@pytest.mark.asyncio
async def test_create_order_success_and_decrements_stock(
    client: AsyncClient, seeded_users, seeded_products
):
    headers = seeded_users["customer"]["headers"]
    pid = seeded_products[3]  # Low Stock Silk Dress, initial stock = 2

    # 1. Add 2 units to cart
    await client.post(
        "/api/v1/cart/items",
        json={"product_id": pid, "quantity": 2, "size": "M", "color": "Emerald"},
        headers=headers,
    )

    # 2. Place Order
    payload = {
        "shipping_address": {
            "full_name": "Alice Shopper",
            "address_line1": "123 Fashion Blvd",
            "city": "New York",
            "state": "NY",
            "postal_code": "10001",
            "country": "United States",
            "phone": "+1-555-0199",
        },
        "payment_method": "mock_card",
    }
    response = await client.post("/api/v1/orders", json=payload, headers=headers)
    assert response.status_code == 201
    order = response.json()
    assert order["order_number"].startswith("ORD-")
    assert order["payment_status"] == "paid"
    assert order["order_status"] == "placed"
    assert len(order["items"]) == 1
    assert order["items"][0]["quantity"] == 2
    assert order["items"][0]["unit_price"] == 150.00
    assert order["subtotal"] == 300.00

    # 3. Verify Product Stock has decreased from 2 to 0!
    prod_resp = await client.get(f"/api/v1/products/{pid}")
    assert prod_resp.status_code == 200
    assert prod_resp.json()["stock"] == 0

    # 4. Verify user's cart is now empty
    cart_resp = await client.get("/api/v1/cart", headers=headers)
    assert len(cart_resp.json()["items"]) == 0

@pytest.mark.asyncio
async def test_get_order_history(client: AsyncClient, seeded_users, seeded_products):
    headers = seeded_users["customer"]["headers"]
    pid = seeded_products[2]

    # Add item and place order
    await client.post(
        "/api/v1/cart/items",
        json={"product_id": pid, "quantity": 1, "size": "M", "color": "White"},
        headers=headers,
    )
    await client.post(
        "/api/v1/orders",
        json={
            "shipping_address": {
                "full_name": "Alice Shopper",
                "address_line1": "123 Fashion Blvd",
                "city": "New York",
                "state": "NY",
                "postal_code": "10001",
                "country": "United States",
                "phone": "+1-555-0199",
            },
            "payment_method": "mock_card",
        },
        headers=headers,
    )

    response = await client.get("/api/v1/orders", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1

@pytest.mark.asyncio
async def test_admin_update_order_status(client: AsyncClient, seeded_users, seeded_products):
    cust_headers = seeded_users["customer"]["headers"]
    admin_headers = seeded_users["admin"]["headers"]
    pid = seeded_products[0]

    # Place order as customer
    await client.post(
        "/api/v1/cart/items",
        json={"product_id": pid, "quantity": 1, "size": "L", "color": "Camel"},
        headers=cust_headers,
    )
    order_resp = await client.post(
        "/api/v1/orders",
        json={
            "shipping_address": {
                "full_name": "Alice Shopper",
                "address_line1": "123 Fashion Blvd",
                "city": "New York",
                "state": "NY",
                "postal_code": "10001",
                "country": "United States",
                "phone": "+1-555-0199",
            },
            "payment_method": "cash_on_delivery",
        },
        headers=cust_headers,
    )
    order_id = order_resp.json()["id"]

    # Admin updates status to shipped
    update_payload = {"order_status": "shipped", "payment_status": "paid"}
    res = await client.put(f"/api/v1/admin/orders/{order_id}/status", json=update_payload, headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["order_status"] == "shipped"
    assert res.json()["payment_status"] == "paid"
