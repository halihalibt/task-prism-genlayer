# Stable Studionet evidence

The timing-protected source is deployed at `0x60A05E9C82801E90837BD3688636bf213B80528f`; full elapsed-time verification is pending. New receipts are kept separately under [timing-deployment/](timing-deployment/). [Timing protections](TIMING_PROTECTIONS.md) and [candidate manifest](timing-candidate.json) describe local tests and remaining live checks. This directory records actual signed transactions submitted to Stable Studionet, Chain ID 61999, and reads from `latest-final` state. Test-only fixtures and LOCAL MOCK results are not deployment evidence.

See the [deployment list](DEPLOYMENTS.md) for addresses, transactions and source identities across versions.

## Previous deployment

Contract: `0x0BC304C168D14B8f4928f622e971B532D30d7268`

Deployment transaction: [`0x2e483058cb6ca581e28abf406e1ba97b82d0e8df073296661916a21625db0076`](https://explorer-studio.genlayer.com/tx/0x2e483058cb6ca581e28abf406e1ba97b82d0e8df073296661916a21625db0076)

Canonical deployed source commit: `f85542e325da306a5bea89b3c976843090372a79`

Source SHA-256: `c76ce31efe3a6d285cee8148ab7fc380dfeb18895990404d230eca2be99d0ab8`

The raw receipt reports FINALIZED, MAJORITY_AGREE and SUCCESS execution. `deploy-read-back.json` contains the initial state read from the contract. The deployed source is byte-identical to `history/real-gen-untimed/task_prism.py` and `contracts/task_prism.py` at that commit (verified by `python3 scripts/check-evidence.py`).

**Real testnet GEN.** Bounties and stakes move as real testnet GEN (wei): `post_task`, `register_agent` and `top_up_stake` are payable and must send exactly the declared amount; settlements are withdrawable balances pulled with `withdraw`. Faucet GEN is free for testing; no simulated ledger is used. The previous contract (`0x2D5d39cE2414F154D0D2cd574079167B26deA68c`) used a simulated mGEN ledger and is superseded; its evidence is archived under [history/consensus-compatible-contract/](history/consensus-compatible-contract/).

## Transaction encoding

Stable Studionet receives signed legacy EVM transactions calling `addTransaction` on its consensus contract. The inner payload is the SDK's RLP plus GenVM calldata encoding. Scripts use genlayer-js 1.1.8 with real key-derived temporary accounts; private keys are never persisted.

The initial encoding attempt sent the inner payload directly to the zero address. Its receipt is retained as `initial-envelope-receipt.json`: type 0, FINALIZED, NO_MAJORITY, no contract. It is not a deployment or successful contract execution. `initial-envelope-attempt.json` records the local source identity used for that attempt; the deployed-source identity is the canonical commit above.

## HTTP response compatibility

The initial contract at `0xdbfA1b3EfFd0fcB38A5f6f208D3247a5C77Ab1b3` used `Response.status_code`. The pinned GenVM SDK exposes `Response.status`. Its first live delivery evaluation ended FINALIZED with ERROR execution and left the task SUBMITTED, with no verdict or settlement. The complete failed evaluation and prior transactions are retained in `sdk-compatibility-attempt.json`; the initial deployment manifest, source hash, receipt and read-back are retained under `history/initial-contract/`.

The active contract uses the SDK's documented `status` field. The SDK-matching local response fixture checks HTTP 200, 404 and 500 handling. Verdict thresholds, ledger accounting, challenge rules and state transitions are unchanged.

## Recorded live transactions

[Live verification](LIVE_VERIFICATION.md) lists finalized receipts and state read-backs by method. The [JSON index](live-verification.json) separates consensus-accepted execution from rejected consensus. Complete original receipts and full state read-backs are retained in the linked lossless archive. The historical [browser ledger write](history/strict-score-contract/browser-ledger-write.json) records a temporary-account transaction submitted through the Pages application on the preceding contract.

Transaction FINALIZED, leader execution SUCCESS and MAJORITY_AGREE are separate checks. Clients only report a confirmed state-changing transaction when all required checks pass and latest-final state has been read back.

## Consensus compatibility

The preceding contract at `0x2Bc2ec661ecbF8f76be6777A56481Eb1012fB4bE` required matching threshold bands for every dimension as well as matching overall verdicts and a maximum ten-point score difference. For example, `[60,100,70]` and `[60,100,60]` both imply PARTIAL but failed that additional band comparison. Its deployment, original source, successful ledger paths and unsuccessful consensus attempts are preserved under [history/strict-score-contract](history/strict-score-contract/). No old task or verdict was migrated or overwritten.

The active contract compares the same independently computed verdict, hashes, URL and basis, retaining the ten-point score tolerance. JSON output may have a single outer code fence; malformed JSON and non-integer values remain errors before storage changes. Local regression tests cover the nondecisive boundary case and continued rejection of different verdicts or scores over the tolerance. These local tests are separate from live receipts.

The current contract adds submit-time delivery validation (a nondeterministic fetch at submit: size ≤ 24000 bytes, UTF-8 decodable, SHA-256 matches), delivery resubmission before evaluation, and poster expiry of a task whose delivery was submitted but never successfully evaluated. See [PROBES.md](PROBES.md) for the on-chain adversarial probes (A–D, all REJECT) and the bad-delivery cases, and [COVERAGE_PARTIAL.md](COVERAGE_PARTIAL.md) for the re-run coverage case (PARTIAL 50/100/50). The combined [live verification](LIVE_VERIFICATION.md) contains all 25 current-contract transactions, including the expected stake-threshold rejection.

The [browser adjudication](BROWSER_ADJUDICATION.md) is a historical record from the superseded contract (simulated mGEN) and is not current-contract evidence. Earlier unsuccessful attempts remain in the historical records and are not counted as successful adjudications.
