"""
Visualization Planner — Stage 3
Consumes:
  - Code understanding (Stage 1, from LLM or deterministic AST analysis)
  - Actual execution events (Stage 2, from GDB runtime tracer)
Produces:
  - A validated VisualizationPlan (Stage 3 output)

The planner NEVER overwrites observed runtime values with LLM guesses.
It uses the LLM only for:
  1. Code understanding (algorithm pattern, candidate visualizations)
  2. Step explanations (human-readable descriptions)
  3. Scene layout hints

All variable values, array states, and pointer positions come exclusively
from the verified GDB execution trace.
"""
import os
import json
import re
import httpx
import logging
from typing import Dict, Any, List, Optional
from app.schemas.execution import ExecutionEvent
from app.schemas.visualization import (
    VisualizationPlan,
    VisualObject,
    VisualAction,
    CodeUnderstanding,
)
from app.analysis.ast_analyzer import CppAstAnalyzer

logger = logging.getLogger("dyc.planner")


# ──────────────────────────────────────────────
# Prompts
# ──────────────────────────────────────────────

CODE_UNDERSTANDING_PROMPT = """You are an expert C++ code analyzer for DebugYourCode (DYC), an educational code visualization platform.

Analyze the following C++ code and return a JSON object with these fields:
{
  "functions": [{"name": "...", "params": [...], "returnType": "...", "lineStart": N, "lineEnd": N}],
  "loops": [{"type": "for|while|do-while", "line": N, "variable": "...", "bound": "..."}],
  "dataStructures": [{"type": "array|vector|stack|queue|linked_list|tree|map|set", "name": "...", "elementType": "..."}],
  "branches": [{"type": "if|else|switch", "line": N, "condition": "..."}],
  "algorithmPattern": "binary_search|sorting|two_pointer|sliding_window|recursion|divide_and_conquer|graph_traversal|dynamic_programming|brute_force|unknown",
  "candidateVisualizations": ["array_with_pointers", "sorting_bars", "call_stack_tree", "linked_list", "tree", "graph", "generic_memory"],
  "unsupportedConstructs": [],
  "summary": "Brief 1-2 sentence summary of what this code does"
}

RULES:
1. Return ONLY valid JSON, no markdown fences, no extra text.
2. Be precise about line numbers.
3. If uncertain about algorithmPattern, use "unknown".
4. candidateVisualizations should list the BEST visualization types for this code, ordered by relevance.

C++ Code:
```cpp
{code}
```"""


STEP_EXPLANATION_PROMPT = """You are the DYC AI Tutor explaining ONE execution step to a student.

Code:
```cpp
{code}
```

Current Step {step}/{total_steps} — Line {line}:
`{line_text}`

Variables: {variables}
Data Structures: {data_structures}
Event Type: {event_type}
Previous Description: {prev_description}

Write a concise 1-2 sentence explanation of what this step does and why.
Focus on the student's understanding. Reference variable values from the trace.
Return ONLY the explanation text, nothing else."""


