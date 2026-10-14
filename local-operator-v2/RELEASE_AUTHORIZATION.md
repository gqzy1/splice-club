# FAST-2G local signing authorization

This release authorizes only four individually initiated, human-confirmed OKX attempts on Stable Studionet 61999: T01 new V2 deployment by A, T02 seed by A, T03 seed by a different B, and T04 fusion by the original A. Failures consume their stage. No retry, appeal, fifth transaction, automatic signing or cloud signing is allowed. Stop on rejection, error, unknown broadcast/result, fee-estimation failure or any nonzero fee/value.

The sole deployable source is SPLICE-V2, SHA256 `4a92361b30f2b504ec02e699a816bab78cac47504dafafa9a2ca158c947f07b1`. Constructor args are empty and leaderOnly is false. All writes require explicit user clicks and wallet confirmation. The release itself has not executed any real transaction.

Use only http://127.0.0.1:4180, the existing V2 storage namespace and original execution records. Never clear progress, switch profiles/ports or copy an existing run to reset the budget. Existing intents, hashes or deployment addresses require read-only recovery. V1 source, address, seeds and request IDs must not be reused.

No main merge, public site update or Portal submission is authorized. Evidence downloads locally and is not uploaded automatically. Real fusion requires FINALIZED plus MAJORITY_AGREE, successful execution, zero actual fee, verified source/work/lineage/hash readbacks and a separately recorded human comparison.
