# Review TASK PRISM

[Open the task market](https://halihalibt.github.io/task-prism-genlayer/).

## Inspect without signing

1. Choose **User tasks** in the market index. Seed fixtures are labelled separately and are not consensus evidence.
2. Select **Inspect** on a task. The adjudication cockpit shows the English application status, specification commitment, delivery URL and hash.
3. Read each recorded round's three scores, verdict, rationale and contradiction witnesses. Two-round tasks retain both evaluations.
4. Inspect the settlement panel: agent payment, poster refund and treasury slash are simulated mGEN ledger movements.
5. Open **Chain evidence** for the raw finalized receipts and read-backs. Transaction FINALIZED is checked separately from successful contract execution.

## Recorded verdict paths

| Path | Task | Inspect |
| --- | --- | --- |
| ACCEPT · two retained rounds · 200 to agent | `runbook-20261109121251` | [Open task](https://halihalibt.github.io/task-prism-genlayer/?task=runbook-20261109121251#adjudication) |
| PARTIAL · 100 to agent · 100 refund | `support-20261109121251` | [Open task](https://halihalibt.github.io/task-prism-genlayer/?task=support-20261109121251#adjudication) |
| REJECT · 200 refund · 100 stake slash | `integrity-20261109121251` | [Open task](https://halihalibt.github.io/task-prism-genlayer/?task=integrity-20261109121251#adjudication) |

[Browser receipts and screenshots](BROWSER_ADJUDICATION.md) show the real pending-to-final settlement flow. [Live verification](LIVE_VERIFICATION.md) contains the complete current-contract transaction list.

## Try a new task

1. Choose **Connect**, then an injected EVM wallet or the explicitly labelled **temporary test account**. Temporary accounts disappear from browser memory on reload; do not use them for work you need to control later.
2. Switch an injected wallet to Stable Studionet, Chain ID 61999, if prompted. Reading the market never requires a wallet.
3. Claim demo funds once per address. Posting locks a positive even bounty from the simulated balance. No real GEN moves.
4. A different address registers an agent with at least 1000 simulated mGEN, then claims the task.
5. Submit a public, stable HTTPS UTF-8 text URL, its exact body SHA-256 and a summary. The browser can hash a CORS-enabled URL or the downloaded local file.
6. Run independent consensus. The first verdict leaves the task EVALUATING and escrow locked.
7. Finalize once, or have the poster/agent challenge before another transaction finalizes. A challenge independently evaluates again and immediately settles. There is no timed or guaranteed challenge window.
8. Expand **Transaction activity** to follow FINALIZED, execution status and latest-final read-back. Export the receipts if desired. RPC quotas may delay processing; clients honor the server's retry interval.

## Accounting rules

ACCEPT pays the full bounty and adds 10 reputation. PARTIAL splits the even bounty exactly and adds 2 reputation. REJECT refunds the poster, transfers 100 stake to treasury and removes 15 reputation. Matching verdict labels on a challenge remove 5 additional reputation from the challenger. A rejected agent at 900 stake must top up at least 100 before claiming again.
