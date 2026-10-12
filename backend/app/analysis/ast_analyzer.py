import re
from typing import Dict, Any, List, Optional, Tuple

class CppLoopPattern:
    def __init__(
        self,
        loop_type: str,  # 'for' or 'while'
        var_name: str,
        start_val: str,
        condition: str,
        bound_var: str,
        increment_op: str,  # '++', '+=c', '*=c', '/=c', '--'
        step_value: int = 1,
        nesting_level: int = 0,
        inner_loops: Optional[List['CppLoopPattern']] = None,
        is_triangular: bool = False
    ):
        self.loop_type = loop_type
        self.var_name = var_name
        self.start_val = start_val
        self.condition = condition
        self.bound_var = bound_var
        self.increment_op = increment_op
        self.step_value = step_value
        self.nesting_level = nesting_level
        self.inner_loops = inner_loops or []
        self.is_triangular = is_triangular

class CppAstAnalyzer:
    @staticmethod
    def extract_loops(code: str) -> List[Dict[str, Any]]:
        """
        Parses for and while loops, their step updates, bounds, and nesting depth.
        """
        loops = []
        # Match for loops: for (int i = 0; i < n; i++) or i += 2 or i *= 2
        for_pattern = re.compile(
            r"for\s*\(\s*(?:int|size_t|auto)?\s*([a-zA-Z_]\w*)\s*=\s*([^;]+);\s*([^;]+);\s*([^)]+)\)"
        )
        
        for match in for_pattern.finditer(code):
            var = match.group(1).strip()
            init = match.group(2).strip()
            cond = match.group(3).strip()
            incr = match.group(4).strip()
            
            # Analyze increment
            step_type = "linear"
            step_val = 1
            if "++" in incr:
                step_type = "constant_add"
                step_val = 1
            elif "--" in incr:
                step_type = "constant_sub"
                step_val = 1
            elif "+=" in incr:
                step_type = "constant_add"
                m = re.search(r"\+=\s*(\d+)", incr)
                step_val = int(m.group(1)) if m else 2
            elif "-=" in incr:
                step_type = "constant_sub"
                m = re.search(r"-=\s*(\d+)", incr)
                step_val = int(m.group(1)) if m else 2
            elif "*=" in incr:
                step_type = "multiplicative"
                m = re.search(r"\*=\s*(\d+)", incr)
                step_val = int(m.group(1)) if m else 2
            elif "/=" in incr:
                step_type = "division"
                m = re.search(r"/=\s*(\d+)", incr)
                step_val = int(m.group(1)) if m else 2

            # Check if triangular: e.g. j < n - i or j < i
            is_triangular = bool(re.search(r"[a-zA-Z_]\w*\s*[-+]\s*[a-zA-Z_]\w*", cond))

            loops.append({
                "type": "for",
                "var": var,
                "init": init,
                "cond": cond,
                "incr": incr,
                "step_type": step_type,
                "step_val": step_val,
                "is_triangular": is_triangular,
                "raw": match.group(0)
            })

        # Match while loops: while (low <= high), while (n > 0)
        while_pattern = re.compile(r"while\s*\(([^)]+)\)")
        for match in while_pattern.finditer(code):
            cond = match.group(1).strip()
            # Check for binary search pattern: while (low <= high) or (left < right)
            is_two_pointers = bool(re.search(r"\b(left|low|l|i)\b\s*<=\s*\b(right|high|r|j)\b", cond))
            loops.append({
                "type": "while",
                "cond": cond,
                "is_two_pointers": is_two_pointers,
                "step_type": "binary_or_pointer" if is_two_pointers else "unknown",
                "raw": match.group(0)
            })

        return loops

    @staticmethod
    def extract_recursions(code: str) -> List[Dict[str, Any]]:
        """
        Detects recursive function declarations and call sites.
        """
        recursions = []
        # Find function definitions: returnType funcName(args) { ... }
        func_def_pattern = re.compile(r"\b([a-zA-Z_]\w*)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*\{")
        
        for match in func_def_pattern.finditer(code):
            func_name = match.group(2)
            if func_name in ("main", "if", "for", "while", "switch"):
                continue
                
            # Check if the function calls itself inside the body
            # Simple body search from function start
            body_start = match.end()
            # Find matching closing brace
            brace_count = 1
            idx = body_start
            while idx < len(code) and brace_count > 0:
                if code[idx] == '{':
                    brace_count += 1
                elif code[idx] == '}':
                    brace_count -= 1
                idx += 1
            body = code[body_start:idx]
            
            # Count recursive calls
            rec_calls = re.findall(rf"\b{re.escape(func_name)}\s*\(", body)
            if rec_calls:
                call_count = len(rec_calls)
                # Check divide and conquer: func(n / 2)
                is_divide_conquer = bool(re.search(rf"\b{re.escape(func_name)}\s*\([^)]*/\s*2", body))
                recursions.append({
                    "function": func_name,
                    "recursive_calls_count": call_count,
                    "is_divide_conquer": is_divide_conquer
                })

        return recursions

    @staticmethod
    def extract_storage(code: str) -> Dict[str, Any]:
        """
        Detects fixed arrays, std::vector, dynamically allocated heap objects.
        """
        # Array declarations: int arr[100];
        arr_pattern = re.compile(r"\b(int|float|double|char|long|bool)\s+([a-zA-Z_]\w*)\s*\[(\d+)\]")
        arrays = []
        for m in arr_pattern.finditer(code):
            arrays.append({
                "type": m.group(1),
                "name": m.group(2),
                "size": int(m.group(3))
            })

        # Vectors: std::vector<int> v;
        vec_pattern = re.compile(r"\b(?:std::)?vector\s*<([^>]+)>\s*([a-zA-Z_]\w*)")
        vectors = []
        for m in vec_pattern.finditer(code):
            vectors.append({
                "elem_type": m.group(1).strip(),
                "name": m.group(2).strip()
            })

        # Dynamic allocations: new int[...] or malloc
        dynamic_allocs = re.findall(r"\bnew\s+([a-zA-Z_]\w*)\s*\[([^\]]+)\]", code)
        
        return {
            "fixed_arrays": arrays,
            "vectors": vectors,
            "dynamic_allocs": dynamic_allocs
        }
