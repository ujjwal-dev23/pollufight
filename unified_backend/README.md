# PolluFight Unified Backend

Unified FastAPI backend consolidating pollution detection and policy feedback services.

## Architecture

```
unified_backend/
├── main.py                 # Main FastAPI application
├── config.py               # Shared configuration
├── routes/
│   ├── pollution.py        # Pollution detection endpoints
│   ├── policy.py           # Policy feedback endpoints
│   └── health.py           # Health check endpoints
├── services/
│   ├── ai_service.py       # Shared Hugging Face API client
│   ├── pollution_service.py # Pollution detection logic
│   ├── legal_drafter.py    # Legal draft generation
│   └── policy_service.py    # Policy analysis with LangGraph
└── models/
    ├── pollution_models.py  # Pollution detection models
    └── policy_models.py     # Policy feedback models
```

## API Endpoints

### Pollution Detection
- `POST /api/pollution/analyze` - Analyze image for pollution
  - Body: `FormData` with `file` or `image_url` and optional `original_filename`
  - Returns: `AnalysisResponse` with pollution type, confidence, legal draft, and details

### Policy Feedback
- `POST /api/policy/analyze` - Analyze community comments
  - Body: `{"comments": ["comment1", "comment2", ...]}`
  - Returns: `DashboardReport` with sentiment, themes, and innovations

### Health Check
- `GET /health` - Health check endpoint
  - Returns: `{"status": "healthy", "service": "PolluFight Unified Backend"}`

## Setup

1. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r unified_backend/requirements.txt
   ```

3. **Set environment variables:**
   Create a `.env` file in the `unified_backend/` directory:
   ```env
   HUGGINGFACE_API_TOKEN=your_token_here
   API_HOST=0.0.0.0
   API_PORT=8000
   CORS_ORIGINS=*
   ```

4. **Run the server:**
   ```bash
   uvicorn unified_backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

   Or use the start script from the project root:
   ```bash
   ./start-dev.sh
   ```

## Configuration

All configuration is managed through `config.py` and environment variables:

- `HUGGINGFACE_API_TOKEN` - Hugging Face API token for AI models
- `API_HOST` - Server host (default: 0.0.0.0)
- `API_PORT` - Server port (default: 8000)
- `CORS_ORIGINS` - CORS allowed origins (default: *)

## Features

- ✅ Unified backend for all services
- ✅ Shared AI service for Hugging Face API calls
- ✅ Async/await support for better performance
- ✅ Comprehensive error handling
- ✅ CORS middleware for frontend integration
- ✅ Health check endpoint
- ✅ Structured logging

## Migration from Old Backends

The unified backend replaces:
- `sub_modules/pollution_detector/main.py` (Port 8000)
- `sub_modules/policy_feedback/backend/main.py` (Port 8001)

**Frontend Changes:**
- Pollution API: `http://localhost:8000/analyze` → `http://localhost:8000/api/pollution/analyze`
- Policy API: `http://localhost:8001/analyze` → `http://localhost:8000/api/policy/analyze`

## Development

The backend uses:
- **FastAPI** for the web framework
- **Uvicorn** as the ASGI server
- **LangGraph** for policy analysis workflows
- **Hugging Face API** for AI/ML models
- **Pydantic** for data validation

## Testing

Test the endpoints using curl:

```bash
# Health check
curl http://localhost:8000/health

# Pollution detection
curl -X POST http://localhost:8000/api/pollution/analyze \
  -F "image_url=https://example.com/image.jpg"

# Policy analysis
curl -X POST http://localhost:8000/api/policy/analyze \
  -H "Content-Type: application/json" \
  -d '{"comments": ["Comment 1", "Comment 2"]}'
```
