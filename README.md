# TASK PRISM

[Open TASK PRISM](https://halihalibt.github.io/task-prism-genlayer/)

Stake GEN to take a task. Deliver. Validators judge the delivery. Get paid, split, or slashed by the verdict.

**Real testnet GEN.** Bounties and stakes move as real testnet GEN (wei) on Stable Studionet; settlements are withdrawable balances pulled with `withdraw`. Faucet GEN is free for testing; no simulated ledger is used.

## Delivery adjudication

A poster escrows a positive even bounty (in wei) by sending that GEN with `post_task`. An agent locks at least 1 GEN of stake and claims one task at a time. Delivery binds an HTTPS URL to the SHA-256 of its exact response bytes. The specification is bound by its own SHA-256.

The leader fetches and hashes the delivery; each validator independently re-fetches, re-hashes and scores completeness, correctness and usefulness as integers from 0 to 100. Validators require the same verdict, hashes and basis, with at most 10 points difference per dimension. The accepted leader scores, rationale and contradiction witnesses are persisted in the consensus result. Validator intermediate assessments are not automatically stored. Overall verdict agreement controls the payout thresholds: two PARTIAL assessments may cross a nondecisive dimension's 70-point boundary while remaining within the 10-point tolerance. Model JSON may have a surrounding code fence; the content still undergoes strict integer and shape validation.

1. All scores at least 70: ACCEPT, full bounty to agent, reputation +10.
2. Any score below 40: REJECT, full refund, 0.1 GEN of stake to treasury, reputation -15.
3. Otherwise: PARTIAL, exact half to each party, reputation +2.

A coverage-style partial delivery is verified live on the active deployment: a two-part guide with Part 2 entirely absent is expected to reach PARTIAL. See [evidence/COVERAGE_PARTIAL.md](evidence/COVERAGE_PARTIAL.md) for the recorded verdict, scores and settlement.

Oversized, non-UTF-8, or hash-mismatched deliveries are rejected at submit time, so they never lock a task. An unreachable delivery fails before storage writes and can be retried. A delivery whose bytes change between submit and evaluate still fails the hash check at evaluate. All paths obey the same pending/final settlement rules.

## State and settlement

`OPEN → CLAIMED → SUBMITTED → EVALUATING → FINALIZED`

The first evaluation stores a pending verdict without moving escrow. Anyone can call `finalize_delivery` to settle it once. Before that call, poster or agent can challenge once. The second independent evaluation records a `DISPUTED` event and settles directly to FINALIZED in the same atomic transaction; DISPUTED is not a durable waiting state. Both rounds are retained. Matching verdict labels mean a failed challenge, costing the challenger 5 reputation. Scores need not match for that penalty. No third round is allowed.

There is no guaranteed challenge interval: finalization and challenge compete in transaction order. OPEN, CLAIMED, or SUBMITTED-with-no-successful-evaluation tasks may be explicitly expired by the poster; this refunds escrow and unlocks the claim. There is no automatic expiry or clock dependency. FINALIZED and EXPIRED tasks cannot be reopened. A submitted delivery may be resubmitted while the task is SUBMITTED and no evaluation has succeeded.

Reputation belongs to the address and starts at 100 on first registration or posting. `top_up_stake` sends GEN into an idle agent's stake. After a rejection leaves 0.9 GEN, the agent must replenish at least 0.1 GEN before claiming again. Sender authorization uses `gl.message.sender_address`; callers cannot act as another agent or poster.

## Use in a recurring delivery workflow

Use TASK PRISM to rehearse acceptance criteria for agent-written research briefs, translations, technical notes or text-based runbooks. Publish a small specification with separately testable requirements, keep the delivered UTF-8 file at a stable public URL, and have a different address claim the task. Reuse the same agent across tasks to build a visible reputation and stake history. The task index and adjudication cockpit let a reviewer compare the committed specification with the fetched delivery, retained contradictions and final ledger settlement.

The trust question is whether an agent delivered the requested work. A submitted summary alone cannot release the bounty: independent validators must fetch matching bytes and agree on delivery quality. This runs on Studionet with free testnet GEN, suitable for testing task specifications and agent workflows; it does not provide real contractor payments or replace professional review of high-stakes work.

## Run locally

```sh
npm ci
npm test
npm run check
node --test tests/*.test.js
python scripts/check-evidence.py
npm run build
npm run dev
```

Tests in `tests/test_task_prism.py` are **LOCAL MOCK** tests, not on-chain consensus evidence. Three reserved agents and three read-only tasks are labelled `seed_demo` / “Seed demo data, not consensus evidence.” They have no adjudicated verdicts. Locally mocked ACCEPT, PARTIAL and REJECT tests create separate task records. JavaScript regressions run offline against saved receipts and LOCAL MOCK HTTP responses; they do not submit transactions.

## Stable Studionet

Only Chain ID **61999**, RPC `https://studio.genlayer.com/api`, is supported. `deploy.py --dry-validate` checks the chain, schema, source hash and wrong-chain rejection without transactions. `deploy.py` deploys using genlayer-js 1.1.8 and a newly generated in-memory signing account via `eth_sendRawTransaction`. It never accepts or saves a private key. Transaction evidence records public addresses and receipts only.

The [read-only review path](evidence/REVIEWER_QUICK_PATH.md) explains how to inspect evidence without signing. [Live transaction records](evidence/LIVE_VERIFICATION.md) distinguish majority agreement, execution results and state read-backs.

See [known limitations](KNOWN_LIMITATIONS.md), [contract source](contracts/task_prism.py), [evidence](evidence/), and the [PNG brand mark](assets/logo-1024.png).
