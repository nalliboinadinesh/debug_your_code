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
                
            # Separate data structures (arrays, maps, pairs, linear), pointers, and scalar variables
            data_structures = {}
            pointers = {}
            scalars = {}
            
            for k, v in curr_locals.items():
                if isinstance(v, list):
                    data_structures[k] = v
                elif isinstance(v, dict):
                    if v.get("__isPointer"):
                        pointers[k] = v
                    elif v.get("__isMap") or v.get("__isPair") or v.get("__isLinear"):
                        data_structures[k] = v
                    else:
                        scalars[k] = v
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

                # 3. Check for data structure changes (arrays, maps, pairs)
                if event_type == "statement_enter":
                    for ds_name, curr_ds in data_structures.items():
                        prev_ds = prev_locals.get(ds_name)
                        if isinstance(curr_ds, list) and isinstance(prev_ds, list):
                            diff_indices = [
                                i for i in range(min(len(curr_ds), len(prev_ds)))
                                if curr_ds[i] != prev_ds[i]
                            ]
                            if diff_indices:
                                event_type = "array_write"
                                active_indices = diff_indices
                                changed_var = ds_name
                                old_val = [prev_ds[i] for i in diff_indices]
                                new_val = [curr_ds[i] for i in diff_indices]
                                idx_str = ", ".join(f"[{i}]" for i in diff_indices)
                                description = f"Array `{ds_name}` element{idx_str} updated to {new_val}"
                                break
                        elif isinstance(curr_ds, dict) and curr_ds.get("__isMap"):
                            if prev_ds != curr_ds:
                                event_type = "map_update"
                                changed_var = ds_name
                                entries_str = ", ".join(f"[{e['key']}]={e['value']}" for e in curr_ds.get("entries", [])[:5])
                                description = f"Map `{ds_name}` updated: {{{entries_str}}}"
                                break
                        elif isinstance(curr_ds, dict) and curr_ds.get("__isPair"):
                            if prev_ds != curr_ds:
                                event_type = "loop_iteration" if (line_text.startswith("for") or line_text.startswith("while")) else "variable_update"
                                changed_var = ds_name
                                description = f"Pair `{ds_name}`: first={curr_ds.get('first')}, second={curr_ds.get('second')}"
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
                dataStructures=data_structures,
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
