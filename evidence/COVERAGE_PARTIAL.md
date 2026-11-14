# Coverage-style partial delivery

> Version scope: the recorded live results below belong to the previous, untimed contract. They do not validate the timing-protected source. See [TIMING_PROTECTIONS.md](TIMING_PROTECTIONS.md).

[Open this finalized task](https://halihalibt.github.io/task-prism-genlayer/?task=coverage-20261109192338#adjudication).

Contract: `0x0BC304C168D14B8f4928f622e971B532D30d7268` on Stable Studionet, Chain ID 61999. Real testnet GEN (1 GEN = 10^18 wei); no simulated ledger.

## Why this case

Under the strict same-band rule, validators split twice on a two-section delivery and left it stuck SUBMITTED. The relaxed rule (same verdict, at most 10 points per dimension) is mock-tested, and the contract had already finalized a PARTIAL verdict for a five-item support sheet — but it had never been tested live on a two-section delivery where one whole section is absent. This case is that exact shape:

- Specification: two equally important parts. Part 1: local setup guide. Part 2: version 1 to version 2 migration guide.
- Delivery: Part 1 complete (prerequisites, install commands, config example, server-start verification); Part 2 entirely absent.
- Delivery bytes: [fixtures/coverage-partial.txt](https://raw.githubusercontent.com/halihalibt/task-prism-genlayer/f85542e325da306a5bea89b3c976843090372a79/fixtures/coverage-partial.txt), fetched and hashed by validators from a commit-pinned URL (sha256 `63db7fb3bbddc6fa14a68cdffc2cbaea80f96a268e1130b871320d26a56cfe27`).

## Transactions

All transactions below are FINALIZED. The first two evaluation attempts did not reach consensus and wrote no state; the third did.

| Operation | Transaction | Consensus | Execution | Read-back |
| --- | --- | --- | --- | --- |
| `register_agent` | [0x4fdb92e13ac4edc27ba0fbd2a9d6a2d090084f7228db3f8934005b3fab774e32](https://explorer-studio.genlayer.com/tx/0x4fdb92e13ac4edc27ba0fbd2a9d6a2d090084f7228db3f8934005b3fab774e32) | MAJORITY_AGREE | SUCCESS · FINALIZED | stake 1 GEN |
| `post_task` | [0x352e003aead2e4b319ed455278bc4c1bbf7073e6425e67d9f77a92fe19c85900](https://explorer-studio.genlayer.com/tx/0x352e003aead2e4b319ed455278bc4c1bbf7073e6425e67d9f77a92fe19c85900) | MAJORITY_AGREE | SUCCESS · FINALIZED | OPEN |
| `claim_task` | [0xab33925dc7ea7388b62db217bbb41e507d58c889d0601556ad1d9df65a7c8901](https://explorer-studio.genlayer.com/tx/0xab33925dc7ea7388b62db217bbb41e507d58c889d0601556ad1d9df65a7c8901) | MAJORITY_AGREE | SUCCESS · FINALIZED | CLAIMED |
| `submit_delivery` | [0xed5af38802e4198f355f64d0fa37cf19bd92e88461387fa70eddcaf27ec8785f](https://explorer-studio.genlayer.com/tx/0xed5af38802e4198f355f64d0fa37cf19bd92e88461387fa70eddcaf27ec8785f) | MAJORITY_AGREE | SUCCESS · FINALIZED | SUBMITTED |
| `evaluate_delivery` attempt 1 | [0x1b4e6ea1c2595df8d1d68229a2280bb715e8ed291af3ece6790c59132acf8cf5](https://explorer-studio.genlayer.com/tx/0x1b4e6ea1c2595df8d1d68229a2280bb715e8ed291af3ece6790c59132acf8cf5) | MAJORITY_DISAGREE | SUCCESS · FINALIZED | SUBMITTED (unchanged) |
| `evaluate_delivery` attempt 2 | [0xf33b3f6bee60808f659aeeafd3d1189cb26467d650ecd49efb33f94a21236894](https://explorer-studio.genlayer.com/tx/0xf33b3f6bee60808f659aeeafd3d1189cb26467d650ecd49efb33f94a21236894) | MAJORITY_DISAGREE | SUCCESS · FINALIZED | SUBMITTED (unchanged) |
| `evaluate_delivery` attempt 3 | [0x8f41dd65ebdeb592c76394474de6e3f21c98d43eb9cbcfc501b94150b7b0daee](https://explorer-studio.genlayer.com/tx/0x8f41dd65ebdeb592c76394474de6e3f21c98d43eb9cbcfc501b94150b7b0daee) | MAJORITY_AGREE | SUCCESS · FINALIZED | EVALUATING |
| `finalize_delivery` | [0x535f2486b08deb79636d54e74c8c6ad3e455ac67106637fb5d164c767c79f0ca](https://explorer-studio.genlayer.com/tx/0x535f2486b08deb79636d54e74c8c6ad3e455ac67106637fb5d164c767c79f0ca) | MAJORITY_AGREE | SUCCESS · FINALIZED | FINALIZED |
| `withdraw` (agent) | [0xc4397505f066224509e2926c0f64258cd9cc1c47d953014d8b82bc7b2d44144a](https://explorer-studio.genlayer.com/tx/0xc4397505f066224509e2926c0f64258cd9cc1c47d953014d8b82bc7b2d44144a) | MAJORITY_AGREE | SUCCESS · FINALIZED | 0.1 GEN received |
| `withdraw` (poster) | [0x76dfb0dc4b519fa17e09baaa5ca926178dcd1aede70d1b4db5507d06afcb7843](https://explorer-studio.genlayer.com/tx/0x76dfb0dc4b519fa17e09baaa5ca926178dcd1aede70d1b4db5507d06afcb7843) | MAJORITY_AGREE | SUCCESS · FINALIZED | 0.1 GEN received |

The first two attempts are recorded honestly: validators still split on a coverage-style delivery sometimes. The relaxed rule did not eliminate disagreement — it made consensus reachable on retry, and the failed attempts wrote no state, so the retries were safe.

## Verdict

Completeness, correctness and usefulness were **50 / 100 / 50**, verdict **PARTIAL**, one round, basis `CONTENT_REVIEW`. The accepted rationale: "The delivered content fully meets the requirements for Part 1 of the specification, including prerequisites (Node.js 20 and Git), install commands, a config file example, and verification steps. However, Part 2 (migration guide) is entirely absent, which is a critical gap as the specification explicitly requires both parts to be present and complete."

Contradiction witness:

- "Part 2 (version 1 to version 2 migration guide) is missing, despite the specification requiring it to include backup, migration command, rollback, and verification steps."

## Settlement

| Field | Before settlement | After settlement |
| --- | ---: | ---: |
| Agent withdrawable · GEN | 0 | 0.1 (withdrawn) |
| Poster withdrawable · GEN | 0 | 0.1 (withdrawn) |
| Agent reputation | 100 | 102 |
| Agent stake · GEN | 1 | 1 |
| Treasury · GEN (contract-wide, from earlier REJECT slashes) | 0.3 | 0.3 |

The agent received 0.1 GEN and the poster received 0.1 GEN (exact half each). The claim was unlocked, with no slash. GEN conservation holds at every step: contract GEN balance = escrow + stakes + withdrawable + treasury (+ 1 GEN stranded by a failed payable call — see PROBES.md).

Real testnet GEN; the agent and poster pulled their settlements with `withdraw` and the EOA deltas match exactly. Full log with receipts and read-backs: [coverage-partial.json](coverage-partial.json). Runner: `scripts/coverage-case.mjs`.
