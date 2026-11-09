// Live verification of the real-GEN contract (scripts/live-verify.js).
//
// Core evidence flow on the ACTIVE deployment (see evidence/deployment.json):
// faucet-funded accounts, real GEN bounties/stakes (wei), pull-payment
// withdrawals, and conservation against the contract's on-chain GEN balance.
// No simulated ledger: every amount below is wei of testnet GEN.
//
// Flow: register agent (1 GEN stake) -> ACCEPT runbook task with a poster
// challenge (2 rounds) -> agent withdraws the full bounty -> REJECT task
// (unrelated delivery, correct hash) -> stake-threshold rejection ->
// top-up -> claim -> expire -> PARTIAL translation task -> both parties
// withdraw their halves. Every step asserts conservation:
//   contract GEN balance == escrow + stakes + withdrawable + treasury.
//
// Run: node scripts/live-verify.js <fixture-commit> [--browser-partial]
// The fixture commit is the pushed commit that introduced the probe
// fixtures; the REJECT case pins its delivery URL to it.
// Output: evidence/live-verification.json (packaged later by
// scripts/record-evidence.py; do not hand-edit the packaged file).
import readline from 'node:readline';
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash}from'node:crypto';import {createAccount}from'genlayer-js';import{rpc,reader,readFinal,sendLocal,encoded,validateChain,fundAccount,contractBalance}from'./network.js';
const d=JSON.parse(fs.readFileSync('evidence/deployment.json')),address=d.contract_address;
assert(address);await validateChain();
const hash=s=>createHash('sha256').update(s).digest('hex');
const GEN=10n**18n;
const BOUNTY=2n*10n**17n; // 0.2 GEN
const STAKE=10n**18n; // 1 GEN
const SLASH=10n**17n; // 0.1 GEN
const a=createAccount(),b=createAccount(),c=createAccount();
const fixtureCommit=process.argv.find((x)=>/^[0-9a-f]{40}$/.test(x));
assert(fixtureCommit,'Pass the fixture commit SHA as the first argument: node scripts/live-verify.js <commit>');
await readFinal(address);
const label=new Date().toISOString().replace(/\D/g,'').slice(0,14);
const log={network:'Stable Studionet',chain_id:61999,contract:address,started_at:new Date().toISOString(),scope:'Live signed transactions with finalized receipts and latest-final read-back. Real testnet GEN (wei); no simulated ledger. No user-wallet path is implied.',public_accounts:{poster:a.address,agent:b.address,observer:c.address},all_scenarios_passed:false,transactions:[]};
const save=()=>fs.writeFileSync('evidence/live-verification.json',JSON.stringify(log,null,2)+'\n');
const read=async()=>JSON.parse(await readFinal(address));
const readContractBalance=async()=>{const onchain=await contractBalance(address);const view=await readFinal(address,'get_contract_balance',[]);assert.equal(BigInt(onchain),BigInt(JSON.parse(view)),'CONTRACT_BALANCE_VIEW_MISMATCH');return BigInt(onchain);};
async function fund(account,amount){await fundAccount(account.address,amount);for(let i=0;i<30;i++){const bal=BigInt(await rpc('eth_getBalance',[account.address,'latest']));if(bal>=amount)return;await new Promise(r=>setTimeout(r,2000));}throw Error('FAUCET_FUND_TIMEOUT');}
function conserved(s,contractWei){
 const escrow=Object.values(s.tasks).filter(t=>t.origin!=='seed_demo'&&!['FINALIZED','EXPIRED'].includes(t.status)).reduce((x,t)=>x+BigInt(t.bounty),0n);
 const stakes=Object.values(s.agents).filter(x=>x.origin!=='seed_demo').reduce((x,ag)=>x+BigInt(ag.stake),0n);
 const withdrawable=Object.values(s.withdrawable||{}).reduce((x,y)=>x+BigInt(y),0n);
 assert.equal(BigInt(contractWei),escrow+stakes+withdrawable+BigInt(s.treasury),'GEN_CONSERVATION');
}
const isIdle=(r)=>{try{return Buffer.from(r.result||'','base64').toString('utf-8').includes('idle');}catch{return false;}};
function leaderOutcome(receipt){const leaders=receipt.consensus_data?.leader_receipt||[];const list=Array.isArray(leaders)?leaders:[leaders];return{leader:list.find((r)=>r.mode==='leader')||list[0],list};}
async function run(account,method,args=[],check=()=>{},expectError=false,value=0n){
 const matches=x=>x.sender===account.address&&x.method===method&&JSON.stringify(x.args)===JSON.stringify(args)&&!!x.expect_error===expectError;
 const done=log.transactions.find(x=>matches(x)&&x.verified);if(done)return done;
 let item=log.transactions.findLast(x=>matches(x)&&!x.verified&&(x.receipt?.status!=='FINALIZED'||x.receipt?.result_name==='MAJORITY_AGREE'));
 if(!item){const tx=await sendLocal(account,address,encoded(method,args),value);item={method,args,sender:account.address,hash:tx,submitted_at:new Date().toISOString(),expect_error:expectError,verified:false};log.transactions.push(item);save();console.log(method,'submitted',tx);}
 for(let i=0;i<240;i++){item.receipt=await rpc('eth_getTransactionByHash',[item.hash]);if(item.receipt?.status==='FINALIZED')break;await new Promise(r=>setTimeout(r,12000));}
 save();assert.equal(item.receipt.status,'FINALIZED');const {leader,list}=leaderOutcome(item.receipt);
 item.execution=leader?.execution_result;item.read_back=await read();item.read_back_at=new Date().toISOString();item.contract_balance_wei=(await readContractBalance()).toString();save();assert.equal(item.receipt.result_name,'MAJORITY_AGREE','CONSENSUS_NOT_REACHED');
 if(expectError){assert.equal(item.execution,'ERROR');assert.match(leader.genvm_result?.stderr||'',/STAKE_BELOW_MINIMUM/);}else{assert.equal(item.execution,'SUCCESS',JSON.stringify(leader?.genvm_result));check(item.read_back);conserved(item.read_back,BigInt(item.contract_balance_wei));}
 item.verified=true;save();console.log(method,'FINALIZED',item.execution);return item;
}
async function withdrawAndCheck(account,expectedWei){
 const before=BigInt(await rpc('eth_getBalance',[account.address,'latest']));
 await run(account,'withdraw',[],s=>{assert.equal(BigInt(s.withdrawable[account.address.toLowerCase()]||0),0n);});
 const after=BigInt(await rpc('eth_getBalance',[account.address,'latest']));
 assert.equal(after-before,BigInt(expectedWei),'WITHDRAW_EOA_DELTA');
 console.log('withdraw',account.address.slice(0,10),'received',expectedWei.toString(),'wei');
}
async function mainFlow(){
const agent='runbook-agent-'+label;
await fund(a,2n*GEN);await fund(b,2n*GEN);
await run(b,'register_agent',[agent,STAKE,'integrity, evidence, technical writing'],s=>{assert.equal(BigInt(s.agents[agent].stake),STAKE);},false,STAKE);
const url='https://raw.githubusercontent.com/halihalibt/task-prism-genlayer/bc00d0f953ba813114c254d1e6bb698e7bc113e3/fixtures/delivery.txt';
const body=fs.readFileSync('fixtures/delivery.txt');
async function delivery(id,title,spec,expected,resource=url,summary='A public UTF-8 runbook with three numbered steps, an example and limitations.',skipEvaluation=false){await run(a,'post_task',[id,title,BOUNTY,hash(spec),spec],s=>{assert.equal(s.tasks[id].status,'OPEN');},false,BOUNTY);await run(b,'claim_task',[id,agent],s=>assert.equal(s.tasks[id].status,'CLAIMED'));await run(b,'submit_delivery',[id,resource,expected,summary],s=>assert.equal(s.tasks[id].status,'SUBMITTED'));if(skipEvaluation)return;await run(c,'evaluate_delivery',[id],s=>{assert.equal(s.tasks[id].status,'EVALUATING');assert.equal(s.tasks[id].rounds.length,1);assert.equal(s.tasks[id].settlement,null);});}
const accept='runbook-'+label;
await delivery(accept,'A source-integrity verification runbook','Deliver a concise English runbook for public source delivery integrity. Include three numbered steps: capture exact UTF-8 bytes and calculate SHA-256; compare against the submitted hash; inspect verdict scores and wait for FINALIZED and latest-final. Include one hash-change example and explicit limitations. A short, self-contained text is sufficient; no external research or citations are required.',hash(body));
await run(a,'challenge_delivery',[accept,'Recheck the three requested steps, the hash-change example, and the limitations against the exact delivered text.'],s=>{assert.equal(s.tasks[accept].status,'FINALIZED');assert.equal(s.tasks[accept].rounds.length,2);assert.equal(s.tasks[accept].rounds[0].verdict,'ACCEPT');assert.equal(s.tasks[accept].final_verdict,'ACCEPT');assert.equal(s.reputation[a.address.toLowerCase()],95);assert.equal(s.reputation[b.address.toLowerCase()],110);});
await withdrawAndCheck(b,BOUNTY);
const reject='integrity-'+label;
const recipe=fs.readFileSync('fixtures/probe-c-recipe.txt');
await delivery(reject,'Byte-integrity negative control','Deliver a concise English three-step runbook for checking a public delivery manifest, with one hash-change example and limitations.',hash(recipe),'https://raw.githubusercontent.com/halihalibt/task-prism-genlayer/'+fixtureCommit+'/fixtures/probe-c-recipe.txt','A chocolate cake recipe, unrelated to the requested runbook.');
await run(c,'finalize_delivery',[reject],s=>{assert.equal(s.tasks[reject].final_verdict,'REJECT');assert.equal(BigInt(s.agents[agent].stake),STAKE-SLASH);assert.equal(BigInt(s.tasks[reject].settlement.refunded_to_poster),BOUNTY);assert.equal(BigInt(s.treasury),SLASH);assert.equal(s.reputation[b.address.toLowerCase()],95);});
const next='pipeline-'+label,spec='Provide a short review of a delivery integrity manifest.';
await run(a,'post_task',[next,'An explicitly expired pipeline task',BOUNTY,hash(spec),spec],s=>assert.equal(s.tasks[next].status,'OPEN'),false,BOUNTY);
await run(b,'claim_task',[next,agent],()=>{},true);
await run(b,'top_up_stake',[agent,SLASH],s=>{assert.equal(BigInt(s.agents[agent].stake),STAKE);},false,SLASH);
await run(b,'claim_task',[next,agent],s=>assert.equal(s.tasks[next].status,'CLAIMED'));
await run(a,'expire_task',[next],s=>{assert.equal(s.tasks[next].status,'EXPIRED');assert.equal(s.agents[agent].open_claim,'');});
await withdrawAndCheck(a,BOUNTY*2n); // REJECT refund (0.2) + expire refund (0.2)
const partial='support-'+label;
const translationURL='https://raw.githubusercontent.com/halihalibt/task-prism-genlayer/f3406aad2268e4e8070fb6e8f5bf5ae203ea1cc3/fixtures/support-es.txt';
const translationSpec='Create an English-to-Spanish customer support reply sheet. Translate all five equally weighted source messages, retaining their numbering and meaning, with natural, grammatically correct Spanish usable by a support agent: 1. Your file is ready to download. 2. We received your request. 3. Please confirm your email address. 4. Your appointment is on Monday. 5. Your order has been canceled. Each source needs its own Spanish translation. No citations or external research are needed.';
const browserPartial=process.argv.includes('--browser-partial');
await delivery(partial,'Spanish customer support reply sheet',translationSpec,hash(fs.readFileSync('fixtures/support-es.txt')),translationURL,'Three numbered English-to-Spanish support replies.',browserPartial);
if(browserPartial){log.awaiting_browser_adjudication={task_id:partial};log.run_finished_at=new Date().toISOString();log.core_methods_verified=true;save();console.log('BROWSER ADJUDICATION READY',partial);return;}

const pending=(await read()).tasks[partial];
assert.equal(pending.pending_verdict,'PARTIAL','PARTIAL_SCENARIO_NOT_REACHED');
await run(c,'finalize_delivery',[partial],s=>{const task=s.tasks[partial];assert.equal(task.status,'FINALIZED');assert.equal(task.final_verdict,'PARTIAL');assert.equal(BigInt(task.settlement.paid_to_agent),BOUNTY/2n);assert.equal(BigInt(task.settlement.refunded_to_poster),BOUNTY/2n);});
await withdrawAndCheck(b,BOUNTY/2n);
await withdrawAndCheck(a,BOUNTY/2n);
log.all_scenarios_passed=true;
log.completed_at=new Date().toISOString();save();console.log('LIVE VERIFICATION COMPLETE');
}

