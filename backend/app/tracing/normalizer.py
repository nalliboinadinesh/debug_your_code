import re
from typing import List, Dict, Any, Optional
from app.schemas.execution import ExecutionEvent

class EventNormalizer:
    @staticmethod
    def normalize(
        raw_events: List[Dict[str, Any]],
        code_lines: List[str],
        accumulated_stdout: str = ""
    ) -> List[ExecutionEvent]:
        normalized: List[ExecutionEvent] = []
        prev_locals: Dict[str, Any] = {}
        prev_callstack_depth: int = 0
        
        for idx, ev in enumerate(raw_events):
            step = idx + 1
            line_no = ev.get("line", 1)
            func_name = ev.get("function", "main")
            curr_locals = ev.get("locals", {})
            call_stack = ev.get("callStack", [])
            
            # Fetch line text from source code safely
            line_text = ""
            if 1 <= line_no <= len(code_lines):
                line_text = code_lines[line_no - 1].strip()
                
            # Separate arrays, pointers, and scalar variables
            arrays = {}
            pointers = {}
            scalars = {}
            
            for k, v in curr_locals.items():
                if isinstance(v, list):
                    arrays[k] = v
                elif isinstance(v, dict) and v.get("__isPointer"):
                    pointers[k] = v
                else:
                    scalars[k] = v

            # Determine what changed between previous step and current step
            changed_var = None
            old_val = None
            new_val = None
            event_type = "statement_enter"
            description = f"Executing line {line_no}: `{line_text}`"
            active_indices = None
            comparison_operands = None

            # 1. Check for function call or return
            curr_stack_depth = len(call_stack)
            if idx > 0 and curr_stack_depth > prev_callstack_depth:
                event_type = "function_call"
                description = f"Calling function `{func_name}`"
            elif idx > 0 and curr_stack_depth < prev_callstack_depth:
                event_type = "function_return"
                description = f"Returning from function to `{call_stack[0]['name'] if call_stack else 'caller'}`"
            else:
                # 2. Check for scalar variable changes
                for var_name, curr_v in scalars.items():
                    if var_name not in prev_locals:
                        changed_var = var_name
                        old_val = None
                        new_val = curr_v
                        event_type = "variable_declare"
                        description = f"Declared variable `{var_name}` with value `{curr_v}`"
                        break
                    elif prev_locals[var_name] != curr_v:
                        changed_var = var_name
                        old_val = prev_locals[var_name]
                        new_val = curr_v
                        
                        # Is it in a loop header?
                        if line_text.startswith("for") or line_text.startswith("while"):
                            event_type = "loop_iteration"
                            description = f"Loop iteration: `{var_name}` updated from `{old_val}` to `{new_val}`"
                        else:
                            event_type = "variable_update"
                            description = f"Variable `{var_name}` updated from `{old_val}` to `{new_val}`"
                        break

                # 3. Check for array changes
                if event_type == "statement_enter":
                    for arr_name, curr_arr in arrays.items():
                        prev_arr = prev_locals.get(arr_name)
                        if isinstance(prev_arr, list):
                            diff_indices = [
                                i for i in range(min(len(curr_arr), len(prev_arr)))
                                if curr_arr[i] != prev_arr[i]
                            ]
                            if diff_indices:
                                event_type = "array_write"
                                active_indices = diff_indices
                                changed_var = arr_name
                                old_val = [prev_arr[i] for i in diff_indices]
                                new_val = [curr_arr[i] for i in diff_indices]
                                idx_str = ", ".join(f"[{i}]" for i in diff_indices)
                                description = f"Array `{arr_name}` element{idx_str} updated to {new_val}"
                                break

                # 4. Check for pointer changes
                if event_type == "statement_enter":
                    for ptr_name, curr_ptr in pointers.items():
                        prev_ptr = prev_locals.get(ptr_name)
                        if prev_ptr != curr_ptr:
                            event_type = "pointer_update"
                            changed_var = ptr_name
                            old_val = prev_ptr.get("address") if isinstance(prev_ptr, dict) else None
                            new_val = curr_ptr.get("address")
                            target_val = curr_ptr.get("target")
                            description = f"Pointer `{ptr_name}` updated to address `{new_val}` (dereferenced: `{target_val}`)"
                            break

                # 5. Check for comparisons/branch lines
                if event_type == "statement_enter":
                    if re.search(r"\bif\s*\(", line_text):
                        event_type = "comparison"
                        description = f"Evaluating condition: `{line_text}`"
                    elif re.search(r"\b(cout|printf|puts)\b", line_text):
                        event_type = "output"
                        description = f"Output operation at line {line_no}"

            # Automatically highlight active index from mid or i if present
            if not active_indices:
                if "mid" in scalars and isinstance(scalars["mid"], int):
                    active_indices = [scalars["mid"]]
                elif "i" in scalars and isinstance(scalars["i"], int):
                    active_indices = [scalars["i"]]

            # Construct normalized event
            event = ExecutionEvent(
                step=step,
                line=line_no,
                eventType=event_type,
                variable=changed_var,
                oldValue=old_val,
                newValue=new_val,
                description=description,
                currentScope=func_name,
                callStack=call_stack,
                dataStructures=arrays,
                pointers=pointers,
                variables=scalars,
                activeIndices=active_indices,
                comparisonOperands=comparison_operands,
                stdout=accumulated_stdout if idx == len(raw_events) - 1 else "",
                confidence="verified_runtime"
            )
            normalized.append(event)
            prev_locals = dict(curr_locals)
            prev_callstack_depth = curr_stack_depth

        return normalized
