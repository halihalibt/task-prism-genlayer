// Finality, accepted consensus and successful execution are separate conditions.
export function receiptOutcome(receipt) {
  if (receipt?.status !== 'FINALIZED') return 'pending';
  if (receipt.result_name !== 'MAJORITY_AGREE') return 'consensus_error';
  const receipts = receipt.consensus_data?.leader_receipt;
  const leader = Array.isArray(receipts) ? receipts.find(r => r?.mode === 'leader') : receipts;
  return leader?.execution_result === 'SUCCESS' ? 'readback' : 'error';
}

export function reconcileTransaction(transaction) {
  const result = {...transaction};
  const outcome = receiptOutcome(result.receipt);
  if (outcome === 'readback') {
    result.phase = result.read_back && result.read_back_at ? 'confirmed' : 'readback';
  } else if (outcome !== 'pending' || ['confirmed', 'readback'].includes(result.phase)) {
    result.phase = outcome;
  }
  result.verified = result.phase === 'confirmed' && outcome === 'readback';
  if (outcome === 'consensus_error') result.error = 'CONSENSUS_NOT_REACHED';
  return result;
}
