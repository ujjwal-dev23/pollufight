"""Shared configuration for unified backend."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from project root
current_dir = Path(__file__).parent.absolute()
env_path = current_dir.parent / ".env"  # Go up to project root
load_dotenv(dotenv_path=env_path)

# Hugging Face Configuration
HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN") or os.getenv("HUGGINGFACEHUB_API_TOKEN")
HUGGINGFACE_BASE_URL = "https://router.huggingface.co"

# API Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# Model IDs
DETR_MODEL = "facebook/detr-resnet-50"
VIT_MODEL = "google/vit-base-patch16-224"
LLM_MODEL = "meta-llama/Llama-3.2-3B-Instruct"

# Timeout Configuration
API_TIMEOUT = float(os.getenv("API_TIMEOUT", "45.0"))
