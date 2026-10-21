from datetime import timedelta
import pytest
from httpx import AsyncClient
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    ROLE_CUSTOMER,
    ROLE_ADMIN,
)

def test_password_hashing():
    pwd = "MySecretPassword123!"
    hash1 = hash_password(pwd)
    hash2 = hash_password(pwd)

    # Salt ensures different hashes for the same password
    assert hash1 != hash2
    assert verify_password(pwd, hash1) is True
    assert verify_password(pwd, hash2) is True
    assert verify_password("WrongPassword!", hash1) is False

def test_jwt_token_creation_and_validation():
    user_id = "60c72b2f9b1d8b2bad000001"
    token = create_access_token(user_id, role=ROLE_CUSTOMER, email="test@test.com")
    payload = decode_access_token(token)

    assert payload is not None
    assert payload["sub"] == user_id
    assert payload["role"] == ROLE_CUSTOMER
    assert payload["email"] == "test@test.com"

def test_expired_jwt_rejected():
    user_id = "60c72b2f9b1d8b2bad000001"
    # Create expired token (-10 minutes)
    expired_token = create_access_token(
        user_id,
        role=ROLE_CUSTOMER,
        email="test@test.com",
        expires_delta=timedelta(minutes=-10)
    )
    payload = decode_access_token(expired_token)
    assert payload is None

def test_tampered_jwt_rejected():
    token = create_access_token("123", role=ROLE_CUSTOMER, email="test@test.com")
    tampered_token = token[:-5] + "abcde"
    payload = decode_access_token(tampered_token)
    assert payload is None

@pytest.mark.asyncio
async def test_admin_route_forbidden_for_anonymous(client: AsyncClient):
    response = await client.get("/api/v1/admin/orders")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_admin_route_forbidden_for_customer(client: AsyncClient, seeded_users):
    customer_headers = seeded_users["customer"]["headers"]
    response = await client.get("/api/v1/admin/orders", headers=customer_headers)
    assert response.status_code == 403
