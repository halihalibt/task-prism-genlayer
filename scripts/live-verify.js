import readline from 'node:readline';
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash}from'node:crypto';import {createAccount}from'genlayer-js';import{rpc,reader,readFinal,sendLocal,encoded,validateChain}from'./network.js';
const d=JSON.parse(fs.readFileSync('evidence/deployment.json')),address=d.contract_address;
assert(address);await validateChain();
const hash=s=>createHash('sha256').update(s).digest('hex');
const a=createAccount(),b=createAccount(),c=createAccount();
await readFinal(address);
const label=new Date().toISOString().replace(/\D/g,'').slice(0,14);
const log={network:'Stable Studionet',chain_id:61999,contract:address,started_at:new Date().toISOString(),scope:'Live signed transactions with finalized receipts and latest-final read-back. No user-wallet path is implied.',public_accounts:{poster:a.address,agent:b.address,observer:c.address},all_scenarios_passed:false,transactions:[]};
const save=()=>fs.writeFileSync('evidence/live-verification.json',JSON.stringify(log,null,2)+'\n');
const read=async()=>JSON.parse(await readFinal(address));
async function run(account,method,args=[],check=()=>{},expectError=false){
 const matches=x=>x.sender===account.address&&x.method===method&&JSON.stringify(x.args)===JSON.stringify(args)&&!!x.expect_error===expectError;
 const done=log.transactions.find(x=>matches(x)&&x.verified);if(done)return done;
 let item=log.transactions.findLast(x=>matches(x)&&!x.verified&&(x.receipt?.status!=='FINALIZED'||x.receipt?.result_name==='MAJORITY_AGREE'));
 if(!item){const tx=await sendLocal(account,address,encoded(method,args));item={method,args,sender:account.address,hash:tx,submitted_at:new Date().toISOString(),expect_error:expectError,verified:false};log.transactions.push(item);save();console.log(method,'submitted',tx);}
 for(let i=0;i<240;i++){item.receipt=await rpc('eth_getTransactionByHash',[item.hash]);if(item.receipt?.status==='FINALIZED')break;await new Promise(r=>setTimeout(r,12000));}
 save();assert.equal(item.receipt.status,'FINALIZED');const receipts=item.receipt.consensus_data?.leader_receipt;const leader=Array.isArray(receipts)?receipts.find(r=>r.mode==='leader'):receipts;
 item.execution=leader?.execution_result;item.read_back=await read();item.read_back_at=new Date().toISOString();save();assert.equal(item.receipt.result_name,'MAJORITY_AGREE','CONSENSUS_NOT_REACHED');
 if(expectError){assert.equal(item.execution,'ERROR');assert.match(leader.genvm_result?.stderr||'',/STAKE_BELOW_MINIMUM/);}else{assert.equal(item.execution,'SUCCESS',JSON.stringify(leader?.genvm_result));check(item.read_back);}
 item.verified=true;save();console.log(method,'FINALIZED',item.execution);return item;
}
function conserved(s){const wallets=Object.values(s.balances).reduce((x,y)=>x+y,0),stakes=Object.values(s.agents).filter(x=>x.origin!=='seed_demo').reduce((x,a)=>x+a.stake,0),escrow=Object.values(s.tasks).filter(t=>t.origin!=='seed_demo'&&!['FINALIZED','EXPIRED'].includes(t.status)).reduce((x,t)=>x+t.bounty,0);assert.equal(s.issued,wallets+stakes+escrow+s.treasury);}
async function mainFlow(){
const agent='runbook-agent-'+label;
await run(a,'claim_demo_funds',[],s=>assert.equal(s.balances[a.address.toLowerCase()],10000));
await run(b,'claim_demo_funds',[],s=>assert.equal(s.balances[b.address.toLowerCase()],10000));
await run(b,'register_agent',[agent,1000,'integrity, evidence, technical writing'],s=>{assert.equal(s.agents[agent].stake,1000);conserved(s);});
const url='https://raw.githubusercontent.com/halihalibt/task-prism-genlayer/bc00d0f953ba813114c254d1e6bb698e7bc113e3/fixtures/delivery.txt';
const body=fs.readFileSync('fixtures/delivery.txt');
async function delivery(id,title,spec,expected,resource=url,summary='A public UTF-8 runbook with three numbered steps, an example and limitations.',skipEvaluation=false){await run(a,'post_task',[id,title,200,hash(spec),spec],s=>{assert.equal(s.tasks[id].status,'OPEN');conserved(s);});await run(b,'claim_task',[id,agent],s=>assert.equal(s.tasks[id].status,'CLAIMED'));await run(b,'submit_delivery',[id,resource,expected,summary],s=>assert.equal(s.tasks[id].status,'SUBMITTED'));if(skipEvaluation)return;await run(c,'evaluate_delivery',[id],s=>{assert.equal(s.tasks[id].status,'EVALUATING');assert.equal(s.tasks[id].rounds.length,1);assert.equal(s.tasks[id].settlement,null);conserved(s);});}
const accept='runbook-'+label;
await delivery(accept,'A source-integrity verification runbook','Deliver a concise English runbook for public source delivery integrity. Include three numbered steps: capture exact UTF-8 bytes and calculate SHA-256; compare against the submitted hash; inspect verdict scores and wait for FINALIZED and latest-final. Include one hash-change example and explicit limitations. A short, self-contained text is sufficient; no external research or citations are required.',hash(body));
await run(a,'challenge_delivery',[accept,'Recheck the three requested steps, the hash-change example, and the limitations against the exact delivered text.'],s=>{assert.equal(s.tasks[accept].status,'FINALIZED');assert.equal(s.tasks[accept].rounds.length,2);assert.equal(s.tasks[accept].rounds[0].verdict,'ACCEPT');assert.equal(s.tasks[accept].final_verdict,'ACCEPT');assert.equal(s.reputation[a.address.toLowerCase()],95);assert.equal(s.reputation[b.address.toLowerCase()],110);conserved(s);});
const reject='integrity-'+label;
await delivery(reject,'Byte-integrity negative control','Deliver a concise English three-step runbook for checking a public delivery manifest, with one hash-change example and limitations.','0'.repeat(64));
await run(c,'finalize_delivery',[reject],s=>{assert.equal(s.tasks[reject].final_verdict,'REJECT');assert.equal(s.agents[agent].stake,900);assert.equal(s.tasks[reject].settlement.refunded_to_poster,200);assert.equal(s.treasury,100);assert.equal(s.reputation[b.address.toLowerCase()],95);conserved(s);});
const next='pipeline-'+label,spec='Provide a short review of a delivery integrity manifest.';
await run(a,'post_task',[next,'An explicitly expired pipeline task',200,hash(spec),spec],s=>assert.equal(s.tasks[next].status,'OPEN'));
await run(b,'claim_task',[next,agent],()=>{},true);
await run(b,'top_up_stake',[agent,100],s=>{assert.equal(s.agents[agent].stake,1000);conserved(s);});
await run(b,'claim_task',[next,agent],s=>assert.equal(s.tasks[next].status,'CLAIMED'));
await run(a,'expire_task',[next],s=>{assert.equal(s.tasks[next].status,'EXPIRED');assert.equal(s.agents[agent].open_claim,'');conserved(s);});
const partial='support-'+label;
const translationURL='https://raw.githubusercontent.com/halihalibt/task-prism-genlayer/f3406aad2268e4e8070fb6e8f5bf5ae203ea1cc3/fixtures/support-es.txt';
const translationSpec='Create an English-to-Spanish customer support reply sheet. Translate all five equally weighted source messages, retaining their numbering and meaning, with natural, grammatically correct Spanish usable by a support agent: 1. Your file is ready to download. 2. We received your request. 3. Please confirm your email address. 4. Your appointment is on Monday. 5. Your order has been canceled. Each source needs its own Spanish translation. No citations or external research are needed.';
const browserPartial=process.argv.includes('--browser-partial');
await delivery(partial,'Spanish customer support reply sheet',translationSpec,hash(fs.readFileSync('fixtures/support-es.txt')),translationURL,'Three numbered English-to-Spanish support replies.',browserPartial);
if(browserPartial){log.awaiting_browser_adjudication={task_id:partial};log.run_finished_at=new Date().toISOString();log.core_methods_verified=true;save();console.log('BROWSER ADJUDICATION READY',partial);return;}

const pending=(await read()).tasks[partial];
assert.equal(pending.pending_verdict,'PARTIAL','PARTIAL_SCENARIO_NOT_REACHED');
await run(c,'finalize_delivery',[partial],s=>{const task=s.tasks[partial];assert.equal(task.status,'FINALIZED');assert.equal(task.final_verdict,'PARTIAL');assert.equal(task.settlement.paid_to_agent,100);assert.equal(task.settlement.refunded_to_poster,100);conserved(s);});
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
  running=true;await run(actors[cmd.actor],cmd.method,cmd.args||[],()=>{},!!cmd.expect_error);
 }catch(error){console.error(String(error));}finally{running=false;}
});
try{await mainFlow();running=false;if(!process.argv.includes('--browser-partial'))input.close();}catch(error){running=false;console.error(String(error));console.log('Verification paused. In-memory signers remain available for JSON retry commands.');}
