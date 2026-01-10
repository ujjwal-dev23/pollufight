import os
import json
import httpx
from typing import List, TypedDict
from langgraph.graph import StateGraph, END
from models import DashboardReport, SentimentDistribution, DeepSentiment, ThemePillar, Innovation
from pathlib import Path
from dotenv import load_dotenv

# 1. Load environment variables with absolute path
current_dir = Path(__file__).parent.absolute()
env_path = current_dir / ".env"
load_dotenv(dotenv_path=env_path)
token = os.getenv("HUGGINGFACEHUB_API_TOKEN")

# 2. Define State
class AgentState(TypedDict):
    comments: List[str]
    vibe_check: SentimentDistribution
    deep_sentiment: DeepSentiment
    theme_map: List[ThemePillar]
    innovation_spotter: List[Innovation]
    final_report: DashboardReport

# 3. Helper Functions
def parse_json_garbage(text):
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
        print(f"DEBUG: JSON Parsing failed for: {text[:100]}... Error: {e}")
    return None

import re

def call_hf_api(prompt, model_id="meta-llama/Llama-3.2-3B-Instruct"):
    if not token or token == "your_token_here":
        return None
    
    # CORRECT Hugging Face Router endpoint
    API_URL = "https://router.huggingface.co/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model_id,
        "messages": [
            {"role": "system", "content": "You are a helpful urban planning assistant. Return only structured JSON."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 1024,
        "temperature": 0.1,
        "stream": False
    }
    
    try:
        with httpx.Client(timeout=45.0) as client:
            response = client.post(API_URL, headers=headers, json=payload)
            if response.status_code == 200:
                result = response.json()
                if "choices" in result and len(result["choices"]) > 0:
                    return result["choices"][0]["message"]["content"]
                return str(result)
            else:
                print(f"DEBUG: API Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"DEBUG: Request failed: {e}")
    return None

# 4. Graph Nodes
def analyze_sentiment(state: AgentState):
    comments_text = "\n".join(state["comments"][:30])
    prompt = f"Analyze community comments and return JSON.\nComments:\n{comments_text}\n\nReturn ONLY JSON:\n{{\"support\": 0-100, \"neutral\": 0-100, \"oppose\": 0-100, \"insight\": \"string\", \"reasoning\": \"string\"}}"
    
    resp = call_hf_api(prompt)
    data = parse_json_garbage(resp) if resp else None
    
    if data:
        state["vibe_check"] = SentimentDistribution(
            support=data.get("support", 72),
            neutral=data.get("neutral", 18),
            oppose=data.get("oppose", 10)
        )
        state["deep_sentiment"] = DeepSentiment(
            insight=data.get("insight", "Significant concern detected."),
            reasoning=data.get("reasoning", "Extracted from comment patterns.")
        )
    else:
        state["vibe_check"] = SentimentDistribution(support=72, neutral=18, oppose=10)
        state["deep_sentiment"] = DeepSentiment(insight="Demo Insight", reasoning="API fallback.")
    return state

def cluster_themes(state: AgentState):
    comments_text = "\n".join(state["comments"][:30])
    prompt = f"Group comments into 3-4 themes.\nComments:\n{comments_text}\n\nReturn ONLY JSON list:\n[{{\"theme\": \"name\", \"mentions\": count, \"summary\": \"text\"}}]"
    
    resp = call_hf_api(prompt)
    data = parse_json_garbage(resp) if resp else None
    
    if data and isinstance(data, list):
        pillars = []
        for item in data[:5]:
            if not isinstance(item, dict): continue
            # Handle misnamed fields
            theme = item.get("theme", item.get("topic", "General"))
            mentions = item.get("mentions", item.get("count", 1))
            summary = item.get("summary", item.get("description", "Insight extracted from comments."))
            pillars.append(ThemePillar(theme=theme, mentions=mentions, summary=summary))
        state["theme_map"] = pillars
    else:
        state["theme_map"] = [ThemePillar(theme="General", mentions=len(state["comments"]), summary="Analysis in progress.")]
    return state

def spot_innovation(state: AgentState):
    comments_text = "\n".join(state["comments"][:30])
    prompt = f"Identify 2 unique suggestions.\nComments:\n{comments_text}\n\nReturn ONLY JSON list:\n[{{\"idea\": \"name\", \"context\": \"text\"}}]"
    
    resp = call_hf_api(prompt)
    data = parse_json_garbage(resp) if resp else None
    
    if data and isinstance(data, list):
        innovations = []
        for item in data[:3]:
            if not isinstance(item, dict): continue
            # Handle misnamed fields
            idea = item.get("idea", item.get("suggestion", "New Concept"))
            context = item.get("context", item.get("description", item.get("reasoning", "Derived from community feedback.")))
            innovations.append(Innovation(idea=idea, context=context))
        state["innovation_spotter"] = innovations
    else:
        state["innovation_spotter"] = [Innovation(idea="Innovation Check", context="No unique ideas found yet.")]
    return state

def compile_report(state: AgentState):
    state["final_report"] = DashboardReport(
        vibe_check=state["vibe_check"],
        deep_sentiment=state["deep_sentiment"],
        theme_map=state["theme_map"],
        innovation_spotter=state["innovation_spotter"]
    )
    return state

# 5. Build Graph
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
app_graph = workflow.compile()
