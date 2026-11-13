# Live contract verification

> Version scope: the recorded live results below belong to the previous, untimed contract. They do not validate the timing-protected source. See [TIMING_PROTECTIONS.md](TIMING_PROTECTIONS.md).

Contract: `0x0BC304C168D14B8f4928f622e971B532D30d7268` on Stable Studionet, Chain ID 61999.

25 signed transactions have FINALIZED receipts and latest-final read-backs. These include 24 consensus-accepted successful executions, 1 intentional stake-threshold rejection and 0 consensus-rejected evaluation attempts with unchanged state. Amounts are real testnet GEN in wei (1 GEN = 10^18 wei); settlements are withdrawable balances pulled by the parties with `withdraw`. No simulated ledger is used.

## Task outcomes

| Task | State | Verdict | Scores by round | Agent payment (wei) | Poster refund (wei) | Slash pool contribution (wei) |
| --- | --- | --- | --- | ---: | ---: | ---: |
| integrity-20261109175017 | FINALIZED | REJECT | 0/0/0 | 0 | 200000000000000000 | 100000000000000000 |
| integrity-20261109181701 | FINALIZED | REJECT | 0/0/0 | 0 | 200000000000000000 | 100000000000000000 |
| integrity-20261109190501 | FINALIZED | REJECT | 0/0/0 | 0 | 200000000000000000 | 100000000000000000 |
| pipeline-20261109175017 | EXPIRED | — | — | 0 | 200000000000000000 | 0 |
| pipeline-20261109190501 | EXPIRED | — | — | 0 | 200000000000000000 | 0 |
| runbook-20261109175017 | FINALIZED | ACCEPT | 96/98/95; 96/98/96 | 200000000000000000 | 0 | 0 |
| runbook-20261109181034 | FINALIZED | ACCEPT | 100/100/100 | 200000000000000000 | 0 | 0 |
| runbook-20261109181701 | FINALIZED | ACCEPT | 100/100/100; 100/100/100 | 200000000000000000 | 0 | 0 |
| runbook-20261109182907 | FINALIZED | ACCEPT | 100/98/100; 100/100/100 | 200000000000000000 | 0 | 0 |
| runbook-20261109190501 | FINALIZED | ACCEPT | 100/100/100; 100/100/100 | 200000000000000000 | 0 | 0 |
| support-20261109175017 | FINALIZED | PARTIAL | 60/85/70 | 100000000000000000 | 100000000000000000 | 0 |
| support-20261109190501 | FINALIZED | PARTIAL | 60/95/60 | 100000000000000000 | 100000000000000000 | 0 |

## Transaction receipts and read-backs

