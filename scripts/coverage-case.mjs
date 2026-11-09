// Coverage-style partial-delivery case (scripts/coverage-case.mjs).
//
// The relaxed consensus rule (same verdict + at most 10 points per
// dimension) was introduced after validators split twice on a two-section
// delivery under the strict same-band rule. The rule is mock-tested, and
// the new contract finalized a PARTIAL verdict for a five-item support
// sheet, but it was never tested live on a two-section delivery where one
// whole section is absent. This script runs exactly that shape against the
// EXISTING deployment (no redeploy, no contract change):
//
//   Spec: two equally important parts. Part 1: local setup guide.
//         Part 2: version 1 to version 2 migration guide.
//   Delivery: Part 1 complete, Part 2 entirely absent.
//   Expected: PARTIAL (completeness ~half, correctness high on what is
//   there, usefulness ~half).
//
// The delivery file lives in fixtures/coverage-partial.txt and is fetched
// by validators from a raw.githubusercontent.com URL pinned to the commit
// that introduced it, so the bytes are immutable. The script verifies the
// pinned URL serves the exact local bytes before submitting.
//
// Flow (fresh ephemeral accounts, keys in ignored .local/):
//   poster claims funds, agent claims funds, agent registers, poster posts
//   the task, agent claims, agent submits the delivery, observer evaluates
//   (up to 3 attempts; a failed consensus writes no state and is recorded
//   honestly), observer finalizes. Every step asserts ledger conservation.
//   The verdict is recorded as observed, not assumed: the case passes only
//   if the pending verdict is PARTIAL and settlement is 100/100 with +2
//   reputation.
//
// Run: node scripts/coverage-case.mjs
// Output: evidence/coverage-partial.json (full log with receipts and
// read-backs), evidence/COVERAGE_PARTIAL.md (summary),
// evidence/final-state.json (last finalized read-back).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createAccount, generatePrivateKey } from 'genlayer-js';
import { rpc, reader, readFinal, sendLocal, encoded, validateChain } from './network.js';

const deployment = JSON.parse(fs.readFileSync('evidence/deployment.json', 'utf8'));
const address = deployment.contract_address;
assert(address, 'No contract address in evidence/deployment.json');
await validateChain();
const hash = (s) => createHash('sha256').update(s).digest('hex');

function loadAccountSync(name) {
  fs.mkdirSync('.local', { recursive: true, mode: 0o700 });
  const keyPath = `.local/${name}`;
  if (!fs.existsSync(keyPath)) fs.writeFileSync(keyPath, generatePrivateKey(), { mode: 0o600 });
  return createAccount(fs.readFileSync(keyPath, 'utf8').trim());
}
const poster = loadAccountSync('coverage-poster-key');
const agentOwner = loadAccountSync('coverage-agent-key');
const observer = loadAccountSync('coverage-observer-key');
console.log('poster  ', poster.address);
console.log('agent   ', agentOwner.address);
console.log('observer', observer.address);
console.log('contract', address);

const label = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const taskId = `coverage-${label}`;
const agentId = `coverage-agent-${label}`;
const spec = 'Write a two-part integration guide for the Acme Widget service. Part 1: a complete local setup guide — prerequisites (Node.js 20 and Git), install commands, a config file example, and how to verify the server starts. Part 2: a complete migration guide for moving existing data from version 1 to version 2 — backup step, migration command, rollback step, and how to verify the migration. Both parts must be present and complete; each part is equally important.';
const title = 'Two-part integration guide with missing migration section';
const summary = 'Part 1 only: complete local setup guide with prerequisites, install commands, config example and verification step. Part 2 (version 1 to version 2 migration guide) is not included.';
const fixture = fs.readFileSync('fixtures/coverage-partial.txt');
const deliveryHash = hash(fixture);
const commit = process.argv[2] || null;
if (!commit) throw Error('Pass the fixture commit SHA as the first argument: node scripts/coverage-case.mjs <commit>');
const deliveryUrl = `https://raw.githubusercontent.com/halihalibt/task-prism-genlayer/${commit}/fixtures/coverage-partial.txt`;

const logFile = 'evidence/coverage-partial.json';
const log = fs.existsSync(logFile)
  ? JSON.parse(fs.readFileSync(logFile, 'utf8'))
  : {
      network: 'Stable Studionet',
      chain_id: 61999,
      contract: address,
      started_at: new Date().toISOString(),
      scope: 'Coverage-style partial delivery against the active consensus-compatible deployment. Live signed transactions with finalized receipts and latest-final read-back. No user-wallet path is implied.',
      case: {
        task_id: taskId,
        agent_id: agentId,
        title,
        specification: spec,
        delivery_url: deliveryUrl,
        delivery_sha256: deliveryHash,
        summary,
        design: 'Two equally important sections; Part 1 delivered complete, Part 2 entirely absent. This is the exact shape that split validators twice under the strict same-band rule (same verdict required, scores in the same band). The relaxed rule requires the same verdict with at most 10 points per dimension.',
        expected_verdict: 'PARTIAL',
      },
      public_accounts: { poster: poster.address, agent: agentOwner.address, observer: observer.address },
      all_scenarios_passed: false,
      evaluation_attempts: [],
      transactions: [],
    };
