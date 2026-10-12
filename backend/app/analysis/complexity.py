import re
from typing import Dict, Any, List, Optional
from app.schemas.analysis import (
    ComplexityAnalysisRequest,
    ComplexityAnalysisResponse,
    TimeComplexityInfo,
    SpaceComplexityInfo,
    SpaceBreakdownItem
)
from app.analysis.ast_analyzer import CppAstAnalyzer

class ComplexityAnalyzer:
    @staticmethod
    def analyze(request: ComplexityAnalysisRequest) -> ComplexityAnalysisResponse:
        code = request.code
        loops = CppAstAnalyzer.extract_loops(code)
        recursions = CppAstAnalyzer.extract_recursions(code)
        storage = CppAstAnalyzer.extract_storage(code)
        
        # 1. TIME COMPLEXITY DERIVATION
        time_info = TimeComplexityInfo(
            worstCase="O(1)",
            averageCase="O(1)",
            bestCase="O(1)",
            dominantTerm="1",
            mathematicalDerivation="Constant time operations without iterative loops or recursion.",
            stepFormula="T(N) = C",
            exactOpCountForInput=request.executedSteps or 1,
            assumptions=["Constant time arithmetic and assignment operations."]
        )
        
        pattern_name = "Sequential Code (Constant Time)"
        
        # Check Recursion First
        if recursions:
            rec = recursions[0]
            func_name = rec["function"]
            calls = rec["recursive_calls_count"]
            if rec["is_divide_conquer"]:
                if calls == 1:
                    pattern_name = f"Divide & Conquer (Binary) in `{func_name}`"
                    time_info.worstCase = "O(log N)"
                    time_info.averageCase = "O(log N)"
                    time_info.bestCase = "O(1)"
                    time_info.dominantTerm = "log N"
                    time_info.stepFormula = "T(N) = T(N/2) + O(1)"
                    time_info.mathematicalDerivation = "By Master Theorem Case 2: T(N) = T(N/2) + c => recurrence tree has depth log_2(N), doing O(1) work per level. Total time: O(log N)."
                elif calls == 2:
                    pattern_name = f"Divide & Conquer Tree in `{func_name}`"
                    time_info.worstCase = "O(N log N)"
                    time_info.averageCase = "O(N log N)"
                    time_info.bestCase = "O(N log N)"
                    time_info.dominantTerm = "N log N"
                    time_info.stepFormula = "T(N) = 2T(N/2) + O(N)"
                    time_info.mathematicalDerivation = "By Master Theorem Case 2: T(N) = 2T(N/2) + cN => recurrence tree has depth log_2(N) and each level does cN work. Total time: O(N log N)."
            else:
                if calls == 1:
                    pattern_name = f"Linear Recursion in `{func_name}`"
                    time_info.worstCase = "O(N)"
                    time_info.averageCase = "O(N)"
                    time_info.bestCase = "O(1)"
                    time_info.dominantTerm = "N"
                    time_info.stepFormula = "T(N) = T(N-1) + O(1)"
                    time_info.mathematicalDerivation = "Single recursive call with unit decrement: T(N) = T(N-1) + c = T(0) + c * N. Asymptotic time is O(N)."
                elif calls >= 2:
                    pattern_name = f"Branching Recursion Tree (Exponential) in `{func_name}`"
                    time_info.worstCase = "O(2^N)"
                    time_info.averageCase = "O(2^N)"
                    time_info.bestCase = "O(2^N)"
                    time_info.dominantTerm = "2^N"
                    time_info.stepFormula = "T(N) = 2T(N-1) + O(1)"
                    time_info.mathematicalDerivation = "Branching recursion with branch factor 2: Full binary recursion tree of depth N yields 2^N - 1 total invocations. Asymptotic time: O(2^N)."

        # Check Loops if no recursion
        elif loops:
            num_loops = len(loops)
            # Check for actual nested loops (inner loop inside outer loop body)
            is_nested = any(
                l.get("body") and ("for " in l.get("body") or "while " in l.get("body"))
                for l in loops
            ) or bool(re.search(r"(?:for|while)\s*\([^)]*\)\s*\{[^{}]*(?:for|while)\s*\(", code))
            # Check if triangular
            has_triangular = any(l.get("is_triangular") for l in loops)
            
            if is_nested and has_triangular:
                pattern_name = "Nested Triangular Loops (e.g. Bubble/Selection Sort)"
                time_info.worstCase = "O(N^2)"
                time_info.averageCase = "O(N^2)"
                time_info.bestCase = "O(N)" if "break" in code else "O(N^2)"
                time_info.dominantTerm = "N^2"
                time_info.stepFormula = "T(N) = \\sum_{i=0}^{N-1} (N - 1 - i) = \\frac{N(N-1)}{2}"
                time_info.mathematicalDerivation = (
                    "Outer loop executes N times. For each iteration i, inner loop executes (N - 1 - i) times. "
                    "Total operations = (N-1) + (N-2) + ... + 1 = N(N-1)/2 = 0.5 * N^2 - 0.5 * N. "
                    "Dropping lower-order terms and constants yields O(N^2)."
                )
                time_info.assumptions.append("Input array size is N.")
            elif is_nested:
                pattern_name = "Nested Independent Loops"
                time_info.worstCase = "O(N^2)"
                time_info.averageCase = "O(N^2)"
                time_info.bestCase = "O(N^2)"
                time_info.dominantTerm = "N^2"
                time_info.stepFormula = "T(N, M) = N \\times M"
                time_info.mathematicalDerivation = (
                    "Outer loop runs N iterations. Inner loop runs M iterations per outer step. "
                    "Total operations = N * M. When N ≈ M, this yields O(N^2)."
                )
            else:
                # Single loop
                l = loops[0]
                step_val = l.get("step_val", 1)
                step_type = l.get("step_type", "linear")
                
                if step_type == "constant_add" and step_val > 1:
                    pattern_name = f"Single Loop with Step Increment (i += {step_val})"
                    time_info.worstCase = "O(N)"
                    time_info.averageCase = "O(N)"
                    time_info.bestCase = "O(1)" if "break" in code else "O(N)"
                    time_info.dominantTerm = "N"
                    time_info.stepFormula = f"T(N) = \\lceil N / {step_val} \\rceil"
                    time_info.mathematicalDerivation = (
                        f"The loop variable advances by {step_val} each iteration until reaching bound N. "
                        f"Total execution iterations = ceil(N / {step_val}). "
                        f"Crucial Note: Although the exact operation count is halved (N/{step_val}) compared to i++, "
                        f"the asymptotic order remains linear O(N) because constant scalar factors (1/{step_val}) are absorbed by Big-O definition (c * N)."
                    )
                    time_info.assumptions.append(f"Loop step stride is {step_val}.")
                elif step_type in ("multiplicative", "division"):
                    pattern_name = f"Logarithmic Loop (Multiplicative/Division by {step_val})"
                    time_info.worstCase = f"O(log_{step_val} N)"
                    time_info.averageCase = f"O(log_{step_val} N)"
                    time_info.bestCase = "O(1)"
                    time_info.dominantTerm = "log N"
                    time_info.stepFormula = f"T(N) = \\lfloor \\log_{step_val}(N) \\rfloor + 1"
                    time_info.mathematicalDerivation = (
                        f"The loop variable multiplies or divides by {step_val} each step. "
                        f"After k iterations, variable reaches {step_val}^k = N, so k = log_{step_val}(N). "
                        f"Asymptotic time complexity is O(log N)."
                    )
                elif l.get("is_two_pointers"):
                    pattern_name = "Two Pointers Traversal"
                    time_info.worstCase = "O(N)"
                    time_info.averageCase = "O(N)"
                    time_info.bestCase = "O(1)"
                    time_info.dominantTerm = "N"
                    time_info.stepFormula = "T(N) = N"
                    time_info.mathematicalDerivation = "The two pointers approach each other, decrementing distance (right - left) by at least 1 per iteration, leading to at most N total steps."
                elif storage.get("maps") and any(l.get("has_map_op") for l in loops if l.get("type") == "for"):
                    m = storage["maps"][0]
                    if m.get("kind") == "map":
                        pattern_name = f"Frequency Map / Balanced BST Insertion (`{m['name']}`)"
                        time_info.worstCase = "O(N log K)"
                        time_info.averageCase = "O(N log K)"
                        time_info.bestCase = "O(N)"
                        time_info.dominantTerm = "N log K"
                        time_info.stepFormula = "T(N) = \\sum_{i=1}^{N} \\log(i) = O(N \\log K)"
                        time_info.mathematicalDerivation = (
                            f"The loop iterates N times. Inside each iteration, `{m['name']}[arr[i]]++` performs a lookup "
                            f"and insertion on `std::map` (implemented as a self-balancing Red-Black Tree). "
                            f"Each BST operation with K unique elements takes O(log K) time. "
                            f"Total insertion time: O(N log K) (worst case O(N log N) when all elements are distinct). "
                            f"Subsequent range traversal loop takes O(K) time, which is strictly dominated by O(N log K)."
                        )
                        time_info.assumptions.append("N is input array length; K is number of unique elements (K <= N).")
                    else:
                        pattern_name = f"Hash Table Frequency Counting (`{m['name']}`)"
                        time_info.worstCase = "O(N^2)"
                        time_info.averageCase = "O(N)"
                        time_info.bestCase = "O(N)"
                        time_info.dominantTerm = "N"
                        time_info.stepFormula = "T(N) = N \\times O(1) = O(N)"
                        time_info.mathematicalDerivation = (
                            f"The loop iterates N times. Inside each iteration, `{m['name']}[arr[i]]++` performs average O(1) hash table lookup. "
                            f"Average total time is O(N). In the worst case (hash collision degradation), lookup is O(N), yielding O(N^2)."
                        )
                elif storage.get("sets") and any(l.get("has_map_op") for l in loops if l.get("type") == "for"):
                    s = storage["sets"][0]
                    pattern_name = f"Set Membership & Insertion (`{s['name']}`)"
                    is_ordered = s.get("kind") == "set"
                    time_info.worstCase = "O(N log N)" if is_ordered else "O(N^2)"
                    time_info.averageCase = "O(N log K)" if is_ordered else "O(N)"
                    time_info.bestCase = "O(N)"
                    time_info.dominantTerm = "N log K" if is_ordered else "N"
                    time_info.stepFormula = "T(N) = O(N \\log K)" if is_ordered else "T(N) = O(N)"
                    time_info.mathematicalDerivation = (
                        f"Iterating N items with `{s['name']}` insertion takes O(N log K) for balanced BST set, or average O(N) for hash set."
                    )
                else:
                    pattern_name = "Single Linear Loop (i++)"
                    time_info.worstCase = "O(N)"
                    time_info.averageCase = "O(N)"
                    time_info.bestCase = "O(1)" if "break" in code else "O(N)"
                    time_info.dominantTerm = "N"
                    time_info.stepFormula = "T(N) = N"
                    time_info.mathematicalDerivation = (
                        "The loop variable starts at 0 and increments by 1 until N. "
                        "Number of loop body executions = N. Time complexity is strictly O(N)."
                    )

        # 2. SPACE COMPLEXITY DERIVATION
        space_info = SpaceComplexityInfo(
            auxiliarySpace="O(1)",
            totalSpace="O(1)",
            callStackDepth=1,
            breakdown=[],
            limitations=[]
        )
        
        # Local variables breakdown
        space_info.breakdown.append(
            SpaceBreakdownItem(
                item="Primitive Variables (int, pointers)",
                category="local_var",
                sizeEstimate="O(1)",
                details="Scalars allocated on the stack frame (constant memory)."
            )
        )

        # Check recursion stack depth
        if recursions:
            rec = recursions[0]
            if rec["is_divide_conquer"]:
                space_info.auxiliarySpace = "O(log N)"
                space_info.totalSpace = "O(log N)"
                space_info.callStackDepth = 16
                space_info.breakdown.append(
                    SpaceBreakdownItem(
                        item=f"Call Stack Frame for `{rec['function']}`",
                        category="recursive_frame",
                        sizeEstimate="O(log N)",
                        details="Maximum recursion depth corresponds to the height of the divide-and-conquer tree: log_2(N) frames."
                    )
                )
            else:
                space_info.auxiliarySpace = "O(N)"
                space_info.totalSpace = "O(N)"
                space_info.callStackDepth = 50
                space_info.breakdown.append(
                    SpaceBreakdownItem(
                        item=f"Call Stack Frame for `{rec['function']}`",
                        category="recursive_frame",
                        sizeEstimate="O(N)",
                        details="Linear recursion creates N stack frames before base case return."
                    )
                )

        # Check arrays & vectors
        if storage.get("fixed_arrays"):
            for arr in storage["fixed_arrays"]:
                sz = arr["size"]
                bytes_est = sz * 4
                space_info.totalSpace = f"O(N) (Fixed {sz} elements)"
                space_info.breakdown.append(
                    SpaceBreakdownItem(
                        item=f"Array `{arr['name']}[{sz}]`",
                        category="array",
                        sizeEstimate=f"{bytes_est} bytes ({sz} * sizeof({arr['type']}))",
                        details="Stack allocated contiguous array buffer."
                    )
                )
                
        if storage.get("vectors"):
            for vec in storage["vectors"]:
                space_info.totalSpace = "O(N)"
                space_info.breakdown.append(
                    SpaceBreakdownItem(
                        item=f"std::vector<{vec['elem_type']}> `{vec['name']}`",
                        category="vector",
                        sizeEstimate="O(N) heap capacity",
                        details="Dynamic contiguous vector buffer on the heap (input/storage)."
                    )
                )

        # Check maps (Auxiliary Space O(K))
        if storage.get("maps"):
            for m in storage["maps"]:
                space_info.auxiliarySpace = "O(K)"
                space_info.totalSpace = "O(N + K)" if storage.get("vectors") else "O(K)"
                space_info.breakdown.append(
                    SpaceBreakdownItem(
                        item=f"std::{m['kind']}<{m['key_type']}, {m['val_type']}> `{m['name']}`",
                        category="map",
                        sizeEstimate="O(K) heap nodes",
                        details=f"Auxiliary storage for at most K unique keys. Tree nodes allocate heap memory dynamically."
                    )
                )

        # Check sets (Auxiliary Space O(K))
        if storage.get("sets"):
            for s in storage["sets"]:
                space_info.auxiliarySpace = "O(K)" if space_info.auxiliarySpace == "O(1)" else space_info.auxiliarySpace
                space_info.totalSpace = "O(N + K)" if storage.get("vectors") else "O(K)"
                space_info.breakdown.append(
                    SpaceBreakdownItem(
                        item=f"std::{s['kind']}<{s['elem_type']}> `{s['name']}`",
                        category="set",
                        sizeEstimate="O(K) heap nodes",
                        details="Auxiliary storage for at most K unique elements."
                    )
                )

        if storage.get("dynamic_allocs"):
            space_info.limitations.append("Contains explicit `new[]` dynamic heap allocations tracked separately.")

        return ComplexityAnalysisResponse(
            success=True,
            timeComplexity=time_info,
            spaceComplexity=space_info,
            codePattern=pattern_name,
            summary=f"Algorithm pattern: {pattern_name}. Time: {time_info.worstCase}, Auxiliary Space: {space_info.auxiliarySpace}."
        )
