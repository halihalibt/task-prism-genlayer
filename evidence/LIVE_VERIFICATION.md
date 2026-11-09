# Live contract verification

Contract: `0x2D5d39cE2414F154D0D2cd574079167B26deA68c` on Stable Studionet, Chain ID 61999.

21 signed transactions have FINALIZED receipts and latest-final read-backs. These include 20 consensus-accepted successful executions, 1 intentional stake-threshold rejection and 0 consensus-rejected evaluation attempts with unchanged state. Amounts are simulated mGEN; no real GEN moves.

## Task outcomes

| Task | State | Verdict | Scores by round | Agent payment | Poster refund | Slash pool contribution |
| --- | --- | --- | --- | ---: | ---: | ---: |
| integrity-20261109121251 | FINALIZED | REJECT | 0/0/0 | 0 | 200 | 100 |
| pipeline-20261109121251 | EXPIRED | — | — | 0 | 200 | 0 |
| runbook-20261109121251 | FINALIZED | ACCEPT | 100/99/99; 97/96/95 | 200 | 0 | 0 |
| support-20261109121251 | SUBMITTED | — | — | 0 | 0 | 0 |

## Transaction receipts and read-backs

| Method | Transaction | Status | Execution |
| --- | --- | --- | --- |
| `claim_demo_funds` | [0xab351fa1…](https://explorer-studio.genlayer.com/tx/0xab351fa135a83934de20aaad740f25f3f7687ee032c2527828c1e0c2a01e987e) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_demo_funds` | [0x597119c6…](https://explorer-studio.genlayer.com/tx/0x597119c67581887486223edbc45f4975b4897d4f21a92e8339bdbd4e7a273b4e) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `register_agent` | [0xbde003fc…](https://explorer-studio.genlayer.com/tx/0xbde003fcea9e3880fd5c9de3c586af9d49fbbc4f5483822d3d21805486dfd135) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `post_task` | [0x26229750…](https://explorer-studio.genlayer.com/tx/0x2622975014efd13038da137bd53dd74478bc1dd0f070b190772f85a0345dda7c) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_task` | [0xe750ebc1…](https://explorer-studio.genlayer.com/tx/0xe750ebc116fda238269216933ed7e74cc6b749dd32247d71618dae47af0a6bfc) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `submit_delivery` | [0x1ce11385…](https://explorer-studio.genlayer.com/tx/0x1ce113851dd432b7c2b262a60a334aa19c8c2dbd9386b6b3ae9482b1b5b96e84) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `evaluate_delivery` | [0x488c80c3…](https://explorer-studio.genlayer.com/tx/0x488c80c3c36a9393fa014568adba8e036c60f6dbf7afc6dcb16b1ba338614682) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `challenge_delivery` | [0xcf6b0319…](https://explorer-studio.genlayer.com/tx/0xcf6b0319ef96d022ea285eca535f92613ddb9466dd71a419dfb1f4ee8eda1457) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `post_task` | [0x7c69ffc7…](https://explorer-studio.genlayer.com/tx/0x7c69ffc7301ec279cc16a346afb2f00a5cfcc2c4ee173b97afdbf9c7586e3f91) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_task` | [0x088fc682…](https://explorer-studio.genlayer.com/tx/0x088fc68253019a302b4632df4564d6d0dd61a21ee7b8bfaea3cf68257800f0dc) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `submit_delivery` | [0x89351c44…](https://explorer-studio.genlayer.com/tx/0x89351c44c0d84c214d943c33e83ff5b59b8c0b20438dd65b3a994f8c7d7bf32e) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `evaluate_delivery` | [0x0729c609…](https://explorer-studio.genlayer.com/tx/0x0729c609da11001fffd4e0ac99e8de8dd24dec7dcce23e647d67b6fd5c252235) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `finalize_delivery` | [0x8883a64f…](https://explorer-studio.genlayer.com/tx/0x8883a64fbffbc80892c866e974cbf660c1debddedd9bed37eca05c0fb9c43bc0) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `post_task` | [0x315a90fc…](https://explorer-studio.genlayer.com/tx/0x315a90fc7b0ff5892ea004683bb08d1f14c6fd06d69e41e22e3e07c413ccd62b) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_task` | [0x9eaed392…](https://explorer-studio.genlayer.com/tx/0x9eaed39285ba72922ee6585a88a7301e2ec253c56ac563052e4d719a281f7a49) | FINALIZED | ERROR · MAJORITY_AGREE · STAKE_BELOW_MINIMUM |
| `top_up_stake` | [0x01ff3199…](https://explorer-studio.genlayer.com/tx/0x01ff31991f7d468c545dada5b5b3699e4b5bbb95291b684f743b4b1947a263d0) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_task` | [0x7016ef4a…](https://explorer-studio.genlayer.com/tx/0x7016ef4ad048b38dcff2f3c63bd52b1c15336c0bf2067bdeff34a8d5af86b2a6) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `expire_task` | [0xf97c46b0…](https://explorer-studio.genlayer.com/tx/0xf97c46b0c0ff46f7067f3d1abbb40494d5e8cc090f9438c8ef3e52f1b9b0fc5a) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `post_task` | [0x38b50357…](https://explorer-studio.genlayer.com/tx/0x38b50357e864facf08f75013832c1e7a49a3ccc6386fc5d0766da68cfaba6df1) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `claim_task` | [0xff763ea1…](https://explorer-studio.genlayer.com/tx/0xff763ea190dbddc4cd9a00e8994d564f476b3427aa5124bca61608746787a932) | FINALIZED | SUCCESS · MAJORITY_AGREE |
| `submit_delivery` | [0x7a2bbce4…](https://explorer-studio.genlayer.com/tx/0x7a2bbce494c903eb591ff1f9bf533ee9af6015840cca7539a40bcb489578f9fd) | FINALIZED | SUCCESS · MAJORITY_AGREE |

The readable per-transaction state projections are in [live-verification.json](live-verification.json). Complete original receipts and full read-backs are preserved losslessly in [live-verification.full.json.gz](live-verification.full.json.gz); its uncompressed SHA-256 is recorded in the index. [final-state.json](final-state.json) is the last finalized read-back.

Seed fixtures are excluded from these outcomes and from issued-funds conservation checks. Local mock results are separate from network evidence.
