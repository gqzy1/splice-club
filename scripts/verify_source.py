from pathlib import Path
import hashlib
root = Path(__file__).resolve().parents[1]
copy = root / "intelligent-contract/contracts/creative_fusion.py"
expected = (root / "SOURCE_SHA256.txt").read_text().split()[0]
actual = hashlib.sha256(copy.read_bytes()).hexdigest()
assert actual == expected, f"Source integrity mismatch: {actual}"
canonical = root.parent / "splice-fusion-primitive/contracts/creative_fusion.py"
if canonical.exists():
    assert canonical.read_bytes() == copy.read_bytes(), "A/B source mismatch"
assert actual in (root / "src/config.ts").read_text(), "Frontend manifest mismatch"
print("SOURCE_INTEGRITY_PASS " + actual)
