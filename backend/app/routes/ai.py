from fastapi import APIRouter, HTTPException
from app.schemas.ai import (
    AIExplanationRequest,
    AIExplanationResponse,
    AIPredictionRequest,
    AIPredictionResponse,
    AIHintRequest,
    AIHintResponse
)
from app.ai.adapter import AIModelAdapter

router = APIRouter(prefix="/api/ai", tags=["ai"])
adapter = AIModelAdapter()

@router.post("/explain", response_model=AIExplanationResponse)
async def explain_execution(request: AIExplanationRequest):
    try:
        return await adapter.explain_execution(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

@router.post("/complexity", response_model=AIExplanationResponse)
async def explain_complexity(request: AIExplanationRequest):
    try:
        return await adapter.explain_complexity(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

@router.post("/hint", response_model=AIHintResponse)
async def generate_hint(request: AIHintRequest):
    try:
        return await adapter.generate_hint(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

@router.post("/predict", response_model=AIPredictionResponse)
async def evaluate_prediction(request: AIPredictionRequest):
    try:
        return await adapter.evaluate_prediction(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")
