import asyncio
import os
import sys
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.security import hash_password, ROLE_ADMIN, ROLE_CUSTOMER
from app.services.product_service import slugify

SAMPLE_PRODUCTS = [
    {
        "title": "Tailored Double-Breasted Wool Trench Coat",
        "description": "Crafted from a heavyweight Italian wool-cashmere blend, this signature trench coat features structured lapels, horn buttons, deep storm flaps, and a removable waist belt for a commanding silhouette in freezing temperatures.",
        "category": "Jackets & Coats",
        "price": 189.00,
        "original_price": 240.00,
        "stock": 18,
        "sizes": ["XS", "S", "M", "L", "XL"],
        "colors": ["Camel", "Charcoal", "Midnight Navy"],
        "images": [
            "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1539533018447-63fcce667823?auto=format&fit=crop&w=800&q=80"
        ],
        "tags": ["winter", "formal", "warm", "wool", "coat", "outerwear", "trench"],
        "rating": 4.9,
        "reviews_count": 34,
        "is_featured": True,
    },
    {
        "title": "Minimalist Waterproof Windbreaker Parka",
        "description": "Engineered with triple-layer breathable GORE-TEX technology and sealed seams. Designed for urban commuters needing lightweight storm protection without sacrificing modern aesthetics.",
        "category": "Jackets & Coats",
        "price": 115.00,
        "original_price": 145.00,
        "stock": 25,
        "sizes": ["S", "M", "L", "XL"],
        "colors": ["Matte Black", "Sage Green", "Slate Grey"],
        "images": [
            "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80"
        ],
        "tags": ["rain", "waterproof", "casual", "windbreaker", "jacket", "sporty", "breathable"],
        "rating": 4.7,
        "reviews_count": 28,
        "is_featured": True,
    },
    {
        "title": "Oversized Cashmere Crewneck Sweater",
        "description": "Spun from 100% Grade-A Mongolian cashmere with ribbed cuffs and hem. Impossibly soft against the skin with effortless drape for layering over collared shirts or relaxing at home.",
        "category": "Sweaters & Knits",
        "price": 135.00,
        "original_price": 160.00,
        "stock": 15,
        "sizes": ["XS", "S", "M", "L"],
        "colors": ["Oatmeal", "Cloud Grey", "Espresso"],
        "images": [
            "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=800&q=80"
        ],
        "tags": ["cashmere", "sweater", "warm", "knitwear", "cozy", "luxury", "winter"],
        "rating": 4.8,
        "reviews_count": 42,
        "is_featured": True,
    },
    {
        "title": "Chunky Cable-Knit Fisherman Pullover",
        "description": "Traditional Aran cable stitching made from sturdy, breathable organic merino wool. Designed to keep you warm against crisp autumn breezes and seaside chills.",
        "category": "Sweaters & Knits",
        "price": 89.00,
        "original_price": 110.00,
        "stock": 20,
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "colors": ["Ivory", "Forest Green", "Burnt Orange"],
        "images": [
            "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80"
        ],
        "tags": ["cable-knit", "wool", "sweater", "warm", "cozy", "fall", "casual"],
        "rating": 4.6,
        "reviews_count": 19,
        "is_featured": False,
    },
    {
        "title": "Crisp Oxford Cotton Button-Down Shirt",
        "description": "Woven with durable two-ply combed cotton that gets softer with every wash. Features classic mother-of-pearl buttons, a tailored curved hem, and a structured button-down collar.",
        "category": "Shirts & Tops",
        "price": 55.00,
        "original_price": 70.00,
        "stock": 40,
        "sizes": ["S", "M", "L", "XL"],
        "colors": ["Oxford White", "Sky Blue", "French Blue"],
        "images": [
            "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"
        ],
        "tags": ["formal", "office", "cotton", "shirt", "button-down", "business", "classic"],
        "rating": 4.9,
        "reviews_count": 55,
        "is_featured": True,
    },
    {
        "title": "Relaxed French Terry Cotton Hoodie",
        "description": "Heavyweight 450 GSM French terry fleece with flatlock stitching, kangaroo pocket, and double-lined hood. The quintessential street-smart staple for weekend comfort.",
        "category": "Shirts & Tops",
        "price": 68.00,
        "original_price": 85.00,
        "stock": 35,
        "sizes": ["XS", "S", "M", "L", "XL"],
        "colors": ["Heather Grey", "Washed Black", "Olive"],
        "images": [
            "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80"
        ],
        "tags": ["hoodie", "streetwear", "casual", "cotton", "cozy", "loungewear"],
        "rating": 4.7,
        "reviews_count": 31,
        "is_featured": False,
    },
    {
        "title": "Pleated High-Waisted Wide-Leg Trousers",
        "description": "Tailored drape with front double pleats, slanted pockets, and a clean hook-and-bar closure. Designed to transition smoothly from boardroom presentations to upscale evening dinners.",
        "category": "Pants & Trousers",
        "price": 95.00,
        "original_price": 120.00,
        "stock": 22,
        "sizes": ["XS", "S", "M", "L"],
        "colors": ["Black", "Taupe", "Cream"],
        "images": [
            "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80"
        ],
        "tags": ["pants", "trousers", "formal", "office", "wide-leg", "tailored", "elegant"],
        "rating": 4.8,
        "reviews_count": 27,
        "is_featured": True,
    },
    {
        "title": "Selvedge Raw Indigo Denim Jeans",
        "description": "13.5 oz Japanese selvedge denim woven on vintage shuttle looms. Clean straight-leg cut designed to break in naturally and develop personalized fade patterns over time.",
        "category": "Pants & Trousers",
        "price": 110.00,
        "original_price": 135.00,
        "stock": 28,
        "sizes": ["S", "M", "L", "XL"],
        "colors": ["Raw Indigo", "Faded Blue"],
        "images": [
            "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80"
        ],
        "tags": ["jeans", "denim", "selvedge", "casual", "pants", "classic"],
        "rating": 4.9,
        "reviews_count": 39,
        "is_featured": False,
    },
    {
        "title": "Silk Slip Midi Dress with Cowl Neck",
        "description": "Cut on the bias from 100% pure mulberry silk charmeuse for a fluid silhouette that skims curves. Features delicate adjustable spaghetti straps and an alluring low back.",
        "category": "Dresses",
        "price": 145.00,
        "original_price": 180.00,
        "stock": 14,
        "sizes": ["XS", "S", "M", "L"],
        "colors": ["Champagne Gold", "Emerald Green", "Noir"],
        "images": [
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80"
        ],
        "tags": ["silk", "dress", "evening", "party", "formal", "wedding", "glamour"],
        "rating": 4.9,
        "reviews_count": 48,
        "is_featured": True,
    },
    {
        "title": "Linen Wrap Floral Summer Sundress",
        "description": "Airy Belgian flax linen with an elegant tie waist and ruffled hem. Perfectly breathable for warm coastal vacations, garden parties, or weekend brunches in the sunshine.",
        "category": "Dresses",
        "price": 79.00,
        "original_price": 98.00,
        "stock": 30,
        "sizes": ["XS", "S", "M", "L", "XL"],
        "colors": ["Sage Floral", "Terracotta", "Sky Blue"],
        "images": [
            "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80"
        ],
        "tags": ["summer", "linen", "sundress", "casual", "beach", "vacation", "floral"],
        "rating": 4.7,
        "reviews_count": 22,
        "is_featured": False,
    },
    {
        "title": "Handcrafted Leather Chelsea Boots",
        "description": "Crafted from supple full-grain Italian calfskin with elastic side gussets and Goodyear welted Vibram rubber soles for exceptional comfort and all-weather durability.",
        "category": "Footwear",
        "price": 165.00,
        "original_price": 210.00,
        "stock": 16,
        "sizes": ["8", "9", "10", "11", "12"],
        "colors": ["Espresso Brown", "Midnight Black"],
        "images": [
            "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80"
        ],
        "tags": ["boots", "leather", "chelsea", "footwear", "shoes", "formal", "casual"],
        "rating": 4.8,
        "reviews_count": 36,
        "is_featured": True,
    },
    {
        "title": "Italian Leather Belt with Brushed Brass Buckle",
        "description": "Vegetable-tanned full-grain bridle leather cut to 1.25 inches with hand-burnished edges and a solid brushed brass roller buckle.",
        "category": "Accessories",
        "price": 42.00,
        "original_price": 50.00,
        "stock": 50,
        "sizes": ["30", "32", "34", "36", "38"],
        "colors": ["Cognac Brown", "Classic Black"],
        "images": [
            "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80"
        ],
        "tags": ["belt", "leather", "accessories", "formal", "classic"],
        "rating": 4.7,
        "reviews_count": 15,
        "is_featured": False,
    },
]

