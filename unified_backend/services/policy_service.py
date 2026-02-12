"""Policy feedback analysis service using LangGraph."""
import json
import re
import logging
from typing import List, TypedDict
from langgraph.graph import StateGraph, END
from ..models.policy_models import (
    DashboardReport,
    SentimentDistribution,
    DeepSentiment,
    ThemePillar,
    Innovation
)
from .ai_service import ai_service

logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    comments: List[str]
    vibe_check: SentimentDistribution
    deep_sentiment: DeepSentiment
    theme_map: List[ThemePillar]
    innovation_spotter: List[Innovation]
    final_report: DashboardReport


def parse_json_garbage(text: str):
    """Robust JSON extraction from LLM output."""
    try:
        # Search for first { or [ and last } or ]
        match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        # Fallback to simple index search
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            return json.loads(text[start:end+1])
        start_list = text.find('[')
        end_list = text.rfind(']')
        if start_list != -1 and end_list != -1:
            return json.loads(text[start_list:end_list+1])
    except Exception as e:
        logger.debug(f"JSON Parsing failed for: {text[:100]}... Error: {e}")
    return None



async def analyze_sentiment(state: AgentState):
    """Analyze sentiment from comments."""
    # import asyncio  <-- No longer needed
    comments_text = "\n".join(state["comments"][:30])
    prompt = f"""Analyze community comments and return JSON.
Comments:
{comments_text}

Return ONLY JSON in this format:
{{
  "support": 70,
  "neutral": 20,
  "oppose": 10,
  "insight": "The community is primarily concerned about...",
  "reasoning": "Mentions of smoke and drainage indicate..."
}}"""
    
    # Run async function in async context
    resp = await ai_service.generate_text(
        prompt,
        system_prompt="You are a helpful urban planning assistant. Return only structured JSON."
    )

    # Removed manual event loop handling

    
    data = parse_json_garbage(resp) if resp else None
    
    # Handle list response (sometimes LLM returns [{},{},...])
    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
        data = data[0]
        
    if data and isinstance(data, dict):
        try:
            # Safe parsing helper
            def safe_float(val, default):
                try:
                    return float(val)
                except (ValueError, TypeError):
                    return default

            state["vibe_check"] = SentimentDistribution(
                support=safe_float(data.get("support"), 72),
                neutral=safe_float(data.get("neutral"), 18),
                oppose=safe_float(data.get("oppose"), 10)
            )
            insight = data.get("insight") or data.get("detailed_analysis_of_vibe") or "Significant concern detected."
            reasoning = data.get("reasoning") or data.get("evidence_from_comments") or "Extracted from comment patterns."
            
            state["deep_sentiment"] = DeepSentiment(
                insight=str(insight),
                reasoning=str(reasoning)
            )
            logger.info(f"Analyzed sentiment: {state['vibe_check']}")
        except Exception as e:
            logger.error(f"Error parsing sentiment data: {e}")
            state["vibe_check"] = SentimentDistribution(support=72, neutral=18, oppose=10)
            state["deep_sentiment"] = DeepSentiment(
                insight="Error analyzing sentiment",
                reasoning="Data format issue."
            )
    else:
        state["vibe_check"] = SentimentDistribution(support=72, neutral=18, oppose=10)
        state["deep_sentiment"] = DeepSentiment(
            insight="Demo Insight",
            reasoning="API fallback."
        )
    return state



