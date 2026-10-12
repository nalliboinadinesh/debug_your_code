import subprocess
import json
import os
import tempfile

def test_full_stepping():
    cpp_code = r"""#include <iostream>

void swap(int &a, int &b) {
    int temp = a;
    a = b;
    b = temp;
}

int main() {
    int arr[4] = {40, 10, 30, 20};
    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 3; j++) {
            if (arr[j] > arr[j+1]) {
                swap(arr[j], arr[j+1]);
            }
        }
    }
    return 0;
}
"""
    temp_dir = tempfile.gettempdir()
    src_file = os.path.join(temp_dir, "test_swap.cpp")
    with open(src_file, "w") as f:
        f.write(cpp_code)
        
    drive = src_file[0].lower()
    path_rest = src_file[2:].replace("\\", "/")
    wsl_src = f"/mnt/{drive}{path_rest}"
    wsl_bin = "/tmp/dyc_test_swap"
    
    compile_cmd = ["wsl", "-d", "Ubuntu", "bash", "-c", f"g++ -g3 -O0 '{wsl_src}' -o '{wsl_bin}'"]
    res = subprocess.run(compile_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("Compile error:", res.stderr)
        return
    print("Compilation succeeded!")

    gdb_py_script = r"""
import gdb
import json

events = []
gdb.execute("file /tmp/dyc_test_swap")
gdb.execute("set pagination off")
gdb.execute("break main")
gdb.execute("run")

step_count = 0
max_steps = 150

def parse_val(v):
    try:
        t = v.type.strip_typedefs()
        code = t.code
        if code == gdb.TYPE_CODE_ARRAY:
            low, high = t.range()
            return [parse_val(v[i]) for i in range(low, high + 1)]
        elif code in (gdb.TYPE_CODE_INT, gdb.TYPE_CODE_FLT, gdb.TYPE_CODE_BOOL):
            s = str(v)
            if s.isdigit() or (s.startswith('-') and s[1:].isdigit()):
                return int(s)
            try:
                return float(s)
            except:
                return s
        elif code == gdb.TYPE_CODE_REF:
            return parse_val(v.referenced_value())
        else:
            return str(v)
    except Exception as e:
        return str(v)

while step_count < max_steps:
    step_count += 1
    try:
        frame = gdb.selected_frame()
    except Exception as e:
        break
        
    sal = frame.find_sal()
    symtab = sal.symtab
    line = sal.line
    filename = symtab.filename if symtab else ""
    func_name = frame.name()
    
    if "test_swap.cpp" in filename:
        locals_dict = {}
        block = frame.block()
        while block:
            if not block.is_global and not block.is_static:
                for symbol in block:
                    if symbol.is_variable or symbol.is_argument:
                        name = symbol.name
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
            if cur.name():
                call_stack.append({"name": cur.name(), "line": cur.find_sal().line})
            cur = cur.older()
            
        events.append({
            "step": step_count,
            "line": line,
            "function": func_name,
            "locals": locals_dict,
            "callStack": call_stack
        })
        
    try:
        # Step into
        res = gdb.execute("step", to_string=True)
        if "exited" in res.lower():
            break
    except Exception as e:
        break

print("===DYC_EVENTS_START===")
print(json.dumps(events))
print("===DYC_EVENTS_END===")
gdb.execute("quit")
"""
    gdb_py_file = os.path.join(temp_dir, "tracer_swap.py")
    with open(gdb_py_file, "w") as f:
        f.write(gdb_py_script)
        
    wsl_py = f"/mnt/{drive}{gdb_py_file[2:].replace(chr(92), '/')}"
    gdb_cmd = ["wsl", "-d", "Ubuntu", "bash", "-c", f"gdb -q -x '{wsl_py}'"]
    res = subprocess.run(gdb_cmd, capture_output=True, text=True, timeout=15)
    if "===DYC_EVENTS_START===" in res.stdout:
        part = res.stdout.split("===DYC_EVENTS_START===")[1].split("===DYC_EVENTS_END===")[0]
        data = json.loads(part)
        print(f"Captured {len(data)} trace events successfully!")
        print("First event:", json.dumps(data[0]))
        # Find swap call
        swap_events = [e for e in data if e.get("function") == "swap"]
        print(f"Swap function events count: {len(swap_events)}")
        if swap_events:
            print("Swap event:", json.dumps(swap_events[0]))
        last_event = data[-1]
        print("Last event:", json.dumps(last_event))

if __name__ == "__main__":
    test_full_stepping()
