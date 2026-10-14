# FAST-2D bounded incident diagnosis

**Decision: NOT VERIFIED. CANDIDATE ONLY — NOT DEPLOYED.**

No transaction, signature, retry, appeal, deployment or production-source change is included.
The original private evidence export is intentionally absent. The summary and fixture are allowlisted extracts;
node configurations, signed transaction envelopes and user wallet inventory are not published.

From the repository root, using only Python's standard library:

```sh
python3 diagnostics/fast-2d/extract_evidence.py /absolute/path/to/SPLICE_FAST2C_EVIDENCE_2026-10-14T08-46-14-910Z.json --output diagnostics/fast-2d
python3 diagnostics/fast-2d/build_candidate.py
python3 diagnostics/fast-2d/test_incident.py
```

The first command requires the original export and verifies its SHA256 plus deployed code bytes.
The committed minimized fixture lets the last two commands run without that private export.
`creative_fusion_candidate.py` is a generated experimental listing, not an approved deployment artifact.
`candidate.diff` shows only the proposed helper, parser substitutions and prompt clarification.
Tests use local CPython and SDK stubs. They do not execute GenVM, query an LLM or prove real consensus.
See `SPLICE_FAST2D_FUSION_ROOT_CAUSE_REPORT.md` for evidence boundaries and recovery choices.
