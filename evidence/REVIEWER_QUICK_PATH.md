# Review TASK PRISM

[Open the task market](https://halihalibt.github.io/task-prism-genlayer/).

Contract: `0x0BC304C168D14B8f4928f622e971B532D30d7268` on Stable Studionet, Chain ID 61999. Real testnet GEN (1 GEN = 10^18 wei); no simulated ledger.

## Inspect without signing

1. Choose **User tasks** in the market index. Seed fixtures are labelled separately and are not consensus evidence.
2. Select **Inspect** on a task. The adjudication cockpit shows the English application status, specification commitment, delivery URL and hash.
3. Read each recorded round's three scores, verdict, rationale and contradiction witnesses. Two-round tasks retain both evaluations.
4. Inspect the settlement panel: agent payment, poster refund and treasury slash are real testnet GEN movements, paid as withdrawable balances pulled with `withdraw`.
5. Open **Chain evidence** for the raw finalized receipts and read-backs. Transaction FINALIZED is checked separately from successful contract execution.

## Recorded verdict paths

| Path | Task | Inspect |
| --- | --- | --- |
| ACCEPT · two retained rounds · 0.2 GEN to agent | `runbook-20261109190501` | [Open task](https://halihalibt.github.io/task-prism-genlayer/?task=runbook-20261109190501#adjudication) |
| PARTIAL · 0.1 GEN to agent · 0.1 GEN refund | `support-20261109190501` | [Open task](https://halihalibt.github.io/task-prism-genlayer/?task=support-20261109190501#adjudication) |
| REJECT · 0.2 GEN refund · 0.1 GEN stake slash | `integrity-20261109190501` | [Open task](https://halihalibt.github.io/task-prism-genlayer/?task=integrity-20261109190501#adjudication) |

[Live verification](LIVE_VERIFICATION.md) contains the complete current-contract transaction list. [Coverage case](COVERAGE_PARTIAL.md) and [adversarial probes](PROBES.md) are separate supplements. The browser adjudication in [BROWSER_ADJUDICATION.md](BROWSER_ADJUDICATION.md) is a historical record from the superseded contract and is not current-contract evidence.

## Try a new task

1. Choose **Connect**, then an injected EVM wallet or the explicitly labelled **temporary test account**. Temporary accounts disappear from browser memory on reload; do not use them for work you need to control later.
2. Switch an injected wallet to Stable Studionet, Chain ID 61999, if prompted. Reading the market never requires a wallet.
3. Fund the account with free testnet GEN from the faucet. Posting locks a positive even bounty in real testnet GEN (a payable transaction); the bounty must be sent exactly. Settlements are withdrawable GEN pulled with `withdraw`.
4. A different address registers an agent with a 1 GEN stake, then claims the task.
5. Submit a public, stable HTTPS UTF-8 text URL, its exact body SHA-256 and a summary. The browser can hash a CORS-enabled URL or the downloaded local file. The delivery is validated at submit time (size ≤ 24000 bytes, UTF-8, hash matches); a bad delivery is not submitted and the task stays claimable. The agent may resubmit before evaluation.
6. Run independent consensus. The first verdict leaves the task EVALUATING and escrow locked.
7. Finalize once, or have the poster/agent challenge before another transaction finalizes. A challenge independently evaluates again and immediately settles. There is no timed or guaranteed challenge window. The poster may expire a task whose delivery was submitted but never successfully evaluated, refunding the bounty and releasing the claim.
8. Expand **Transaction activity** to follow FINALIZED, execution status and latest-final read-back. Export the receipts if desired. RPC quotas may delay processing; clients honor the server's retry interval.

## Accounting rules

ACCEPT pays the full bounty and adds 10 reputation. PARTIAL splits the even bounty exactly and adds 2 reputation. REJECT refunds the poster, transfers 0.1 GEN stake to treasury and removes 15 reputation. Matching verdict labels on a challenge remove 5 additional reputation from the challenger. A rejected agent at 0.9 GEN stake must top up 0.1 GEN to 1 GEN before claiming again.
