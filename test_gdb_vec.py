import subprocess

script = r"""
cat << 'EOF' > /tmp/vec_test.cpp
#include <iostream>
#include <vector>

int binarySearch(std::vector<int>& arr, int target) {
    int low = 0;
    int high = arr.size() - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

int main() {
    std::vector<int> arr = {10, 20, 30, 40, 50, 60, 70};
    int target = 50;
    std::cout << binarySearch(arr, target) << std::endl;
    return 0;
}
EOF
g++ -g3 -O0 -std=c++17 -o /tmp/vec_test /tmp/vec_test.cpp

python3 -c "
py_gdb = '''
import gdb

gdb.execute('file /tmp/vec_test')
gdb.execute('break binarySearch')
gdb.execute('run')
# Step past prologue into first line of function body
gdb.execute('step')

v = gdb.parse_and_eval('arr')
print('V TYPE:', v.type)
print('V CODE:', v.type.code)

ref = v.referenced_value() if v.type.code == gdb.TYPE_CODE_REF else v
print('REF TYPE:', ref.type)

try:
    start = ref['_M_impl']['_M_start']
    finish = ref['_M_impl']['_M_finish']
    n = int(finish - start)
    print('VECTOR SIZE:', n)
    vals = [int(start[i]) for i in range(n)]
    print('VECTOR VALS:', vals)
except Exception as e:
    print('VECTOR ERROR:', e)

print('STR REF:', str(ref))
gdb.execute('quit')
'''
with open('/tmp/test_gdb.py', 'w') as f:
    f.write(py_gdb)
"
gdb -q -batch -x /tmp/test_gdb.py
"""

res = subprocess.run(["wsl", "bash", "-c", script], capture_output=True, text=True)
print("STDOUT:")
print(res.stdout)
print("STDERR:")
print(res.stderr)
