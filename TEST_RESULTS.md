# Verification results

- Offline tests: **30 PASS**, 0 failures.
- Real onchain E2E: **NOT RUN LIVE**.
- LLM replies and consensus: **SIMULATED / MOCKED** in tests.
- Stable Studionet schema: **READ_ONLY_SCHEMA_PASS**, chain ID 61999.
- A/B complete contract bytes and frontend manifest: **SOURCE_INTEGRITY_PASS**.

Commands: `npm test`, `npm run check`, `npm run verify-source`, `npm run build`. All passed.

- Domain: 16 tests.
- SDK adapter and wallet/error/readback guards: 9 tests.
- React interaction and honest predeployment UX: 5 tests.

Actual production adapter code is exercised against mocked SDK responses; chain writes were not sent. Click and drag selection use the same bounded pair path; their React handlers are exercised. Mobile viewport rendering, real pointer gestures, real wallet signing and browser visual QA are NOT RUN.

Production assets: CSS about 12.59 kB (3.49 kB gzip), app about 210 kB (66.76 kB gzip), SDK about 535 kB (116.21 kB gzip). Vite reports an advisory >500 kB SDK chunk warning; build succeeds. No heavy 3D or image API dependencies.

The supported control-browser skill was unavailable in this environment; browser QA was skipped under the Sites workflow rules. No substitute screenshot or invented visual PASS is claimed.
