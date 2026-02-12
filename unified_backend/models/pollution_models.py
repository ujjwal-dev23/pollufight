"""Pydantic models for pollution detection."""
from pydantic import BaseModel
from typing import List, Optional


class PollutionDetails(BaseModel):
    label: str
    score: float
    pollution_type: str
    box: Optional[List[float]] = None
    source: str


class AnalysisResponse(BaseModel):
    pollution_type: str
    confidence_level: float
    legal_draft: str
    details: List[PollutionDetails]
