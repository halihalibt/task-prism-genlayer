// Offline regression checks using saved real receipts; no network or signing.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {test} from 'node:test';
import {receiptOutcome,reconcileTransaction} from '../scripts/receipt-status.js';

const index=JSON.parse(fs.readFileSync(new URL('../evidence/live-verification.json',import.meta.url)));
const log=JSON.parse(gunzipSync(fs.readFileSync(new URL('../evidence/'+index.archive,import.meta.url))));
const accepted=log.transactions.find(x=>x.verified&&x.execution==='SUCCESS');
const rejected=log.transactions.filter(x=>x.receipt.result_name!=='MAJORITY_AGREE');

test('both real rejected evaluations fail, including the successful leader execution',()=>{
  assert(rejected.some(x=>x.execution==='SUCCESS'));
  for(const tx of rejected){
    assert.equal(receiptOutcome(tx.receipt),'consensus_error');
    const cached=reconcileTransaction({...tx,phase:'confirmed',verified:true});
    assert.equal(cached.phase,'consensus_error');
    assert.equal(cached.verified,false);
    assert.equal(cached.error,'CONSENSUS_NOT_REACHED');
  }
});
test('accepted consensus requires successful execution',()=>{
  const tx=log.transactions.find(x=>x.execution==='ERROR'&&x.receipt.result_name==='MAJORITY_AGREE');
  assert.equal(receiptOutcome(tx.receipt),'error');
  assert.equal(reconcileTransaction({...tx,phase:'confirmed'}).verified,false);
});
test('accepted successful receipt needs read-back before confirmation',()=>{
  assert.equal(receiptOutcome(accepted.receipt),'readback');
  const complete=reconcileTransaction({...accepted,phase:'confirmed'});
  assert.equal(complete.phase,'confirmed');
  assert.equal(complete.verified,true);
  const missing=reconcileTransaction({...accepted,read_back:null,phase:'confirmed'});
  assert.equal(missing.phase,'readback');
  assert.equal(missing.verified,false);
});
test('missing or non-finalized receipt cannot keep cached confirmation',()=>{
  for(const receipt of [null,{status:'PENDING'}]){
    const tx=reconcileTransaction({phase:'confirmed',verified:true,receipt});
    assert.equal(tx.phase,'pending');assert.equal(tx.verified,false);
  }
});
test('missing consensus result or leader fails closed',()=>{
  assert.equal(receiptOutcome({status:'FINALIZED'}),'consensus_error');
  assert.equal(receiptOutcome({status:'FINALIZED',result_name:'MAJORITY_AGREE'}),'error');
});
