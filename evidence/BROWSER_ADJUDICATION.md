# Browser delivery adjudication — historical (superseded contract)

> This records a browser-submitted adjudication on the superseded contract `0x2D5d39cE2414F154D0D2cd574079167B26deA68c` (simulated mGEN). It is retained for history, not current-contract evidence. The current contract is `0x0BC304C168D14B8f4928f622e971B532D30d7268` (real testnet GEN); see [LIVE_VERIFICATION.md](LIVE_VERIFICATION.md), [COVERAGE_PARTIAL.md](COVERAGE_PARTIAL.md) and [PROBES.md](PROBES.md). Its data files are archived under [history/consensus-compatible-contract/](history/consensus-compatible-contract/).

[Open this finalized task](https://halihalibt.github.io/task-prism-genlayer/?task=support-20261109121251#adjudication).

Contract: `0x2D5d39cE2414F154D0D2cd574079167B26deA68c` on Stable Studionet, Chain ID 61999.

These two transactions were submitted by the Pages application using its labelled in-memory temporary test account. They are not an injected-wallet signature. Simulated mGEN ledger, no real GEN moves.

| Operation | Transaction | Consensus | Execution | Read-back |
| --- | --- | --- | --- | --- |
| `evaluate_delivery` | [0x42352c32ee18417d9898f1ba16b96a3584a662993303dcf98c718afad41ea693](https://explorer-studio.genlayer.com/tx/0x42352c32ee18417d9898f1ba16b96a3584a662993303dcf98c718afad41ea693) | MAJORITY_AGREE | SUCCESS · FINALIZED | EVALUATING |
| `finalize_delivery` | [0x90e9aa9f3b1ad58400dda15e950f1099f097f8669b29158452c8500893227046](https://explorer-studio.genlayer.com/tx/0x90e9aa9f3b1ad58400dda15e950f1099f097f8669b29158452c8500893227046) | MAJORITY_AGREE | SUCCESS · FINALIZED | FINALIZED |

The first read-back retained PARTIAL as a pending verdict with locked escrow and no settlement. Completeness, correctness and usefulness were **60 / 95 / 60**. The final read-back preserved the same round and contradiction witnesses.

| Ledger field | Before settlement | After settlement |
| --- | ---: | ---: |
| Agent balance · mGEN | 9100 | 9200 |
| Poster balance · mGEN | 9600 | 9700 |
| Agent reputation | 95 | 97 |
| Agent stake · mGEN | 1000 | 1000 |
| Treasury · mGEN | 100 | 100 |

The agent received 100 and the poster received 100. The claim was unlocked, with no slash. The offline evidence checker validates these deltas, integer scores, the immutable round, archive hashes and conservation of issued credits.

[Manifest and archive hashes](browser-adjudication-manifest.json) · [Original browser export](browser-adjudication.json.gz) · [Core setup receipts](cli-core.full.json.gz) · [Verdict screenshot](ui-partial-verdict.jpg) · [Settlement screenshot](ui-partial-settlement.jpg)
