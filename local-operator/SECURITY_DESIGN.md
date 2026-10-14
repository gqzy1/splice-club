# FAST-2C security design

## Scope and boundaries

Standalone local-only React/Vite UI under Repository B. No root UI/config/contract changes. `main`, `gh-pages`, Repository A and PR #1–#3 remain untouched. Network fixed to 61999 and official RPC. No deployment, signing or live RPC POST is performed by development or QA.

## Exact SDK, isolated construction

Installed genlayer-js **1.1.8** is the API/encoding authority. `construct()` calls its actual `deployContract({code,args:[],leaderOnly:false})` or `writeContract({address,functionName,args,value:0n,leaderOnly:false})`. A capture-only EIP-1193 provider intercepts `eth_sendTransaction` and throws `OPERATOR_BUILD_ONLY_CAPTURED`. No real wallet provider is supplied to the SDK. No successful response/hash is fabricated. Any SDK gas fallback or ABI fallback cannot reach a wallet.

The operator uses that exact captured primary envelope for review. Before actual signing it constructs again, compares immutable from/to/data/value/chain and args, checks source SHA, fresh wallet/direct chain, accounts, balance, gasPrice, full from/to/data/value gas estimates and nonce. No fixed gas fallback exists in the sending path. One direct `eth_sendTransaction` call on the explicitly selected OKX provider sends the reviewed SDK envelope with type=legacy, chainId=0xf22f, value=0x0 and gasPrice=0x0. SDK fallback is never used for sending. The external SDK consensus contract address is checked against the pinned chain configuration; no fake target contract is used to deploy.

## Budget and recovery

Each T01–T04 has at most one signing attempt. Refusal is terminal and consumes that stage's attempt despite no broadcast. Persistent intent is saved and read back before signing. Hash is saved before any result polling. Missing Hash is UNKNOWN, never retried. A returned Hash is included in the visible error if post-send storage fails; the earlier intent persists. No reset function or automatic retry exists.

Chrome Web Locks (exclusive/ifAvailable) span each prepare, send, state mutation and readback operation; a stale second tab must reload durable state inside the lock. Pending intent/Hash, failed stage or halt prevents the next signing operation. Locks are origin/profile-scoped: clearing storage, altering code, using another Chrome profile/origin or deleting package state defeats local safeguards and requires manual reconciliation. This is documented rather than claimed as an absolute tamper-proof chain budget.

After refresh the UI loads stored state and never calls send/authorization automatically. Account events and polling reread the selected provider; every signature repeats chain and account checks. A/B/A is enforced by addresses, not a UI label. Read-only errors retain a hold. Only successful complete revalidation of a known submitted Hash can clear a read-only hold; a consensus failure/nonzero fee hard stop cannot be cleared by a later read.

## Real verification

Raw eth_getTransactionByHash is saved before parsing. Require matching hash, sender, nonce, value=0, leader_only=false and the exact constructor/call calldata captured from the SDK envelope. Preserve raw field names; recognize Stable result_name/result and execution field forms only when explicit. Require FINALIZED + MAJORITY_AGREE + successful execution. SDK getTransaction must also read successfully; Gas receipt must match Hash and explicit effectiveGasPrice/gasUsed must prove zero gas fee; reported fee deposits/userValue must be zero when present.

Deployment address comes from transaction recipient/to_address and is checked against any receipt address. Base64 deployed source bytes must match frozen SHA; total() must be 0. T02/T03 use get_request(actual creator, saved request_id), then exact work input/creator/depth/license/fingerprint comparison. T04 uses stored readback IDs, get_request/get_work/get_lineage; verifies distinct creators, sorted parents, canonical Python-compatible ensure_ascii JSON SHA256 parent/input hashes, fingerprint, output shape, total=3, and list_works membership. No tutorial data is imported.

No software keyword check can establish the intended creative mechanism by itself. After all objective checks, the user compares actual source features with real output, confirms three explicit semantic checks locally, optionally records exact description/feature excerpts for each parent and the interaction. Export distinguishes this human semantic review from onchain consensus and includes the actual evidence.

## Local host and data

Static server binds 127.0.0.1:4179 only; rejects other Host/Origin and non-GET/HEAD requests, prevents traversal, sends CSP, no-store and no-referrer. No write/proxy/upload HTTP endpoint. Only fixed official RPC is allowed as browser outbound connection. SDK contains its own network constants for other chains but no runtime path selects them. No analytics, external fonts, CDN or telemetry is added. Browser extensions operate outside the page CSP.

The operator persists/exports only public addresses, request payloads and received transaction data. There are no credential inputs, wallet secret APIs, wallet-state file reads or private-key account constructors. JSON exports remain in browser downloads. Export recursively redacts credential-key fields from any unexpected RPC metadata (API keys, private keys, mnemonic/password/authorization/token fields); raw public transaction evidence is retained. RPC receives necessary public accounts and call parameters; this is required network use, not an evidence upload service. Tests use clearly labeled synthetic data and are excluded from the production JS.

## Compatibility and provenance

- OKX namespace/isOkxWallet and explicit connect: https://web3.okx.com/zh-hans/onchainos/dev-docs/wallet/dapp-connect/web-detect-okx-wallet
- EVM provider methods: https://web3.okx.com/zh-hans/onchainos/dev-docs/wallet/dapp-connect/chains/evm/provider
- Discovery standard: https://eips.ethereum.org/EIPS/eip-6963
- Fixed SDK API: installed package-lock and genlayer-js 1.1.8 dist implementation.
- Stable response structure checked against official source https://github.com/genlayerlabs/genlayer-studio/tree/c94072951e483510329670aa427fba3fa6944f45/backend/database_handler and protocol_rpc/endpoints.py. This is reference-code inspection, not proof that deployed nodes run that commit; unknown live fields stop verification.

EIP-6963 metadata and isOkxWallet are self-reported identifiers, not cryptographic attestation of an extension. User explicitly selects/confirms OKX and checks the real extension dialog. EIP-1193 cannot introspect the wallet's configured RPC URL. Adding/switching uses only fixed official parameters and live chain/read checks; user can inspect the wallet's network settings.

Live Windows Chrome/OKX interoperability, live CORS/RPC reachability, live signature and live terminal fields/AI consensus remain NOT RUN LIVE. A Linux headless mocked browser run cannot certify the Windows shell or a real OKX extension. No compatibility issue is bypassed by switching networks, RPCs or signers.
