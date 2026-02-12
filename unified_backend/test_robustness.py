
import sys
import os
import asyncio
import logging
from unittest.mock import MagicMock

# Configure logging
logging.basicConfig(level=logging.ERROR)

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock env vars
os.environ["HUGGINGFACE_API_TOKEN"] = "test_token"

try:
    from unified_backend.services.policy_service import policy_workflow
    from unified_backend.services.ai_service import ai_service
except ImportError:
    # Try adjusting path if running from inside unified_backend
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from services.policy_service import policy_workflow
    from services.ai_service import ai_service

async def run_test_case(name, mock_response):
    print(f"\n--- Running Test Case: {name} ---")
    
    # Mock the AI service
    async def mock_generate_text(*args, **kwargs):
        return mock_response

    ai_service.generate_text = mock_generate_text
    
    initial_state = {"comments": ["Test comment"]}
    
    try:
        result = await policy_workflow.ainvoke(initial_state)
        print("✅ Workflow completed successfully")
        print(f"Report Summary: {result['final_report'].vibe_check}")
        return True
    except Exception as e:
        print(f"❌ Workflow FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    print("Starting Robustness Tests...")
    
    # Test Case 1: Malformed JSON (garbage)
    await run_test_case("Garbage JSON", "This is not JSON at all.")
    
    # Test Case 2: List instead of Dict (Sentiment)
    # The code expects a dict for sentiment, but we return a list of dicts
    await run_test_case("List Response for Sentiment", '[{"support": 50, "neutral": 30, "oppose": 20, "insight": "Good", "reasoning": "Reason"}]')
    
    # Test Case 3: Empty List
    await run_test_case("Empty List", '[]')
    
    # Test Case 4: String numbers
    await run_test_case("String Numbers", '{"support": "50", "neutral": "30", "oppose": "20", "insight": "Good", "reasoning": "Reason"}')
    
    # Test Case 5: Missing keys
    await run_test_case("Missing Keys", '{"insight": "Good"}')
    
    print("\nAlle tests finished.")

if __name__ == "__main__":
    asyncio.run(main())
