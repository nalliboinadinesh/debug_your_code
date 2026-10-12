import subprocess

script = r"""
cat << 'EOF' > /tmp/user_bs.cpp
#include <iostream>
#include <vector>
using namespace std;

int binarySearch(vector<int>& arr, int target) {
    int low = 0;
    int high = arr.size() - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;

        if (arr[mid] == target) {
            return mid;
        }
        else if (arr[mid] < target) {
            low = mid + 1;
        }
        else {
            high = mid - 1;
        }
    }

    return -1;
}

int main() {
    vector<int> arr = {10, 20, 30, 40, 50, 60, 70};
    int target = 50;

    int result = binarySearch(arr, target);

    if (result != -1) {
        cout << "Element found at index: " << result << endl;
    }
    else {
        cout << "Element not found" << endl;
    }

    return 0;
}
EOF
g++ -g3 -O0 -std=c++17 -o /tmp/user_bs /tmp/user_bs.cpp

python3 -c "
py = '''
import gdb
import json

events = []
gdb.execute('file /tmp/user_bs')
gdb.execute('set pagination off')
gdb.execute('set confirm off')
gdb.execute('break main')
gdb.execute('run')

def parse_val(v, depth=0):
    if depth > 4:
        return '...'
    try:
        t = v.type.strip_typedefs()
        code = t.code
        if code == gdb.TYPE_CODE_REF:
            try:
                v = v.referenced_value()
                t = v.type.strip_typedefs()
                code = t.code
            except Exception:
                return str(v)
                
        type_str = str(t)
        if 'vector<' in type_str:
            try:
                start = v['_M_impl']['_M_start']
                finish = v['_M_impl']['_M_finish']
                n = int(finish - start)
                if 0 <= n <= 100:
                    return [parse_val(start[i], depth + 1) for i in range(n)]
            except Exception:
                pass
            s = str(v)
            if '{' in s and '}' in s:
                body = s[s.find('{') + 1 : s.rfind('}')]
                items = [x.strip() for x in body.split(',') if x.strip()]
                parsed = []
                for it in items[:50]:
                    if it.isdigit() or (it.startswith('-') and it[1:].isdigit()):
                        parsed.append(int(it))
                    else:
                        parsed.append(it)
                if parsed:
                    return parsed

        if code == gdb.TYPE_CODE_ARRAY:
            low, high = t.range()
            count = min(high - low + 1, 30)
            return [parse_val(v[i], depth + 1) for i in range(low, low + count)]
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
                parsed = []
                for it in items[:30]:
                    if it.isdigit() or (it.startswith('-') and it[1:].isdigit()):
                        parsed.append(int(it))
                    else:
                        parsed.append(it)
                return parsed
            return s
    except Exception as e:
        return str(v)

step_count = 0
in_user_code = False
consecutive_lib_steps = 0
max_steps = 200

while step_count < max_steps:
    step_count += 1
    try:
        frame = gdb.selected_frame()
    except Exception:
        break
        
    sal = frame.find_sal()
    symtab = sal.symtab
    line = sal.line
    filename = symtab.filename if symtab else ''
    func_name = frame.name() or 'unknown'
    
    is_user_code = ('user_bs.cpp' in filename or filename.endswith('.cpp')) and ('/include/' not in filename)
    
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
            
        events.append({
            'step': len(events) + 1,
            'line': line,
            'function': func_name,
            'locals': locals_dict
        })
    else:
        consecutive_lib_steps += 1
        if func_name in ('__libc_start_main', 'exit', '__run_exit_handlers', '_exit'):
            break
        if in_user_code and consecutive_lib_steps > 40:
            try:
                gdb.execute('finish')
                continue
            except:
                pass
                
    try:
        res = gdb.execute('step', to_string=True)
        if 'exited' in res.lower() or 'not being run' in res.lower():
            break
    except Exception:
        break

print('COLLECTED EVENTS:', len(events))
for ev in events:
    print(f\"Line {ev['line']} ({ev['function']}): {ev['locals']}\")
gdb.execute('quit')
'''
with open('/tmp/test_tracer.py', 'w') as f:
    f.write(py)
"
gdb -q -batch -x /tmp/test_tracer.py
"""

res = subprocess.run(["wsl", "bash", "-c", script], capture_output=True, text=True)
print("STDOUT:")
print(res.stdout)
print("STDERR:")
print(res.stderr)
