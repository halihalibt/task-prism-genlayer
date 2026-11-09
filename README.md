# TASK PRISM

[Open TASK PRISM](https://halihalibt.github.io/task-prism-genlayer/)

Stake GEN to take a task. Deliver. Validators judge the delivery. Get paid, split, or slashed by the verdict.

**Simulated mGEN ledger, no real GEN moves.** The product tagline describes the task-market mechanism; this release uses integer demo credits, not GEN custody, token staking, or payments.

## Delivery adjudication

A poster escrows a positive even bounty from their demo balance. An agent locks at least 1000 simulated mGEN and claims one task at a time. Delivery binds an HTTPS URL to the SHA-256 of its exact response bytes. The specification is bound by its own SHA-256.

The leader fetches and hashes the delivery; each validator independently re-fetches, re-hashes and scores completeness, correctness and usefulness as integers from 0 to 100. Validators require the same verdict, hashes, basis and per-dimension threshold bands, with at most 10 points difference per dimension. The accepted leader scores, rationale and contradiction witnesses are persisted in the consensus result. Validator intermediate assessments are not automatically stored.

1. All scores at least 70: ACCEPT, full bounty to agent, reputation +10.
2. Any score below 40: REJECT, full refund, 100 stake to treasury, reputation -15.
3. Otherwise: PARTIAL, exact half to each party, reputation +2.

An unreachable delivery fails before storage writes and can be retried. Hash mismatch deterministically proposes REJECT with scores 0/0/0. Both paths obey the same pending/final settlement rules.

## State and settlement

`OPEN → CLAIMED → SUBMITTED → EVALUATING → FINALIZED`

The first evaluation stores a pending verdict without moving escrow. Anyone can call `finalize_delivery` to settle it once. Before that call, poster or agent can challenge once. The second independent evaluation records a `DISPUTED` event and settles directly to FINALIZED in the same atomic transaction; DISPUTED is not a durable waiting state. Both rounds are retained. Matching verdict labels mean a failed challenge, costing the challenger 5 reputation. Scores need not match for that penalty. No third round is allowed.

There is no guaranteed challenge interval: finalization and challenge compete in transaction order. OPEN or CLAIMED tasks may be explicitly expired by the poster before delivery; this refunds escrow and unlocks the claim. There is no automatic expiry or clock dependency. FINALIZED and EXPIRED tasks cannot be reopened.

Reputation belongs to the address and starts at 100 on first registration or posting. `top_up_stake` moves demo balance into an idle agent's stake. After a rejection leaves 900, the agent must replenish at least 100 before claiming again. Sender authorization uses `gl.message.sender_address`; callers cannot act as another agent or poster.

## Run locally

```sh
npm ci
npm test
npm run check
npm run build
npm run dev
```

Tests in `tests/test_task_prism.py` are **LOCAL MOCK** tests, not on-chain consensus evidence. Three reserved agents and three read-only tasks are labelled `seed_demo` / “Seed demo data, not consensus evidence.” They have no adjudicated verdicts. Locally mocked ACCEPT, PARTIAL and REJECT tests create separate task records.

## Stable Studionet

Only Chain ID **61999**, RPC `https://studio.genlayer.com/api`, is supported. `deploy.py --dry-validate` checks the chain, schema, source hash and wrong-chain rejection without transactions. `deploy.py` deploys using genlayer-js 1.1.8 and a newly generated in-memory signing account via `eth_sendRawTransaction`. It never accepts or saves a private key. Transaction evidence records public addresses and receipts only.

The [read-only review path](evidence/REVIEWER_QUICK_PATH.md) explains how to inspect evidence without signing. [Live transaction records](evidence/LIVE_VERIFICATION.md) distinguish majority agreement, execution results and state read-backs.

See [known limitations](KNOWN_LIMITATIONS.md), [contract source](contracts/task_prism.py), and [evidence](evidence/).
