# Task deadline and challenge protections

The timing-protected source is deployed at `0x60A05E9C82801E90837BD3688636bf213B80528f`. [Deployment transaction](https://explorer-studio.genlayer.com/tx/0x8b56d9fe5e2263c475996e541ea1f5e9f60c4115b843261c397a91059a77cfe7) is FINALIZED / MAJORITY_AGREE / SUCCESS, with latest-final read-back and exact deployed source-byte verification. Real elapsed-time validation is still pending; see [live timing evidence](timing-deployment/). The previous address `0x0BC304C168D14B8f4928f622e971B532D30d7268` and its receipts remain historical evidence only.

## Rules and regression coverage

| Requirement | Contract enforcement | Local regression coverage |
| --- | --- | --- |
| Nonzero period before the first verdict can finalize | First successful evaluation stores `evaluated_at` and `challenge_deadline = evaluated_at + 3600`. `finalize_delivery` rejects transaction times before that deadline. Authorized challenge requires time strictly before it. The second adjudication still settles atomically. | `test_first_verdict_blocks_all_early_finalizers` checks ACCEPT, PARTIAL, REJECT, all caller roles, immediate and deadline-minus-one rejection, exact-deadline settlement, conservation and duplicate finalization. `test_challenge_last_second_survives_early_finalize_attempt` and `test_challenge_at_or_after_deadline_cannot_race_finalization` cover the complementary boundary and preserved rounds. |
| Prevent premature expiry of claimed work | Claim stores `claimed_at` and `delivery_deadline = claimed_at + 86400`. Poster expiry requires time at or after it. Delivery requires time strictly before it. | `test_claim_has_full_delivery_period_and_no_early_poster_refund`, `test_late_delivery_rejected_before_fetch_and_no_deadline_reset`, and existing authorization and claim-lock tests cover early attempts, expiry boundary, agent unlock, no early refund, and no late submission. |
| Prevent premature expiry of submitted work | First successful submission stores `submitted_at` and `review_deadline = submitted_at + 86400`. A last-second delivery receives the full review period. Resubmission does not extend it. First evaluation requires time before it. Poster expiry requires time at or after it and no recorded round. | `test_last_second_delivery_starts_independent_full_review_period`, `test_submitted_expiry_protects_review_and_refunds_once_at_deadline`, `test_resubmission_cannot_grief_poster_by_extending_review`, `test_late_evaluation_cannot_remove_poster_expiry_right`, `test_nonposter_cannot_expire_before_or_after_deadlines`, and `test_evaluated_task_cannot_be_expired_even_after_all_deadlines`. |
| Failed nondeterministic calls must not change deadlines or settlement | Time checks precede fetching; all storage writes remain after successful fetch/consensus. | `test_failed_consensus_does_not_create_or_extend_any_deadline`, `test_failed_challenge_preserves_original_window_for_retry`, existing bad-delivery, validator disagreement and unreachable-resource tests assert byte-identical state after rejected calls. |

Time is derived from GenVM `gl.message_raw['datetime']`, parsed with an explicit timezone and converted to integer UTC seconds without floating-point arithmetic. There is no timestamp argument a poster can choose. The [GenLayer transaction-context documentation](https://docs.genlayer.com/developers/intelligent-contracts/features/transaction-context) describes this runtime value. The parser has UTC-offset, fractional-second, missing-context and missing-timezone tests. Events include transaction timestamps. No background expiry runs.

The periods are fixed constants, not poster settings. OPEN cancellation remains immediate because no agent has claimed the task. Expiry never slashes stake. EVALUATING tasks cannot expire, even after all deadlines. Failed consensus consumes elapsed time without extending deadlines. A participant must allow time for retries. Transaction datetime is pinned for execution and can precede consensus completion; the one-hour interval begins at the evaluation transaction datetime, not browser observation time.

## Frontend and evidence separation

The browser displays UTC deadlines and uses `taskActions` to disable actions outside their intervals. These controls use the browser clock as guidance only; the contract remains authoritative. Missing deadlines fail closed for claimed, submitted and evaluating tasks. Contract authorization checks remain unchanged.

`config.js` reads the new address and keeps `deploymentPending: true` until elapsed-time checks finish. All writes are disabled on this branch; a visible English/Chinese notice explains that live elapsed-time verification is pending. This branch has not been published to Pages. Existing Pages behavior is unaffected by a branch push.

`history/real-gen-untimed/task_prism.py` preserves the exact old deployed bytes. `check-evidence.py` validates the old receipt against that snapshot and the candidate hash separately, rather than treating a new local source as deployed. Historical signed workflows refuse to run against a different source hash. Deployment without an explicit `--confirm-deploy` signing flag exits before network activity or account creation.

## Reproducible local validation

```sh
npm ci
npm test
node --test tests/*.test.js
npm run check
python3 scripts/check-evidence.py
npm run build
python3 deploy.py --dry-validate
```

Observed on 2026-11-13:

| Check | Result | Scope |
| --- | --- | --- |
| Baseline Python suite before changes | 39 passed | LOCAL MOCK |
| Python suite after changes | 54 passed | LOCAL MOCK; 39 original cases retained with elapsed-time setup where required, 15 new timing cases |
| Node tests | 12 passed | Offline timing controls, deployment guards, transport mocks and saved receipt handling |
| `npm run check` | Passed | i18n parity, source identity separation, wrong-chain guard and existing static checks |
| `python3 scripts/check-evidence.py` | Passed; 25 saved verified core transactions | Offline previous-version receipts; no timing evidence implied |
| `npm run build` | Passed | Existing esbuild static Pages build |
| `python3 deploy.py --dry-validate` | Chain 61999, wrong-chain rejection and schema accepted | Read-only RPC; see `timing-schema-preflight.json`. Not execution of timed methods. |
| Previous contract `latest-final` read | 19 user tasks: 15 FINALIZED, 4 EXPIRED; 0 timed tasks | Read-only; see `timing-previous-read.json`. |
| Playwright browser attempt | Blocked before page load | Bundled browser missing. System Chromium then failed with `process_singleton_posix ... socket() failed: Operation not permitted (1)`. No browser assertion ran; see `timing-browser-local.json`. |

Optional browser reproduction with a working Chromium/Playwright installation:

```sh
# Run the build first. This test intercepts RPC with LOCAL MOCK state.
# Set PLAYWRIGHT_MODULE to an absolute installed module path if needed.
# Set CHROMIUM_PATH to an installed Chromium executable if needed.
node tests/browser-timing.mjs
```

The browser attempt is not reported as a pass. Local Python and JavaScript cases do not prove validator execution of the timestamp parser or real elapsed-time behavior on Studionet.

## Deployment and live validation

This version changes the contract and has now been deployed using the original SDK deployment method. It uses the existing generated test-account signing method. The previous address cannot be used as new-version evidence. New deployment and validation transaction receipts are recorded separately; the user-wallet path is not implied.

The existing deploy wrapper and genlayer-js 1.1.8 encoding remain in use. The `python3 deploy.py --confirm-deploy` command creates an in-memory signing account and records its new attempt in `evidence/timing-deployment/`, without overwriting old evidence. If that directory already contains a deployment attempt, the script stops before another signature so the existing attempt can be inspected. A signed deployment must reach transaction FINALIZED, consensus agreement and successful execution, followed by a `latest-final` read-back. Verify deployed bytes and hash against `timing-candidate.json`.

The resumable `node scripts/timing-live.js --confirm-live` suite creates distinct test accounts, retains signing keys only in ignored `.local/`, and records real receipts and state snapshots. It performs the following live checks with production time periods unchanged. `--due` only runs eligible elapsed-time actions; it never changes a timestamp. Do not start a second runner while another is active. Completed operations are skipped; an uncertain broadcast stops for inspection rather than automatically submitting again.

Full elapsed-time checks:

1. Claim: an immediate poster expiry must fail with `DELIVERY_PERIOD_ACTIVE`; funds and the agent lock must remain unchanged. At `delivery_deadline`, expiry must refund once and unlock the agent.
2. Submit on a separate task before its delivery deadline: immediate poster expiry must fail with `REVIEW_PERIOD_ACTIVE`. Resubmission must preserve the original review deadline. On an unevaluated task at that deadline, expiry must refund once and unlock the agent. Early attempts and later success must retain receipts and state read-backs.
3. Evaluate a separate submitted task: immediate finalize must fail with `CHALLENGE_PERIOD_ACTIVE`, with unchanged escrow and pending verdict. An authorized challenge before the deadline must retain both rounds and settle once. A separate unchallenged task must finalize only at or after the one-hour deadline; late challenge must fail.
4. Repeat value conservation, payout/slash and duplicate-settlement checks on the newly deployed version. Use actual elapsed time; changing simulated timestamps is not live timing evidence.
5. Update the deployed manifest, source identity and frontend address only with actual successful receipts. Preserve the old records, enable writes only for the verified deployment, and publish Pages from the reviewed branch through the existing main-branch workflow.

Until these new-version live checks exist, this source does not establish deployment-level resolution of the timing requirements.

## Changed files

- `.github/workflows/pages.yml`
- `KNOWN_LIMITATIONS.md`
- `README.md`
- `app.js`
- `config.js`
- `contracts/task_prism.py`
- `evidence/COVERAGE_PARTIAL.md`
- `evidence/DEPLOYMENTS.md`
- `evidence/LIVE_VERIFICATION.md`
- `evidence/PROBES.md`
- `evidence/README.md`
- `evidence/REVIEWER_QUICK_PATH.md`
- `evidence/TIMING_PROTECTIONS.md`
- `evidence/history/real-gen-untimed/task_prism.py`
- `evidence/timing-browser-local.json`
- `evidence/timing-candidate.json`
- `evidence/timing-local-validation.txt`
- `evidence/timing-previous-read.json`
- `evidence/timing-schema-preflight.json`
- `i18n_and_styles.js`
- `scripts/check-evidence.py`
- `scripts/check.js`
- `scripts/coverage-case.mjs`
- `scripts/deploy.js`
- `scripts/deployment-source.js`
- `scripts/live-verify.js`
- `scripts/probes.mjs`
- `scripts/task-timing.js`
- `scripts/verify-translation.js`
- `tests/browser-timing.mjs`
- `tests/deployment-guard.test.js`
- `tests/task-timing.test.js`
- `tests/test_task_prism.py`

The captured command output is retained in [timing-local-validation.txt](timing-local-validation.txt). No original JSON receipt or compressed evidence archive was modified.

## Additional local validation

The new live-runner confirmation guard passes before network/signing (Node suite: 13 passing). Initial receipt checking exposed a local checker assumption that GEN balances were decimal; RPC returned a `0x` quantity. The checker now explicitly parses hexadecimal and decimal balances, and the rerun passes. This was a checker failure, not a failed contract execution; original receipts are unchanged.