const save = () => fs.writeFileSync(logFile, JSON.stringify(log, null, 2) + '\n');
const read = async () => JSON.parse(await readFinal(address));
function conserved(s) {
  const wallets = Object.values(s.balances).reduce((x, y) => x + y, 0);
  const stakes = Object.values(s.agents).filter((x) => x.origin !== 'seed_demo').reduce((x, a) => x + a.stake, 0);
  const escrow = Object.values(s.tasks).filter((t) => t.origin !== 'seed_demo' && !['FINALIZED', 'EXPIRED'].includes(t.status)).reduce((x, t) => x + t.bounty, 0);
  assert.equal(s.issued, wallets + stakes + escrow + s.treasury, 'LEDGER_CONSERVATION');
}
const isIdle = (r) => {
  try {
    return Buffer.from(r.result || '', 'base64').toString('utf-8').includes('idle');
  } catch {
    return false;
  }
};
function leaderOutcome(receipt) {
  const leaders = receipt.consensus_data?.leader_receipt || [];
  const list = Array.isArray(leaders) ? leaders : [leaders];
  const leader = list.find((r) => r.mode === 'leader') || list[0];
  return { leader, list };
}
async function run(account, method, args = [], check = () => {}) {
  const matches = (x) => x.sender === account.address && x.method === method && JSON.stringify(x.args) === JSON.stringify(args);
  const done = log.transactions.find((x) => matches(x) && x.verified);
  if (done) return done;
  let item = log.transactions.findLast((x) => matches(x) && !x.verified && (x.receipt?.status !== 'FINALIZED' || x.receipt?.result_name === 'MAJORITY_AGREE'));
  if (!item) {
    const tx = await sendLocal(account, address, encoded(method, args));
    item = { method, args, sender: account.address, hash: tx, submitted_at: new Date().toISOString(), expect_error: false, verified: false };
    log.transactions.push(item);
    save();
    console.log(method, 'submitted', tx);
  }
  for (let i = 0; i < 240; i++) {
    item.receipt = await rpc('eth_getTransactionByHash', [item.hash]);
    if (item.receipt?.status === 'FINALIZED') break;
    await new Promise((r) => setTimeout(r, 12000));
  }
  save();
  assert.equal(item.receipt.status, 'FINALIZED', 'TX_NOT_FINALIZED');
  const { leader, list } = leaderOutcome(item.receipt);
  item.execution = leader?.execution_result;
  item.consensus = item.receipt.result_name;
  item.read_back = await read();
  item.read_back_at = new Date().toISOString();
  item.verification = 'SUCCESS';
  save();
  assert.equal(item.receipt.result_name, 'MAJORITY_AGREE', 'CONSENSUS_NOT_REACHED');
  if (item.execution !== 'SUCCESS') {
    const ok = list.some((r) => r.execution_result === 'SUCCESS') && list.every((r) => r.execution_result === 'SUCCESS' || isIdle(r));
    assert.ok(ok, `EXECUTION_FAILED: ${JSON.stringify(leader?.genvm_result || leader)}`);
    console.log(method, 'FINALIZED with an idle-validator receipt entry; leader execution SUCCESS');
  }
  check(item.read_back);
  conserved(item.read_back);
  item.verified = true;
  save();
  console.log(method, 'FINALIZED', item.execution);
  return item;
}

