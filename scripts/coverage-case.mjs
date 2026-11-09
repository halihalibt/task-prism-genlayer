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
// Money is real testnet GEN (wei): the poster locks a 0.2 GEN bounty, the
// agent stakes 1 GEN, settlement is withdrawable GEN, and both parties pull
// their halves at the end. Conservation is checked against the contract's
// on-chain GEN balance after every step.
//
// Flow (fresh ephemeral accounts, keys in ignored .local/):
//   poster + agent funded from the Studio faucet, agent registers, poster
//   posts the task, agent claims, agent submits the delivery, observer
//   evaluates (up to 3 attempts; a failed consensus writes no state and
//   is recorded honestly), observer finalizes, both parties withdraw.
//   The verdict is recorded as observed, not assumed: the case passes only
//   if the pending verdict is PARTIAL and settlement is 0.1/0.1 GEN with
//   +2 reputation.
//
// Run: node scripts/coverage-case.mjs <commit>
// Output: evidence/coverage-partial.json (full log with receipts and
// read-backs), evidence/COVERAGE_PARTIAL.md (summary, written by hand
// after the run), evidence/final-state.json (last finalized read-back).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createAccount, generatePrivateKey } from 'genlayer-js';
import { rpc, reader, readFinal, sendLocal, encoded, validateChain, fundAccount, contractBalance } from './network.js';

