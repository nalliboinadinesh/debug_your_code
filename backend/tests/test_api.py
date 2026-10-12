import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "cpp" in data["supported_languages"]

def test_execute_array_loop():
    code = """#include <iostream>
int main() {
    int arr[3] = {10, 20, 30};
    int total = 0;
    for (int i = 0; i < 3; i++) {
        total += arr[i];
    }
    std::cout << total << std::endl;
    return 0;
}
"""
    response = client.post("/api/run", json={"code": code})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["totalSteps"] > 0
    assert len(data["events"]) > 0
    # Verify array and variable state
    has_total_update = any("total" in e["variables"] for e in data["events"])
    assert has_total_update

def test_complexity_linear_increment_stride():
    code_1 = """#include <iostream>
int main() {
    int arr[10];
    for (int i = 0; i < 10; i++) {
        arr[i] = i;
    }
    return 0;
}
"""
    res1 = client.post("/api/analyze", json={"code": code_1})
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["timeComplexity"]["worstCase"] == "O(N)"
    assert data1["timeComplexity"]["dominantTerm"] == "N"

    # Now with i += 2
    code_2 = """#include <iostream>
int main() {
    int arr[10];
    for (int i = 0; i < 10; i += 2) {
        arr[i] = i;
    }
    return 0;
}
"""
    res2 = client.post("/api/analyze", json={"code": code_2})
    assert res2.status_code == 200
    data2 = res2.json()
    # Asymptotic order is STILL O(N), but derivation mentions step stride 2 and ceil(N / 2)
    assert data2["timeComplexity"]["worstCase"] == "O(N)"
    assert "2" in data2["timeComplexity"]["stepFormula"]