async function main() {
  await run(poster, 'claim_demo_funds', [], (s) => assert.equal(s.balances[poster.address.toLowerCase()], 10000));
  await run(agentOwner, 'claim_demo_funds', [], (s) => assert.equal(s.balances[agentOwner.address.toLowerCase()], 10000));
  await run(agentOwner, 'register_agent', [agentId, 1000, 'integration, technical writing'], (s) => {
    assert.equal(s.agents[agentId].stake, 1000);
    conserved(s);
  });

  // The pinned delivery URL must serve the exact local bytes before anything
  // is submitted; validators hash the fetched body.
  const res = await fetch(deliveryUrl, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw Error(`DELIVERY_URL_HTTP_${res.status}: ${deliveryUrl}`);
  const body = Buffer.from(await res.arrayBuffer());
  if (body.length > 24000) throw Error('DELIVERY_TOO_LARGE');
  if (hash(body) !== deliveryHash) throw Error('DELIVERY_BYTES_MISMATCH: pinned URL does not serve the local fixture');
  console.log('delivery URL serves the exact fixture bytes:', deliveryUrl);

  await run(poster, 'post_task', [taskId, title, 200, hash(spec), spec], (s) => {
    assert.equal(s.tasks[taskId].status, 'OPEN');
    conserved(s);
  });
  await run(agentOwner, 'claim_task', [taskId, agentId], (s) => assert.equal(s.tasks[taskId].status, 'CLAIMED'));
  await run(agentOwner, 'submit_delivery', [taskId, deliveryUrl, deliveryHash, summary], (s) => assert.equal(s.tasks[taskId].status, 'SUBMITTED'));

  // Evaluation: up to 3 attempts. A failed consensus writes no state; each
  // attempt is recorded honestly and the task stays SUBMITTED for a retry.
  let evaluated = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const state = await read();
    const task = state.tasks[taskId];
    if (task.status === 'EVALUATING' && task.rounds.length >= 1) {
      console.log(`evaluation already recorded (round ${task.rounds.length})`);
      evaluated = task;
      break;
    }
    assert.equal(task.status, 'SUBMITTED', `TASK_NOT_SUBMITTED_BEFORE_EVALUATION_ATTEMPT_${attempt}`);
    const attemptRecord = { attempt, submitted_at: new Date().toISOString() };
    log.evaluation_attempts.push(attemptRecord);
    save();
    const tx = await sendLocal(observer, address, encoded('evaluate_delivery', [taskId]));
    attemptRecord.hash = tx;
    save();
    console.log(`evaluate_delivery attempt ${attempt} submitted`, tx);
    let receipt;
    for (let i = 0; i < 240; i++) {
      receipt = await rpc('eth_getTransactionByHash', [tx]);
      if (receipt?.status === 'FINALIZED') break;
      await new Promise((r) => setTimeout(r, 12000));
    }
    attemptRecord.receipt = receipt;
    attemptRecord.consensus = receipt?.result_name;
    const { leader, list } = leaderOutcome(receipt || {});
    attemptRecord.execution = leader?.execution_result;
    attemptRecord.read_back = await read();
    attemptRecord.read_back_at = new Date().toISOString();
    save();
    const stateAfter = attemptRecord.read_back;
    const taskAfter = stateAfter.tasks[taskId];
    if (receipt?.status === 'FINALIZED' && receipt?.result_name === 'MAJORITY_AGREE' && (attemptRecord.execution === 'SUCCESS' || (list.some((r) => r.execution_result === 'SUCCESS') && list.every((r) => r.execution_result === 'SUCCESS' || isIdle(r))))) {
      assert.equal(taskAfter.status, 'EVALUATING');
      assert.equal(taskAfter.rounds.length, 1);
      assert.equal(taskAfter.settlement, null);
      conserved(stateAfter);
      attemptRecord.verification = 'SUCCESS';
      attemptRecord.verdict = taskAfter.pending_verdict;
      attemptRecord.scores = taskAfter.rounds[0].scores;
      save();
      console.log(`evaluation attempt ${attempt} FINALIZED: ${taskAfter.pending_verdict} ${JSON.stringify(taskAfter.rounds[0].scores)}`);
      evaluated = taskAfter;
      break;
    }
    attemptRecord.verification = 'CONSENSUS_NOT_REACHED';
    save();
    console.log(`evaluation attempt ${attempt} did not reach consensus (${receipt?.result_name}/${attemptRecord.execution}); state unchanged, retrying`);
  }
  if (!evaluated) throw Error('EVALUATION_CONSENSUS_NOT_REACHED_AFTER_3_ATTEMPTS');
  const pendingVerdict = evaluated.pending_verdict;
  const scores = evaluated.rounds[0].scores;
  console.log('pending verdict:', pendingVerdict, 'scores:', JSON.stringify(scores));

  await run(observer, 'finalize_delivery', [taskId], (s) => {
    const t = s.tasks[taskId];
    assert.equal(t.status, 'FINALIZED');
    assert.equal(t.final_verdict, pendingVerdict);
    if (pendingVerdict === 'ACCEPT') assert.deepEqual(t.settlement, { paid_to_agent: 200, refunded_to_poster: 0, slashed_to_treasury: 0, agent_reputation_delta: 10 });
    else if (pendingVerdict === 'PARTIAL') assert.deepEqual(t.settlement, { paid_to_agent: 100, refunded_to_poster: 100, slashed_to_treasury: 0, agent_reputation_delta: 2 });
    else assert.deepEqual(t.settlement, { paid_to_agent: 0, refunded_to_poster: 200, slashed_to_treasury: 100, agent_reputation_delta: -15 });
    conserved(s);
  });

  const finalState = await read();
  log.completed_at = new Date().toISOString();
  log.all_scenarios_passed = pendingVerdict === 'PARTIAL';
  log.result = {
    task_id: taskId,
    pending_verdict: pendingVerdict,
    scores,
    final_verdict: finalState.tasks[taskId].final_verdict,
    settlement: finalState.tasks[taskId].settlement,
    rounds: finalState.tasks[taskId].rounds,
    evaluation_attempts: log.evaluation_attempts.length,
  };
  save();
  fs.writeFileSync('evidence/final-state.json', JSON.stringify(finalState, null, 2) + '\n');
  console.log('COVERAGE CASE COMPLETE:', pendingVerdict, JSON.stringify(scores), 'attempts:', log.evaluation_attempts.length);
}

await main();
