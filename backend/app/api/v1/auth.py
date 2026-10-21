from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database
from app.api.deps import get_current_user
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import AuthService, serialize_user

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Registers a new customer account and returns a signed JWT."""
    return await AuthService.register(db, data)

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Authenticates credentials and returns a signed JWT."""
    return await AuthService.login(db, data)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return serialize_user(current_user)

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Stateless JWT logout endpoint."""
    return {"message": "Successfully logged out."}
