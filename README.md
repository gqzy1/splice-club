# SPLICE.CLUB

A playful collaborative idea-fusion club on GenLayer. Two seeds from different wallet contributors become a new AI-proposed creation after independent validator review. The accepted work keeps its complete parent lineage.

[Open the club](https://gqzy1.github.io/splice-club/) · [Verified Onchain Example — no wallet](https://gqzy1.github.io/splice-club/?w=1) · [Contract Explorer](https://explorer-studio.genlayer.com/address/0x834f53cf56AE590F63cee321eE1A8CE566F3E9c4)

## Try it

1. First visits open a seven-step offline Playground: pick, collide, reveal, flip and explore the local lineage. It uses prewritten deterministic examples, makes no AI calls and sends no transactions.
2. Exit to the club to browse real seeds and fusions, open their descriptions and inspect their roots. `?w=1` skips onboarding, opens real work #3 and blocks wallet connections and writes.
3. LIVE uses the official RPC. If it cannot be read, the UI explicitly shows CAPTURED ONCHAIN EVIDENCE with its timestamp; these records are real historical readbacks, not a current gallery. Wallet writes are disabled in this fallback mode. Refresh retries the official RPC; there is no paid or unofficial proxy.
4. With LIVE reads available, connect an EIP-1193 wallet (OKX is preferred when present). Registration requires an explicit public-derivation checkbox. Select two seeds from different wallet addresses and actively press LET’S SPLICE to request a wallet signature.
5. The result is shown only after finalized majority agreement, successful execution and request-bound saved-work readback. Pending hashes persist across refresh; Recheck performs reads only. An uncertain submission blocks new writes. Account/network changes invalidate the active wallet connection.

## V2 release

Stable Studionet only: **61999**, RPC **https://studio.genlayer.com/api**.

Contract: `0x834f53cf56AE590F63cee321eE1A8CE566F3E9c4`. Official source SHA256: `4a92361b30f2b504ec02e699a816bab78cac47504dafafa9a2ca158c947f07b1`.

Four recorded transactions are finalized; the real AI child is Prismatic Resonator Beetle (#3), from Prism Beetle (#1) and Echo Loom (#2). T04 final-round votes: 3 AGREE, 1 DISAGREE, 1 IDLE. [Real evidence](ONCHAIN_EVIDENCE.md) · [Raw export](evidence/SPLICE_V2_EVIDENCE.json).

The complete official contract is bundled in [intelligent-contract/contracts/creative_fusion.py](intelligent-contract/contracts/creative_fusion.py) and matches [Repository A](https://github.com/gqzy1/splice-fusion-primitive). This release excludes the local deployment/signing operator and temporary diagnostics.

## Development

```sh
npm ci
npm test
npm run check
npm run verify-source
npm run verify-evidence
npm run build
```

React 19 / TypeScript / Vite / genlayer-js 1.1.8. GitHub Pages serves the production build from the existing `gh-pages` branch. [Usage](DEMO.md) · [Tests and limitations](TEST_RESULTS.md) · [Projects submission](SUBMISSION_PROJECTS.md). MIT License.

## Scope and limitations

Distinct wallet addresses do not prove distinct people. Contribution records make no legal IP claim. V2 fuses depth-zero seeds only. No token, marketplace or royalties. Generated content is model-dependent; one accepted example does not establish universal semantic accuracy or injection resistance. Human review is disclosed separately from validator consensus. Exact GenVM node binary version remains unverified. The four evidence receipts reported zero fees; future nonzero fees stop signing. This release does not re-run real wallet transactions.
