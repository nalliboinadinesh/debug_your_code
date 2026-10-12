import os
import subprocess
import json
import uuid
import tempfile
from typing import Dict, Any, List, Tuple, Optional
from app.execution.compiler import windows_to_wsl_path

GDB_TRACER_TEMPLATE = r"""
import gdb
import json
import sys

events = []
binary_path = "{bin_wsl}"
src_wsl = "{src_wsl}"
max_steps = {max_steps}
src_filename = "{src_filename}"

gdb.execute("file " + binary_path)
gdb.execute("set pagination off")
gdb.execute("set confirm off")
try:
    gdb.execute("skip -rfu ^std::")
    gdb.execute("skip -gfi */include/*")
except:
    pass
gdb.execute("break main")

# Run with redirected stdin if provided
stdin_file = "{stdin_wsl}"
if stdin_file:
    gdb.execute("run < " + stdin_file)
else:
    gdb.execute("run")

def parse_val(v, depth=0):
    if depth > 4:
        return "..."
    try:
        t = v.type.strip_typedefs()
        code = t.code
        
        # 1. References (e.g. vector<int>&)
        if code == gdb.TYPE_CODE_REF:
            try:
                v = v.referenced_value()
                t = v.type.strip_typedefs()
                code = t.code
            except Exception:
                return str(v)
                
        # 2. std::vector inspection
        type_str = str(t)
        if "vector<" in type_str:
            try:
                start = v['_M_impl']['_M_start']
                finish = v['_M_impl']['_M_finish']
                end_storage = v['_M_impl']['_M_end_of_storage']
                n = int(finish - start)
                cap = int(end_storage - start)
                # A valid std::vector always satisfies 0 <= size <= capacity
                if 0 <= n <= cap and 0 <= cap <= 2000 and int(start) != 0:
                    if n > 0:
                        _ = int(start[0])  # ensure memory is accessible
                    return [parse_val(start[i], depth + 1) for i in range(n)]
                elif n == 0 or cap == 0:
                    return []
            except Exception:
                pass
            # Fallback for std::vector string representation
            s = str(v)
            if "{" in s and "}" in s and "length -" not in s and "capacity -" not in s:
                body = s[s.find("{") + 1 : s.rfind("}")]
                items = [x.strip() for x in body.split(",") if x.strip()]
                parsed = []
                for it in items[:50]:
                    if it.isdigit() or (it.startswith('-') and it[1:].isdigit()):
                        parsed.append(int(it))
                    else:
                        parsed.append(it)
                if parsed and len(parsed) <= 100:
                    return parsed
            return []

        # 3. std::map / std::unordered_map / multimap inspection
        if "map" in type_str or "map with" in str(v).lower():
            s = str(v)
            if "with 0 elements" in s or "<error reading" in s:
                return {"__isMap": True, "type": "map", "size": 0, "entries": []}
            import re
            pairs = re.findall(r"\[([^\]]+)\]\s*=\s*([^,}]+)", s)
            if pairs:
                entries = []
                for k_raw, val_raw in pairs[:50]:
                    k_str = k_raw.strip()
                    v_str = val_raw.strip()
                    k_parsed = int(k_str) if (k_str.isdigit() or (k_str.startswith('-') and k_str[1:].isdigit())) else k_str
                    v_parsed = int(v_str) if (v_str.isdigit() or (v_str.startswith('-') and v_str[1:].isdigit())) else v_str
                    entries.append({"key": k_parsed, "value": v_parsed})
                map_kind = "unordered_map" if "unordered" in type_str else "map"
                return {"__isMap": True, "type": map_kind, "size": len(entries), "entries": entries}

        # 4. std::pair inspection
        if "pair<" in type_str or "first =" in str(v):
            s = str(v)
            import re
            m = re.search(r"first\s*=\s*([^,}]+),\s*second\s*=\s*([^}]+)", s)
            if m:
                f_str = m.group(1).strip()
                s_str = m.group(2).strip()
                f_val = int(f_str) if (f_str.isdigit() or (f_str.startswith('-') and f_str[1:].isdigit())) else f_str
                s_val = int(s_str) if (s_str.isdigit() or (s_str.startswith('-') and s_str[1:].isdigit())) else s_str
                return {"__isPair": True, "first": f_val, "second": s_val}

        # 5. std::stack / std::queue / std::deque
        if "stack<" in type_str or "queue<" in type_str or "deque<" in type_str:
            try:
                c = v['c']
                parsed_c = parse_val(c, depth + 1)
                if isinstance(parsed_c, list):
                    kind = "stack" if "stack<" in type_str else ("queue" if "queue<" in type_str else "deque")
                    return {"__isLinear": True, "type": kind, "elements": parsed_c}
            except Exception:
                pass

        # 6. std::string
        if "string" in type_str and "basic_string" in type_str:
            s = str(v)
            if '"' in s:
                return s[s.find('"') + 1 : s.rfind('"')]

        # 7. std::set / std::unordered_set inspection
        if "set" in type_str or "set with" in str(v).lower():
            s = str(v)
            if "with 0 elements" in s or "<error reading" in s:
                return []
            import re
            m = re.search(r"with\s+(\d+)\s+elements?", s)
            if m and int(m.group(1)) > 500:
                return []
            if "{" in s and "}" in s:
                body = s[s.find("{") + 1 : s.rfind("}")]
                vals = re.findall(r"=\s*([-\d]+)", body)
                if vals:
                    return [int(val) for val in vals[:50]]
                items = [x.strip() for x in body.split(",") if x.strip()]
                parsed = []
                for it in items[:50]:
                    if it.isdigit() or (it.startswith('-') and it[1:].isdigit()):
                        parsed.append(int(it))
                return parsed
            return []

        # 8. C-style arrays
        if code == gdb.TYPE_CODE_ARRAY:
            low, high = t.range()
            count = min(high - low + 1, 50)
            return [parse_val(v[i], depth + 1) for i in range(low, low + count)]
            
        # 9. Pointers
        elif code == gdb.TYPE_CODE_PTR:
            addr = hex(int(v))
            deref = None
            try:
                deref = parse_val(v.dereference(), depth + 1)
            except:
                pass
            return {"__isPointer": True, "address": addr, "target": deref}
            
        # 10. Scalars
        elif code in (gdb.TYPE_CODE_INT, gdb.TYPE_CODE_FLT, gdb.TYPE_CODE_BOOL):
            s = str(v)
            if s.isdigit() or (s.startswith('-') and s[1:].isdigit()):
                return int(s)
            try:
                return float(s)
            except:
                return s
        else:
            s = str(v)
            if s.startswith('{') and s.endswith('}'):
                items = [x.strip() for x in s[1:-1].split(',') if x.strip()]
                parsed_items = []
                for it in items[:30]:
                    if it.isdigit() or (it.startswith('-') and it[1:].isdigit()):
                        parsed_items.append(int(it))
                    else:
                        parsed_items.append(it)
                return parsed_items
            return s
    except Exception as e:
        return str(v)

step_count = 0
in_user_code = False
consecutive_lib_steps = 0

while len(events) < max_steps and step_count < max_steps * 20:
    step_count += 1
    try:
        frame = gdb.selected_frame()
    except Exception:
        break
        
    sal = frame.find_sal()
    symtab = sal.symtab
    line = sal.line
    filename = symtab.filename if symtab else ""
    func_name = frame.name() or "unknown"
    
    # We only record events that occur within the user's source code
    is_user_code = (src_filename in filename or filename.endswith(".cpp")) and ("/include/" not in filename)
    
    if is_user_code:
        in_user_code = True
        consecutive_lib_steps = 0
        locals_dict = {}
        block = None
        try:
            block = frame.block()
        except:
            pass
            
        while block:
            if not block.is_global and not block.is_static:
                for symbol in block:
                    if symbol.is_variable or symbol.is_argument:
                        name = symbol.name
                        if name not in locals_dict:
                            try:
                                val = frame.read_var(symbol)
                                locals_dict[name] = parse_val(val)
                            except:
                                pass
            if block.function:
                break
            block = block.superblock
            
        call_stack = []
        cur = frame
        while cur:
            c_name = cur.name()
            if c_name:
                c_line = 0
                try:
                    c_line = cur.find_sal().line
                except:
                    pass
                call_stack.append({"name": c_name, "line": c_line})
            cur = cur.older()
            
        events.append({
            "step": len(events) + 1,
            "line": line,
            "function": func_name,
            "locals": locals_dict,
            "callStack": call_stack
        })
    else:
        consecutive_lib_steps += 1
        if func_name in ("__libc_start_main", "exit", "__run_exit_handlers", "_exit"):
            break
        # If we stepped into a deep STL function, use finish to return back quickly
        if in_user_code and consecutive_lib_steps > 6:
            try:
                gdb.execute("finish")
                continue
            except:
                pass
        
    try:
        res = gdb.execute("step", to_string=True)
        if "exited" in res.lower() or "not being run" in res.lower():
            break
    except Exception:
        break

print("===DYC_EVENTS_START===")
print(json.dumps(events))
print("===DYC_EVENTS_END===")
try:
    gdb.execute("quit")
except:
    pass
"""

