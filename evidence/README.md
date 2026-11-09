# Stable Studionet evidence

This directory records actual signed transactions submitted to Stable Studionet, Chain ID 61999, and reads from `latest-final` state. Test-only fixtures and LOCAL MOCK results are not deployment evidence.

## Deployment

Contract: `0xdbfA1b3EfFd0fcB38A5f6f208D3247a5C77Ab1b3`

Deployment transaction: [`0xce27abb39cf29afc959f7c52d6c4bb4f5c26271aad310360304135b35bd0e795`](https://explorer-studio.genlayer.com/tx/0xce27abb39cf29afc959f7c52d6c4bb4f5c26271aad310360304135b35bd0e795)

Canonical deployed source commit: `4174a5a996e3e41c5994f990e018289cd6cd3f7f`

Source SHA-256: `f747d1ba19ab476fa9979aaf552300d17324cc98b250a3f1b43a1e9f5febaf78`

The raw receipt reports FINALIZED, MAJORITY_AGREE and SUCCESS execution. `deploy-read-back.json` contains the initial state read from the contract, including its three labelled agents and three labelled tasks. They contain no consensus verdicts.

## Transaction encoding

Stable Studionet receives signed legacy EVM transactions calling `addTransaction` on its consensus contract. The inner payload is the SDK's RLP plus GenVM calldata encoding. Scripts use genlayer-js 1.1.8 with real key-derived temporary accounts; private keys are never persisted.

The initial encoding attempt sent the inner payload directly to the zero address. Its receipt is retained as `initial-envelope-receipt.json`: type 0, FINALIZED, NO_MAJORITY, no contract. It is not a deployment or successful contract execution. `initial-envelope-attempt.json` records the local source identity used for that attempt; the deployed-source identity is the canonical commit above.
