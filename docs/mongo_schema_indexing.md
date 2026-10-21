# MongoDB Schema Design & Indexing Guide

MongoDB is the persistent document database for the GenAI Clothing Store. This document details collection structures, indexing rationale, and transactional snapshot design.

---

## 1. Collections & Document Structures

### A. `users` Collection
Stores customer and administrator profiles.

```json
{
  "_id": ObjectId("670f5e1289abc12345678901"),
  "email": "customer@example.com",
  "full_name": "Eleanor Vance",
  "hashed_password": "$2b$12$e8qW7...",
  "role": "customer", // "customer" | "admin"
  "is_active": true,
  "created_at": ISODate("2026-10-21T07:00:00Z"),
  "updated_at": ISODate("2026-10-21T07:00:00Z")
}
```

### B. `products` Collection
Stores catalog items with embedded variants (sizes, colors, images, tags).

```json
{
  "_id": ObjectId("670f5e1289abc12345678910"),
  "title": "Tailored Double-Breasted Wool Trench Coat",
  "slug": "tailored-double-breasted-wool-trench-coat-1",
  "description": "Crafted from a heavyweight Italian wool-cashmere blend...",
  "category": "Jackets & Coats",
  "price": 189.00,
  "original_price": 240.00,
  "stock": 18,
  "sizes": ["XS", "S", "M", "L", "XL"],
  "colors": ["Camel", "Charcoal", "Midnight Navy"],
  "images": ["/uploads/abc123def.jpg"],
  "tags": ["winter", "formal", "warm", "wool", "coat"],
  "rating": 4.9,
  "reviews_count": 34,
  "is_featured": true,
  "is_active": true,
  "created_at": ISODate("2026-10-21T07:00:00Z"),
  "updated_at": ISODate("2026-10-21T07:00:00Z")
}
```

### C. `carts` Collection
Maintains current shopping bag state per user.

```json
{
  "_id": ObjectId("670f5e1289abc12345678920"),
  "user_id": "670f5e1289abc12345678901",
  "items": [
    {
      "product_id": "670f5e1289abc12345678910",
      "quantity": 2,
      "size": "L",
      "color": "Camel"
    }
  ],
  "updated_at": ISODate("2026-10-21T07:15:00Z")
}
```

### D. `orders` Collection (Immutable Snapshots)
Stores completed orders. Note that each item contains a **snapshot** of product title, unit purchase price, size, and image at the exact time of order.

```json
{
  "_id": ObjectId("670f5e1289abc12345678930"),
  "order_number": "ORD-20261021-4821",
  "user_id": "670f5e1289abc12345678901",
  "items": [
    {
      "product_id": "670f5e1289abc12345678910",
      "title": "Tailored Double-Breasted Wool Trench Coat",
      "unit_price": 189.00,
      "quantity": 2,
      "size": "L",
      "color": "Camel",
      "image": "/uploads/abc123def.jpg",
      "subtotal": 378.00
    }
  ],
  "shipping_address": {
    "full_name": "Eleanor Vance",
    "address_line1": "742 Evergreen Terrace",
    "city": "Springfield",
    "state": "OR",
    "postal_code": "97477",
    "country": "United States",
    "phone": "+1-555-0199"
  },
  "payment_method": "mock_card",
  "payment_status": "paid",
  "order_status": "placed", // placed | processing | shipped | delivered | cancelled
  "subtotal": 378.00,
  "tax": 30.24,
  "shipping_fee": 0.00,
  "total": 408.24,
  "created_at": ISODate("2026-10-21T07:20:00Z"),
  "updated_at": ISODate("2026-10-21T07:20:00Z")
}
```

---

## 2. Why Store Order Item Snapshots?

In traditional relational databases, beginners often store only `product_id` and reference `products.price`.
**The Critical Problem:** If an administrator updates the price of a coat from \$189 to \$240 three months later, all historical orders would dynamically recalculate and show incorrect financial totals, corrupting accounting and customer receipts!

**Our Solution:** In `OrderService`, when an order is created, we embed an immutable `OrderItemSnapshot`:
1. `title`: Exact name purchased
2. `unit_price`: Verified price paid
3. `subtotal`: `unit_price * quantity`

If the product is edited, deleted, or repriced in the future, past orders remain 100% historically consistent.

---

## 3. Database Indexes

Indexes are automatically registered on application startup in `app/core/database.py`:

| Collection | Index Fields | Type | Purpose |
|---|---|---|---|
| `users` | `email: 1` | Unique | Prevents duplicate account registrations |
| `products` | `category: 1` | Single Field | Fast category browsing (`/shop?category=...`) |
| `products` | `price: 1` | Single Field | Range queries (`min_price`, `max_price`) and sorting |
| `products` | `is_active: 1` | Single Field | Filters out unpublished/inactive items |
| `products` | `title: text, description: text, tags: text` | Compound Text | Natural language keyword searches |
| `carts` | `user_id: 1` | Unique | Ensures 1 active shopping cart per user |
| `orders` | `user_id: 1, created_at: -1` | Compound | Fast reverse-chronological order history lookup |
