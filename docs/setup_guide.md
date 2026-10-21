# Developer Setup & Local Execution Guide

Follow this guide to get the **GenAI-Powered Clothing Store** running locally on your workstation.

---

## Prerequisites

- **Python:** 3.12 or newer
- **Node.js:** v18.0 or newer (npm v10+)
- **MongoDB:** Local MongoDB instance, Docker container, or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- **Groq API Key:** Free API key from [console.groq.com](https://console.groq.com/keys) (optional; development mock mode works automatically if omitted)

---

## Method 1: Local Development (Recommended for Fast Iteration)

### Step 1: Clone and Configure Environment

```bash
# Copy example environment configuration
cp .env.example .env
```

Edit `.env` to configure your settings:
```ini
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=clothing_store_db
GROQ_API_KEY=gsk_your_groq_api_key_here
AI_MOCK_MODE=False
```

### Step 2: Set up Backend Virtual Environment

```bash
# Create and activate Python virtual environment
python -m venv venv

# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Step 3: Initialize Database & Seed Sample Products

```bash
# Seed rich sample clothing catalog & demo customer
$env:PYTHONPATH="backend"   # Windows PowerShell
python backend/scripts/seed_db.py

# Create or reset administrator account
python backend/scripts/create_admin.py
```

### Step 4: Start Backend FastAPI Server

```bash
$env:PYTHONPATH="backend"
uvicorn app.main:app --reload --port 8000
```
- API Base: `http://localhost:8000`
- Interactive Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/v1/health`

### Step 5: Start React Frontend

Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
- Storefront URL: `http://localhost:5173`

---

## Method 2: Full Stack with Docker Compose

If you have Docker Desktop running:

```bash
# Build and launch all three containers (Mongo + FastAPI Backend + React Nginx Frontend)
docker compose up --build
```

- Storefront: `http://localhost` (or `http://localhost:3000`)
- Backend API Docs: `http://localhost:8000/docs`

To seed the containerized MongoDB:
```bash
docker compose exec backend python scripts/seed_db.py
docker compose exec backend python scripts/create_admin.py
```

---

## Default Seeded Credentials

| Account | Email | Password | Role |
|---|---|---|---|
| **Administrator** | `admin@clothingstore.com` | `AdminStrongPass123!` | `admin` (Catalog CRUD, Orders, Status) |
| **Demo Customer** | `customer@clothingstore.com` | `CustomerPass123!` | `customer` (Cart, Checkout, History) |
