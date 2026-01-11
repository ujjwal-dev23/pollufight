@echo off
setlocal

rem Check for venv
if not exist "venv" (
    echo ⚠️  Virtual environment not found. Creating one...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

rem Start Python Backend in the background
echo 🐍 Starting Pollution Detector Backend (Port 8000)...
start "Pollution Detector Backend" cmd /k "python -m uvicorn sub_modules.pollution_detector.main:app --host 0.0.0.0 --port 8000"

rem Start Policy Feedback Backend
echo 🏛️  Starting Policy Feedback Backend (Port 8001)...
start "Policy Feedback Backend" cmd /k "python -m uvicorn sub_modules.policy_feedback.backend.main:app --host 0.0.0.0 --port 8001"

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
