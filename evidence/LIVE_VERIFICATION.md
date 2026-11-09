# Live contract verification

Contract: `0x2Bc2ec661ecbF8f76be6777A56481Eb1012fB4bE` on Stable Studionet, Chain ID 61999.

23 signed transactions have FINALIZED receipts and latest-final read-backs. These include 20 consensus-accepted successful executions, 1 intentional stake-threshold rejection and 2 consensus-rejected evaluation attempts with unchanged state. Amounts are simulated mGEN; no real GEN moves.

## Task outcomes

| Task | State | Verdict | Scores by round | Agent payment | Poster refund | Slash pool contribution |
| --- | --- | --- | --- | ---: | ---: | ---: |
| coverage-20261109072450 | SUBMITTED | — | — | 0 | 0 | 0 |
| integrity-20261109072450 | FINALIZED | REJECT | 0/0/0 | 0 | 200 | 100 |
| pipeline-20261109072450 | EXPIRED | — | — | 0 | 200 | 0 |
| runbook-20261109072450 | FINALIZED | ACCEPT | 98/98/97; 100/99/98 | 200 | 0 | 0 |

## Transaction receipts and read-backs

| Method | Transaction | Status | Execution |
| --- | --- | --- | --- |
| `claim_demo_funds` | [0x410f7bad…](https://explorer-studio.genlayer.com/tx/0x410f7badb066ecefbf67d12694419a9518c757a7c8b89f763db7b68a0fa68525) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_demo_funds` | [0xaf5b6893…](https://explorer-studio.genlayer.com/tx/0xaf5b68935d98de5c2ccbb893a1dbef5352057f33920eed479d1bad534a5827cc) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `register_agent` | [0xb0cf2277…](https://explorer-studio.genlayer.com/tx/0xb0cf22778b9e115382225cd6fac68d9af92a9fb5fed1a349a542d31a98e4e18f) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `post_task` | [0xc5e4df2f…](https://explorer-studio.genlayer.com/tx/0xc5e4df2f083ff9fe9c0c81fb17c5eb83a3577fa815650ac126fad85ffcc93f72) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_task` | [0x2b5a9f17…](https://explorer-studio.genlayer.com/tx/0x2b5a9f176cc30269c8e65b030201b7158caeef319e318d4ab7c5947e3cf9510a) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `submit_delivery` | [0x6dca3542…](https://explorer-studio.genlayer.com/tx/0x6dca354272a57db2a00032e7f01586493d52d0a9ede8d1e6c22ae4ec019c0dca) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `evaluate_delivery` | [0x303a914e…](https://explorer-studio.genlayer.com/tx/0x303a914e7e0b0eb0e9953710666c5a6b65ef5eb429741b55d0ba28e418c60d0a) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `challenge_delivery` | [0xf1945950…](https://explorer-studio.genlayer.com/tx/0xf1945950a657af85bc1298b679879730a14bc41f0f6f6fb4372c0780dcdc2e18) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `post_task` | [0x81db9468…](https://explorer-studio.genlayer.com/tx/0x81db946895550f161bf66b58014bef07158b28155965d7413ae16b7c0249b2f1) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_task` | [0x1a7e1113…](https://explorer-studio.genlayer.com/tx/0x1a7e11136ed2edb310e528c372f180e84cd32ea1adf2b59bdbf1ccbd881a1778) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `submit_delivery` | [0xddbead12…](https://explorer-studio.genlayer.com/tx/0xddbead123d2f9e21d1978268b1b81adf29568f96401dbfbd955b87f18999af75) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `evaluate_delivery` | [0x7de30731…](https://explorer-studio.genlayer.com/tx/0x7de307317a064c78dc41fa92f8fc489838c2a2c498c84539d9af9d671d11e29c) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `finalize_delivery` | [0x4d97c5b2…](https://explorer-studio.genlayer.com/tx/0x4d97c5b2f9339882574c98c4b6448fddb6036aef6677d375e06f5bac5e5350eb) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `post_task` | [0xf5db96f6…](https://explorer-studio.genlayer.com/tx/0xf5db96f6a4ca63486b5af764c1d74f0839a3cdd5930a9bef7374b600bc50101e) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_task` | [0x55d9b5d8…](https://explorer-studio.genlayer.com/tx/0x55d9b5d882fefbb53f998c79cd1496a9c3976fa258cd844d19a10dbe13576aaf) | FINALIZED | ERROR · MAJORITY_AGREE · STAKE_BELOW_MINIMUM |
| `top_up_stake` | [0x7201477a…](https://explorer-studio.genlayer.com/tx/0x7201477a920e69d4f08476b8ba930141f7d3df94b4c3f1f4646335214ee8bb74) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_task` | [0xd850a021…](https://explorer-studio.genlayer.com/tx/0xd850a021906dd5425bdcf8d94d5b47287135b8cc2746b909237c1f290cbd710e) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `expire_task` | [0xf0c4f550…](https://explorer-studio.genlayer.com/tx/0xf0c4f5507d8a7029016274f29c14450df928a4141a1380af6367d9d4c8076abf) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `post_task` | [0xa729d2c9…](https://explorer-studio.genlayer.com/tx/0xa729d2c969d60bc3bb2c655b7236141928e37d778554ea816f12a9ce9669b4c6) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_task` | [0x23579ee9…](https://explorer-studio.genlayer.com/tx/0x23579ee9247f1b64848a05f126a2e9d0e82440ae48f49865cb0fb94869cba636) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `submit_delivery` | [0x8453fea6…](https://explorer-studio.genlayer.com/tx/0x8453fea6758ccd2b4c5c66f6c1c2fa45a6763a55dd094927e1ae803da271e231) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `evaluate_delivery` | [0x3d0098eb…](https://explorer-studio.genlayer.com/tx/0x3d0098eb2c12ba1376a2b49362b70ecc0011ac54b049b693947c4da302ed8691) | FINALIZED | ERROR · MAJORITY_DISAGREE · CONSENSUS_NOT_REACHED |
| `evaluate_delivery` | [0x28b9ef10…](https://explorer-studio.genlayer.com/tx/0x28b9ef109ec61653b838dad151e516704fc9766d0650534652fcdc727c10d053) | FINALIZED | SUCCESS · MAJORITY_DISAGREE · CONSENSUS_NOT_REACHED |

The readable per-transaction state projections are in [live-verification.json](live-verification.json). Complete original receipts and full read-backs are preserved losslessly in [live-verification.full.json.gz](live-verification.full.json.gz); its uncompressed SHA-256 is recorded in the index. [final-state.json](final-state.json) is the last finalized read-back.

Seed fixtures are excluded from these outcomes and from issued-funds conservation checks. Local mock results are separate from network evidence.
