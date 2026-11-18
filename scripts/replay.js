import record from './replay-case.js';

const labels = ['Posted', 'Claimed', 'Delivered', 'Verdict', 'Challenge', 'Settlement', 'Stake exit'];
const dimensions = ['Completeness', 'Correctness', 'Usefulness'];
const steps = document.querySelector('#replay-steps');
const detail = document.querySelector('#replay-detail');
const play = document.querySelector('#play');
const {task, hashes, withdrawTime} = record;
const gen = wei => (wei / 1e18).toLocaleString('en', {maximumFractionDigits: 2}) + ' GEN';
const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
let current = 0;
let timer;

const descriptions = [
  () => '<p>' + escape(task.deliverable_spec) + '</p>',
  () => '<p>The agent claimed the task and locked 1 GEN.</p>',
  () => '<p>' + escape(task.delivery.summary) + '</p><a href="' + escape(task.delivery.url) + '" target="_blank" rel="noopener">Open exact delivery ↗</a><p class="proof-hash">SHA-256 ' + escape(task.delivery.sha256) + '</p>',
  () => '',
  () => '',
  () => '<p>The challenge upheld REJECT. The poster received a refund credit and 0.10 GEN went to the treasury.</p>',
  () => '<p>The agent withdrew the remaining 0.90 GEN. The recorded wallet balance increased by that amount.</p>',
];

function select(index) {
  current = index;
  [...steps.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  const round = index === 3 || index === 4 ? task.rounds[index - 3] : null;
  const scores = round ? '<p>' + escape(round.rationale) + '</p>' + round.scores.map((score, i) =>
    '<div class="score"><span>' + dimensions[i] + '</span><meter min="0" max="100" value="' + score + '" aria-label="' + dimensions[i] + '"></meter><strong>' + score + '/100</strong></div>'
  ).join('') : '';
  const time = index < 6 ? new Date(task.events[index].timestamp * 1000).toISOString() : withdrawTime;
  const ledger = index < 5
    ? [['Bounty in escrow', gen(task.bounty)], ['Stake locked', index ? '1 GEN' : '0 GEN'], ['Settlement', 'Pending']]
    : [['Poster refund credit', gen(task.settlement.refunded_to_poster)], ['Agent earnings', gen(task.settlement.paid_to_agent)], ['Treasury slash', gen(task.settlement.slashed_to_treasury)], [index === 6 ? 'Principal withdrawn' : 'Remaining idle principal', '0.9 GEN']];
  detail.innerHTML = '<article class="case-card"><small>' + time + '</small><h3>' + labels[index] +
    (round ? ' · ' + escape(round.verdict) : '') + '</h3>' + descriptions[index]() + scores +
    '<a href="https://explorer-studio.genlayer.com/tx/' + hashes[index] + '" target="_blank" rel="noopener">Finalized receipt ↗</a></article>' +
    '<aside class="case-card"><h3>Funds ledger</h3>' + ledger.map(([name, value]) =>
      '<div class="ledger-line"><span>' + name + '</span><strong>' + value + '</strong></div>'
    ).join('') + '</aside>';
}

function stop() {
  clearInterval(timer);
  timer = null;
  play.textContent = 'Play replay';
  play.setAttribute('aria-pressed', 'false');
}

steps.innerHTML = labels.map((label, i) => '<button type="button" data-step="' + i + '">' + label + '</button>').join('');
steps.addEventListener('click', event => {
  const button = event.target.closest('[data-step]');
  if (!button) return;
  stop();
  select(Number(button.dataset.step));
});
play.addEventListener('click', () => {
  if (timer) return stop();
  select(0);
  play.textContent = 'Pause';
  play.setAttribute('aria-pressed', 'true');
  timer = setInterval(() => {
    select(current + 1);
    if (current === labels.length - 1) stop();
  }, 2300);
});
select(0);
