import subprocess
import json
import os
import tempfile

def test_wsl_gdb():
    print("Testing WSL G++ and GDB execution...")
    # C++ code with array and loop
    cpp_code = r"""#include <iostream>

int main() {
    int arr[5] = {10, 20, 30, 40, 50};
    int total = 0;
    for (int i = 0; i < 5; i++) {
        total += arr[i];
    }
    std::cout << "Total: " << total << std::endl;
    return 0;
}
"""
    # Write to a temporary file in user's temp
    temp_dir = tempfile.gettempdir()
    src_file = os.path.join(temp_dir, "test_code.cpp")
    with open(src_file, "w") as f:
        f.write(cpp_code)
        
    # Convert windows path to wsl path
    # e.g. C:\Users\... -> /mnt/c/Users/...
    drive = src_file[0].lower()
    path_rest = src_file[2:].replace("\\", "/")
    wsl_src = f"/mnt/{drive}{path_rest}"
    wsl_bin = "/tmp/dyc_test_bin"
    
    # 1. Compile
    compile_cmd = ["wsl", "-d", "Ubuntu", "bash", "-c", f"g++ -g -O0 '{wsl_src}' -o '{wsl_bin}'"]
    res = subprocess.run(compile_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("Compile error:", res.stderr)
        return
    print("Compilation succeeded!")

    # 2. Test GDB Python script execution inside WSL!
    # GDB in Ubuntu has Python support built-in!
    gdb_py_script = r"""
import gdb
import json

events = []
gdb.execute("file /tmp/dyc_test_bin")
gdb.execute("break main")
gdb.execute("run")

step_count = 0
max_steps = 100

while step_count < max_steps:
    step_count += 1
    frame = gdb.selected_frame()
    sal = frame.find_sal()
    symtab = sal.symtab
    line = sal.line
    filename = symtab.filename if symtab else ""
    
    # Check if we are in our test source
    if "test_code.cpp" in filename:
        # Collect local variables
        block = frame.block()
        locals_dict = {}
        while block:
            if not block.is_global and not block.is_static:
                for symbol in block:
                    if symbol.is_variable or symbol.is_argument:
                        name = symbol.name
                        try:
                            val = frame.read_var(symbol)
                            locals_dict[name] = str(val)
                        except Exception as e:
                            locals_dict[name] = "<err>"
            if block.function:
                break
            block = block.superblock
            
        events.append({
            "step": step_count,
            "line": line,
            "file": filename,
            "locals": locals_dict
        })
        
    try:
        res = gdb.execute("step", to_string=True)
        if "exited" in res.lower() or "inferior" in res.lower() and "exited" in res.lower():
            break
    except Exception as e:
        break

print("===DYC_EVENTS_START===")
print(json.dumps(events))
print("===DYC_EVENTS_END===")
gdb.execute("quit")
"""
    gdb_py_file = os.path.join(temp_dir, "tracer.py")
    with open(gdb_py_file, "w") as f:
        f.write(gdb_py_script)
        
    wsl_py = f"/mnt/{drive}{gdb_py_file[2:].replace(chr(92), '/')}"
    
    gdb_cmd = ["wsl", "-d", "Ubuntu", "bash", "-c", f"gdb -q -x '{wsl_py}'"]
    res = subprocess.run(gdb_cmd, capture_output=True, text=True, timeout=10)
    print("GDB stdout:")
    print(res.stdout)
    if res.stderr:
        print("GDB stderr:", res.stderr)

if __name__ == "__main__":
    test_wsl_gdb()
