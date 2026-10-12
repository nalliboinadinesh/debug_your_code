import sys
from app.execution.runner import ExecutionRunner
from app.schemas.execution import ExecutionRequest

code = """#include <bits/stdc++.h>
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
"""

runner = ExecutionRunner()
req = ExecutionRequest(code=code)
res = runner.run(req)
print("SUCCESS:", res.success)
print("TOTAL STEPS:", res.totalSteps)
print("DETECTED:", res.detectedStructures)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
print("COMP_ERR:", res.compilationError)
print("RUN_ERR:", res.runtimeError)

if res.events:
    for ev in res.events[:15]:
        print(f"Step {ev.step:02d} (line {ev.line:02d}) [{ev.eventType}]: vars={ev.variables}, ds={ev.dataStructures}, pointers={ev.pointers}")
