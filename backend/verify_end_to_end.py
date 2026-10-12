import httpx
import json

with open("test_run_bs.py") as f:
    import test_run_bs
    code = test_run_bs.code

client = httpx.Client(timeout=45)

print("=== 1. EXECUTION & TRACING ===")
resp = client.post("http://127.0.0.1:8000/api/run", json={"code": code, "stdin": "", "language": "cpp", "maxSteps": 250})
assert resp.status_code == 200, f"Status {resp.status_code}"
data = resp.json()
print("SUCCESS:", data["success"])
print("TOTAL STEPS:", data["totalSteps"])
print("DETECTED:", data["detectedStructures"])
print("STDOUT:", data["stdout"].strip())

print("\n=== 2. VISUALIZATION PLAN (STAGE 3) ===")
vp = data.get("visualizationPlan")
assert vp is not None, "Missing visualizationPlan!"
print("PRIMARY VIZ:", vp["primaryVisualization"])
print("OBJECTS:", [(o["id"], o["kind"], o["label"]) for o in vp["objects"]])
print("TOTAL ACTIONS:", len(vp["actions"]))
sample_act = vp["actions"][11]
print(f"SAMPLE ACTION Step {sample_act['step']}: [{sample_act['action']}] target={sample_act['targetId']} -> {sample_act['explanation']}")

print("\n=== 3. AI TUTOR (LOCAL GEMMA 4 via OLLAMA) ===")
sample_ev = data["events"][11]
ai_req = {
    "context": {
        "code": code,
        "currentStep": sample_ev["step"],
        "totalSteps": data["totalSteps"],
        "currentLine": sample_ev["line"],
        "currentVariables": sample_ev["variables"],
        "currentEvent": sample_ev
    },
    "question": "Why is mid calculated as low + (high - low) / 2 instead of (low + high) / 2?",
    "model": "gemma-4"
}
ai_resp = client.post("http://127.0.0.1:8000/api/ai/explain", json=ai_req)
print("AI STATUS:", ai_resp.status_code)
ai_data = ai_resp.json()
print("MODEL USED:", ai_data.get("modelUsed"))
print("EXPLANATION:\n", ai_data.get("explanation"))
