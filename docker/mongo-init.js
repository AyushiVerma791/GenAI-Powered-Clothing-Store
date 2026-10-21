// MongoDB Initialization Script
db = db.getSiblingDB('clothing_store_db');

print('Initializing MongoDB collections and indexes for clothing_store_db...');

db.createCollection('users');
db.createCollection('products');
db.createCollection('carts');
db.createCollection('orders');

db.users.createIndex({ "email": 1 }, { unique: true });
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "price": 1 });
db.products.createIndex({ "is_active": 1 });
db.products.createIndex({ "title": "text", "description": "text", "tags": "text" });
db.carts.createIndex({ "user_id": 1 }, { unique: true });
db.orders.createIndex({ "user_id": 1, "created_at": -1 });

print('MongoDB initialization completed successfully.');