const deployment = JSON.parse(fs.readFileSync('evidence/deployment.json', 'utf8'));
const address = deployment.contract_address;
assert(address, 'No contract address in evidence/deployment.json');
await validateChain();
const hash = (s) => createHash('sha256').update(s).digest('hex');
const GEN = 10n ** 18n;
const BOUNTY = 2n * 10n ** 17n; // 0.2 GEN
const STAKE = 10n ** 18n; // 1 GEN

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
      money: 'Real testnet GEN, amounts in wei (1 GEN = 10^18 wei). No simulated ledger.',
      started_at: new Date().toISOString(),
      scope: 'Coverage-style partial delivery against the active deployment. Live signed transactions with finalized receipts and latest-final read-back. No user-wallet path is implied.',
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
const serArgs = (args) => args.map((a) => (typeof a === 'bigint' ? a.toString() : a));
const save = () => fs.writeFileSync(logFile, JSON.stringify(log, null, 2) + '\n');
const read = async () => JSON.parse(await readFinal(address));
const readContractBalance = async () => {
  const onchain = await contractBalance(address);
  const view = await readFinal(address, 'get_contract_balance', []);
  assert.equal(BigInt(onchain), BigInt(JSON.parse(view)), 'CONTRACT_BALANCE_VIEW_MISMATCH');
  return BigInt(onchain);
};
async function fund(account, amount) {
  await fundAccount(account.address, amount);
  for (let i = 0; i < 30; i++) {
    const bal = BigInt(await rpc('eth_getBalance', [account.address, 'latest']));
    if (bal >= amount) return;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw Error('FAUCET_FUND_TIMEOUT');
}
async function conserved(s) {
  const escrow = Object.values(s.tasks).filter((t) => t.origin !== 'seed_demo' && !['FINALIZED', 'EXPIRED'].includes(t.status)).reduce((x, t) => x + BigInt(t.bounty), 0n);
  const stakes = Object.values(s.agents).filter((x) => x.origin !== 'seed_demo').reduce((x, a) => x + BigInt(a.stake), 0n);
  const withdrawable = Object.values(s.withdrawable || {}).reduce((x, y) => x + BigInt(y), 0n);
  const contractWei = await readContractBalance();
  assert.equal(contractWei, escrow + stakes + withdrawable + BigInt(s.treasury), 'GEN_CONSERVATION');
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
async function run(account, method, args = [], check = () => {}, value = 0n, tag = null) {
  const matches = (x) => x.sender === account.address && x.method === method && JSON.stringify(x.args) === JSON.stringify(serArgs(args)) && (x.tag || null) === (tag || null);
  const done = log.transactions.find((x) => matches(x) && x.verified);
  if (done) return done;
  let item = log.transactions.findLast((x) => matches(x) && !x.verified && (x.receipt?.status !== 'FINALIZED' || x.receipt?.result_name === 'MAJORITY_AGREE'));
  if (!item) {
    const tx = await sendLocal(account, address, encoded(method, args), value);
    item = { method, args: serArgs(args), sender: account.address, hash: tx, submitted_at: new Date().toISOString(), expect_error: false, verified: false, tag: tag || null };
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
  item.contract_balance_wei = (await readContractBalance()).toString();
  item.verification = 'SUCCESS';
  save();
  assert.equal(item.receipt.result_name, 'MAJORITY_AGREE', 'CONSENSUS_NOT_REACHED');
  if (item.execution !== 'SUCCESS') {
    const ok = list.some((r) => r.execution_result === 'SUCCESS') && list.every((r) => r.execution_result === 'SUCCESS' || isIdle(r));
    assert.ok(ok, `EXECUTION_FAILED: ${JSON.stringify(leader?.genvm_result || leader)}`);
    console.log(method, 'FINALIZED with an idle-validator receipt entry; leader execution SUCCESS');
  }
  check(item.read_back);
  await conserved(item.read_back);
  item.verified = true;
  save();
  console.log(method, 'FINALIZED', item.execution);
  return item;
}
async function withdrawAndCheck(account, expectedWei, tag) {
  const before = BigInt(await rpc('eth_getBalance', [account.address, 'latest']));
  await run(account, 'withdraw', [], (s) => {
    assert.equal(BigInt(s.withdrawable[account.address.toLowerCase()] || 0), 0n);
  }, 0n, tag);
  const after = BigInt(await rpc('eth_getBalance', [account.address, 'latest']));
  assert.equal(after - before, BigInt(expectedWei), 'WITHDRAW_EOA_DELTA');
  console.log('withdraw', account.address.slice(0, 10), 'received', expectedWei.toString(), 'wei');
}

async function main() {
  await fund(poster, 2n * GEN);
  await fund(agentOwner, 2n * GEN);
  await run(agentOwner, 'register_agent', [agentId, STAKE, 'integration, technical writing'], (s) => {
    assert.equal(BigInt(s.agents[agentId].stake), STAKE);
  }, STAKE);

  // The pinned delivery URL must serve the exact local bytes before anything
  // is submitted; validators hash the fetched body.
  const res = await fetch(deliveryUrl, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw Error(`DELIVERY_URL_HTTP_${res.status}: ${deliveryUrl}`);
  const body = Buffer.from(await res.arrayBuffer());
  if (body.length > 24000) throw Error('DELIVERY_TOO_LARGE');
  if (hash(body) !== deliveryHash) throw Error('DELIVERY_BYTES_MISMATCH: pinned URL does not serve the local fixture');
  console.log('delivery URL serves the exact fixture bytes:', deliveryUrl);

  await run(poster, 'post_task', [taskId, title, BOUNTY, hash(spec), spec], (s) => {
    assert.equal(s.tasks[taskId].status, 'OPEN');
  }, BOUNTY);
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
    attemptRecord.contract_balance_wei = (await readContractBalance()).toString();
    save();
    const stateAfter = attemptRecord.read_back;
    const taskAfter = stateAfter.tasks[taskId];
    if (receipt?.status === 'FINALIZED' && receipt?.result_name === 'MAJORITY_AGREE' && (attemptRecord.execution === 'SUCCESS' || (list.some((r) => r.execution_result === 'SUCCESS') && list.every((r) => r.execution_result === 'SUCCESS' || isIdle(r))))) {
      assert.equal(taskAfter.status, 'EVALUATING');
      assert.equal(taskAfter.rounds.length, 1);
      assert.equal(taskAfter.settlement, null);
      await conserved(stateAfter);
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
    const st = t.settlement;
    assert.equal(BigInt(st.slashed_to_treasury), pendingVerdict === 'REJECT' ? 10n ** 17n : 0n);
    if (pendingVerdict === 'ACCEPT') { assert.equal(BigInt(st.paid_to_agent), BOUNTY); assert.equal(BigInt(st.refunded_to_poster), 0n); assert.equal(st.agent_reputation_delta, 10); }
    else if (pendingVerdict === 'PARTIAL') { assert.equal(BigInt(st.paid_to_agent), BOUNTY / 2n); assert.equal(BigInt(st.refunded_to_poster), BOUNTY / 2n); assert.equal(st.agent_reputation_delta, 2); }
    else { assert.equal(BigInt(st.paid_to_agent), 0n); assert.equal(BigInt(st.refunded_to_poster), BOUNTY); assert.equal(st.agent_reputation_delta, -15); }
  });

  // Pull-payment: both parties withdraw their halves as real GEN.
  await withdrawAndCheck(agentOwner, BOUNTY / 2n, 'withdraw-coverage-agent');
  await withdrawAndCheck(poster, BOUNTY / 2n, 'withdraw-coverage-poster');

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
