from pathlib import Path
import hashlib
root = Path(__file__).resolve().parents[1]
copy = root / "intelligent-contract/contracts/creative_fusion.py"
expected = "4a92361b30f2b504ec02e699a816bab78cac47504dafafa9a2ca158c947f07b1"
assert (root / "SOURCE_SHA256.txt").read_text().split()[0] == expected
assert hashlib.sha256(copy.read_bytes()).hexdigest() == expected
assert expected in (root / "src/config.ts").read_text()
canonical = root.parent / "repo-a/contracts/creative_fusion.py"
if canonical.exists(): assert canonical.read_bytes() == copy.read_bytes(), "A/B source mismatch"
print("SOURCE_INTEGRITY_PASS " + expected)
