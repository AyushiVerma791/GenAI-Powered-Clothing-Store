import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    payload = {
        "email": "newuser@example.com",
        "full_name": "Bob Builder",
        "password": "Password123!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["role"] == "customer"
    assert data["user"]["is_active"] is True

@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, seeded_users):
    payload = {
        "email": "customer@example.com",  # Already in seeded_users
        "full_name": "Duplicate User",
        "password": "Password123!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

@pytest.mark.asyncio
async def test_register_validation_error(client: AsyncClient):
    payload = {
        "email": "invalid-email-format",
        "full_name": "B",  # Too short (< 2 chars)
        "password": "short",  # Too short (< 8 chars)
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, seeded_users):
    payload = {
        "email": "customer@example.com",
        "password": "CustomerPass123!",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "customer@example.com"

@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, seeded_users):
    payload = {
        "email": "customer@example.com",
        "password": "WrongPassword999!",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient, seeded_users):
    headers = seeded_users["customer"]["headers"]
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "customer@example.com"
    assert response.json()["role"] == "customer"

@pytest.mark.asyncio
async def test_get_me_unauthenticated(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
