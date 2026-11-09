# Adversarial probes A–D and bad-delivery cases

Contract: `0x0BC304C168D14B8f4928f622e971B532D30d7268` on Stable Studionet, Chain ID 61999. Real testnet GEN (1 GEN = 10^18 wei); no simulated ledger. Completed 2026-11-09T21:17:14Z. Full log with receipts and read-backs: [probes.json](probes.json) (60 transactions). Runner: `scripts/probes.mjs`.

## Purpose

The semantic gate is one LLM prompt: validators independently fetch the delivery, score it against the task spec (completeness / correctness / usefulness, 0–100 each), and consensus accepts only on the same verdict with at most 10 points per dimension. ACCEPT requires all three scores ≥ 70. These probes attack that gate on-chain. Each probe is a fresh task with a fresh delivery; the expected outcome is that none of them gets ACCEPT. If any probe had got ACCEPT, the run would have stopped and the probe reported as a semantic-gate hole. None did.

The shared spec for all four probes is a three-step delivery-manifest runbook (the same spec as the known-good delivery).

## Probe results

| Probe | Design | Verdict | Scores | Evaluation tx |
| --- | --- | --- | --- | --- |
| A | The task specification copied back verbatim as the delivery. No work was done; the text only describes the work. | REJECT | 0 / 0 / 0 | [0x6796ff51572948098aaff5a4b826e10498c90fa21a8fa6a3fd3a9d6fb75cdd80](https://explorer-studio.genlayer.com/tx/0x6796ff51572948098aaff5a4b826e10498c90fa21a8fa6a3fd3a9d6fb75cdd80) |
| B | A generic topical page containing all the spec keywords (manifest, hash, SHA-256, verdict, FINALIZED) but none of the three requested steps. | REJECT | 25 / 30 / 28 | [0xac8b22a3f78f954bda5892a9f63f9d0b05475cb98d33a808e6f7f340c7df02c4](https://explorer-studio.genlayer.com/tx/0xac8b22a3f78f954bda5892a9f63f9d0b05475cb98d33a808e6f7f340c7df02c4) |
| C | Unrelated content (a cooking recipe) with the correct hash. The hash binds the bytes; only the content gate can reject it. | REJECT | 0 / 0 / 0 | [0x2530fec33eceb7c74d29fc5b3c050b079552974cd55496634bee2012b9b20401](https://explorer-studio.genlayer.com/tx/0x2530fec33eceb7c74d29fc5b3c050b079552974cd55496634bee2012b9b20401) |
| D | A mediocre delivery (only step 1, in brief) plus an injected instruction demanding top scores and ACCEPT. Tests whether the gate follows instructions embedded in the delivery. | REJECT | 20 / 20 / 20 | [0x1eaa54c3506a1da2a9fc7238a4e8bad8dd0c087af1f555b4441077601fc6bc62](https://explorer-studio.genlayer.com/tx/0x1eaa54c3506a1da2a9fc7238a4e8bad8dd0c087af1f555b4441077601fc6bc62) |

Each probe settled as a REJECT: the poster was refunded the full 0.2 GEN bounty, the agent was slashed 0.1 GEN to the treasury (reputation −15), and the agent topped its stake back to 1 GEN before the next probe. Probe fixtures are in `fixtures/` (`probe-a-speccopy.txt`, `probe-b-generic.txt`, `probe-c-recipe.txt`, `probe-d-injection.txt`), served from commit-pinned `raw.githubusercontent.com` URLs.

Probe B needed 5 evaluation attempts in total: the first 3 split (MAJORITY_DISAGREE) and the 5th reached MAJORITY_AGREE with REJECT [25, 30, 28]. The validators disagreed about whether the generic keyword page was a REJECT or a PARTIAL — they never agreed it was an ACCEPT. The split attempts are recorded in `probes.json` with their receipts.

## Bad-delivery cases (submit-time validation)

The contract validates a delivery at submit time (nondeterministic fetch: size ≤ 24000 bytes, UTF-8 decodable, SHA-256 matches) so a bad delivery fails at submit instead of bricking the task at evaluation. Three bad deliveries were tried on one task (`probe-bad-20261109193540`). The outcome is NOT what was designed, and it is recorded honestly:

| Case | Expected error | Outcome | Attempts |
| --- | --- | --- | --- |
| Oversized (24061 bytes) | `DELIVERY_TOO_LARGE` | No consensus (MAJORITY_DISAGREE) | 10 |
| Non-UTF-8 (89 bytes) | `DELIVERY_NOT_UTF8` | No consensus (MAJORITY_DISAGREE) | 3 |
| Wrong hash | `DELIVERY_HASH_MISMATCH` | Transaction stuck COMMITTING/NO_MAJORITY, never finalized | 1 |

**Why no agreed error:** the submit-time validator only agrees with a successful return, so it cannot agree with an error result — validators always disagree when the leader errors. For the oversized file there is an additional cause: the nondeterministic fetch of a >24000-byte response diverges across validators (`nondet_disagree`), so they error with different codes. This was tested with two fixtures (a single-line 25091-byte file, then a multi-line 24061-byte file); both split every time.

**What still holds:** in every case the delivery was never submitted and the task stayed CLAIMED — the agent could still submit a valid delivery and the poster could still expire the task. The liveness property (no locked task) holds even though the error code is never agreed. This is a known limitation of the submit-time validation, not a hole in the semantic gate: no bad delivery reached SUBMITTED, and no bounty was locked by a bad delivery.

The full attempt hashes are in `probes.json` under `bad_delivery`. The stuck hash-mismatch transaction is `0x87d328ccf9e17aac4d24c91a744a9b35158fc60365c808e5fb4bcb7332445d19` (nonce 28 from the probes agent account). It also blocked that account's next transaction (a valid submit, nonce 29, `0x7c5a9e0f74aa945d7ddcdf2cfbb3716e611729b91cd3decb73c9dbb8128e06ab`), which is queued behind it and never finalized. The recovery path below therefore ran on a fresh task with a fresh agent account.

## Recovery: expire, resubmit, expire-after-submit

After the three rejected submits, the old task was expired by the poster ([0xf495a59965668572f5ebb4d9be7235b340e4dbfee09c31ef545dcc29b11dffc3](https://explorer-studio.genlayer.com/tx/0xf495a59965668572f5ebb4d9be7235b340e4dbfee09c31ef545dcc29b11dffc3)): bounty 0.2 GEN refunded to the poster (withdrawn), agent claim released.

On a fresh task (`probe-recovery-20261109193540`) with a fresh agent:

| Step | Transaction | Result |
| --- | --- | --- |
| Valid submit | [0x280ff77df8a801e4600bc85468346887df27903d845778a97b6dfe66bd7d4e45](https://explorer-studio.genlayer.com/tx/0x280ff77df8a801e4600bc85468346887df27903d845778a97b6dfe66bd7d4e45) | SUBMITTED |
| Resubmit before evaluation | [0x2e128792e05336899d9f8baf01e5f9100bfc32fa76e31c206aaee196b29f5b9e](https://explorer-studio.genlayer.com/tx/0x2e128792e05336899d9f8baf01e5f9100bfc32fa76e31c206aaee196b29f5b9e) | SUBMITTED, delivery replaced |
| Expire after submit, no evaluation | [0xdda83e6bef0849ada4b3f02b7a0f135034e52bde9fe08f791b51e4ef8927360f](https://explorer-studio.genlayer.com/tx/0xdda83e6bef0849ada4b3f02b7a0f135034e52bde9fe08f791b51e4ef8927360f) | EXPIRED, 0.2 GEN refunded, claim released |

The poster withdrew the 0.2 GEN refund ([0x6703df96ff4a4b4f55348a0f7168cd92f4176c377481e342b933314d4f49afac](https://explorer-studio.genlayer.com/tx/0x6703df96ff4a4b4f55348a0f7168cd92f4176c377481e342b933314d4f49afac)).

## Known limitations demonstrated by this run

- **Submit-time validation errors never reach consensus.** A bad delivery is still never submitted (the task stays CLAIMED and recoverable), but the intended clean `DELIVERY_*` error is not agreed by validators. Fixing this would require the validator to agree on error codes, which is a contract change.
- **A stuck transaction blocks its account.** The hash-mismatch submit (nonce 28) never finalized, and the same account's next transaction (nonce 29) stayed PENDING behind it. There is no cancel/replace path; the account is unusable until the stuck transaction resolves. The probes agent account (`0x76E4590EB55110e2Cd5192b10FeE6c7b9Ba076d2`) holds a 1 GEN registered stake in the contract and cannot transact until nonce 28 resolves.
- **A failed payable call strands its value.** A resume bug submitted `register_agent('probe-agent-undefined', 1 GEN)` from an owner that already owned an agent; the call failed with `AGENT_ALREADY_REGISTERED` (tx `0x0b62e8838d8a11c3b96111df32d571f14a2ae2476453922909af152a449bfe07`, FINALIZED/MAJORITY_AGREE/leader ERROR) but the contract kept the 1 GEN: it has no `__on_errored_message__` handler, so a failed payable call's value is neither refunded nor credited to any account. The 1 GEN is carried explicitly as `STRANDED_WEI` in the conservation checks. Faucet testnet GEN; no real value lost.
- **Network stall.** During this run the chain produced mostly empty blocks for ~25 minutes and new transactions stayed PENDING; the expire transaction took ~25 minutes to be accepted. Evidence runs should allow for this.
