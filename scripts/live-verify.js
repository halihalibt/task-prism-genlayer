import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash}from'node:crypto';import {createAccount}from'genlayer-js';import{rpc,reader,sendLocal,encoded,validateChain}from'./network.js';
const d=JSON.parse(fs.readFileSync('evidence/deployment.json')),address=d.contract_address;
assert(address);await validateChain();
const hash=s=>createHash('sha256').update(s).digest('hex');
const a=createAccount(),b=createAccount(),c=createAccount();
const label=new Date().toISOString().replace(/\D/g,'').slice(0,14);
const log={network:'Stable Studionet',chain_id:61999,contract:address,started_at:new Date().toISOString(),scope:'Live signed transactions with finalized receipts and latest-final read-back. No user-wallet path is implied.',public_accounts:{poster:a.address,agent:b.address,observer:c.address},transactions:[]};
const save=()=>fs.writeFileSync('evidence/live-verification.json',JSON.stringify(log,null,2)+'\n');
const read=async()=>JSON.parse(await reader.readContract({address,functionName:'get_state',args:[],transactionHashVariant:'latest-final'}));
async function run(account,method,args=[],check=()=>{},expectError=false){const tx=await sendLocal(account,address,encoded(method,args));const item={method,args,sender:account.address,hash:tx,submitted_at:new Date().toISOString()};log.transactions.push(item);save();console.log(method,'submitted',tx);let receipt;for(let i=0;i<240;i++){receipt=await rpc('eth_getTransactionByHash',[tx]);if(receipt?.status==='FINALIZED')break;await new Promise(r=>setTimeout(r,6000));}item.receipt=receipt;save();assert.equal(receipt.status,'FINALIZED');const leaders=receipt.consensus_data?.leader_receipt;const leader=Array.isArray(leaders)?leaders.find(r=>r.mode==='leader')||leaders[0]:leaders;item.execution=leader?.execution_result;item.read_back=await read();item.read_back_at=new Date().toISOString();save();if(expectError){assert.notEqual(item.execution,'SUCCESS');}else{assert.equal(item.execution,'SUCCESS',JSON.stringify(leader?.genvm_result));check(item.read_back);}item.verified=true;save();console.log(method,'FINALIZED',item.execution);return item;}
function conserved(s){const wallets=Object.values(s.balances).reduce((x,y)=>x+y,0),stakes=Object.values(s.agents).filter(x=>x.origin!=='seed_demo').reduce((x,a)=>x+a.stake,0),escrow=Object.values(s.tasks).filter(t=>t.origin!=='seed_demo'&&!['FINALIZED','EXPIRED'].includes(t.status)).reduce((x,t)=>x+t.bounty,0);assert.equal(s.issued,wallets+stakes+escrow+s.treasury);}
const agent='runbook-agent-'+label;
await run(a,'claim_demo_funds',[],s=>assert.equal(s.balances[a.address.toLowerCase()],10000));
await run(b,'claim_demo_funds',[],s=>assert.equal(s.balances[b.address.toLowerCase()],10000));
await run(b,'register_agent',[agent,1000,'integrity, evidence, technical writing'],s=>{assert.equal(s.agents[agent].stake,1000);conserved(s);});
const url='https://raw.githubusercontent.com/halihalibt/task-prism-genlayer/bc00d0f953ba813114c254d1e6bb698e7bc113e3/fixtures/delivery.txt';
const body=fs.readFileSync('fixtures/delivery.txt');
async function delivery(id,title,spec,expected){await run(a,'post_task',[id,title,200,hash(spec),spec],s=>{assert.equal(s.tasks[id].status,'OPEN');conserved(s);});await run(b,'claim_task',[id,agent],s=>assert.equal(s.tasks[id].status,'CLAIMED'));await run(b,'submit_delivery',[id,url,expected,'A public UTF-8 runbook with three numbered steps, an example and limitations.'],s=>assert.equal(s.tasks[id].status,'SUBMITTED'));await run(c,'evaluate_delivery',[id],s=>{assert.equal(s.tasks[id].status,'EVALUATING');assert.equal(s.tasks[id].rounds.length,1);assert.equal(s.tasks[id].settlement,null);conserved(s);});}
const accept='runbook-'+label;
await delivery(accept,'A source-integrity verification runbook','Deliver a concise English runbook for public source delivery integrity. Include three numbered steps: capture exact UTF-8 bytes and calculate SHA-256; compare against the submitted hash; inspect verdict scores and wait for FINALIZED and latest-final. Include one hash-change example and explicit limitations. A short, self-contained text is sufficient; no external research or citations are required.',hash(body));
await run(a,'challenge_delivery',[accept,'Recheck the three requested steps, the hash-change example, and the limitations against the exact delivered text.'],s=>{assert.equal(s.tasks[accept].status,'FINALIZED');assert.equal(s.tasks[accept].rounds.length,2);conserved(s);});
const reject='integrity-'+label;
await delivery(reject,'Byte-integrity negative control','Deliver a concise English three-step runbook for checking a public delivery manifest, with one hash-change example and limitations.','0'.repeat(64));
await run(c,'finalize_delivery',[reject],s=>{assert.equal(s.tasks[reject].final_verdict,'REJECT');assert.equal(s.agents[agent].stake,900);conserved(s);});
const next='pipeline-'+label,spec='Provide a short review of a delivery integrity manifest.';
await run(a,'post_task',[next,'An explicitly expired pipeline task',200,hash(spec),spec],s=>assert.equal(s.tasks[next].status,'OPEN'));
await run(b,'claim_task',[next,agent],()=>{},true);
await run(b,'top_up_stake',[agent,100],s=>{assert.equal(s.agents[agent].stake,1000);conserved(s);});
await run(b,'claim_task',[next,agent],s=>assert.equal(s.tasks[next].status,'CLAIMED'));
await run(a,'expire_task',[next],s=>{assert.equal(s.tasks[next].status,'EXPIRED');assert.equal(s.agents[agent].open_claim,'');conserved(s);});
log.completed_at=new Date().toISOString();save();console.log('LIVE VERIFICATION COMPLETE');
