import httpx
import json

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

client = httpx.Client(timeout=45)

print("=== 1. EXECUTION TEST ===")
exec_resp = client.post("http://127.0.0.1:8000/api/run", json={"code": code, "stdin": "", "language": "cpp", "maxSteps": 250})
print("Exec Status:", exec_resp.status_code)
exec_data = exec_resp.json()
print("Success:", exec_data.get("success"))
print("Total Steps:", exec_data.get("totalSteps"))
print("Stdout:", exec_data.get("stdout"))
print("Detected Structures:", exec_data.get("detectedStructures"))
print("Compile Error:", exec_data.get("compilationError"))
print("Runtime Error:", exec_data.get("runtimeError"))

print("\n=== 2. COMPLEXITY ANALYSIS TEST ===")
ana_resp = client.post("http://127.0.0.1:8000/api/analyze", json={"code": code, "executedSteps": exec_data.get("totalSteps"), "language": "cpp"})
print("Analyze Status:", ana_resp.status_code)
ana_data = ana_resp.json()
print("Time Complexity:", ana_data.get("timeComplexity", {}).get("worstCase"))
print("Average Case:", ana_data.get("timeComplexity", {}).get("averageCase"))
print("Best Case:", ana_data.get("timeComplexity", {}).get("bestCase"))
print("Space Auxiliary:", ana_data.get("spaceComplexity", {}).get("auxiliarySpace"))
print("Summary:", ana_data.get("summary"))

print("\n=== 3. AI TUTOR EXPLANATION TEST ===")
# Pick a loop step where arr[i] is inserted into seen
events = exec_data.get("events", [])
sample_step = events[min(10, len(events)-1)] if events else {}
ai_req = {
    "context": {
        "code": code,
        "currentStep": sample_step.get("step", 1),
        "totalSteps": exec_data.get("totalSteps", 1),
        "currentLine": sample_step.get("line", 1),
        "currentVariables": sample_step.get("variables", {}),
        "currentEvent": sample_step,
        "complexity": ana_data
    },
    "question": "What does this code do, how does unordered_set prevent duplicates, and what are its time and space complexities?",
    "model": "gemma-4"
}

ai_resp = client.post("http://127.0.0.1:8000/api/ai/explain", json=ai_req)
print("AI Status:", ai_resp.status_code)
ai_data = ai_resp.json()
print("Model Used:", ai_data.get("modelUsed"))
print("Explanation:\n", ai_data.get("explanation"))
