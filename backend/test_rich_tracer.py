import subprocess
import json
import os
import tempfile

def test_rich_tracer():
    cpp_code = r"""#include <iostream>
#include <vector>

void bubbleSort(int a[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (a[j] > a[j+1]) {
                int temp = a[j];
                a[j] = a[j+1];
                a[j+1] = temp;
            }
        }
    }
}

int main() {
    int arr[5] = {5, 2, 8, 1, 9};
    int* ptr = &arr[0];
    bubbleSort(arr, 5);
    std::cout << "Done" << std::endl;
    return 0;
}
"""
    temp_dir = tempfile.gettempdir()
    src_file = os.path.join(temp_dir, "test_bubble.cpp")
    with open(src_file, "w") as f:
        f.write(cpp_code)
        
    drive = src_file[0].lower()
    path_rest = src_file[2:].replace("\\", "/")
    wsl_src = f"/mnt/{drive}{path_rest}"
    wsl_bin = "/tmp/dyc_test_bubble"
    
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
gdb.execute("file /tmp/dyc_test_bubble")
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
        elif code == gdb.TYPE_CODE_PTR:
            addr = hex(int(v))
            deref = None
            try:
                deref = parse_val(v.dereference())
            except:
                pass
            return {"type": "pointer", "address": addr, "target": deref}
        elif code in (gdb.TYPE_CODE_INT, gdb.TYPE_CODE_FLT, gdb.TYPE_CODE_BOOL):
            s = str(v)
            if s.isdigit() or (s.startswith('-') and s[1:].isdigit()):
                return int(s)
            try:
                return float(s)
            except:
                return s
        else:
            return str(v)
    except Exception as e:
        return str(v)

while step_count < max_steps:
    step_count += 1
    try:
        frame = gdb.selected_frame()
    except:
        break
        
    sal = frame.find_sal()
    symtab = sal.symtab
    line = sal.line
    filename = symtab.filename if symtab else ""
    func_name = frame.name()
    
    if "test_bubble.cpp" in filename:
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
        res = gdb.execute("step", to_string=True)
        if "exited normally" in res or "exited with code" in res or not res:
            break
    except:
        break

print("===DYC_EVENTS_START===")
print(json.dumps(events[:40]))
print("===DYC_EVENTS_END===")
gdb.execute("quit")
"""
    gdb_py_file = os.path.join(temp_dir, "tracer_bubble.py")
    with open(gdb_py_file, "w") as f:
        f.write(gdb_py_script)
        
    wsl_py = f"/mnt/{drive}{gdb_py_file[2:].replace(chr(92), '/')}"
    gdb_cmd = ["wsl", "-d", "Ubuntu", "bash", "-c", f"gdb -q -x '{wsl_py}'"]
    res = subprocess.run(gdb_cmd, capture_output=True, text=True, timeout=15)
    print("Execution output:")
    if "===DYC_EVENTS_START===" in res.stdout:
        part = res.stdout.split("===DYC_EVENTS_START===")[1].split("===DYC_EVENTS_END===")[0]
        data = json.loads(part)
        print(f"Captured {len(data)} trace events!")
        print("First 3 events:")
        print(json.dumps(data[:3], indent=2))
        print("Event inside bubbleSort:")
        for ev in data:
            if ev.get("function") == "bubbleSort":
                print(json.dumps(ev, indent=2))
                break

if __name__ == "__main__":
    test_rich_tracer()
