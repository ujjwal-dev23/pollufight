"""Shared AI service for Hugging Face API calls."""
import os
import httpx
import logging
from typing import Optional, Dict, Any, List
from ..config import (
    HUGGINGFACE_API_TOKEN,
    HUGGINGFACE_BASE_URL,
    DETR_MODEL,
    VIT_MODEL,
    LLM_MODEL,
    API_TIMEOUT
)

logger = logging.getLogger(__name__)


class HuggingFaceService:
    """Shared service for all Hugging Face API calls."""
    
    def __init__(self):
        self.token = HUGGINGFACE_API_TOKEN.strip() if HUGGINGFACE_API_TOKEN else None
        self.base_url = HUGGINGFACE_BASE_URL
        self.timeout = API_TIMEOUT
        
    def get_headers(self) -> Dict[str, str]:
        """Get authorization headers for API calls."""
        if not self.token:
            logger.warning("No HUGGINGFACE_API_TOKEN found. API calls will fail.")
            return {}
        return {
            "Authorization": f"Bearer {self.token}"
        }
    
    async def detect_objects(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """Detect objects in image using DETR model."""
        try:
            url = f"{self.base_url}/hf-inference/models/{DETR_MODEL}"
            headers = self.get_headers()
            headers["Content-Type"] = "image/jpeg"
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, content=image_bytes)
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"DETR API Error {response.status_code}: {response.text}")
                    return []
        except Exception as e:
            logger.error(f"DETR detection failed: {e}")
            return []
    
    async def classify_scene(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """Classify scene using ViT model."""
        try:
            url = f"{self.base_url}/hf-inference/models/{VIT_MODEL}"
            headers = self.get_headers()
            headers["Content-Type"] = "image/jpeg"
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, content=image_bytes)
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"ViT API Error {response.status_code}: {response.text}")
                    return []
        except Exception as e:
            logger.error(f"Scene classification failed: {e}")
            return []
    
    async def generate_text(
        self, 
        prompt: str, 
        model_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.1
    ) -> Optional[str]:
        """Generate text using LLM model."""
        if not self.token:
            return None
        
        model = model_id or LLM_MODEL
        url = f"{self.base_url}/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code == 200:
                    result = response.json()
                    if "choices" in result and len(result["choices"]) > 0:
                        return result["choices"][0]["message"]["content"]
                    return str(result)
                else:
                    logger.error(f"LLM API Error {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Text generation failed: {e}")
        
        return None


# Singleton instance
ai_service = HuggingFaceService()
