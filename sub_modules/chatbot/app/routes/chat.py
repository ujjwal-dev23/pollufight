from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from app.services.llm import LLMService

router = APIRouter()
llm_service = LLMService()

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    response: str

@router.on_event("startup")
async def startup_event():
    llm_service.load_model()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not request.query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    response_text = llm_service.generate_response(request.query)
    return ChatResponse(response=response_text)