async def seed_database():
    print(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
    client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[settings.MONGODB_DB_NAME]

    try:
        await client.admin.command('ping')
        print("MongoDB connection verified.")
    except Exception as e:
        print(f"Cannot connect to MongoDB: {e}")
        print("Please ensure MongoDB is running (e.g. via Docker Compose or MongoDB Atlas).")
        return

    now = datetime.now(timezone.utc)

    # 1. Seed Admin User
    admin_email = settings.ADMIN_EMAIL.lower().strip()
    admin_exists = await db.users.find_one({"email": admin_email})
    if not admin_exists:
        await db.users.insert_one({
            "email": admin_email,
            "full_name": "Store Administrator",
            "hashed_password": hash_password(settings.ADMIN_PASSWORD),
            "role": ROLE_ADMIN,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        })
        print(f"Created Admin user: {admin_email}")

    # 2. Seed Demo Customer User
    customer_email = "customer@clothingstore.com"
    customer_exists = await db.users.find_one({"email": customer_email})
    if not customer_exists:
        await db.users.insert_one({
            "email": customer_email,
            "full_name": "Demo Shopper",
            "hashed_password": hash_password("CustomerPass123!"),
            "role": ROLE_CUSTOMER,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        })
        print(f"Created Demo Customer user: {customer_email}")

    # 3. Seed Products
    print("Clearing and populating sample products...")
    await db.products.delete_many({})

    count = 0
    for p in SAMPLE_PRODUCTS:
        base_slug = slugify(p["title"])
        doc = dict(p)
        doc.update({
            "slug": f"{base_slug}-{count + 1}",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        })
        await db.products.insert_one(doc)
        count += 1

    print(f"Successfully seeded {count} clothing products into '{settings.MONGODB_DB_NAME}.products'.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
