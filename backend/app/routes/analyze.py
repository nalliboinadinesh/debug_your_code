from fastapi import APIRouter, HTTPException
from app.schemas.analysis import ComplexityAnalysisRequest, ComplexityAnalysisResponse
from app.analysis.complexity import ComplexityAnalyzer

router = APIRouter(prefix="/api", tags=["analysis"])

@router.post("/analyze", response_model=ComplexityAnalysisResponse)
async def analyze_complexity(request: ComplexityAnalysisRequest):
    try:
        response = ComplexityAnalyzer.analyze(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")