class VisualizationPlanner:
    """
    Deterministic + LLM-enhanced visualization planner.
    
    The planner works in two modes:
    1. WITH LLM (Ollama/Gemma): Full code understanding + rich explanations
    2. WITHOUT LLM (fallback): Deterministic AST analysis + template explanations
    
    In both cases, all runtime values come from the verified GDB trace.
    """

    def __init__(self):
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "gemma4:12b")
        self._llm_available: Optional[bool] = None

    async def _check_llm(self) -> bool:
        """Check if Ollama is reachable (cached)."""
        if self._llm_available is not None:
            return self._llm_available
        try:
            async with httpx.AsyncClient(timeout=3) as client:
                resp = await client.get(f"{self.ollama_url}/api/tags")
                self._llm_available = resp.status_code == 200
        except Exception:
            self._llm_available = False
        return self._llm_available

    async def _call_llm(self, prompt: str, temperature: float = 0.1, max_tokens: int = 2048) -> Optional[str]:
        """Call Ollama chat completion endpoint."""
        if not await self._check_llm():
            return None
        try:
            async with httpx.AsyncClient(timeout=35) as client:
                resp = await client.post(
                    f"{self.ollama_url}/api/chat",
                    json={
                        "model": self.ollama_model,
                        "messages": [{"role": "user", "content": prompt}],
                        "stream": False,
                        "think": False,
                        "options": {
                            "temperature": temperature,
                            "num_predict": max_tokens,
                        }
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("message", {}).get("content", "")
        except Exception as e:
            logger.warning(f"LLM call failed: {e}")
        return None

    # ──────────────────────────────────────────────
    # Stage 1: Code Understanding
    # ──────────────────────────────────────────────

    async def understand_code(self, code: str) -> CodeUnderstanding:
        """
        Analyze code with instant deterministic AST baseline + fast LLM enhancement.
        """
        # 1. Instant deterministic baseline
        base = self._deterministic_understanding(code)

        # 2. Try fast LLM refinement (max 8s timeout, 400 tokens)
        try:
            llm_result = await self._call_llm(
                CODE_UNDERSTANDING_PROMPT.replace("{code}", code),
                temperature=0.1,
                max_tokens=400,
            )

            if llm_result:
                cleaned = llm_result.strip()
                if cleaned.startswith("```"):
                    cleaned = re.sub(r"^```\w*\n?", "", cleaned)
                    cleaned = re.sub(r"\n?```$", "", cleaned)
                parsed = json.loads(cleaned)
                return CodeUnderstanding(
                    functions=parsed.get("functions") or base.functions,
                    loops=parsed.get("loops") or base.loops,
                    dataStructures=parsed.get("dataStructures") or base.dataStructures,
                    branches=parsed.get("branches") or base.branches,
                    algorithmPattern=parsed.get("algorithmPattern") or base.algorithmPattern,
                    candidateVisualizations=parsed.get("candidateVisualizations") or base.candidateVisualizations,
                    unsupportedConstructs=parsed.get("unsupportedConstructs", []),
                    summary=parsed.get("summary") or base.summary,
                )
        except Exception as e:
            logger.debug(f"LLM refinement skipped: {e}")

        return base

    def _deterministic_understanding(self, code: str) -> CodeUnderstanding:
        """Fallback: use regex-based AST analysis when LLM is unavailable."""
        loops = CppAstAnalyzer.extract_loops(code)
        recursions = CppAstAnalyzer.extract_recursions(code)
        storage = CppAstAnalyzer.extract_storage(code)

        # Detect algorithm pattern
        pattern = "unknown"
        candidates = ["generic_memory"]

        has_binary = any(l.get("is_two_pointers") for l in loops if l.get("type") == "while")
        has_sort = "sort" in code.lower() or "swap" in code.lower()
        has_recursion = len(recursions) > 0

        if has_binary:
            pattern = "binary_search"
            candidates = ["array_with_pointers"]
        elif has_sort:
            pattern = "sorting"
            candidates = ["sorting_bars", "array_with_pointers"]
        elif has_recursion:
            if any(r.get("is_divide_conquer") for r in recursions):
                pattern = "divide_and_conquer"
                candidates = ["call_stack_tree", "array_with_pointers"]
            else:
                pattern = "recursion"
                candidates = ["call_stack_tree"]
        elif loops:
            if len(loops) >= 2:
                pattern = "nested_loops"
            else:
                pattern = "linear_scan"
            candidates = ["array_with_pointers"]

        # Detect data structures from storage analysis
        ds_list = []
        if isinstance(storage, dict):
            for arr in storage.get("fixed_arrays", []):
                ds_list.append({
                    "type": "array",
                    "name": arr.get("name", "arr"),
                    "elementType": arr.get("type", "int"),
                })
            for vec in storage.get("vectors", []):
                ds_list.append({
                    "type": "vector",
                    "name": vec.get("name", "arr"),
                    "elementType": vec.get("elem_type", "int"),
                })

        # Detect functions
        func_pattern = re.compile(
            r"(?:int|void|bool|double|float|long|string|auto|vector\s*<[^>]+>)\s+(\w+)\s*\([^)]*\)\s*\{"
        )
        functions = []
        for match in func_pattern.finditer(code):
            name = match.group(1)
            line_start = code[:match.start()].count("\n") + 1
            functions.append({"name": name, "lineStart": line_start})

        return CodeUnderstanding(
            functions=functions,
            loops=loops,
            dataStructures=ds_list,
            branches=[],
            algorithmPattern=pattern,
            candidateVisualizations=candidates,
            unsupportedConstructs=[],
            summary=f"C++ program with {len(functions)} function(s), {len(loops)} loop(s), pattern: {pattern}",
        )

    # ──────────────────────────────────────────────
    # Stage 3: Build Visualization Plan
    # ──────────────────────────────────────────────

    async def build_plan(
        self,
        code: str,
        events: List[ExecutionEvent],
        detected_structures: List[str],
        code_understanding: Optional[CodeUnderstanding] = None,
    ) -> VisualizationPlan:
        """
        Build a complete VisualizationPlan from verified execution events.
        
        All values in the plan come from the GDB trace.
        The LLM only contributes explanations and layout hints.
        """
        if not code_understanding:
            code_understanding = self._deterministic_understanding(code)

        code_lines = code.splitlines()

        # ── Build Visual Objects from detected structures ──
        objects: List[VisualObject] = []
        primary_viz = code_understanding.candidateVisualizations[0] if code_understanding.candidateVisualizations else "array_with_pointers"

        # Scan all events to find arrays, variables, pointers
        all_arrays: Dict[str, List] = {}
        all_scalars: set = set()
        all_pointers: set = set()

        for ev in events:
            for name, val in ev.dataStructures.items():
                if isinstance(val, list) and len(val) > 0:
                    all_arrays[name] = val
            for name in ev.variables:
                all_scalars.add(name)
            for name in ev.pointers:
                all_pointers.add(name)

        # Create array objects
        for arr_name, arr_val in all_arrays.items():
            objects.append(VisualObject(
                id=arr_name,
                kind="array",
                label=f"{arr_name}[{len(arr_val)}]",
                initialValue=arr_val,
                metadata={"length": len(arr_val), "elementType": "int"},
            ))

        # Create variable objects for key scalars
        for var_name in sorted(all_scalars):
            objects.append(VisualObject(
                id=f"var_{var_name}",
                kind="variable",
                label=var_name,
                metadata={"isPointer": var_name in ("low", "high", "mid", "left", "right", "i", "j", "k")},
            ))

        # Create pointer objects
        for ptr_name in sorted(all_pointers):
            objects.append(VisualObject(
                id=f"ptr_{ptr_name}",
                kind="pointer",
                label=ptr_name,
            ))

        # ── Build Visual Actions from execution events ──
        actions: List[VisualAction] = []
        batch_explain_steps: List[Dict] = []

        for ev in events:
            line_text = ""
            if 1 <= ev.line <= len(code_lines):
                line_text = code_lines[ev.line - 1].strip()

            # Core action: highlight the current line
            action_type = "highlight_line"
            target_id = ""
            params: Dict[str, Any] = {"line": ev.line, "lineText": line_text}

            # Map event types to visual actions
            if ev.eventType == "variable_declare" or ev.eventType == "variable_update":
                action_type = "update_variable"
                target_id = f"var_{ev.variable}" if ev.variable else ""
                params["variable"] = ev.variable
                params["oldValue"] = ev.oldValue
                params["newValue"] = ev.newValue

            elif ev.eventType == "array_write":
                action_type = "highlight_cell"
                target_id = ev.variable or ""
                params["indices"] = ev.activeIndices or []
                params["values"] = ev.newValue

            elif ev.eventType == "comparison":
                action_type = "compare"
                params["condition"] = line_text

            elif ev.eventType == "loop_iteration":
                action_type = "move_pointer"
                target_id = f"var_{ev.variable}" if ev.variable else ""
                params["variable"] = ev.variable
                params["oldValue"] = ev.oldValue
                params["newValue"] = ev.newValue

            elif ev.eventType == "function_call":
                action_type = "call_function"
                params["function"] = ev.currentScope

            elif ev.eventType == "function_return":
                action_type = "return_function"
                params["function"] = ev.currentScope

            elif ev.eventType == "pointer_update":
                action_type = "move_pointer"
                target_id = f"ptr_{ev.variable}" if ev.variable else ""
                params["variable"] = ev.variable
                params["newAddress"] = ev.newValue

            elif ev.eventType == "output":
                action_type = "output"
                params["stdout"] = ev.stdout

            # Add full runtime state snapshot (from GDB, NOT from LLM)
            params["variables"] = ev.variables
            params["dataStructures"] = ev.dataStructures
            params["callStack"] = [{"name": f.get("name", ""), "line": f.get("line", 0)} for f in ev.callStack]
            params["activeIndices"] = ev.activeIndices

            actions.append(VisualAction(
                step=ev.step,
                line=ev.line,
                action=action_type,
                targetId=target_id,
                params=params,
                explanation=ev.description,  # Use normalizer description as default
                confidence=ev.confidence,
            ))

            # Collect for batch LLM explanation
            batch_explain_steps.append({
                "step": ev.step,
                "line": ev.line,
                "line_text": line_text,
                "event_type": ev.eventType,
                "variables": ev.variables,
                "data_structures": ev.dataStructures,
            })

        # Actions use verified runtime descriptions from normalizer for instant rendering.
        # Deep tutor explanations are queried on-demand by the student via the Stage 5 AI tutor.

        # ── Scene hints ──
        scene_hints: Dict[str, Any] = {
            "algorithmPattern": code_understanding.algorithmPattern,
            "primaryVisualization": primary_viz,
            "arrayCount": len(all_arrays),
            "hasPointers": len(all_pointers) > 0 or any(
                v in all_scalars for v in ("low", "high", "mid", "left", "right")
            ),
            "hasCallStack": any(len(ev.callStack) > 1 for ev in events),
            "hasRecursion": "recursion" in detected_structures,
        }

        return VisualizationPlan(
            schemaVersion="1.0",
            objects=objects,
            actions=actions,
            sceneHints=scene_hints,
            codeUnderstanding=code_understanding,
            totalSteps=len(events),
            primaryVisualization=primary_viz,
        )

    async def _batch_enhance_explanations(
        self,
        code: str,
        code_lines: List[str],
        actions: List[VisualAction],
        steps_data: List[Dict],
    ) -> Optional[List[VisualAction]]:
        """
        Use LLM to generate richer explanations for key steps.
        Only enhances ~10 important steps to keep latency low.
        """
        # Select important steps: first, last, variable changes, comparisons, function calls
        important_indices = set()
        important_indices.add(0)
        important_indices.add(len(actions) - 1)

        for i, step in enumerate(steps_data):
            if step["event_type"] in ("comparison", "function_call", "function_return", "array_write"):
                important_indices.add(i)
            if len(important_indices) >= 10:
                break

        # Also add some loop iterations for variety
        for i, step in enumerate(steps_data):
            if step["event_type"] == "loop_iteration" and i not in important_indices:
                important_indices.add(i)
                if len(important_indices) >= 12:
                    break

        total = len(actions)
        enhanced_actions = list(actions)

        for idx in sorted(important_indices):
            if idx >= len(steps_data):
                continue
            step = steps_data[idx]
            prev_desc = steps_data[idx - 1]["line_text"] if idx > 0 else ""

            prompt = STEP_EXPLANATION_PROMPT.replace("{code}", code) \
                .replace("{step}", str(step["step"])) \
                .replace("{total_steps}", str(total)) \
                .replace("{line}", str(step["line"])) \
                .replace("{line_text}", step["line_text"]) \
                .replace("{variables}", json.dumps(step["variables"])) \
                .replace("{data_structures}", json.dumps(step["data_structures"])) \
                .replace("{event_type}", step["event_type"]) \
                .replace("{prev_description}", prev_desc)

            explanation = await self._call_llm(prompt, temperature=0.2, max_tokens=200)
            if explanation and len(explanation.strip()) > 10:
                enhanced_actions[idx].explanation = explanation.strip()
                enhanced_actions[idx].confidence = "llm_enhanced"

        return enhanced_actions
