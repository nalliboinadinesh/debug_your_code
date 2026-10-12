import os
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

            # 6. Detect data structures present in execution
            detected_structures = set()
            for ev in events:
                if ev.dataStructures:
                    for ds_name in ev.dataStructures.keys():
                        if "set" in ds_name.lower() or "seen" in ds_name.lower():
                            detected_structures.add("set")
                        else:
                            detected_structures.add("array")
                if ev.pointers:
                    detected_structures.add("pointer")
                if len(ev.callStack) > 1:
                    detected_structures.add("call_stack")
                    # Recursion requires the same function name appearing more than once in the call stack
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
