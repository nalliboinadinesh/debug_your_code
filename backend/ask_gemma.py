import httpx
import json

prompt = """You are the AI Tutor in DebugYourCode (DYC).
Provide an in-depth, rigorous explanation of the following C++ code.
Address each of the following:
1. High-Level Overview & Logic: What is the code trying to achieve, and does the algorithm achieve it correctly?
2. Step-by-Step Walkthrough with the given input {10, 20, 30, 40, 50}.
3. Correctness Analysis: Does it correctly detect duplicates? What happens if duplicates exist (e.g. {10, 20, 10})? What happens if no duplicates exist?
4. Data Structure Choice: Why is std::unordered_set used instead of std::vector or std::set? (Hash table vs Balanced BST vs Array).
5. Exact Time & Space Complexity Analysis: Best case, average case, and worst case (including hash collisions).
6. Edge Cases: Empty array, single element, negative numbers, large inputs.

Code:
```cpp
#include <bits/stdc++.h>
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
```
"""

resp = httpx.post("http://localhost:11434/api/chat", json={
    "model": "gemma4:12b",
    "messages": [{"role": "user", "content": prompt}],
    "options": {"num_predict": 350, "temperature": 0.1},
    "think": False,
    "stream": False
}, timeout=60)

data = resp.json()
ans = data.get("message", {}).get("content", "")
print("=== GEMMA 4 LOCAL MODEL RESPONSE ===")
print(ans)

with open("gemma_response.txt", "w", encoding="utf-8") as f:
    f.write(ans)
