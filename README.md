# SPLICE.CLUB

**Your idea. Their idea. Weird chemistry.**

A playful collaborative idea-fusion playground on GenLayer. Two wallet contributors publish fictional creative seeds, anyone combines them, native AI consensus checks the proposed fusion, and accepted work keeps its roots.

**Current status: predeployment MVP.** The app contains real Stable network read/write integration, but its contract address is intentionally null. No simulated creations are presented as onchain data. The gallery is honestly empty until deployment. The public demo at `?w=1` is explicitly **NOT YET VERIFIED**.

## Play

First visits open a seven-step **OFFCHAIN PLAYGROUND TUTORIAL**. Pick or drag local ingredients, replace/remove them, activate the machine, flip a creation and explore its clickable lineage. Skip at any time; HOW TO PLAY restarts it. Completion or skipping is remembered locally. Animation takes 2.2 seconds and can be skipped; reduced-motion users reveal immediately.

Local objects have a separate type, state and drag payload. They never enter gallery, transaction, history or contribution data. No wallet, model request, consensus or onchain registration occurs in the tutorial. The direct `?w=1` route preserves the existing verified-read entry rather than forcing the introduction.


- **Playground:** drag a seed into the mix, or tap “Splice me” on touch devices. Choose two seeds from different creators. Remove or replace selections.
- **Gallery:** wallet-free public reads, seed/fusion views, lightweight category filters, pagination, refresh and details.
- **Creation cards:** deterministic CSS/SVG glyphs, vivid palettes, IDs, text, contributor identity and features. These visuals are decorative identity patterns, not AI-generated images or onchain image assets.
- **Reveal:** a saved work is revealed only after FINALIZED + MAJORITY_AGREE + successful execution and a matching contract readback.
- **Lineage:** real parent IDs, creator addresses, public permission, version and input hash; clickable parent details and SVG convergence.
- **Seed form:** validated text, categories and explicit public derivation permission. Content is public; there is no legal ownership certification.

Ivory, acid lime, punch orange and cobalt blue form a typographic creative toy. Responsive cards, native modal dialogs, keyboard buttons, focus outlines, click alternatives to dragging and reduced-motion support are included. No large 3D library, paid API or paid server is required.

## Develop

```sh
npm ci
npm test
npm run check
npm run verify-source
npm run build
npm run dev
```

React 19, TypeScript, Vite, CSS/SVG, `genlayer-js` **1.1.8**. The production build targets `/splice-club/` for later GitHub Pages publication. No deployment workflow runs automatically.

## Real chain paths

`src/chain.ts` uses an account-free public client for `list_works`, `get_work`, `get_lineage`, `get_request` and transaction status. Browser writes use an EIP-1193 provider, actual account and the official `studionet` preset. Reads and writes bind to **61999**, **https://studio.genlayer.com/api**. Network and account are rechecked immediately before submission. Wallet changes invalidate the connected session.

Only `create_seed` and `fuse` are submitted through `writeContract` with `leaderOnly:false`. No paid offchain model call exists. SDK 1.1.8 owns transaction encoding and gas estimation; there is no obsolete fee-config RPC call. Funding, wallet UX and actual estimation/submission are NOT RUN LIVE.

The transaction hash and request ID survive reload in browser local storage. A pending transaction blocks another write; “Recheck saved transaction” performs reads only. Timeout/read errors retain the pending hash and never automatically resubmit. Finalized contract errors are shown separately from consensus failure. A successful receipt alone is insufficient: the saved work must match the caller, operation and canonical parents.

## Contract completeness

`intelligent-contract/contracts/creative_fusion.py` is the complete byte-identical official source from the companion primitive repository. [SOURCE_SHA256.txt](SOURCE_SHA256.txt) pins its digest, and `npm run verify-source` verifies both the manifest and bytes. It also compares Repository A directly when the two checkouts are siblings.

## Deployment activation (requires separate authorization)

After a real deployment and successful example, update `src/config.ts` with the real contract address, status and verified work ID. Keep source digest exact and archive real evidence first. Run the checks, browser/wallet acceptance, build and publish only within the newly authorized phase. No fake address or transaction is used to make the UI look active.

The read-only compatibility diagnostic is `node scripts/check-stable.mjs`. It submits no transaction and uses no wallet. Its current response is archived in [STABLE_COMPATIBILITY.json](STABLE_COMPATIBILITY.json).

Current visual identity and browser acceptance: [FAST_1C_REPORT.md](FAST_1C_REPORT.md). The Hyperpop Creative Lab puts the working reactor in the immersive hero, with local-study entry cards, chromatic material, a collectible shelf and an interactive lineage room. The earlier [FAST_1B_REPORT.md](FAST_1B_REPORT.md) remains the historical functional checkpoint.

See [DEMO.md](DEMO.md), [TEST_RESULTS.md](TEST_RESULTS.md), [SOURCE_PROVENANCE.md](SOURCE_PROVENANCE.md) and [intelligent-contract/DEPLOYMENT_MANIFEST_STUDIONET.md](intelligent-contract/DEPLOYMENT_MANIFEST_STUDIONET.md). MIT License.
