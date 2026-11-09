# Stable Studionet evidence

This directory records actual signed transactions submitted to Stable Studionet, Chain ID 61999, and reads from `latest-final` state. Test-only fixtures and LOCAL MOCK results are not deployment evidence.

## Deployment

Contract: `0x2Bc2ec661ecbF8f76be6777A56481Eb1012fB4bE`

Deployment transaction: [`0x39eb3e9b257cd31b2ff6046168ca6c2b66358167060d83c8fd52a7d8ec4962db`](https://explorer-studio.genlayer.com/tx/0x39eb3e9b257cd31b2ff6046168ca6c2b66358167060d83c8fd52a7d8ec4962db)

Canonical deployed source commit: `4df9c7a38753809dae7c87f878396d9107e77813`

Source SHA-256: `54437c822d51540a422fb2679dc4f322b234b3c7fbeaf1989b10973851ff8877`

The raw receipt reports FINALIZED, MAJORITY_AGREE and SUCCESS execution. `deploy-read-back.json` contains the initial state read from the contract, including its three labelled agents and three labelled tasks. They contain no consensus verdicts.

## Transaction encoding

Stable Studionet receives signed legacy EVM transactions calling `addTransaction` on its consensus contract. The inner payload is the SDK's RLP plus GenVM calldata encoding. Scripts use genlayer-js 1.1.8 with real key-derived temporary accounts; private keys are never persisted.

The initial encoding attempt sent the inner payload directly to the zero address. Its receipt is retained as `initial-envelope-receipt.json`: type 0, FINALIZED, NO_MAJORITY, no contract. It is not a deployment or successful contract execution. `initial-envelope-attempt.json` records the local source identity used for that attempt; the deployed-source identity is the canonical commit above.

## HTTP response compatibility

The initial contract at `0xdbfA1b3EfFd0fcB38A5f6f208D3247a5C77Ab1b3` used `Response.status_code`. The pinned GenVM SDK exposes `Response.status`. Its first live delivery evaluation ended FINALIZED with ERROR execution and left the task SUBMITTED, with no verdict or settlement. The complete failed evaluation and prior transactions are retained in `sdk-compatibility-attempt.json`; the initial deployment manifest, source hash, receipt and read-back are retained under `history/initial-contract/`.

The active contract uses the SDK's documented `status` field. The SDK-matching local response fixture checks HTTP 200, 404 and 500 handling. Verdict thresholds, ledger accounting, challenge rules and state transitions are unchanged.

## Recorded live transactions

[Live verification](LIVE_VERIFICATION.md) lists finalized receipts and state read-backs by method. The [JSON index](live-verification.json) separates consensus-accepted execution from rejected consensus. Complete original receipts and full state read-backs are retained in the linked lossless archive. The [browser ledger write](browser-ledger-write.json) records an actual temporary-account transaction submitted through the Pages application.

Transaction FINALIZED, leader execution SUCCESS and MAJORITY_AGREE are separate checks. Clients only report a confirmed state-changing transaction when all required checks pass and latest-final state has been read back.
