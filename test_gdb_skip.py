import subprocess

script = r"""
cat << 'EOF' > /tmp/dup_test.cpp
#include <iostream>
#include <vector>
#include <unordered_set>
using namespace std;

int main() {
    vector<int> arr = {10, 20, 30, 40, 50};
    unordered_set<int> seen;
    for (int i = 0; i < arr.size(); i++) {
        if (seen.find(arr[i]) != seen.end()) {
            cout << "Duplicate found: " << arr[i] << endl;
            return 0;
        }
        seen.insert(arr[i]);
    }
    cout << "No duplicates found" << endl;
    return 0;
}
EOF
g++ -g3 -O0 -std=c++17 -o /tmp/dup_test /tmp/dup_test.cpp

python3 -c "
import gdb

gdb.execute('file /tmp/dup_test')
gdb.execute('skip -rfu ^std::')
gdb.execute('skip -gfi */include/*')
gdb.execute('break main')
gdb.execute('run')

steps = 0
events = []
while len(events) < 50:
    steps += 1
    frame = gdb.selected_frame()
    sal = frame.find_sal()
    line = sal.line
    filename = sal.symtab.filename if sal.symtab else ''
    
    if 'dup_test.cpp' in filename:
        events.append((steps, line))
        print(f'User step {len(events)}: line {line}')
    
    try:
        res = gdb.execute('step', to_string=True)
        if 'exited' in res.lower():
            print('Program exited normally!')
            break
    except Exception as e:
        print('Error:', e)
        break

print('Total user events:', len(events))
gdb.execute('quit')
"
"""

p = subprocess.run(["wsl", "bash", "-c", script], capture_output=True, text=True)
print("STDOUT:\n", p.stdout)
print("STDERR:\n", p.stderr)