| Method | Transaction | Status | Execution |
| --- | --- | --- | --- |
| `register_agent` | [0xae43327b…](https://explorer-studio.genlayer.com/tx/0xae43327b5d9bc8546f7494a4417428123417874e4c09bdfa239c8a70bc0cf06a) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `post_task` | [0xd85061a1…](https://explorer-studio.genlayer.com/tx/0xd85061a171acd1c2a21a4645ae4e7d3fff40b26edda8b7466a55ec75053bf01c) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_task` | [0x6bfb4c17…](https://explorer-studio.genlayer.com/tx/0x6bfb4c171e907cbc37e44028d2b9b84d9d691cd2a6d3bba90a43425e6f8c398d) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `submit_delivery` | [0x893ccb1c…](https://explorer-studio.genlayer.com/tx/0x893ccb1c90ffbee0a917fd8e34619d9074d0971a4247ea76267a2fe3ad90214a) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `evaluate_delivery` | [0xf2541746…](https://explorer-studio.genlayer.com/tx/0xf25417462371ef483965e035687f673287d9c6ccc9d2974c5f9af714c1d47507) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `challenge_delivery` | [0x11e7e6ca…](https://explorer-studio.genlayer.com/tx/0x11e7e6caf42f563ca985be1e461526df0b496afdfe3fdd3474c3046709a3c857) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `withdraw` | [0x0a92ce49…](https://explorer-studio.genlayer.com/tx/0x0a92ce49683deea9f01e1efaf1012f3f6dfaa8ce0aaf139798a251dd6f7ed502) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `post_task` | [0xc5dad8d0…](https://explorer-studio.genlayer.com/tx/0xc5dad8d04e42dee32a4ac57161354f819b38ebae31817c667f3b11a468eb3ae4) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_task` | [0xc9a1bb52…](https://explorer-studio.genlayer.com/tx/0xc9a1bb52b0d617ca7cb563fcf14ea5e2ae1b3a92448e647447548bba6201c3f8) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `submit_delivery` | [0x6956fc1e…](https://explorer-studio.genlayer.com/tx/0x6956fc1e511fea5252e0c154919c20bc83a827fce39a2c433bbd6b85768ec3e3) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `evaluate_delivery` | [0x93d14ed8…](https://explorer-studio.genlayer.com/tx/0x93d14ed822eea9cfc2d60021a9238a2747860e79eb889e59cad5da856e7eff5f) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `finalize_delivery` | [0x81522654…](https://explorer-studio.genlayer.com/tx/0x81522654db1ed05de55408a865256d9d16073f0f6c7ebae6a3cf257920bec40c) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `post_task` | [0x4540446f…](https://explorer-studio.genlayer.com/tx/0x4540446ffcc80162762071b882e6b3f0694b17f02d82384c2b96bbc94f35a6d6) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_task` | [0x9d23f805…](https://explorer-studio.genlayer.com/tx/0x9d23f8050528c4011a89491008c2a1b453a646a95aba679ec54891a4d3e460a1) | FINALIZED | ERROR · MAJORITY_AGREE · STAKE_BELOW_MINIMUM |
| `top_up_stake` | [0xde822754…](https://explorer-studio.genlayer.com/tx/0xde8227542103f540114084f8bc321cf9f28ee2016ad1b40e5673ceae3b6c5017) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_task` | [0x5d7cda68…](https://explorer-studio.genlayer.com/tx/0x5d7cda6852ed21441d521ecf8e906d5b2e716715f1345c9b04f5651448d8056f) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `expire_task` | [0xe49a67cc…](https://explorer-studio.genlayer.com/tx/0xe49a67cc574a0268dec5b9f701efe4d92bfa4bfc038f5f00f30fd979eda85843) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `withdraw` | [0x2f060664…](https://explorer-studio.genlayer.com/tx/0x2f060664cb74b20da8e88c01097065eecb9d05b0d9fb6e842bd0723fa628933a) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `post_task` | [0x25e925f0…](https://explorer-studio.genlayer.com/tx/0x25e925f03e10493f9f0bcad39f82d09489a05af7bff23866bb91481c024730ea) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_task` | [0x430bc3ff…](https://explorer-studio.genlayer.com/tx/0x430bc3ffb4ad5176a3fc4efee2db72d024af0f88465fdef7a26d018767059226) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `submit_delivery` | [0x79bd22de…](https://explorer-studio.genlayer.com/tx/0x79bd22deacd199752b83a3324334cc8d1a3d8d51fbec7641ad2507d0e32ac2b9) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `evaluate_delivery` | [0x19d97176…](https://explorer-studio.genlayer.com/tx/0x19d97176249093e83ed6f41aefc2ce36f782125ad36855bdf488184b09a27f0d) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `finalize_delivery` | [0x7300b30c…](https://explorer-studio.genlayer.com/tx/0x7300b30c65f1fd0ba531628270af3b89edbd188a7e516cb89196bd1348f209a4) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `withdraw` | [0x6c545845…](https://explorer-studio.genlayer.com/tx/0x6c54584565065a5162fa646a8d2656fcd1858e5addb7510549e9e4b3a6e16c9f) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `withdraw` | [0xd3afd122…](https://explorer-studio.genlayer.com/tx/0xd3afd1221b322c419e439eaadd1e2e028cf88ca3d90d01ba55210f2b91739d21) | FINALIZED | SUCCESS · MAJORITY_AGREE |

The readable per-transaction state projections are in [live-verification.json](live-verification.json). Complete original receipts and full read-backs are preserved losslessly in [live-verification.full.json.gz](live-verification.full.json.gz); its uncompressed SHA-256 is recorded in the index. [final-state.json](final-state.json) is the last finalized read-back.

Seed fixtures are excluded from these outcomes and from GEN conservation checks. Local mock results are separate from network evidence.