class GdbDriver:
    def __init__(self, timeout_sec: int = 12):
        self.timeout_sec = timeout_sec

    def trace(
        self,
        bin_wsl: str,
        src_wsl: str,
        stdin_content: str,
        work_dir: str,
        max_steps: int = 250
    ) -> Tuple[bool, List[Dict[str, Any]], str, str, Optional[str]]:
        """
        Executes binary inside GDB and captures execution events and program stdout.
        Returns: (success, raw_events, stdout, stderr, runtime_error)
        """
        src_filename = os.path.basename(src_wsl)
        
        # Stdin file if any
        stdin_wsl = ""
        if stdin_content:
            stdin_win = os.path.join(work_dir, "stdin.txt")
            with open(stdin_win, "w", encoding="utf-8") as f:
                f.write(stdin_content)
            stdin_wsl = windows_to_wsl_path(stdin_win)

        # Generate GDB script
        script_code = GDB_TRACER_TEMPLATE.replace("{bin_wsl}", bin_wsl) \
            .replace("{src_wsl}", src_wsl) \
            .replace("{src_filename}", src_filename) \
            .replace("{max_steps}", str(max_steps)) \
            .replace("{stdin_wsl}", stdin_wsl)

        script_win = os.path.join(work_dir, f"gdb_script_{uuid.uuid4().hex[:6]}.py")
        with open(script_win, "w", encoding="utf-8") as f:
            f.write(script_code)
            
        script_wsl = windows_to_wsl_path(script_win)
        
        # Also run the binary directly once to capture pure stdout cleanly!
        clean_stdout = ""
        try:
            stdin_redirect = f"< '{stdin_wsl}'" if stdin_wsl else ""
            run_cmd = [
                "wsl", "-d", "Ubuntu", "bash", "-c",
                f"timeout 3s '{bin_wsl}' {stdin_redirect}"
            ]
            run_res = subprocess.run(run_cmd, capture_output=True, text=True, timeout=5)
            clean_stdout = run_res.stdout
        except Exception:
            clean_stdout = ""
            
        # Run GDB with memory & CPU limits
        # ulimit -t 5 (5 CPU seconds), ulimit -v 350000 (350MB virtual memory)
        cmd = [
            "wsl", "-d", "Ubuntu", "bash", "-c",
            f"ulimit -t 6; timeout {self.timeout_sec}s gdb -q -x '{script_wsl}'"
        ]
        
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=self.timeout_sec + 2)
            stdout = res.stdout
            stderr = res.stderr
            
            if "===DYC_EVENTS_START===" in stdout:
                parts = stdout.split("===DYC_EVENTS_START===")[1].split("===DYC_EVENTS_END===")
                events_json = parts[0].strip()
                raw_events = json.loads(events_json)
                return True, raw_events, clean_stdout, stderr, None
            else:
                return False, [], clean_stdout, stderr, "Failed to capture trace events from debugger."
        except subprocess.TimeoutExpired:
            return False, [], clean_stdout, "", f"Execution exceeded wall-clock limit ({self.timeout_sec}s). Possible infinite loop."
        except Exception as e:
            return False, [], clean_stdout, str(e), f"Tracing failed: {str(e)}"
        finally:
            # Clean up binary in /tmp
            try:
                subprocess.run(["wsl", "-d", "Ubuntu", "bash", "-c", f"rm -f '{bin_wsl}'"], capture_output=True)
            except Exception:
                pass
