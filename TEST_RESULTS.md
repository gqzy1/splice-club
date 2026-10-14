# V2 validation

- Frontend: 50/50 Vitest tests passed, including existing tutorial/input/recovery guards and regressions against all four real V2 receipt shapes, current execution errors, V1 rejection, wallet-free read-only entry and labelled RPC fallback.
- TypeScript, official-source integrity, evidence integrity and production Vite build: PASS.
- A/B complete source copies match frozen SHA256 `4a92361b30f2b504ec02e699a816bab78cac47504dafafa9a2ca158c947f07b1`.
- Contract suite: 41/41 offline SDK/storage tests in Repository A. Model and consensus responses mocked.
- Real read-only SDK recheck: finalized T04 MAJORITY_AGREE / SUCCESS; get_lineage(3), list_works(1,30) returned the captured records.
- Production-build browser checks: desktop 1440px and mobile 390px; seven-step tutorial, reveal/flip, parent inspection, gallery/fusion, reload, wallet-free `?w=1`, and forced RPC failure fallback. No page errors, horizontal overflow or chain-write calls. See `qa/browser-release.json` and reproduce using `scripts/browser-release.cjs`.
- Browser QA uses headless Chromium and mobile emulation, not a physical-device or frame-rate guarantee. Browser RPC outcomes are recorded explicitly. Existing real E2E came from the separate OKX operator; this release makes no new signatures or transactions.
- Existing SDK minified chunk exceeds 500 kB; build succeeds and this remains a size advisory.

Exact GenVM node binary version remains unverified. Human semantic review is separate from network consensus. Historical zero receipt fees do not guarantee future fees. No universal model accuracy or prompt-injection guarantee is claimed.
