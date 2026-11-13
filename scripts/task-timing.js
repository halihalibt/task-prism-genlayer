// Browser time is advisory. The contract enforces GenVM transaction time.
export function taskActions(task, now = Math.floor(Date.now() / 1000)) {
  const live = task && task.origin !== 'seed_demo';
  const before = key => Number.isSafeInteger(task?.[key]) && now < task[key];
  const elapsed = key => Number.isSafeInteger(task?.[key]) && now >= task[key];
  return {
    submit: !!live && ((task.status === 'CLAIMED' && before('delivery_deadline')) || (task.status === 'SUBMITTED' && !task.rounds?.length && before('review_deadline'))),
    evaluate: !!live && task.status === 'SUBMITTED' && before('review_deadline'),
    finalize: !!live && task.status === 'EVALUATING' && elapsed('challenge_deadline'),
    challenge: !!live && task.status === 'EVALUATING' && task.rounds?.length === 1 && !task.challenger && before('challenge_deadline'),
    expire: !!live && (task.status === 'OPEN' || (task.status === 'CLAIMED' && elapsed('delivery_deadline')) || (task.status === 'SUBMITTED' && !task.rounds?.length && elapsed('review_deadline')))
  };
}
