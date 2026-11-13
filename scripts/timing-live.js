// Real Stable Studionet transactions. Fixed production deadlines are never changed.
// Run only after signing confirmation. Re-run to resume; --due checks elapsed cases.
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createAccount,generatePrivateKey} from 'genlayer-js';
import {validateChain,rpc,readFinal,sendLocal,encoded,fundAccount,contractBalance} from './network.js';
import {receiptOutcome} from './receipt-status.js';
if(!process.argv.includes('--confirm-live'))throw Error('LIVE_SIGNATURE_CONFIRMATION_REQUIRED');
const dir='evidence/timing-deployment',manifest=JSON.parse(fs.readFileSync(`${dir}/deployment.json`));
const address=manifest.contract_address;
const hash=x=>createHash('sha256').update(x).digest('hex');
assert.equal(hash(fs.readFileSync('contracts/task_prism.py')),manifest.source_sha256);
assert.equal(manifest.finalized_status,'FINALIZED');assert(address);
await validateChain();
const file=`${dir}/live-timing.json`;
if(!fs.existsSync(file)&&fs.existsSync(file+'.gz'))fs.writeFileSync(file,gunzipSync(fs.readFileSync(file+'.gz')));
fs.mkdirSync('.local',{recursive:true,mode:0o700});
const names=['poster','claimed','submitted','pending','challenged','observer'];
const actors=Object.fromEntries(names.map(name=>{
 const key=`.local/timing-${name}-key`;
 if(!fs.existsSync(key)){
  if(fs.existsSync(file))throw Error('MISSING_RESUME_SIGNER: '+name);
  fs.writeFileSync(key,generatePrivateKey(),{mode:0o600});
 }
 return [name,createAccount(fs.readFileSync(key,'utf8').trim())];
}));
const log=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)): {
 scope:'LIVE signed Stable Studionet transactions, actual elapsed time, no timestamp override',chain_id:61999,contract:address,
 source_sha256:manifest.source_sha256,label:new Date().toISOString().replace(/\D/g,'').slice(0,14),started_at:new Date().toISOString(),
 public_accounts:Object.fromEntries(names.map(n=>[n,actors[n].address])),transactions:[],checks:{},completed:false
};
assert.equal(log.contract,address);
for(const name of names)assert.equal(log.public_accounts[name],actors[name].address,'RESUME_SIGNER_MISMATCH');
const save=()=>fs.writeFileSync(file,JSON.stringify(log,null,2)+'\n');save();
const read=async()=>{const x=await readFinal(address);return typeof x==='string'?JSON.parse(x):x;};
function conserved(s,balance){
 const escrow=Object.values(s.tasks).filter(t=>t.origin!=='seed_demo'&&!['FINALIZED','EXPIRED'].includes(t.status)).reduce((n,t)=>n+BigInt(t.bounty),0n);
 const stakes=Object.values(s.agents).filter(a=>a.origin!=='seed_demo').reduce((n,a)=>n+BigInt(a.stake),0n);
 const available=Object.values(s.withdrawable).reduce((n,x)=>n+BigInt(x),0n);
 assert.equal(BigInt(balance),escrow+stakes+available+BigInt(s.treasury),'GEN_CONSERVATION');
}
async function run(tag,who,method,args=[],value=0n,error=null,check=()=>{}){
 let item=log.transactions.findLast(x=>x.tag===tag&&!x.superseded);
 if(item?.verified)return item;
 if(!item){
  const before=await read();
  item={tag,who,method,args:args.map(x=>typeof x==='bigint'?x.toString():x),value_wei:value.toString(),expected_error:error,before,verified:false};
  // Broadcast failures are recorded; an uncertain signature is never blindly replayed.
  log.transactions.push(item);save();
  try{item.hash=await sendLocal(actors[who],address,encoded(method,args),value);item.submitted_at=new Date().toISOString();save();}
  catch(e){item.broadcast_error=String(e);save();throw e;}
 }
 assert(item.hash,'UNRESOLVED_BROADCAST: inspect tag '+tag+' before retrying');
 for(let i=0;i<120;i++){
  item.receipt=await rpc('eth_getTransactionByHash',[item.hash]);save();
  if(item.receipt?.status==='FINALIZED')break;
  await new Promise(r=>setTimeout(r,5000));
 }
 assert.equal(item.receipt?.status,'FINALIZED','TRANSACTION_PENDING: '+tag);
 const leaders=item.receipt.consensus_data?.leader_receipt;
 const leader=Array.isArray(leaders)?leaders.find(x=>x.mode==='leader')||leaders[0]:leaders;
 item.execution=leader?.execution_result;item.read_back=await read();item.read_back_at=new Date().toISOString();
 item.contract_balance_wei=String(await contractBalance(address));save();
 if(item.receipt.result_name!=='MAJORITY_AGREE'){
  assert.deepEqual(item.read_back,item.before,'FAILED_CONSENSUS_CHANGED_STATE');
  item.consensus_failed=true;save();
  const attempts=log.transactions.filter(x=>x.tag===tag).length;
  if(attempts<3){item.superseded=true;save();return run(tag,who,method,args,value,error,check);}
  throw Error('CONSENSUS_NOT_REACHED_AFTER_THREE_FINALIZED_ATTEMPTS: '+tag);
 }
 assert.equal(item.receipt.to_address.toLowerCase(),address.toLowerCase());
 if(error){
  assert.equal(item.execution,'ERROR');assert.match(leader.genvm_result?.stderr||'',new RegExp(error));
  assert.deepEqual(item.read_back,item.before,'REJECTED_CALL_CHANGED_STATE');
 }else{assert.equal(receiptOutcome(item.receipt),'readback',JSON.stringify(leader?.genvm_result));check(item.read_back,item.before);}
 conserved(item.read_back,item.contract_balance_wei);
 item.verified=true;save();console.log(tag,'FINALIZED',item.execution,item.hash);return item;
}
const GEN=10n**18n,BOUNTY=2n*10n**17n,STAKE=GEN;
const id=kind=>`timing-${kind}-${log.label}`;
const agent=kind=>`timing-${kind}-agent-${log.label}`;
const SPEC='Deliver a concise English runbook for public source delivery integrity: three numbered steps to capture exact UTF-8 bytes and calculate SHA-256, compare the submitted hash, and inspect scores plus FINALIZED latest-final state. Include a hash-change example and explicit limitations.';
const URL='https://raw.githubusercontent.com/halihalibt/task-prism-genlayer/bc00d0f953ba813114c254d1e6bb698e7bc113e3/fixtures/delivery.txt';
const digest=hash(fs.readFileSync('fixtures/delivery.txt'));
async function setup(){
 for(const who of names.filter(n=>n!=='observer')){
  if(BigInt(await rpc('eth_getBalance',[actors[who].address,'latest']))<2n*GEN)await fundAccount(actors[who].address,5n*GEN);
 }
 for(const kind of ['claimed','submitted','pending','challenged']){
  await run(kind+'-register',kind,'register_agent',[agent(kind),STAKE,'delivery integrity'],STAKE,null,s=>assert.equal(BigInt(s.agents[agent(kind)].stake),STAKE));
  await run(kind+'-post','poster','post_task',[id(kind),'Timed '+kind+' protection',BOUNTY,hash(SPEC),SPEC],BOUNTY,null,s=>assert.equal(s.tasks[id(kind)].status,'OPEN'));
  await run(kind+'-claim',kind,'claim_task',[id(kind),agent(kind)],0n,null,s=>{
   const t=s.tasks[id(kind)];assert.equal(t.status,'CLAIMED');assert.equal(t.delivery_deadline-t.claimed_at,86400);
  });
  if(kind==='claimed'){
   await run(kind+'-early-expire','poster','expire_task',[id(kind)],0n,'DELIVERY_PERIOD_ACTIVE');
   log.checks.claimed_early_expiry_blocked=true;save();continue;
  }
  await run(kind+'-submit',kind,'submit_delivery',[id(kind),URL,digest,'A three-step source integrity runbook with an example and limitations.'],0n,null,s=>{
   const t=s.tasks[id(kind)];assert.equal(t.status,'SUBMITTED');assert.equal(t.review_deadline-t.submitted_at,86400);
  });
  await run(kind+'-early-expire','poster','expire_task',[id(kind)],0n,'REVIEW_PERIOD_ACTIVE');
  if(kind==='submitted'){
   await run(kind+'-resubmit',kind,'submit_delivery',[id(kind),URL,digest,'The same delivery with a clarified manifest.'],0n,null,(s,b)=>{
    assert.equal(s.tasks[id(kind)].review_deadline,b.tasks[id(kind)].review_deadline);assert.equal(s.tasks[id(kind)].submitted_at,b.tasks[id(kind)].submitted_at);
   });
   log.checks.submitted_early_expiry_blocked=true;log.checks.resubmission_keeps_review_deadline=true;save();continue;
  }
  await run(kind+'-evaluate','observer','evaluate_delivery',[id(kind)],0n,null,s=>{
   const t=s.tasks[id(kind)];assert.equal(t.status,'EVALUATING');assert.equal(t.settlement,null);assert.equal(t.rounds.length,1);assert.equal(t.challenge_deadline-t.evaluated_at,3600);
  });
  await run(kind+'-early-finalize','observer','finalize_delivery',[id(kind)],0n,'CHALLENGE_PERIOD_ACTIVE');
  log.checks.early_finalize_blocked=true;save();
  if(kind==='challenged'){
   await run(kind+'-challenge','poster','challenge_delivery',[id(kind),'Reassess the three numbered steps, hash-change example and explicit limitations against the posted runbook specification.'],0n,null,s=>{
    const t=s.tasks[id(kind)];assert.equal(t.status,'FINALIZED');assert.equal(t.rounds.length,2);assert(t.settlement);assert.equal(s.agents[agent(kind)].open_claim,'');
   });
   log.checks.challenge_during_window_settled=true;save();
  }
 }
}
async function withdraw(tag,who){
 const s=await read(),amount=BigInt(s.withdrawable[actors[who].address.toLowerCase()]||0);
 if(!amount)return;
 const before=BigInt(await rpc('eth_getBalance',[actors[who].address,'latest']));
 const item=await run(tag,who,'withdraw',[],0n,null,state=>assert.equal(BigInt(state.withdrawable[actors[who].address.toLowerCase()]||0),0n));
 const after=BigInt(await rpc('eth_getBalance',[actors[who].address,'latest']));assert.equal(after-before,amount);
 item.eoa_balance_before_wei=before.toString();item.eoa_balance_after_wei=after.toString();item.withdrawal_delta_wei=(after-before).toString();save();
}
async function due(){
 let s=await read();
 const t=s.tasks[id('pending')];
 if(t?.status==='EVALUATING'&&Date.now()/1000>=t.challenge_deadline+5){
  await run('pending-late-challenge','poster','challenge_delivery',[id('pending'),'This challenge is deliberately after the fixed deadline.'],0n,'CHALLENGE_DEADLINE_PASSED');
  await run('pending-elapsed-finalize','observer','finalize_delivery',[id('pending')],0n,null,state=>assert.equal(state.tasks[id('pending')].status,'FINALIZED'));
  await run('pending-duplicate-finalize','observer','finalize_delivery',[id('pending')],0n,'TASK_NOT_EVALUATING');
  log.checks.elapsed_finalize_and_late_challenge=true;save();
 }
 for(const kind of ['claimed','submitted']){
  s=await read();const task=s.tasks[id(kind)],deadline=task?.[kind==='claimed'?'delivery_deadline':'review_deadline'];
  if(task&&['CLAIMED','SUBMITTED'].includes(task.status)&&Date.now()/1000>=deadline+5){
   if(kind==='claimed')await run('claimed-late-submit',kind,'submit_delivery',[id(kind),URL,digest,'Late submission must fail.'],0n,'DELIVERY_DEADLINE_PASSED');
   else await run('submitted-late-evaluate','observer','evaluate_delivery',[id(kind)],0n,'REVIEW_DEADLINE_PASSED');
   await run(kind+'-elapsed-expire','poster','expire_task',[id(kind)],0n,null,(state,before)=>{
    const x=state.tasks[id(kind)],owner=actors[kind].address.toLowerCase();assert.equal(x.status,'EXPIRED');assert.equal(state.agents[agent(kind)].open_claim,'');
    assert.equal(BigInt(x.settlement.refunded_to_poster),BOUNTY);assert.equal(state.agents[agent(kind)].stake,before.agents[agent(kind)].stake);assert.equal(state.reputation[owner],before.reputation[owner]);
   });
   await run(kind+'-duplicate-expire','poster','expire_task',[id(kind)],0n,'TASK_NOT_EXPIRABLE');
   log.checks[kind+'_elapsed_expiry']=true;save();
  }
 }
 await withdraw('challenged-withdraw','challenged');await withdraw('pending-withdraw','pending');await withdraw('poster-withdraw-'+(log.checks.claimed_elapsed_expiry&&log.checks.submitted_elapsed_expiry?'final':'early'),'poster');
 s=await read();log.deadlines=Object.fromEntries(['claimed','submitted','pending','challenged'].map(kind=>{const t=s.tasks[id(kind)];return[kind,t?{task_id:id(kind),status:t.status,delivery_deadline:t.delivery_deadline,review_deadline:t.review_deadline,challenge_deadline:t.challenge_deadline}:null];}));
 log.completed=['claimed_early_expiry_blocked','submitted_early_expiry_blocked','resubmission_keeps_review_deadline','early_finalize_blocked','challenge_during_window_settled','elapsed_finalize_and_late_challenge','claimed_elapsed_expiry','submitted_elapsed_expiry'].every(k=>log.checks[k]===true);
 log.last_observed_at=new Date().toISOString();save();console.log(JSON.stringify({completed:log.completed,checks:log.checks,deadlines:log.deadlines}));
}
if(!process.argv.includes('--due'))await setup();await due();
