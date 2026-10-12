from app.execution.runner import ExecutionRunner
from app.schemas.execution import ExecutionRequest

code = """#include <bits/stdc++.h>
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
"""

runner = ExecutionRunner()
req = ExecutionRequest(code=code, maxSteps=250)
res = runner.run(req)

print("SUCCESS:", res.success)
print("TOTAL STEPS:", res.totalSteps)
print("STDOUT:", repr(res.stdout))
print("STDERR:", repr(res.stderr))
print("RUN_ERR:", repr(res.runtimeError))

for ev in res.events:
    line_desc = ev.description
    print(f"Step {ev.step:02d} | Line {ev.line:02d} | eventType={ev.eventType:16s} | scope={ev.currentScope} | vars={ev.variables} | ds={ev.dataStructures}")
