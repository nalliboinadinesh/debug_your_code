from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class SpaceBreakdownItem(BaseModel):
    item: str
    category: str  # local_var, array, vector, recursive_frame, dynamic_heap
    sizeEstimate: str
    details: str

class TimeComplexityInfo(BaseModel):
    worstCase: str = "O(1)"
    averageCase: str = "O(1)"
    bestCase: str = "O(1)"
    dominantTerm: str = "1"
    mathematicalDerivation: str
    stepFormula: str
    exactOpCountForInput: int
    measuredRuntimeMs: float = 0.0
    assumptions: List[str] = Field(default_factory=list)
    status: str = "verified_ast"
    unsupportedConstructs: List[str] = Field(default_factory=list)

class SpaceComplexityInfo(BaseModel):
    auxiliarySpace: str = "O(1)"
    totalSpace: str = "O(1)"
    callStackDepth: int = 1
    breakdown: List[SpaceBreakdownItem] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)

class ComplexityAnalysisRequest(BaseModel):
    code: str
    language: str = "cpp"
    executedSteps: Optional[int] = None
    inputSizeEstimate: Optional[int] = None

class ComplexityAnalysisResponse(BaseModel):
    success: bool
    timeComplexity: TimeComplexityInfo
    spaceComplexity: SpaceComplexityInfo
    codePattern: str  # e.g., "Single Loop with Array Access", "Nested Triangular Loops", "Recursion Tree"
    summary: str
