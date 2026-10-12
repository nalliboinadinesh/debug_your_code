from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.visualization import VisualizationPlan

class ExecutionEvent(BaseModel):
    step: int
    line: int
    eventType: str = Field(
        ...,
        description="statement_enter, variable_declare, variable_update, comparison, branch, loop_iteration, function_call, function_return, array_read, array_write, pointer_update, output, program_end, runtime_error"
    )
    variable: Optional[str] = None
    oldValue: Optional[Any] = None
    newValue: Optional[Any] = None
    description: str
    currentScope: Optional[str] = "main"
    callStack: List[Dict[str, Any]] = Field(default_factory=list)
    dataStructures: Dict[str, Any] = Field(default_factory=dict)
    pointers: Dict[str, Any] = Field(default_factory=dict)
    variables: Dict[str, Any] = Field(default_factory=dict)
    activeIndices: Optional[List[int]] = None
    comparisonOperands: Optional[Dict[str, Any]] = None
    stdout: str = ""
    runtimeError: Optional[str] = None
    confidence: str = "verified_runtime"

class ExecutionRequest(BaseModel):
    code: str
    stdin: str = ""
    language: str = "cpp"
    maxSteps: int = 250

class ExecutionResponse(BaseModel):
    success: bool
    events: List[ExecutionEvent]
    totalSteps: int
    stdout: str
    stderr: str
    compilationError: Optional[str] = None
    runtimeError: Optional[str] = None
    detectedStructures: List[str] = Field(default_factory=list)
    executionTimeMs: float = 0.0
    visualizationPlan: Optional[VisualizationPlan] = None
