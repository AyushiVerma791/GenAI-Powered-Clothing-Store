from datetime import datetime, timezone
from typing import Optional, Tuple
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status
from app.core.security import hash_password, verify_password, create_access_token, ROLE_CUSTOMER
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse

def serialize_user(doc: dict) -> UserResponse:
    return UserResponse(
        id=str(doc["_id"]),
        email=doc["email"],
        full_name=doc["full_name"],
        role=doc.get("role", ROLE_CUSTOMER),
        is_active=doc.get("is_active", True),
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
        updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
    )

class AuthService:
    @staticmethod
    async def register(db: AsyncIOMotorDatabase, data: UserRegister) -> TokenResponse:
        email_clean = data.email.lower().strip()
        existing = await db.users.find_one({"email": email_clean})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists."
            )

        now = datetime.now(timezone.utc)
        user_doc = {
            "email": email_clean,
            "full_name": data.full_name.strip(),
            "hashed_password": hash_password(data.password),
            "role": ROLE_CUSTOMER,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }

        result = await db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id

        user_response = serialize_user(user_doc)
        token = create_access_token(
            subject=user_response.id,
            role=user_response.role,
            email=user_response.email
        )

        return TokenResponse(access_token=token, token_type="bearer", user=user_response)

    @staticmethod
    async def login(db: AsyncIOMotorDatabase, data: UserLogin) -> TokenResponse:
        email_clean = data.email.lower().strip()
        user = await db.users.find_one({"email": email_clean})
        if not user or not verify_password(data.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Please contact support."
            )

        user_response = serialize_user(user)
        token = create_access_token(
            subject=user_response.id,
            role=user_response.role,
            email=user_response.email
        )

        return TokenResponse(access_token=token, token_type="bearer", user=user_response)
