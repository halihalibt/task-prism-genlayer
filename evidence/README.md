# Stable Studionet evidence

This directory records actual signed transactions submitted to Stable Studionet, Chain ID 61999, and reads from `latest-final` state. Test-only fixtures and LOCAL MOCK results are not deployment evidence.

See the [deployment list](DEPLOYMENTS.md) for addresses, transactions and source identities across versions.

## Deployment

Contract: `0x2D5d39cE2414F154D0D2cd574079167B26deA68c`

Deployment transaction: [`0x48dd22f470d04f9939e1a97b037282f5149d2ba09d849e7232e5694be1e594ae`](https://explorer-studio.genlayer.com/tx/0x48dd22f470d04f9939e1a97b037282f5149d2ba09d849e7232e5694be1e594ae)

Canonical deployed source commit: `356c398101b1e3ff7549a98c341add0e20ee90d2`

Source SHA-256: `37dbb612c3619b350bfa5a045db7e5246b1f8f72c9a97361d7eb9741379393f6`

The raw receipt reports FINALIZED, MAJORITY_AGREE and SUCCESS execution. `deploy-read-back.json` contains the initial state read from the contract, including its three labelled agents and three labelled tasks. They contain no consensus verdicts.

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

The active contract compares the same independently computed verdict, hashes, URL and basis, retaining the ten-point score tolerance. JSON output may have a single outer code fence; malformed JSON and non-integer values remain errors before storage changes. Ledger amounts, verdict thresholds, challenge rules and settlement effects are unchanged. Local regression tests cover the nondecisive boundary case and continued rejection of different verdicts or scores over the tolerance. These local tests are separate from live receipts.

The active [browser adjudication](BROWSER_ADJUDICATION.md) records the PARTIAL pending verdict and exact 100/100 settlement submitted through Pages. The combined [live verification](LIVE_VERIFICATION.md) contains all 23 current-contract transactions, including the expected stake-threshold rejection. Earlier unsuccessful attempts remain in the historical records and are not counted as successful adjudications.
