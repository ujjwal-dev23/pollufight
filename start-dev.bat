@echo off
setlocal

rem Check for venv
if not exist "venv" (
    echo ⚠️  Virtual environment not found. Creating one...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r unified_backend\requirements.txt
) else (
    call venv\Scripts\activate.bat
)

rem Start Unified Backend in the background
echo 🚀 Starting Unified Backend (Port 8000)...
echo    - Pollution Detection: /api/pollution/analyze
echo    - Policy Feedback: /api/policy/analyze
start "Unified Backend" cmd /k "python -m uvicorn unified_backend.main:app --host 0.0.0.0 --port 8000"

rem Wait briefly
timeout /t 2 /nobreak >nul

rem Start Frontend
echo 🚀 Starting Frontend...
if "%1"=="tauri" (
    echo 📱 Mode: Tauri App
    call npm run tauri dev
) else if "%1"=="android" (
    echo 🤖 Mode: Android App
    call npm run tauri android dev
) else (
    echo 🌐 Mode: Browser
    call npm run dev
)

endlocal
