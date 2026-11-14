# Review TASK PRISM

> Current deployment enforces a one-hour first-verdict challenge window and separate 24-hour delivery and review deadlines. See [TIMING_PROTECTIONS.md](TIMING_PROTECTIONS.md).

[Open the task market](https://halihalibt.github.io/task-prism-genlayer/).

Contract: `0x60A05E9C82801E90837BD3688636bf213B80528f` on Stable Studionet, Chain ID 61999. Real testnet GEN (1 GEN = 10^18 wei); no simulated ledger.

## Inspect without signing

1. Choose **User tasks** in the market index. Seed fixtures are labelled separately and are not consensus evidence.
2. Select **Inspect** on a task. The adjudication cockpit shows the English application status, specification commitment, delivery URL and hash.
3. Read each recorded round's three scores, verdict, rationale and contradiction witnesses. Two-round tasks retain both evaluations.
4. Inspect the settlement panel: agent payment, poster refund and treasury slash are real testnet GEN movements, paid as withdrawable balances pulled with `withdraw`.
5. Open **Chain evidence** for the raw finalized receipts and read-backs. Transaction FINALIZED is checked separately from successful contract execution.

## Recorded timing paths

[Current deployment evidence](timing-deployment/LIVE_TIMING.md) records 37 FINALIZED / MAJORITY_AGREE transactions: 25 successful executions and 12 expected rejections. It includes early expiry and finalization refusals, challenge within the window, settlement after the window, both 24-hour expiry paths, unchanged resubmission deadlines, refunds, unlocking and withdrawals. The [archive index](timing-deployment/index.json) identifies original receipts and latest-final state snapshots.

[Previous deployment verification](LIVE_VERIFICATION.md), [coverage case](COVERAGE_PARTIAL.md), [adversarial probes](PROBES.md) and [browser adjudication](BROWSER_ADJUDICATION.md) are historical evidence from the superseded untimed contract. Their task IDs should not be used as current-deployment task links.

## Try a new task

1. Choose **Connect**, then an injected EVM wallet or the explicitly labelled **temporary test account**. Temporary accounts disappear from browser memory on reload; do not use them for work you need to control later.
2. Switch an injected wallet to Stable Studionet, Chain ID 61999, if prompted. Reading the market never requires a wallet.
3. Fund the account with free testnet GEN from the faucet. Posting locks a positive even bounty in real testnet GEN (a payable transaction); the bounty must be sent exactly. Settlements are withdrawable GEN pulled with `withdraw`.
4. A different address registers an agent with a 1 GEN stake, then claims the task.
5. Submit a public, stable HTTPS UTF-8 text URL, its exact body SHA-256 and a summary. The browser can hash a CORS-enabled URL or the downloaded local file. The delivery is validated at submit time (size ≤ 24000 bytes, UTF-8, hash matches); a bad delivery is not submitted and the task stays claimable. The agent may resubmit before evaluation.
6. Run independent consensus. The first verdict leaves the task EVALUATING and escrow locked.
7. The poster or agent can challenge strictly before `challenge_deadline` (one hour from the first evaluation transaction time); a second independent evaluation immediately settles. Anyone can finalize once at or after that deadline. The poster can expire CLAIMED tasks only at or after the 24-hour delivery deadline, or unevaluated SUBMITTED tasks only at or after the separate 24-hour review deadline. Resubmission does not extend review. Expiry refunds the bounty and releases the claim.
8. Expand **Transaction activity** to follow FINALIZED, execution status and latest-final read-back. Export the receipts if desired. RPC quotas may delay processing; clients honor the server's retry interval.

## Accounting rules

ACCEPT pays the full bounty and adds 10 reputation. PARTIAL splits the even bounty exactly and adds 2 reputation. REJECT refunds the poster, transfers 0.1 GEN stake to treasury and removes 15 reputation. Matching verdict labels on a challenge remove 5 additional reputation from the challenger. A rejected agent at 0.9 GEN stake must top up 0.1 GEN to 1 GEN before claiming again.
