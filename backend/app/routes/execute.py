from fastapi import APIRouter, HTTPException
from app.schemas.execution import ExecutionRequest, ExecutionResponse
from app.execution.runner import ExecutionRunner
from app.ai.planner import VisualizationPlanner

router = APIRouter(prefix="/api", tags=["execution"])
runner = ExecutionRunner()
planner = VisualizationPlanner()

@router.post("/run", response_model=ExecutionResponse)
@router.post("/execute", response_model=ExecutionResponse)
async def run_code(request: ExecutionRequest):
    try:
        response = runner.run(request)
        if response.success and response.events:
            try:
                response.visualizationPlan = await planner.build_plan(
                    code=request.code,
                    events=response.events,
                    detected_structures=response.detectedStructures
                )
            except Exception:
                pass
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")