// Keep in-memory signers available after a recoverable verification failure.
const input=readline.createInterface({input:process.stdin,output:process.stdout,terminal:false});
let running=true;
input.on('line',async line=>{
 if(running){console.log('A verification action is already running.');return;}
 try{
  const cmd=JSON.parse(line),actors={poster:a,agent:b,observer:c};
  if(cmd.method==='resume'){running=true;await mainFlow();return;}
 if(cmd.method==='read'){const snapshot=await read();fs.writeFileSync('evidence/session-read-back.json',JSON.stringify(snapshot,null,2)+'\n');console.log(JSON.stringify({tasks:Object.fromEntries(Object.entries(snapshot.tasks).map(([k,t])=>[k,t.status])),agents:Object.keys(snapshot.agents)}));return;}
  if(cmd.method==='close'){input.close();return;}
  if(!actors[cmd.actor])throw Error('UNKNOWN_ACTOR');
  running=true;await run(actors[cmd.actor],cmd.method,cmd.args||[],()=>{},!!cmd.expect_error,BigInt(cmd.value||0));
 }catch(error){console.error(String(error));}finally{running=false;}
});
try{await mainFlow();running=false;if(!process.argv.includes('--browser-partial'))input.close();}catch(error){running=false;console.error(String(error));console.log('Verification paused. In-memory signers remain available for JSON retry commands.');}
