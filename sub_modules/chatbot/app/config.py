import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PORT = int(os.getenv("PORT", 5001))
    # Model configuration
    MODEL_ID = os.getenv("MODEL_ID", "TinyLlama/TinyLlama-1.1B-Chat-v1.0")
    DEVICE_MAP = "auto"
    TORCH_DTYPE = "auto"
