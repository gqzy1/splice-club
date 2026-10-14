# FAST-2C verification results

Run date: 2026-10-14. **MOCK PASS / NOT RUN LIVE**. No transaction, deployment, wallet signature or live Stable RPC POST occurred during this work.

- Operator Vitest: **43/43 PASS**, actual installed genlayer-js 1.1.8 exercised with intercepted mock RPC.
- Operator TypeScript check: PASS.
- Operator production Vite build: PASS. SDK chunk size warning ~535 kB remains; no functionality failure.
- Existing SPLICE.CLUB Vitest: **45/45 PASS**; existing TypeScript check PASS.
- Clean standalone `npm ci --ignore-scripts`: PASS from supplied lockfile (371 packages). No install hook required.
- Frozen A/B/operator canonical contract: byte-identical; 9594 bytes each; SHA256 `cf1a92bd0956baf2cad0f54a7d8a677c312156fa9f54188b51a5b240190ffe8e`.
- Browser: isolated Chromium 138 / Playwright environment, fully mocked wallet and RPC. Complete T01→T04, A→B→A, returned seed IDs 11/27 and child 42 (synthetic test values), semantic check, refresh recovery, local download export. No page errors; desktop/mobile 390 px DOM fits viewport. No real provider used. See `BROWSER_MOCK_RESULTS.json`.
- Local Node static server: actual GET=200, POST=403, foreign Origin=403, foreign Host=403; fixed loopback listener. These are local HTTP checks, not chain verification.
- Windows `.cmd` reviewed with explicit quoted paths, Node gate, error checks, lockfile installation, local static start and Chrome discovery. **NOT RUN ON WINDOWS** in this Linux environment.

| Required safety property | Verified by |
|---|---|
| Explicit OKX / multiple injected wallets | unit discovery/connect tests + competing MetaMask browser mock that throws if selected |
| B != A and A→B→A | unit stage guard + full mocked browser flow |
| Wrong chain disables send | wallet checks, pre-send checks and stage/fee tests |
| Estimate failure blocks send | real SDK construction + sending-boundary test; observed 0 real/provider sends |
| Nonzero fee/value blocks | prepare/send fee-change and value tests |
| Rejection never retries | rejection test, one provider call, permanent stop |
| Sent transaction cannot duplicate | same engine and fresh engine tests, durable state |
| RPC unknown stops next write | saved Hash + hold + unknown/pending tests |
| Exact deploy source | WebCrypto hash, SDK envelope decoding, actual A/B/operator byte comparison |
| Exact T02/T03 inputs | SDK argument tests and browser readback |
| T04 actual IDs | unit 11/27 and browser child 42; no production default IDs |
| Read failure is not success | failed readback test |
| Refresh preserves progress | fresh Store/engine test + browser reload with no sends |
| Failed consensus stores no mock work | explicit disagreement test |
| No secrets exported | no credential inputs; recursive credential-key redaction test |
| Storage failure before/after send | pre-send 0 calls; post-send visible Hash + retained intent |
| Cross-tab lock | held-lock rejection unit test; every UI mutation rechecks state within Web Lock |
| Exact lineage/hashes/semantic gate | Unicode canonical hashing test, parent/input hashes and explicit human check in browser |

## Evidence labels

**MOCK PASS**: these tests. Synthetic wallets, Hashes and works remain test-only. Browser fixtures never ship as a success export.

**LOCAL READ-ONLY VERIFIED**: only the local host's static serving and HTTP access boundaries, plus file integrity. No live chain read was performed in this phase.

**NOT RUN LIVE**: Windows shell execution; Windows Chrome extension injection; real OKX authorization/account switching/signing; local CORS/HTTP403 behavior against Stable; live gas; actual deployed address; actual consensus/AI result; get_work/get_lineage and real fees.

**REAL ONCHAIN VERIFIED**: not achieved during development. The UI may show it only after all four real stage readbacks, exact lineage/hashes/fees and the user's semantic comparison pass.

Tests do not certify behavior after manually deleting storage, editing code/state, using another origin/profile, or overriding the wallet dialog's transaction parameters.
