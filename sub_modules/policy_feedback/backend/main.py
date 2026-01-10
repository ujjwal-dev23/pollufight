from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import sys
import os

# Add current directory to sys.path to allow imports from local modules
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from graph import app_graph
from models import DashboardReport

app = FastAPI(title="Mayor's Dashboard API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CommentRequest(BaseModel):
    comments: List[str]

@app.post("/analyze", response_model=DashboardReport)
async def analyze_comments(request: CommentRequest):
    if not request.comments:
        raise HTTPException(status_code=400, detail="No comments provided")
    
    try:
        # Run the LangGraph workflow
        initial_state = {"comments": request.comments}
        result = app_graph.invoke(initial_state)
        return result["final_report"]
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
