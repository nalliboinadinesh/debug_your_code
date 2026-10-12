import httpx
from test_duplicates_check import code

resp = httpx.post("http://127.0.0.1:8000/api/run", json={"code": code, "stdin": "", "language": "cpp", "maxSteps": 250})
data = resp.json()
print("SUCCESS:", data.get("success"))
print("TOTAL STEPS:", data.get("totalSteps"))
print("STDOUT:", repr(data.get("stdout")))
print("STDERR:", repr(data.get("stderr")))
print("RUN_ERR:", repr(data.get("runtimeError")))
for ev in data.get("events", []):
    print(f"Step {ev['step']:02d} (Line {ev['line']:02d}) [{ev['eventType']}]: vars={ev['variables']}, ds={ev['dataStructures']}")
