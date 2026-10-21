# PowerShell Local Development Setup Script
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " Setting up GenAI-Powered Clothing Store Environment " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Environment file check
if (-not (Test-Path ".env")) {
    Write-Host "[1/5] Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
} else {
    Write-Host "[1/5] .env file already exists." -ForegroundColor Green
}

# 2. Virtual Environment check
if (-not (Test-Path "venv")) {
    Write-Host "[2/5] Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
} else {
    Write-Host "[2/5] Python virtual environment already present." -ForegroundColor Green
}

# 3. Backend dependencies
Write-Host "[3/5] Installing/verifying backend dependencies..." -ForegroundColor Yellow
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r backend\requirements.txt

# 4. Frontend dependencies
Write-Host "[4/5] Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

# 5. Run automated tests
Write-Host "[5/5] Running automated tests..." -ForegroundColor Yellow
$env:PYTHONPATH="backend"
.\venv\Scripts\pytest.exe backend/tests

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host " Setup complete! To launch development servers:" -ForegroundColor Green
Write-Host " 1. Backend: $env:PYTHONPATH='backend'; .\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000" -ForegroundColor White
Write-Host " 2. Frontend: cd frontend; npm run dev" -ForegroundColor White
Write-Host "======================================================" -ForegroundColor Green
