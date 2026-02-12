"""Pollution detection routes."""
import io
import asyncio
import logging
from typing import Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from PIL import Image
import requests

from ..models.pollution_models import AnalysisResponse
from ..services.pollution_service import detect_pollution
from ..services.legal_drafter import generate_legal_draft
from ..services.news_service import fetch_pollution_news

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/geodecode")
async def geodecode(lat: float, lon: float):
    """Proxy reverse geocoding request to Nominatim."""
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {
            "User-Agent": "Jan-Kavch-Pollufight-App (Technical Backend Proxy)"
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to geodecode coordinates")


@router.get("/news")
async def get_pollution_news():
    """Fetch live pollution and environmental news."""
    try:
        news = fetch_pollution_news()
        return news
    except Exception as e:
        logger.error(f"Error serving news: {e}")
        # Return empty list instead of 500 to prevent frontend crash
        return []


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    original_filename: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    zipcode: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    user_name: Optional[str] = Form(None)
):
    """Analyze image for pollution detection."""
    try:
        # Load image from file or URL
        image = None
        filename = ""
        
        if file:
            image_data = await file.read()
            image = Image.open(io.BytesIO(image_data))
            filename = file.filename or "unknown.jpg"
        elif image_url:
            if image_url == "skipped":
                # Simulate analysis time for better UX
                await asyncio.sleep(2)
                image = None
                filename = original_filename or "demo_unknown.jpg"
            else:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
                response = requests.get(image_url, headers=headers, timeout=30)
                response.raise_for_status()
                image = Image.open(io.BytesIO(response.content))
                filename = original_filename or "unknown.jpg"
        else:
            raise HTTPException(
                status_code=400,
                detail="Either file or image_url must be provided"
            )

        # Detect pollution
        detection_result = await detect_pollution(image, filename)
        
        pollution_type = detection_result["pollution_type"]
        confidence = detection_result["confidence_level"]
        details = detection_result["details"]

        # Generate legal draft if pollution is detected
        if pollution_type == "No obvious pollution detected":
            legal_draft = "No significant pollution detected warranting a legal notice."
        else:
            location_data = {
                "city": city,
                "state": state,
                "zipcode": zipcode,
                "address": address
            }
            legal_draft = generate_legal_draft(
                pollution_type, 
                details, 
                location_data, 
                user_name=user_name or "Concerned Citizen"
            )

        return AnalysisResponse(
            pollution_type=pollution_type,
            confidence_level=confidence,
            legal_draft=legal_draft,
            details=details
        )

    except Exception as e:
        import traceback
        logger.error(f"Error in analyze_image: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
