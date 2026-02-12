#!/bin/bash

# Exit on error
set -e

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    # Kill the background jobs (the python server)
    kill $(jobs -p) 2>/dev/null || true
}

# Trap SIGINT (Ctrl+C) and EXIT to run cleanup
trap cleanup EXIT INT

# Check for venv
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r unified_backend/requirements.txt
else
    source venv/bin/activate
fi

# Start Unified Backend in the background
echo "🚀 Starting Unified Backend (Port 8000)..."
echo "   - Pollution Detection: /api/pollution/analyze"
echo "   - Policy Feedback: /api/policy/analyze"
uvicorn unified_backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait briefly for the server to initialize
sleep 2

# Start Frontend
echo "🚀 Starting Frontend..."
if [ "$1" == "tauri" ]; then
    echo "📱 Mode: Tauri App"
    npm run tauri dev
elif [ "$1" == "android" ]; then
    echo "🤖 Mode: Android App"
    npm run tauri android dev
else
    echo "🌐 Mode: Browser"
    npm run dev
fi

# Wait for background processes
wait $BACKEND_PID
