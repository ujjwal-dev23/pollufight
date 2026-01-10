from pydantic import BaseModel, Field
from typing import List, Optional

class SentimentDistribution(BaseModel):
    support: float = Field(..., description="Percentage of support")
    neutral: float = Field(..., description="Percentage of neutral sentiment")
    oppose: float = Field(..., description="Percentage of oppose sentiment")

class DeepSentiment(BaseModel):
    insight: str = Field(..., description="The deep emotional insight, identifying urgency or specific group concerns")
    reasoning: str = Field(..., description="The reason behind the identified deep sentiment")

class ThemePillar(BaseModel):
    theme: str = Field("General", description="Name of the theme pillar")
    mentions: int = Field(1, description="Number of mentions for this theme")
    summary: str = Field("Insight extracted from comments.", description="Brief summary of what residents are saying about this theme")

class Innovation(BaseModel):
    idea: str = Field("New Concept", description="The unique, constructive suggestion identified")
    context: str = Field("Derived from community feedback.", description="Context or specific detail from the comments that makes this idea unique")

class DashboardReport(BaseModel):
    vibe_check: SentimentDistribution
    deep_sentiment: DeepSentiment
    theme_map: List[ThemePillar]
    innovation_spotter: List[Innovation]
