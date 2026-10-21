# FastAPI REST API Reference

Base API Path: `/api/v1`  
Interactive Swagger UI: `http://localhost:8000/docs`  
ReDoc Documentation: `http://localhost:8000/redoc`

---

## 1. Health & Diagnostics

### `GET /api/v1/health`
Checks backend and MongoDB connection status. Used by AWS Application Load Balancers and Docker healthchecks.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "GenAI Clothing Store API",
  "version": "1.0.0",
  "environment": "development",
  "database": "connected",
  "ai_mock_mode": false
}
```

---

## 2. Authentication (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Creates a new customer account.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "full_name": "Eleanor Vance",
  "password": "Password123!"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": "670f5e1289abc12345678901",
    "email": "customer@example.com",
    "full_name": "Eleanor Vance",
    "role": "customer",
    "is_active": true,
    "created_at": "2026-10-21T07:00:00Z",
    "updated_at": "2026-10-21T07:00:00Z"
  }
}
```

### `POST /api/v1/auth/login`
Authenticates user and issues signed JWT access token.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "Password123!"
}
```

### `GET /api/v1/auth/me`
Retrieves authenticated user's profile. Requires `Authorization: Bearer <TOKEN>`.

---

## 3. Product Catalog (`/api/v1/products`)

### `GET /api/v1/products`
Retrieves filtered and paginated products.

**Query Parameters:**
| Parameter | Type | Description |
|---|---|---|
| `query` | string | Keyword search in title, description, or tags |
| `category` | string | Filter by exact category |
| `min_price` | float | Minimum price in USD |
| `max_price` | float | Maximum price in USD |
| `size` | string | e.g. `XS`, `S`, `M`, `L`, `XL` |
| `color` | string | e.g. `Black`, `Camel`, `Navy` |
| `sort` | string | `newest`, `price_asc`, `price_desc`, `rating` |
| `page` | int | Page index (default: 1) |
| `limit` | int | Items per page (default: 12) |

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "670f5e1289abc12345678910",
      "title": "Tailored Double-Breasted Wool Trench Coat",
      "slug": "tailored-double-breasted-wool-trench-coat-1",
      "description": "Crafted from a heavyweight Italian wool-cashmere blend...",
      "category": "Jackets & Coats",
      "price": 189.0,
      "original_price": 240.0,
      "stock": 18,
      "sizes": ["XS", "S", "M", "L", "XL"],
      "colors": ["Camel", "Charcoal", "Midnight Navy"],
      "images": ["/placeholder.png"],
      "tags": ["winter", "formal", "warm", "wool"],
      "is_active": true,
      "is_featured": true,
      "rating": 4.9,
      "reviews_count": 34
    }
  ],
  "total": 18,
  "page": 1,
  "limit": 12,
  "total_pages": 2
}
```

### `GET /api/v1/products/categories`
Returns distinct active clothing categories.

---

## 4. Shopping Cart (`/api/v1/cart`)
*All cart endpoints require Bearer JWT authentication.*

### `GET /api/v1/cart`
Returns the user's enriched shopping cart with live catalog prices and computed subtotal, tax, and shipping.

### `POST /api/v1/cart/items`
Adds an item to the shopping bag.
```json
{
  "product_id": "670f5e1289abc12345678910",
  "quantity": 1,
  "size": "M",
  "color": "Camel"
}
```

### `PUT /api/v1/cart/items/{product_id}?size=M&color=Camel`
Updates item quantity in cart.

### `DELETE /api/v1/cart/items/{product_id}?size=M&color=Camel`
Removes an item from cart.

### `DELETE /api/v1/cart`
Clears all items in the user's cart.

---

## 5. Orders & Checkout (`/api/v1/orders`)

### `POST /api/v1/orders`
Places an order from the user's current shopping cart. Atomically reserves stock and creates price snapshots.

**Request Body:**
```json
{
  "shipping_address": {
    "full_name": "Eleanor Vance",
    "address_line1": "742 Evergreen Terrace",
    "address_line2": "Apt 2B",
    "city": "Springfield",
    "state": "OR",
    "postal_code": "97477",
    "country": "United States",
    "phone": "+1-555-0199"
  },
  "payment_method": "mock_card"
}
```

---

## 6. AI Shopping Assistant (`/api/v1/chat`)

### `POST /api/v1/chat/message`
Processes shopping requests through Pydantic AI with Groq or grounded catalog fallback.

**Request Body:**
```json
{
  "message": "Find me warm wool jackets under $200 in size L",
  "history": []
}
```

**Response (200 OK):**
```json
{
  "reply": "Here are 2 stylish options I handpicked for you from our catalog...",
  "recommended_products": [
    {
      "id": "670f5e1289abc12345678910",
      "title": "Tailored Double-Breasted Wool Trench Coat",
      "price": 189.0,
      "category": "Jackets & Coats",
      "image": "/placeholder.png",
      "sizes": ["XS", "S", "M", "L", "XL"],
      "colors": ["Camel", "Charcoal"],
      "match_reason": "Matches your request for a warm wool coat within your $200 budget in size L"
    }
  ],
  "suggested_queries": [
    "Show me more items under $200",
    "What sizes are available?",
    "Can you recommend matching accessories?"
  ],
  "model_used": "llama-3.3-70b-versatile",
  "is_mock": false
}
```
