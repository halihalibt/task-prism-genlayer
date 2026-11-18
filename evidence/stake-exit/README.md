# Stake principal withdrawal

Baseline: [timing-protected release](https://github.com/halihalibt/task-prism-genlayer/tree/a24e07e5e9ed7aebb431f52c81898b36d4f29d6c). The prior source snapshot is preserved here so its receipts can still be verified against the original bytes.

The agent owner can withdraw the full remaining principal when the agent has no open claim. The call binds the amount shown at signing, zeroes the stake before emitting the transfer, and leaves the agent identity, reputation and settlement credits intact. The existing minimum-stake check blocks new claims until the agent tops up to 1 GEN. Demo fixtures have no funded principal and cannot withdraw. Claims continue to lock the principal through delivery, evaluation and the challenge window.

The account panel shows the stake and settlement balance separately. On the stake-exit deployment, the dedicated withdrawal button requests confirmation for the exact principal amount.

Run the historical evidence check and the local regression suite:

```sh
npm ci
npm test
npm run check
python3 scripts/check-evidence.py
npm run build
```

The deployment script supports a separate record for this contract with `node scripts/deploy.js --confirm-deploy --stake-exit`. After deployment is FINALIZED with successful execution, `node scripts/stake-exit-live.js --confirm-live` exercises the Studionet lifecycle and records transaction hashes, receipts, readbacks and balance checks. Continue an interrupted run with the same local signer files and journal.

Any balances, escrow and reputation on the earlier deployment stay on that contract. This release adds a withdrawal path to the new deployment.

## Finalized Studionet evidence

- [Deployment manifest](deployment.json) and [deployment receipt](deploy-receipt.json).
- [Live verification journal](live.json) with 13 finalized calls, including 9 successful executions and 4 intended contract rejections.
- Idle withdrawal credited the owner exactly 1 GEN. A repeat call was rejected, then the same agent topped up and successfully claimed a task.
- Both an active claim and a pending verdict blocked withdrawal. Independent GenLayer evaluation and a real challenge settled a rejected delivery and slashed 0.1 GEN.
- The stale 1 GEN request was rejected. The subsequent withdrawal credited exactly 0.9 GEN, while the poster refund and treasury slash remained on the contract ledger.
- [Open the previous deployment](https://halihalibt.github.io/task-prism-genlayer/?deployment=timing) to continue existing tasks and settlement withdrawals there.
