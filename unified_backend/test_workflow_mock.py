
import sys
import os
import asyncio
from unittest.mock import MagicMock, patch

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock environment variables before importing config
os.environ["HUGGINGFACE_API_TOKEN"] = "test_token"

try:
    from unified_backend.services.policy_service import policy_workflow
    from unified_backend.models.policy_models import CommentRequest
    from unified_backend.services.ai_service import ai_service
except ImportError as e:
    print(f"ImportError: {e}")
    # Try adjusting path if running from inside unified_backend
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    try:
        from services.policy_service import policy_workflow
        from models.policy_models import CommentRequest
        from services.ai_service import ai_service
    except ImportError as e2:
        print(f"ImportError 2: {e2}")
        sys.exit(1)

async def test_workflow():
    print("Starting workflow test...")
    
    # Mock ai_service.generate_text to return valid JSON
    async def mock_generate_text(*args, **kwargs):
        prompt = args[0] if args else kwargs.get("prompt", "")
        if "support" in prompt:
            return '{"support": 50, "neutral": 30, "oppose": 20, "insight": "Test Insight", "reasoning": "Test Reasoning"}'
        elif "themes" in prompt:
            return '[{"theme": "Test Theme", "mentions": 5, "summary": "Test Summary"}]'
        elif "suggestions" in prompt:
            return '[{"idea": "Test Idea", "context": "Test Context"}]'
        return None

    # Patch the generate_text method
    ai_service.generate_text = mock_generate_text
    
    comments = ["Test comment 1", "Test comment 2"]
    initial_state = {"comments": comments}
    
    try:
        print("Invoking workflow...")
        result = await policy_workflow.ainvoke(initial_state)
        print("Workflow finished successfully!")
        print("Final Report:", result["final_report"])
    except Exception as e:
        print(f"Workflow failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_workflow())
