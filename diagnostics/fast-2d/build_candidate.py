"""Build ONE experimental candidate. CANDIDATE ONLY — NOT DEPLOYED.
No SDK changes, no writes, no semantic auto-correction, no production file edits.
"""
import ast, difflib, hashlib
from pathlib import Path
HERE = Path(__file__).resolve().parent
SOURCE = HERE.parents[1]/'intelligent-contract/contracts/creative_fusion.py'
EXPECTED = 'cf1a92bd0956baf2cad0f54a7d8a677c312156fa9f54188b51a5b240190ffe8e'
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == EXPECTED
original = SOURCE.read_text()
helper = '''def strict_model_json(raw: str, maximum: int):
    # CANDIDATE ONLY — NOT DEPLOYED. Whole-document normalization only.
    if not isinstance(raw, str) or len(raw) > maximum or not raw.strip():
        raise ValueError("MODEL_FORMAT_EMPTY_OR_SIZE")
    body = raw.strip()
    if body.startswith("```"):
        lines = body.splitlines()
        if len(lines) < 3 or lines[0] not in ("```json", "```") or lines[-1] != "```":
            raise ValueError("MODEL_FORMAT_FENCE")
        body = "\\n".join(lines[1:-1])
    def unique_pairs(pairs):
        out = {}
        for key, value in pairs:
            if key in out:
                raise ValueError("MODEL_FORMAT_DUPLICATE_KEY")
            out[key] = value
        return out
    def invalid_constant(value):
        raise ValueError("MODEL_FORMAT_NONFINITE")
    try:
        return json.loads(body, object_pairs_hook=unique_pairs, parse_constant=invalid_constant)
    except (ValueError, TypeError):
        raise ValueError("MODEL_FORMAT_INVALID_JSON") from None


'''
updated = original.replace('def parse_candidate(raw: str):', helper+'def parse_candidate(raw: str):', 1)
updated = updated.replace('value = json.loads(raw)', 'value = strict_model_json(raw, 2400)', 1)
updated = updated.replace('v = json.loads(raw)', 'v = strict_model_json(raw, 1800)', 1)
# Add explicit serialization instructions without relaxing any semantic requirement.
updated = updated.replace('Create a fusion from DATA_JSON.', 'Create a fusion from DATA_JSON. Use one JSON object, double-quoted keys and strings, no Markdown, comments, prose, duplicate keys or trailing commas. All fields are required; use strings except features, which is an array. Write a concise causal mechanism where an attribute from one parent changes how an attribute from the other operates.')
updated = updated.replace('Independently read both parents and the candidate.', 'Independently read both parents and the candidate. Output one JSON object with double-quoted keys, JSON true/false booleans, and string evidence. No Markdown, comments, prose, duplicate keys or trailing commas. All seven fields are required, even for a negative verdict.')
# No production SDK call or semantic criterion is changed.
ast.parse(updated)
(HERE/'creative_fusion_candidate.py').write_text('# CANDIDATE ONLY — NOT DEPLOYED\n'+updated)
(HERE/'candidate.diff').write_text(''.join(difflib.unified_diff(original.splitlines(True), updated.splitlines(True), fromfile='canonical/creative_fusion.py', tofile='CANDIDATE_ONLY/creative_fusion.py')))
print('Built isolated syntax/prompt candidate; canonical source untouched.')
