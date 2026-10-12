from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class AIContext(BaseModel):
    code: str
    currentStep: Optional[int] = None
    totalSteps: Optional[int] = None
    currentLine: Optional[int] = None
    currentEvent: Optional[Dict[str, Any]] = None
    currentVariables: Optional[Dict[str, Any]] = None
    previousEvent: Optional[Dict[str, Any]] = None
    nextEvent: Optional[Dict[str, Any]] = None
    complexity: Optional[Dict[str, Any]] = None
    stdout: Optional[str] = None

class AIExplanationRequest(BaseModel):
    context: AIContext
    question: Optional[str] = None
    model: str = "gemma-4"  # or "open-llm" (e.g. Qwen/DeepSeek)
    language: str = "en"

class AIExplanationResponse(BaseModel):
    success: bool
    modelUsed: str
    explanation: str
    keyInsight: Optional[str] = None
    suggestedQuestions: List[str] = Field(default_factory=list)

class AIPredictionRequest(BaseModel):
    context: AIContext
    predictedVariables: Dict[str, Any]
    predictedNextLine: Optional[int] = None
    model: str = "gemma-4"

class AIPredictionResponse(BaseModel):
    isCorrect: bool
    feedback: str
    actualNextState: Dict[str, Any]
    learningTip: str

class AIHintRequest(BaseModel):
    context: AIContext
    studentGoal: Optional[str] = None
    model: str = "gemma-4"

class AIHintResponse(BaseModel):
    hintLevel: int
    hint: str
    codeSnippet: Optional[str] = None
