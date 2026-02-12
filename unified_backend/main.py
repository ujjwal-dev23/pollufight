"""Unified FastAPI backend for PolluFight."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .routes import pollution, policy, health

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="PolluFight Unified API",
    description="Unified backend for pollution detection and policy feedback",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(pollution.router, prefix="/api/pollution", tags=["pollution"])
app.include_router(policy.router, prefix="/api/policy", tags=["policy"])
app.include_router(health.router, prefix="/health", tags=["health"])


@app.on_event("startup")
async def startup_event():
    """Log startup information."""
    logger.info("=" * 60)
    logger.info("PolluFight Unified Backend starting up...")
    logger.info("Available endpoints:")
    logger.info("  - POST /api/pollution/analyze")
    logger.info("  - POST /api/policy/analyze")
    logger.info("  - GET /health")
    logger.info("=" * 60)


if __name__ == "__main__":
    import uvicorn
    from .config import API_HOST, API_PORT
    
    uvicorn.run(
        "unified_backend.main:app",
        host=API_HOST,
        port=API_PORT,
        reload=True
    )
