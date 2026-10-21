#!/usr/bin/env bash
set -e

echo "======================================================"
echo " Setting up GenAI-Powered Clothing Store Environment "
echo "======================================================"

# 1. Environment file check
if [ ! -f ".env" ]; then
    echo "[1/5] Creating .env from .env.example..."
    cp .env.example .env
else
    echo "[1/5] .env file already exists."
fi

# 2. Virtual Environment check
if [ ! -d "venv" ]; then
    echo "[2/5] Creating Python virtual environment..."
    python3 -m venv venv
else
    echo "[2/5] Python virtual environment already present."
fi

# 3. Backend dependencies
echo "[3/5] Installing backend dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

# 4. Frontend dependencies
echo "[4/5] Installing frontend dependencies..."
cd frontend
npm install
cd ..

# 5. Run automated tests
echo "[5/5] Running automated tests..."
export PYTHONPATH="backend"
pytest backend/tests

echo ""
echo "======================================================"
echo " Setup complete! To launch development servers:"
echo " 1. Backend: export PYTHONPATH=backend && uvicorn app.main:app --reload --port 8000"
echo " 2. Frontend: cd frontend && npm run dev"
echo "======================================================"
