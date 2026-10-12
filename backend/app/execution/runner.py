import os
import re
import time
import tempfile
import shutil
from typing import List
from app.schemas.execution import ExecutionRequest, ExecutionResponse, ExecutionEvent
from app.security.validator import validate_cpp_submission
from app.execution.compiler import CppCompiler
from app.tracing.gdb_driver import GdbDriver
from app.tracing.normalizer import EventNormalizer

class ExecutionRunner:
    def __init__(self):
        self.compiler = CppCompiler()
        self.driver = GdbDriver()

    def run(self, request: ExecutionRequest) -> ExecutionResponse:
        start_time = time.time()
        
        # 1. Security & syntax validation
        valid, errors = validate_cpp_submission(request.code, request.stdin)
        if not valid:
            return ExecutionResponse(
                success=False,
                events=[],
                totalSteps=0,
                stdout="",
                stderr="",
                compilationError="\n".join(errors),
                executionTimeMs=(time.time() - start_time) * 1000
            )

        # 2. Create isolated temporary directory
        temp_dir = tempfile.mkdtemp(prefix="dyc_exec_")
        
        try:
            # 3. Isolated compile
            comp_ok, bin_wsl, comp_err, src_wsl = self.compiler.compile(request.code, temp_dir)
            if not comp_ok or not bin_wsl:
                return ExecutionResponse(
                    success=False,
                    events=[],
                    totalSteps=0,
                    stdout="",
                    stderr=comp_err or "Compilation failed",
                    compilationError=comp_err,
                    executionTimeMs=(time.time() - start_time) * 1000
                )

            # 4. GDB runtime trace
            trace_ok, raw_events, stdout, stderr, run_err = self.driver.trace(
                bin_wsl=bin_wsl,
                src_wsl=src_wsl,
                stdin_content=request.stdin,
                work_dir=temp_dir,
                max_steps=request.maxSteps
            )

            if not trace_ok or not raw_events:
                return ExecutionResponse(
                    success=False,
                    events=[],
                    totalSteps=0,
                    stdout=stdout,
                    stderr=stderr,
                    runtimeError=run_err or "No execution events captured.",
                    executionTimeMs=(time.time() - start_time) * 1000
                )

            # 5. Event normalization
            code_lines = request.code.splitlines()
            events = EventNormalizer.normalize(raw_events, code_lines, stdout)

            # 6. Comprehensive data structures detection (Levels 1 to 5)
            detected_structures = set()
            code_text = request.code
            
            # Level 1: Basic
            if re.search(r"\bvector\s*<", code_text): detected_structures.add("vector")
            if re.search(r"\bpair\s*<", code_text): detected_structures.add("pair")
            if re.search(r"\bstring\b", code_text): detected_structures.add("string")
            if re.search(r"\b(vector\s*<\s*vector|\[\s*\d+\s*\]\s*\[\s*\d+\s*\])", code_text): detected_structures.add("matrix")
            
            # Level 2: Linear
            if re.search(r"\bstack\s*<", code_text): detected_structures.add("stack")
            if re.search(r"\bqueue\s*<", code_text): detected_structures.add("queue")
            if re.search(r"\bdeque\s*<", code_text): detected_structures.add("deque")
            if re.search(r"\b(list|forward_list)\s*<", code_text) or re.search(r"\bListNode\b", code_text): detected_structures.add("linked_list")
            
            # Level 3: Associative and Hashing
            if re.search(r"\bunordered_map\s*<", code_text): detected_structures.add("unordered_map")
            elif re.search(r"\bmap\s*<", code_text): detected_structures.add("map")
            if re.search(r"\bunordered_set\s*<", code_text): detected_structures.add("unordered_set")
            elif re.search(r"\bset\s*<", code_text): detected_structures.add("set")
            if re.search(r"\bmultimap\s*<", code_text): detected_structures.add("multimap")
            if re.search(r"\bmultiset\s*<", code_text): detected_structures.add("multiset")
            
            # Level 4: Non-linear
            if re.search(r"\bpriority_queue\s*<", code_text): detected_structures.add("heap")
            if re.search(r"\b(TreeNode|BinaryTree|BST)\b", code_text): detected_structures.add("tree")
            if re.search(r"\b(Trie|TrieNode)\b", code_text): detected_structures.add("trie")
            if re.search(r"\b(adj|graph)\b", code_text, re.IGNORECASE): detected_structures.add("graph")
            
            # Level 5: Advanced
            if re.search(r"\b(SegmentTree|seg_?tree)\b", code_text, re.IGNORECASE): detected_structures.add("segment_tree")
            if re.search(r"\b(Fenwick|BIT|fenwick_?tree)\b", code_text, re.IGNORECASE): detected_structures.add("fenwick_tree")
            if re.search(r"\b(DSU|DisjointSet|find_set|union_sets)\b", code_text, re.IGNORECASE): detected_structures.add("dsu")
            if re.search(r"\b(SparseTable|sparse_?table)\b", code_text, re.IGNORECASE): detected_structures.add("sparse_table")

            # Runtime structure inspection
            for ev in events:
                if ev.dataStructures:
                    for ds_name, ds_val in ev.dataStructures.items():
                        if isinstance(ds_val, dict):
                            if ds_val.get("__isMap"):
                                detected_structures.add(ds_val.get("type", "map"))
                            elif ds_val.get("__isPair"):
                                detected_structures.add("pair")
                            elif ds_val.get("__isLinear"):
                                detected_structures.add(ds_val.get("type", "stack"))
                        elif isinstance(ds_val, list):
                            if len(ds_val) > 0 and isinstance(ds_val[0], list):
                                detected_structures.add("matrix")
                            elif "set" in ds_name.lower() or "seen" in ds_name.lower():
                                detected_structures.add("set")
                            else:
                                detected_structures.add("array")
                if ev.pointers:
                    detected_structures.add("pointer")
                if len(ev.callStack) > 1:
                    detected_structures.add("call_stack")
                    names = [f.get("name") for f in ev.callStack if f.get("name") and f.get("name") != "unknown"]
                    if len(names) != len(set(names)):
                        detected_structures.add("recursion")
                if ev.eventType == "loop_iteration":
                    detected_structures.add("loop")
                if "swap" in (ev.currentScope or "").lower() or "swap" in ev.description.lower():
                    detected_structures.add("sorting")
                if "low" in (ev.variables or {}) and "high" in (ev.variables or {}):
                    detected_structures.add("binary_search")

            elapsed_ms = (time.time() - start_time) * 1000
            
            return ExecutionResponse(
                success=True,
                events=events,
                totalSteps=len(events),
                stdout=stdout,
                stderr=stderr,
                runtimeError=run_err,
                detectedStructures=sorted(list(detected_structures)),
                executionTimeMs=round(elapsed_ms, 2)
            )

        finally:
            # Clean up temporary directory
            shutil.rmtree(temp_dir, ignore_errors=True)
