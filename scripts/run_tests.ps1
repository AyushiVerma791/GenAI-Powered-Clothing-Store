# Script to run all backend and frontend verification tests
Write-Host "Running Backend Automated Test Suite..." -ForegroundColor Cyan
$env:PYTHONPATH="backend"
.\venv\Scripts\pytest.exe backend/tests -v

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nRunning Frontend Build Verification..." -ForegroundColor Cyan
Set-Location frontend
npm run build
Set-Location ..

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n===============================================" -ForegroundColor Green
Write-Host " ALL TEST SUITES & BUILDS PASSED CLEANLY! " -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
