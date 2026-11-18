import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createAccount,generatePrivateKey} from 'genlayer-js';
import {validateChain,rpc,readFinal,sendLocal,encoded,fundAccount,contractBalance} from './network.js';
import {receiptOutcome} from './receipt-status.js';
if(!process.argv.includes('--confirm-live'))throw Error('LIVE_SIGNATURE_CONFIRMATION_REQUIRED');
const dir='evidence/stake-exit',manifest=JSON.parse(fs.readFileSync(`${dir}/deployment.json`));
const address=manifest.contract_address;
const hash=x=>createHash('sha256').update(x).digest('hex');
assert.equal(hash(fs.readFileSync('contracts/task_prism.py')),manifest.source_sha256);
assert.equal(manifest.finalized_status,'FINALIZED');assert(address);
await validateChain();
const file=`${dir}/live.json`;
fs.mkdirSync('.local',{recursive:true,mode:0o700});
if(fs.existsSync(file)&&JSON.parse(fs.readFileSync(file)).completed)process.exit(0);
const names=['poster','agent'];
const actors=Object.fromEntries(names.map(name=>{
 const key=`.local/stake-exit-${name}-key`;
 if(!fs.existsSync(key)){
  if(fs.existsSync(file))throw Error('MISSING_RESUME_SIGNER: '+name);
  fs.writeFileSync(key,generatePrivateKey(),{mode:0o600});
 }
 return [name,createAccount(fs.readFileSync(key,'utf8').trim())];
}));
const log=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)): {
 scope:'LIVE signed Stable Studionet transactions, withdrawal lifecycle and ledger conservation',chain_id:61999,contract:address,
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
  if(method==='withdraw_stake'&&!error){
   item.recipient_before_wei=String(await rpc('eth_getBalance',[actors[who].address,'latest']));
  }
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
 assert.equal(item.receipt.from_address.toLowerCase(),actors[who].address.toLowerCase());
 assert.equal(item.receipt.to_address.toLowerCase(),address.toLowerCase());
 if(error){
  assert.equal(item.execution,'ERROR');assert.match(leader.genvm_result?.stderr||'',new RegExp(error));
  assert.deepEqual(item.read_back,item.before,'REJECTED_CALL_CHANGED_STATE');
 }else{assert.equal(receiptOutcome(item.receipt),'readback',JSON.stringify(leader?.genvm_result));check(item.read_back,item.before);}
 if(method==='withdraw_stake'&&!error){
  item.recipient_after_wei=String(await rpc('eth_getBalance',[actors[who].address,'latest']));
  assert.equal(BigInt(item.recipient_after_wei)-BigInt(item.recipient_before_wei),BigInt(args[1]),'PRINCIPAL_TRANSFER_DELTA');
 }
 conserved(item.read_back,item.contract_balance_wei);
 item.verified=true;save();console.log(tag,'FINALIZED',item.execution,item.hash);return item;
}
const GEN = 10n ** 18n;
const BOUNTY = GEN / 5n;
const SLASH = GEN / 10n;
const agent = 'stake-exit-' + log.label;
const task = agent + '-task';
const owner = actors.agent.address.toLowerCase();
for (const signer of Object.values(actors)) {
 if (BigInt(await rpc('eth_getBalance',[signer.address,'latest'])) < 2n * GEN) {
  await fundAccount(signer.address, 5n * GEN);
 }
}
await run('register','agent','register_agent',[agent,GEN,'documentation'],GEN);
await run('idle-exit','agent','withdraw_stake',[agent,GEN],0n,null,s=>{
 assert.equal(s.agents[agent].stake,0);
 assert.equal(s.withdrawable[owner] ?? 0,0);
});
await run('duplicate-exit','agent','withdraw_stake',[agent,GEN],0n,'NO_STAKE_TO_WITHDRAW');
await run('reactivate','agent','top_up_stake',[agent,GEN],GEN);
const spec = 'Deliver a concise English three-step runbook for checking a public delivery manifest, with one hash-change example and limitations.';
await run('post','poster','post_task',[task,'Manifest runbook',BOUNTY,hash(spec),spec],BOUNTY);
await run('claim','agent','claim_task',[task,agent]);
await run('locked-exit','agent','withdraw_stake',[agent,GEN],0n,'STAKE_LOCKED');
const fixture = 'fixtures/probe-c-recipe.txt';
const url = 'https://raw.githubusercontent.com/halihalibt/task-prism-genlayer/a24e07e5e9ed7aebb431f52c81898b36d4f29d6c/' + fixture;
await run('submit','agent','submit_delivery',[task,url,hash(fs.readFileSync(fixture)),'Chocolate cake recipe.']);
await run('evaluate','poster','evaluate_delivery',[task],0n,null,s=>assert.equal(s.tasks[task].rounds[0].verdict,'REJECT'));
await run('pending-exit','agent','withdraw_stake',[agent,GEN],0n,'STAKE_LOCKED');
await run('challenge','agent','challenge_delivery',[task,'Check whether this cake recipe contains any of the manifest verification steps.'],0n,null,s=>{
 assert.equal(s.tasks[task].final_verdict,'REJECT');
 assert.equal(BigInt(s.agents[agent].stake),GEN-SLASH);
});
await run('wrong-principal','agent','withdraw_stake',[agent,GEN],0n,'STAKE_CHANGED');
await run('post-slash-exit','agent','withdraw_stake',[agent,GEN-SLASH],0n,null,s=>{
 assert.equal(s.agents[agent].stake,0);
 assert.equal(BigInt(s.treasury),SLASH);
 assert.equal(BigInt(s.withdrawable[actors.poster.address.toLowerCase()]),BOUNTY);
});
log.completed = true;
save();
for(const name of names)fs.unlinkSync(`.local/stake-exit-${name}-key`);
