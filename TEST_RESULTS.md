# Verification results — FAST-1B

- `npm ci`: PASS (locked dependencies; no package changes).
- `npm test`: **39 PASS**, 0 failures across four test files.
- `npm run check`: PASS.
- `npm run verify-source`: SOURCE_INTEGRITY_PASS.
- `npm run build`: PASS; existing SDK chunk size advisory remains.
- Production-preview browser acceptance: PASS at 1440, 768 and 390 pixels.
- Actual desktop HTML drag/drop, mobile-emulated touch/click, replacement/removal, reveal, card flip, clickable lineage, completion/reload, reopening, seed drafting, keyboard and reduced motion: PASS.
- Document horizontal overflow: none in the inspected views. Browser page errors: none.
- Real wallet signing, chain writes and deployed-contract E2E: **NOT RUN LIVE**.

Tests: domain 16; SDK adapter 9; real UI guards 5; local tutorial 9. SDK responses in unit tests are mocked. Browser acceptance uses actual production-built React/CSS/SVG, with no wallet or chain transaction. See [qa/browser-results.json](qa/browser-results.json) for runtime observations, [FAST_1B_REPORT.md](FAST_1B_REPORT.md) for screenshots and limits.

Contract source remains `cf1a92bd0956baf2cad0f54a7d8a677c312156fa9f54188b51a5b240190ffe8e`. Repository A canonical source and Repository B copy share Git blob `285809944688e377cf1714d30bd50aa65a6454a6`.

Production sizes: CSS ~28.75 kB / 6.88 kB gzip; app ~225 kB / 71.3 kB gzip; SDK ~534.92 kB / 116.21 kB gzip. No animation/3D dependency was added.
