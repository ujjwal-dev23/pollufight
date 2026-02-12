"""Policy feedback routes."""
import logging
from fastapi import APIRouter, HTTPException
from ..models.policy_models import CommentRequest, DashboardReport
from ..services.policy_service import policy_workflow

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/analyze", response_model=DashboardReport)
async def analyze_comments(request: CommentRequest):
    """Analyze community comments for policy feedback."""
    if not request.comments:
        raise HTTPException(status_code=400, detail="No comments provided")
    
    try:
        # Run the LangGraph workflow (asynchronous invoke)
        initial_state = {"comments": request.comments}
        result = await policy_workflow.ainvoke(initial_state)
        return result["final_report"]
    except Exception as e:
        logger.error(f"Error in analyze_comments: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")