async def cluster_themes(state: AgentState):
    """Cluster comments into themes."""
    # import asyncio <-- No longer needed
    comments_text = "\n".join(state["comments"][:30])
    prompt = f"""Group comments into 3-4 themes.
Comments:
{comments_text}

Return ONLY a JSON list in this format:
[
  {{"theme": "Air Quality", "mentions": 15, "summary": "Residents are reporting smoke and odors from factories."}},
  {{"theme": "Waste Management", "mentions": 8, "summary": "Concerns regarding illegal dumping in wetlands."}}
]"""

    
    
    resp = await ai_service.generate_text(
        prompt,
        system_prompt="You are a helpful urban planning assistant. Return only structured JSON."
    )

    
    data = parse_json_garbage(resp) if resp else None
    
    # Handle wrapped list inside dict if applicable, but we expect a list
    if isinstance(data, dict):
        # Maybe it put the list under a key?
        for key in ["themes", "pillars", "data", "list"]:
             if key in data and isinstance(data[key], list):
                 data = data[key]
                 break
    
    if data and isinstance(data, list):
        pillars = []
        for item in data[:5]:
            if not isinstance(item, dict):
                continue
            
            # Safe parsing
            def safe_int(val, default):
                try:
                    return int(val)
                except (ValueError, TypeError):
                    return default

            theme = str(item.get("theme", item.get("topic", "General")))
            mentions = safe_int(item.get("mentions", item.get("count", 1)), 1)
            summary = str(item.get("summary", item.get("description", "Insight extracted from comments.")))
            pillars.append(ThemePillar(theme=theme, mentions=mentions, summary=summary))
        
        state["theme_map"] = pillars if pillars else [
            ThemePillar(
                theme="General",
                mentions=len(state["comments"]),
                summary="Common community concerns grouped by AI."
            )
        ]
    else:
        state["theme_map"] = [
            ThemePillar(
                theme="General",
                mentions=len(state["comments"]),
                summary="Analysis in progress."
            )
        ]
    return state



async def spot_innovation(state: AgentState):
    """Spot innovative suggestions in comments."""
    # import asyncio <-- No longer needed
    comments_text = "\n".join(state["comments"][:30])
    prompt = f"""Identify 2 unique suggestions.
Comments:
{comments_text}

Return ONLY a JSON list in this format:
[
  {{"idea": "Bio-filtration Systems", "context": "One resident suggested using plants to filter drainage basins."}},
  {{"idea": "Solar Factory Credits", "context": "A citizen proposed tax incentives for green energy transitions."}}
]"""

    
    
    resp = await ai_service.generate_text(
        prompt,
        system_prompt="You are a helpful urban planning assistant. Return only structured JSON."
    )

    
    data = parse_json_garbage(resp) if resp else None
    
    # Handle wrapped list inside dict if applicable
    if isinstance(data, dict):
         for key in ["innovations", "ideas", "suggestions", "list"]:
             if key in data and isinstance(data[key], list):
                 data = data[key]
                 break

    if data and isinstance(data, list):
        innovations = []
        for item in data[:3]:
            if not isinstance(item, dict):
                continue
            idea = str(item.get("idea", item.get("suggestion", "New Concept")))
            context = str(item.get("context", item.get("description", item.get("reasoning", "Derived from community feedback."))))
            innovations.append(Innovation(idea=idea, context=context))
            
        state["innovation_spotter"] = innovations if innovations else [
            Innovation(idea="Community Ideas", context="AI is searching for unique suggestions in the feedback.")
        ]
    else:
        state["innovation_spotter"] = [
            Innovation(idea="Innovation Check", context="No unique ideas found yet.")
        ]
    return state



async def compile_report(state: AgentState):

    """Compile final dashboard report."""
    state["final_report"] = DashboardReport(
        vibe_check=state["vibe_check"],
        deep_sentiment=state["deep_sentiment"],
        theme_map=state["theme_map"],
        innovation_spotter=state["innovation_spotter"]
    )
    return state


# Build LangGraph workflow
def create_policy_workflow():
    """Create and return the LangGraph workflow."""
    workflow = StateGraph(AgentState)
    workflow.add_node("sentiment", analyze_sentiment)
    workflow.add_node("themes", cluster_themes)
    workflow.add_node("innovation", spot_innovation)
    workflow.add_node("compile", compile_report)
    workflow.set_entry_point("sentiment")
    workflow.add_edge("sentiment", "themes")
    workflow.add_edge("themes", "innovation")
    workflow.add_edge("innovation", "compile")
    workflow.add_edge("compile", END)
    return workflow.compile()


# Create workflow instance
policy_workflow = create_policy_workflow()
