import asyncio
import os
import sys
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.security import hash_password, ROLE_ADMIN

async def create_admin():
    email = os.environ.get("ADMIN_EMAIL", settings.ADMIN_EMAIL).strip().lower()
    password = os.environ.get("ADMIN_PASSWORD", settings.ADMIN_PASSWORD).strip()
    full_name = "Store Administrator"

    print(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]

    existing = await db.users.find_one({"email": email})
    now = datetime.now(timezone.utc)

    if existing:
        print(f"Admin user with email '{email}' already exists. Updating credentials and role...")
        await db.users.update_one(
            {"email": email},
            {
                "$set": {
                    "role": ROLE_ADMIN,
                    "hashed_password": hash_password(password),
                    "is_active": True,
                    "updated_at": now,
                }
            }
        )
        print(f"Admin account '{email}' updated successfully.")
    else:
        doc = {
            "email": email,
            "full_name": full_name,
            "hashed_password": hash_password(password),
            "role": ROLE_ADMIN,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        await db.users.insert_one(doc)
        print(f"Created new Admin account successfully: {email}")

    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
