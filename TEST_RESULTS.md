# Verification results — FAST-1C

- `npm ci`: PASS; package and lockfile unchanged.
- `npm test`: **41 PASS**, 0 failures; original 39 retained.
- `npm run check`: PASS.
- `npm run verify-source`: SOURCE_INTEGRITY_PASS; A/B byte comparison passed.
- `npm run build`: PASS; existing SDK chunk size advisory remains.
- Built-product Chromium: complete tutorial and actual formal empty-state/draft-form flow PASS at 1440, 768 and 390 pixels.
- Drag/drop, tap, replacement/removal, skip, reveal, flip, lineage, completion/reload, reopening, keyboard and reduced motion: PASS.
- Mobile-emulated actual touch swipe: PASS.
- Document overflow and page errors: none in captured flows.
- New entry isolation and active real-operation guard: covered by two additional tests.
- Live wallet signing, chain writes and deployed-contract E2E: **NOT RUN LIVE**.

Tests: domain 16; SDK adapter 9; real UI 7; local tutorial 9. SDK replies in unit tests are mocked. Browser captures show actual production-built components with no live transaction. See `qa/browser-results.json`, `qa/visual-checks.json` and [FAST_1C_REPORT.md](FAST_1C_REPORT.md).

Source SHA256: `cf1a92bd0956baf2cad0f54a7d8a677c312156fa9f54188b51a5b240190ffe8e`. A canonical and B copy retain Git blob `285809944688e377cf1714d30bd50aa65a6454a6`. Contract, chain adapter, config, SDK and network settings unchanged.

Production sizes: CSS 41.21 kB / 9.57 kB gzip; app 228.78 kB / 72.21 kB gzip; SDK 534.92 kB / 116.21 kB gzip. No new dependency.

Frame interval observations are headless Chromium measurements with GPU disabled, not a stable 60fps claim. Physical devices and Safari/Firefox were not tested. Private screenshot package includes actual old/new home and tutorial comparisons. No screenshot is added to the public repository.
