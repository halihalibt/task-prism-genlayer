# Live timing protections on Stable Studionet

Contract: `0x60A05E9C82801E90837BD3688636bf213B80528f`; Chain ID 61999.

[Deployment transaction](https://explorer-studio.genlayer.com/tx/0x8b56d9fe5e2263c475996e541ea1f5e9f60c4115b843261c397a91059a77cfe7) is FINALIZED / MAJORITY_AGREE / SUCCESS. Exact deployed bytes match SHA-256 `44222aed4823c3c4c2ae89bedbf9b0552b30b7f976cf8d9b094f73cc1a668bac` and source commit `fcb4d1e0574d3da52d7c4c1f62c4a50267ba7216`. `deploy-read-back.json` is the initial latest-final state.

The initial live verification phase retained 26 FINALIZED / MAJORITY_AGREE transactions: 20 successful executions and 6 expected rejections. Every verified transaction has a latest-final read-back and GEN conservation check. These are signed real testnet transactions; no timestamp overrides or shortened periods were used.

| Check | Observed result |
| --- | --- |
| Immediate poster expiry of claimed work | Verified |
| Immediate poster expiry of submitted work | Verified |
| Resubmission preserves the original review deadline | Verified |
| Finalization during the first verdict challenge interval | Verified |
| Authorized challenge before deadline settles round two | Verified |

The challenged task finalized as **ACCEPT** with 2 retained rounds and settlement `{"agent_reputation_delta": 10, "paid_to_agent": 200000000000000000, "refunded_to_poster": 0, "slashed_to_treasury": 0}`. The agent's subsequent signed `withdraw` succeeded. The runner asserted the EOA balance increase against the withdrawable amount; this initial run did not serialize the separate EOA before/after read values. Receipts and contract-state snapshots are preserved. Future withdrawal checks record those reads as well.

## Elapsed-time verification complete

On 2026-11-14, all remaining cases passed using actual elapsed time. Late challenge, duplicate finalization, late delivery, late evaluation and duplicate expiry were rejected without state changes. First-round finalization succeeded after the challenge deadline. CLAIMED and SUBMITTED expiry refunded the full bounty, cleared agent locks and preserved stake and reputation. Pending-agent and poster withdrawals succeeded with recorded EOA before/after balances equal to the withdrawn amounts. Every new receipt is FINALIZED / MAJORITY_AGREE, with latest-final state and GEN conservation assertions.

The complete suite contains 37 verified transactions: 25 SUCCESS and 12 expected ERROR. Full original receipts, new transaction hashes, state snapshots and withdrawal balances are in the lossless archive and index below. No redeployment or time override was used.

```sh
node scripts/timing-live.js --confirm-live --due
python3 scripts/pack-timing-evidence.py
python3 scripts/check-evidence.py
```

## Receipts

| Tag | Result | Transaction |
| --- | --- | --- |
| `claimed-register` | SUCCESS | [0xe5a5af7bfa500a0599cba9500491afc4005d6436e684602402e7593a796d3f1a](https://explorer-studio.genlayer.com/tx/0xe5a5af7bfa500a0599cba9500491afc4005d6436e684602402e7593a796d3f1a) |
| `claimed-post` | SUCCESS | [0x7460e50fdf39de33c9dd4ec90864b87e330db683301e2e558819d342d6eeb031](https://explorer-studio.genlayer.com/tx/0x7460e50fdf39de33c9dd4ec90864b87e330db683301e2e558819d342d6eeb031) |
| `claimed-claim` | SUCCESS | [0xecd9ee4edc52e70a26e2b17c8503a034d4b926f810226e07da72e3932f3aaaff](https://explorer-studio.genlayer.com/tx/0xecd9ee4edc52e70a26e2b17c8503a034d4b926f810226e07da72e3932f3aaaff) |
| `claimed-early-expire` | ERROR / `DELIVERY_PERIOD_ACTIVE` | [0x6af9e8a988ec25b6266566709163b09abc6dda71f430687d9c9cbef5664ef287](https://explorer-studio.genlayer.com/tx/0x6af9e8a988ec25b6266566709163b09abc6dda71f430687d9c9cbef5664ef287) |
| `submitted-register` | SUCCESS | [0x876d9a73bef6981ba414162a5707516ed11a87b038e3e3aad4c7dd877d80345e](https://explorer-studio.genlayer.com/tx/0x876d9a73bef6981ba414162a5707516ed11a87b038e3e3aad4c7dd877d80345e) |
| `submitted-post` | SUCCESS | [0xe8529ab0aec3feb38f766aa5b1eb321d49d9e8e088260ee38b6a0b71ac030cbf](https://explorer-studio.genlayer.com/tx/0xe8529ab0aec3feb38f766aa5b1eb321d49d9e8e088260ee38b6a0b71ac030cbf) |
| `submitted-claim` | SUCCESS | [0x0595fc104df7894ac96e008e6038645e5897a9129ce29e15e06f8b6e275173c9](https://explorer-studio.genlayer.com/tx/0x0595fc104df7894ac96e008e6038645e5897a9129ce29e15e06f8b6e275173c9) |
| `submitted-submit` | SUCCESS | [0xdf08d7e0876ed823b5e62a7af56e3a9f65e4347451aaf103a1a94f9a15aaa071](https://explorer-studio.genlayer.com/tx/0xdf08d7e0876ed823b5e62a7af56e3a9f65e4347451aaf103a1a94f9a15aaa071) |
| `submitted-early-expire` | ERROR / `REVIEW_PERIOD_ACTIVE` | [0x3c77a5414469c320684c2527e4bea5abbd6095f909f59bf14cc778742a218923](https://explorer-studio.genlayer.com/tx/0x3c77a5414469c320684c2527e4bea5abbd6095f909f59bf14cc778742a218923) |
| `submitted-resubmit` | SUCCESS | [0x476daf656f317ecf0e08337eedf40a4e8f6fdd7066216686c76ad6f2de8d0264](https://explorer-studio.genlayer.com/tx/0x476daf656f317ecf0e08337eedf40a4e8f6fdd7066216686c76ad6f2de8d0264) |
| `pending-register` | SUCCESS | [0xe85877791a93a1284ebd0d57d00e8d986bf651a95f8c25d5c33e37bc62dea803](https://explorer-studio.genlayer.com/tx/0xe85877791a93a1284ebd0d57d00e8d986bf651a95f8c25d5c33e37bc62dea803) |
| `pending-post` | SUCCESS | [0x559c821df4bead6ad73b8924566b4a429db0d23806def5c4bc5785a0ac192d51](https://explorer-studio.genlayer.com/tx/0x559c821df4bead6ad73b8924566b4a429db0d23806def5c4bc5785a0ac192d51) |
| `pending-claim` | SUCCESS | [0x20ac2619a6aace6f9d671a02e404cf679789d2172c9cff668178f6b2832905ba](https://explorer-studio.genlayer.com/tx/0x20ac2619a6aace6f9d671a02e404cf679789d2172c9cff668178f6b2832905ba) |
| `pending-submit` | SUCCESS | [0x0fb2512202472d4c36aae5fb327ffd2e24da6ef61cbe8ca3ac6ecd19eb36ce86](https://explorer-studio.genlayer.com/tx/0x0fb2512202472d4c36aae5fb327ffd2e24da6ef61cbe8ca3ac6ecd19eb36ce86) |
| `pending-early-expire` | ERROR / `REVIEW_PERIOD_ACTIVE` | [0x4aaf0bae2bff3cdf5b3c26f7436316c3f8ee78fff8eba91f9ac3e30705a33d64](https://explorer-studio.genlayer.com/tx/0x4aaf0bae2bff3cdf5b3c26f7436316c3f8ee78fff8eba91f9ac3e30705a33d64) |
| `pending-evaluate` | SUCCESS | [0xe426a29971cec8631bedf8f69446c572ec8653506ab33ec848490e4c181fa48f](https://explorer-studio.genlayer.com/tx/0xe426a29971cec8631bedf8f69446c572ec8653506ab33ec848490e4c181fa48f) |
| `pending-early-finalize` | ERROR / `CHALLENGE_PERIOD_ACTIVE` | [0x40c26a5d1980f92fb8f7b1c55240b74304bbcc4efd269741174d8d495b87fad1](https://explorer-studio.genlayer.com/tx/0x40c26a5d1980f92fb8f7b1c55240b74304bbcc4efd269741174d8d495b87fad1) |
| `challenged-register` | SUCCESS | [0x7b6169be453606ca3642116f9eafb80d6f0a1b86c37807e90cf74c9370c7e4f1](https://explorer-studio.genlayer.com/tx/0x7b6169be453606ca3642116f9eafb80d6f0a1b86c37807e90cf74c9370c7e4f1) |
| `challenged-post` | SUCCESS | [0x37222fc0d7fc6cab6e92a2eba433347036865b089c88c820521ad45fecdbc711](https://explorer-studio.genlayer.com/tx/0x37222fc0d7fc6cab6e92a2eba433347036865b089c88c820521ad45fecdbc711) |
| `challenged-claim` | SUCCESS | [0x72da75608d8c21c0f71b9969a0bd883bcd92f21c018ca235f6d86de0f848ea78](https://explorer-studio.genlayer.com/tx/0x72da75608d8c21c0f71b9969a0bd883bcd92f21c018ca235f6d86de0f848ea78) |
| `challenged-submit` | SUCCESS | [0x3c08ed7dee9998c63482d7aea3898893f58bc30e1189fe80761d6622be409143](https://explorer-studio.genlayer.com/tx/0x3c08ed7dee9998c63482d7aea3898893f58bc30e1189fe80761d6622be409143) |
| `challenged-early-expire` | ERROR / `REVIEW_PERIOD_ACTIVE` | [0xdbdc151831df64c0ecde7ab5368776fcdd5e84c9914029ed14e0a4e79afbbe20](https://explorer-studio.genlayer.com/tx/0xdbdc151831df64c0ecde7ab5368776fcdd5e84c9914029ed14e0a4e79afbbe20) |
| `challenged-evaluate` | SUCCESS | [0x557c77dbc7b27721352a9f4564baf87cd5297fe35cc0943e0015d256cfa657a6](https://explorer-studio.genlayer.com/tx/0x557c77dbc7b27721352a9f4564baf87cd5297fe35cc0943e0015d256cfa657a6) |
| `challenged-early-finalize` | ERROR / `CHALLENGE_PERIOD_ACTIVE` | [0x3b54ec9a0f2639bb22d0e6451769be79bedd94258e333b63ddadda5c87d0da3e](https://explorer-studio.genlayer.com/tx/0x3b54ec9a0f2639bb22d0e6451769be79bedd94258e333b63ddadda5c87d0da3e) |
| `challenged-challenge` | SUCCESS | [0x3bc3d523412b8fd86ae6d7d4a06af3bb145ecea49505df8d212f813ca5c1a049](https://explorer-studio.genlayer.com/tx/0x3bc3d523412b8fd86ae6d7d4a06af3bb145ecea49505df8d212f813ca5c1a049) |
| `challenged-withdraw` | SUCCESS | [0xe7520c47ce6d7d882356d8710726e82449b6b8f4044dc399a53ccee704854280](https://explorer-studio.genlayer.com/tx/0xe7520c47ce6d7d882356d8710726e82449b6b8f4044dc399a53ccee704854280) |

The lossless [archives and index](index.json) retain original receipt bytes and full state snapshots, with decompressed SHA-256 identities. No failed transaction or historical evidence has been removed.
