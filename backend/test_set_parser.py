import re

# Test the parse logic on sample strings
def parse_set_str(v_str):
    s = str(v_str)
    if "with 0 elements" in s or "<error reading" in s:
        return []
    m = re.search(r"with\s+(\d+)\s+elements?", s)
    if m and int(m.group(1)) > 500:
        return []
    if "{" in s and "}" in s:
        body = s[s.find("{") + 1 : s.rfind("}")]
        vals = re.findall(r"=\s*([-\d]+)", body)
        if vals:
            return [int(val) for val in vals[:50]]
        items = [x.strip() for x in body.split(",") if x.strip()]
        parsed = []
        for it in items[:50]:
            if it.isdigit() or (it.startswith('-') and it[1:].isdigit()):
                parsed.append(int(it))
        return parsed
    return []

test_cases = [
    "std::unordered_set with 0 elements",
    "std::unordered_set with 1 element = {[0] = 10}",
    "std::unordered_set with 2 elements = {[0] = 20, [1] = 10}",
    "std::unordered_set with 5 elements = {[0] = 50, [1] = 40, [2] = 30, [3] = 20, [4] = 10}",
    "std::unordered_set with 93824992237073 elements = {[0] = 1431655979, [1] = 1431665373<error reading variable: Cannot access memory at address 0x2>...}"
]

for tc in test_cases:
    print(f"INPUT: {tc[:50]}...")
    print(f"OUTPUT: {parse_set_str(tc)}\n")
