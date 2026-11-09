# Coverage-style partial delivery

[Open this finalized task](https://halihalibt.github.io/task-prism-genlayer/?task=coverage-20261109154647#adjudication).

Contract: `0x2D5d39cE2414F154D0D2cd574079167B26deA68c` on Stable Studionet, Chain ID 61999.

## Why this case

Under the strict same-band rule, validators split twice on a two-section delivery and left it stuck SUBMITTED. The relaxed rule (same verdict, at most 10 points per dimension) is mock-tested, and the new contract had already finalized a PARTIAL verdict for a five-item support sheet — but it had never been tested live on a two-section delivery where one whole section is absent. This case is that exact shape:

- Specification: two equally important parts. Part 1: local setup guide. Part 2: version 1 to version 2 migration guide.
- Delivery: Part 1 complete (prerequisites, install commands, config example, server-start verification); Part 2 entirely absent.
- Delivery bytes: [fixtures/coverage-partial.txt](https://raw.githubusercontent.com/halihalibt/task-prism-genlayer/54c38580ffabec404e8e3ac4aeae293adc63b5e4/fixtures/coverage-partial.txt), fetched and hashed by validators from a commit-pinned URL (sha256 `63db7fb3bbddc6fa14a68cdffc2cbaea80f96a268e1130b871320d26a56cfe27`).

## Transactions

All nine transactions are FINALIZED. The first evaluation attempt did not reach consensus and wrote no state; the second did.

| Operation | Transaction | Consensus | Execution | Read-back |
| --- | --- | --- | --- | --- |
| `claim_demo_funds` (poster) | [0x06c62ae3e7001073523f351723f76f658d4b6f430edc38f7dbf0a027cdd925a7](https://explorer-studio.genlayer.com/tx/0x06c62ae3e7001073523f351723f76f658d4b6f430edc38f7dbf0a027cdd925a7) | MAJORITY_AGREE | SUCCESS · FINALIZED | poster 10000 |
| `claim_demo_funds` (agent) | [0xdfa0c0f5c046cbada5905c7c3a6f8790dc5be88c81e67da76e9f131f4d631b66](https://explorer-studio.genlayer.com/tx/0xdfa0c0f5c046cbada5905c7c3a6f8790dc5be88c81e67da76e9f131f4d631b66) | MAJORITY_AGREE | SUCCESS · FINALIZED | agent 10000 |
| `register_agent` | [0x6c3d5933165bd145106e614efc22e6b6b7dcd5855cd353956254178efa665be3](https://explorer-studio.genlayer.com/tx/0x6c3d5933165bd145106e614efc22e6b6b7dcd5855cd353956254178efa665be3) | MAJORITY_AGREE | SUCCESS · FINALIZED | stake 1000 |
| `post_task` | [0xf9a16229d3e997e23f7c252edbf3d02332bef7b1b6d64cdbccf63b82ac54002e](https://explorer-studio.genlayer.com/tx/0xf9a16229d3e997e23f7c252edbf3d02332bef7b1b6d64cdbccf63b82ac54002e) | MAJORITY_AGREE | SUCCESS · FINALIZED | OPEN |
| `claim_task` | [0xfd4d9f842cba12f823c642476fd154df4c6e0440a5929c5b4644131fc8ac5742](https://explorer-studio.genlayer.com/tx/0xfd4d9f842cba12f823c642476fd154df4c6e0440a5929c5b4644131fc8ac5742) | MAJORITY_AGREE | SUCCESS · FINALIZED | CLAIMED |
| `submit_delivery` | [0x37fa2a56f7bbc9773807d68212358ac19d0687debe37d38f53dfd6a0977f47d6](https://explorer-studio.genlayer.com/tx/0x37fa2a56f7bbc9773807d68212358ac19d0687debe37d38f53dfd6a0977f47d6) | MAJORITY_AGREE | SUCCESS · FINALIZED | SUBMITTED |
| `evaluate_delivery` attempt 1 | [0x7429d49d6f3f47847caf60f2b32a117ec7d0dab3ea67ab9071826446adfae293](https://explorer-studio.genlayer.com/tx/0x7429d49d6f3f47847caf60f2b32a117ec7d0dab3ea67ab9071826446adfae293) | MAJORITY_DISAGREE | SUCCESS · FINALIZED | SUBMITTED (unchanged) |
| `evaluate_delivery` attempt 2 | [0x0705a02e0daabdb1f53315ce24d4088c69decffb78a1cee95babbc582a66b403](https://explorer-studio.genlayer.com/tx/0x0705a02e0daabdb1f53315ce24d4088c69decffb78a1cee95babbc582a66b403) | MAJORITY_AGREE | SUCCESS · FINALIZED | EVALUATING |
| `finalize_delivery` | [0xfafee84de53eb702da99f5c4047a3e0622bef79446a1b52a6c4c2fbbc9349f87](https://explorer-studio.genlayer.com/tx/0xfafee84de53eb702da99f5c4047a3e0622bef79446a1b52a6c4c2fbbc9349f87) | MAJORITY_AGREE | SUCCESS · FINALIZED | FINALIZED |

The first attempt is recorded honestly: validators still split on a coverage-style delivery sometimes. The relaxed rule did not eliminate disagreement — it made consensus reachable on retry, and the failed attempt wrote no state, so the retry was safe.

## Verdict

Completeness, correctness and usefulness were **50 / 90 / 50**, verdict **PARTIAL**, one round, basis `CONTENT_REVIEW`. The accepted rationale: "The delivered bytes contain a complete Part 1 local setup guide (prerequisites, install commands, config example, and server-start verification) but omit Part 2 entirely. The heading calls it a two-part integration guide, yet no version 1-to-2 migration steps are provided, so the document does not substantively meet the full specification."

Contradiction witnesses:

- "Title claims a 'two-part integration guide' but only Part 1 is present."
- "Specification requires a complete Part 2 migration guide (backup step, migration command, rollback step, and migration verification), none of which appear in the delivered content."

## Settlement

| Ledger field | Before settlement | After settlement |
| --- | ---: | ---: |
| Agent balance · mGEN | 9000 | 9100 |
| Poster balance · mGEN | 9800 | 9900 |
| Agent reputation | 100 | 102 |
| Agent stake · mGEN | 1000 | 1000 |
| Treasury · mGEN | 100 | 100 |
| Issued · mGEN | 40000 | 40000 |

The agent received 100 and the poster received 100. The claim was unlocked, with no slash. Ledger conservation holds at every step: issued = wallets + stakes + escrow + treasury.

Simulated mGEN ledger, no real GEN moves. Full log with receipts and read-backs: [coverage-partial.json](coverage-partial.json). Runner: `scripts/coverage-case.mjs`.
