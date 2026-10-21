from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, TEXT, IndexModel
from app.core.config import settings
from app.core.logging import logger

class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

db_manager = DatabaseManager()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB at %s...", settings.MONGODB_URI.split("@")[-1])
    db_manager.client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        maxPoolSize=50,
        minPoolSize=10,
        serverSelectionTimeoutMS=5000
    )
    db_manager.db = db_manager.client[settings.MONGODB_DB_NAME]
    try:
        # Ping the server to verify connectivity
        await db_manager.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB database: %s", settings.MONGODB_DB_NAME)
        await create_indexes()
    except Exception as e:
        logger.warning("MongoDB ping failed on startup: %s. Application will start, but database queries might fail until MongoDB is available.", e)

async def close_mongo_connection():
    if db_manager.client:
        logger.info("Closing MongoDB connection...")
        db_manager.client.close()
        logger.info("MongoDB connection closed.")

async def create_indexes():
    """Ensure essential indexes exist for performance and integrity."""
    if db_manager.db is None:
        return

    try:
        # Users Collection: unique email
        await db_manager.db.users.create_index(
            [("email", ASCENDING)],
            unique=True,
            name="unique_user_email"
        )

        # Products Collection: category, tags, price, and text search on title/description
        await db_manager.db.products.create_index(
            [("category", ASCENDING)],
            name="product_category_idx"
        )
        await db_manager.db.products.create_index(
            [("price", ASCENDING)],
            name="product_price_idx"
        )
        await db_manager.db.products.create_index(
            [("is_active", ASCENDING)],
            name="product_active_idx"
        )
        await db_manager.db.products.create_index(
            [("title", TEXT), ("description", TEXT), ("tags", TEXT)],
            name="product_text_search_idx"
        )

        # Carts Collection: unique user_id
        await db_manager.db.carts.create_index(
            [("user_id", ASCENDING)],
            unique=True,
            name="unique_user_cart"
        )

        # Orders Collection: user_id and created_at for fast history queries
        await db_manager.db.orders.create_index(
            [("user_id", ASCENDING), ("created_at", ASCENDING)],
            name="user_orders_idx"
        )

        logger.info("Database indexes successfully verified/created.")
    except Exception as e:
        logger.error("Error creating database indexes: %s", e)

def get_database() -> AsyncIOMotorDatabase:
    if db_manager.db is None:
        raise RuntimeError("Database connection has not been initialized.")
    return db_manager.db
