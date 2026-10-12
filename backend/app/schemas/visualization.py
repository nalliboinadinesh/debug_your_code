"""
VisualizationPlan Schema v1.0
Bridges the backend execution trace and the frontend Three.js renderer.
The plan describes WHAT to visualize; the renderer decides HOW.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class VisualObject(BaseModel):
    """A renderable object in the 3D/2D scene."""
    id: str = Field(..., description="Unique ID, e.g. 'arr', 'low', 'stack_frame_0'")
    kind: str = Field(
        ...,
        description="Object type: 'array', 'variable', 'pointer', 'stack_frame', 'node', 'edge', 'memory_block', 'generic'"
    )
    label: str = Field("", description="Human-readable label, e.g. 'arr[7]', 'low'")
    initialValue: Optional[Any] = Field(None, description="Initial value or data")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Extra hints: color, position preference, etc.")


class VisualAction(BaseModel):
    """A single animation/state-change event in the visualization timeline."""
    step: int = Field(..., description="Maps 1:1 to ExecutionEvent.step")
    line: int = Field(..., description="Source code line number")
    action: str = Field(
        ...,
        description="Action type: 'highlight_line', 'update_variable', 'move_pointer', "
                    "'compare', 'swap', 'push', 'pop', 'create', 'destroy', 'highlight_cell', "
                    "'unhighlight_cell', 'set_range', 'call_function', 'return_function', 'output', 'noop'"
    )
    targetId: str = Field("", description="ID of the VisualObject this action applies to")
    params: Dict[str, Any] = Field(
        default_factory=dict,
        description="Action-specific parameters, e.g. {index: 3, value: 50, color: 'cyan'}"
    )
    explanation: str = Field("", description="Human-readable explanation of what this step does")
    confidence: str = Field("verified_runtime", description="'verified_runtime' or 'llm_inferred'")


class CodeUnderstanding(BaseModel):
    """Stage 1 output: LLM's understanding of the submitted code."""
    functions: List[Dict[str, Any]] = Field(default_factory=list, description="Detected functions with name, params, line range")
    loops: List[Dict[str, Any]] = Field(default_factory=list, description="Detected loops with type, bounds, nesting")
    dataStructures: List[Dict[str, Any]] = Field(default_factory=list, description="Detected data structures with type, name, usage")
    branches: List[Dict[str, Any]] = Field(default_factory=list, description="Detected if/else/switch branches")
    algorithmPattern: str = Field("unknown", description="Detected pattern: binary_search, sorting, recursion, two_pointer, etc.")
    candidateVisualizations: List[str] = Field(
        default_factory=list,
        description="Recommended visualization types: 'array_with_pointers', 'sorting_bars', 'call_stack_tree', 'linked_list', etc."
    )
    unsupportedConstructs: List[str] = Field(default_factory=list, description="Constructs we cannot fully visualize")
    summary: str = Field("", description="Brief natural-language summary of what the code does")


class VisualizationPlan(BaseModel):
    """
    Stage 3 output: Complete visualization specification.
    Consumed by the frontend Three.js renderer (Stage 4).
    """
    schemaVersion: str = Field("1.0", description="Schema version for forward compatibility")
    objects: List[VisualObject] = Field(default_factory=list, description="All visual objects in the scene")
    actions: List[VisualAction] = Field(default_factory=list, description="Ordered timeline of visual actions")
    sceneHints: Dict[str, Any] = Field(
        default_factory=dict,
        description="Scene-level hints: camera position, background, layout strategy"
    )
    codeUnderstanding: Optional[CodeUnderstanding] = Field(None, description="Stage 1 analysis results")
    totalSteps: int = Field(0)
    primaryVisualization: str = Field(
        "array_with_pointers",
        description="Primary visualization mode: 'array_with_pointers', 'sorting_bars', 'call_stack_tree', 'linked_list', 'tree', 'graph', 'generic_memory'"
    )
