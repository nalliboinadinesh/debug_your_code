import os
import subprocess
import tempfile
import uuid
from typing import Tuple, Optional

def windows_to_wsl_path(win_path: str) -> str:
    """Converts a Windows file path to a WSL mount path."""
    win_path = os.path.abspath(win_path)
    drive = win_path[0].lower()
    rest = win_path[2:].replace("\\", "/")
    return f"/mnt/{drive}{rest}"

class CppCompiler:
    def __init__(self, timeout_sec: int = 10):
        self.timeout_sec = timeout_sec

    def compile(self, code: str, work_dir: str) -> Tuple[bool, Optional[str], Optional[str], str]:
        """
        Compiles C++ code with debug symbols (-g3 -O0).
        Returns: (success, binary_wsl_path, error_message, source_wsl_path)
        """
        src_name = f"solution_{uuid.uuid4().hex[:8]}.cpp"
        bin_name = f"bin_{uuid.uuid4().hex[:8]}"
        
        src_win_path = os.path.join(work_dir, src_name)
        with open(src_win_path, "w", encoding="utf-8") as f:
            f.write(code)
            
        src_wsl = windows_to_wsl_path(src_win_path)
        bin_wsl = f"/tmp/{bin_name}"
        
        cmd = [
            "wsl", "-d", "Ubuntu", "bash", "-c",
            f"g++ -g3 -O0 -std=c++17 '{src_wsl}' -o '{bin_wsl}'"
        ]
        
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=self.timeout_sec)
            if res.returncode != 0:
                err = res.stderr.strip() or res.stdout.strip()
                # Clean up WSL path in error messages to make it look clean
                err_cleaned = err.replace(src_wsl, "solution.cpp")
                return False, None, err_cleaned, src_wsl
            return True, bin_wsl, None, src_wsl
        except subprocess.TimeoutExpired:
            return False, None, f"Compilation timed out after {self.timeout_sec}s.", src_wsl
        except Exception as e:
            return False, None, f"Compilation failed: {str(e)}", src_wsl
