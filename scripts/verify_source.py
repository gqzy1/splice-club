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
v1 = root / "intelligent-contract/archive/v1/creative_fusion.py"
v1_sha = hashlib.sha256(v1.read_bytes()).hexdigest()
assert v1_sha in (root / "src/config.ts").read_text(), "Preserved V1 preview identity mismatch"
operator = root / "local-operator-v2/contracts/creative_fusion.py"
assert operator.read_bytes() == copy.read_bytes(), "V2 operator source mismatch"
print("SOURCE_INTEGRITY_PASS " + actual)
