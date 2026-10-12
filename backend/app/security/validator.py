import re
from typing import Tuple, List

FORBIDDEN_PATTERNS = [
    (r"#\s*include\s*<sys/socket\.h>", "Network socket includes are restricted"),
    (r"#\s*include\s*<netinet/.*>", "Network headers are restricted"),
    (r"#\s*include\s*<arpa/.*>", "Network headers are restricted"),
    (r"#\s*include\s*<windows\.h>", "Platform-specific Windows API is not allowed in isolated runner"),
    (r"\b(fork|vfork|clone)\s*\(", "Process creation (fork/clone) is restricted"),
    (r"\b(execve|execl|execvp|execlp)\s*\(", "Process replacement (exec) is restricted"),
    (r"\bsystem\s*\(\s*\"[^\"]*\"\s*\)", "Direct system shell commands are restricted"),
    (r"\b(kill|ptrace)\s*\(", "Signal/process injection calls are restricted"),
]

MAX_CODE_LENGTH = 30000
MAX_STDIN_LENGTH = 10000

def validate_cpp_submission(code: str, stdin: str = "") -> Tuple[bool, List[str]]:
    errors = []
    
    if not code or not code.strip():
        errors.append("Source code cannot be empty.")
        return False, errors
        
    if len(code) > MAX_CODE_LENGTH:
        errors.append(f"Source code exceeds maximum allowed size ({MAX_CODE_LENGTH} characters).")
        
    if len(stdin) > MAX_STDIN_LENGTH:
        errors.append(f"Input stdin exceeds maximum allowed size ({MAX_STDIN_LENGTH} characters).")
        
    # Check forbidden patterns
    for pattern, reason in FORBIDDEN_PATTERNS:
        if re.search(pattern, code, re.IGNORECASE):
            errors.append(f"Security restriction: {reason}.")
            
    return len(errors) == 0, errors
