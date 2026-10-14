# FAST-2G release validation — 2026-10-14

- TypeScript: PASS (`npm run check`).
- Vitest: **55 PASS**, four files; MOCK/DOM only. Production authorized config used by engine tests; separate false-config test retains prepare/submit lock regression.
- Fresh Vite production build: PASS. No pre-existing dist used. One SDK chunk-size advisory is informational.
- Canonical A/B/operator V2 source: byte-identical, SHA256 `4a92361b30f2b504ec02e699a816bab78cac47504dafafa9a2ca158c947f07b1`.
- Local HTTP: GET 200; POST, external Origin and wrong Host 403; no-store and CSP retained.
- Extracted copy: mandatory manifest/source verification, actual server startup and all four served build-file digests PASS. Authorized UI marker present; obsolete locked UI marker absent.
- Failure injection: missing manifest, missing dist, altered dist and altered config rejected. Occupied 4180 stops a second server. No alternate port or automatic rebuild.
- Windows startup: CRLF, Node version check, locked dependency installation with scripts disabled, no automatic deployment/signature, fixed Chrome URL reviewed. Native Windows execution NOT RUN (Linux host).
- Browser: **BLOCKED / NOT VERIFIED**. Playwright Chromium install returned truncated archives. No real-browser claim is made from DOM or HTTP tests.
- Real OKX: **NOT RUN**. Real V2 onchain deployment/consensus: **NOT RUN**. The release contains no fabricated deployment or successful transaction.
- Prior FAST-2F evidence reused unchanged: 41 contract tests MOCK; 30 parser/reference assertions GENVM VERIFIED at pinned v0.2.16 read-only schema stage; not a new real-model or multi-validator verification.

## Guard coverage

The 55 tests retain exact SDK source/deploy/call construction, empty constructor and leaderOnly=false; unique IDs and verified actual parent IDs; selected OKX and A→B→original A; bad chain/value/price/estimate/nonce rejection; intent-before-send; single send; missing Hash/rejection/storage errors fail closed; refreshed state recovery; corrupt-state rejection; Web Locks contention; failure and unknown consensus not accepted; finalized deployment/source/fee/readback verification; lineage and hashes; local evidence redaction and NOT RUN export; V1 source/address/work isolation. New tests additionally exercise the actual authorized UI readiness and account/network invalidation, direct non-OKX engine rejection, changed pending nonce, preserved unknown V2 intent and all-four-slots-spent reload.

No reset-progress UI exists. Local storage/Web Locks protect against accidental repeated sends within the same origin/profile, not intentional deletion or forged storage. Clearing records, profiles or ports to gain another budget is prohibited and requires investigation. No claim of a tamper-proof global transaction quota is made.
