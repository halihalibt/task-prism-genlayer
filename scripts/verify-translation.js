// Live setup of a bounded translation task. Signers exist only in memory.
// Real testnet GEN (wei): the poster locks a 0.2 GEN bounty, the agent
// stakes 1 GEN. No simulated ledger is used.
import fs from 'node:fs';
import readline from 'node:readline';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createAccount} from 'genlayer-js';
import {validateChain,rpc,readFinal,sendLocal,encoded,fundAccount,contractBalance} from './network.js';
import {receiptOutcome} from './receipt-status.js';

const contract=JSON.parse(fs.readFileSync('evidence/deployment.json')).contract_address;
const path='evidence/translation-setup.json';
assert(!fs.existsSync(path)&&!fs.existsSync(path+'.gz'),'Setup evidence already exists; inspect it before another run.');
await validateChain();
const GEN=10n**18n,BOUNTY=2n*10n**17n,STAKE=10n**18n;
const poster=createAccount(),agent=createAccount();
const task='support-'+new Date().toISOString().replace(/\D/g,'').slice(0,14);
const agentId=task+'-agent';
const sourceCommit='f3406aad2268e4e8070fb6e8f5bf5ae203ea1cc3';
const url=`https://raw.githubusercontent.com/halihalibt/task-prism-genlayer/${sourceCommit}/fixtures/support-es.txt`;
const spec='Create an English-to-Spanish customer support reply sheet. Translate all five equally weighted source messages, retaining their numbering and meaning, with natural, grammatically correct Spanish usable by a support agent: 1. Your file is ready to download. 2. We received your request. 3. Please confirm your email address. 4. Your appointment is on Monday. 5. Your order has been canceled. Each source needs its own Spanish translation. No citations or external research are needed.';
const sha=s=>createHash('sha256').update(s).digest('hex');
const log={network:'Stable Studionet',chain_id:61999,contract,task,agent_id:agentId,delivery_source_commit:sourceCommit,public_accounts:{poster:poster.address,agent:agent.address},scope:'Live task setup only; delivery verdict and settlement require independent consensus and read-back.',money:'Real testnet GEN, amounts in wei. No simulated ledger.',transactions:[]};
const save=()=>fs.writeFileSync(path,JSON.stringify(log,null,2)+'\n');
async function fund(account,amount){await fundAccount(account.address,amount);for(let i=0;i<30;i++){const bal=BigInt(await rpc('eth_getBalance',[account.address,'latest']));if(bal>=amount)return;await new Promise(r=>setTimeout(r,2000));}throw Error('FAUCET_FUND_TIMEOUT');}
async function conserved(s){const escrow=Object.values(s.tasks).filter(t=>t.origin!=='seed_demo'&&!['FINALIZED','EXPIRED'].includes(t.status)).reduce((x,t)=>x+BigInt(t.bounty),0n);const stakes=Object.values(s.agents).filter(x=>x.origin!=='seed_demo').reduce((x,a)=>x+BigInt(a.stake),0n);const withdrawable=Object.values(s.withdrawable||{}).reduce((x,y)=>x+BigInt(y),0n);const onchain=await contractBalance(contract);const view=await readFinal(contract,'get_contract_balance',[]);assert.equal(BigInt(onchain),BigInt(JSON.parse(view)),'CONTRACT_BALANCE_VIEW_MISMATCH');assert.equal(BigInt(onchain),escrow+stakes+withdrawable+BigInt(s.treasury),'GEN_CONSERVATION');}
async function run(account,method,args,check,value=0n){
 let item=log.transactions.find(x=>!x.verified&&x.sender===account.address&&x.method===method&&JSON.stringify(x.args)===JSON.stringify(args));
 if(!item){const hash=await sendLocal(account,contract,encoded(method,args),value);item={method,args,hash,sender:account.address,submitted_at:new Date().toISOString(),verified:false};log.transactions.push(item);save();console.log(method,hash);}
 const hash=item.hash;
 for(let i=0;i<120;i++){
  item.receipt=await rpc('eth_getTransactionByHash',[hash]);
  if(item.receipt?.status==='FINALIZED')break;
  await new Promise(resolve=>setTimeout(resolve,10000));
 }
 save();assert.equal(receiptOutcome(item.receipt),'readback','Transaction finality, consensus or execution failed');
 item.read_back=JSON.parse(await readFinal(contract));item.read_back_at=new Date().toISOString();item.contract_balance_wei=(await contractBalance(contract)).toString();check(item.read_back);await conserved(item.read_back);item.verified=true;save();console.log(method,'FINALIZED / MAJORITY_AGREE / SUCCESS');
}
await fund(poster,2n*GEN);await fund(agent,2n*GEN);
const steps=[
 [agent,'register_agent',[agentId,STAKE,'translation, Spanish, support'],s=>assert.equal(BigInt(s.agents[agentId].stake),STAKE),STAKE],
 [poster,'post_task',[task,'Spanish customer support reply sheet',BOUNTY,sha(spec),spec],s=>assert.equal(s.tasks[task].status,'OPEN'),BOUNTY],
 [agent,'claim_task',[task,agentId],s=>assert.equal(s.tasks[task].status,'CLAIMED'),0n],
 [agent,'submit_delivery',[task,url,sha(fs.readFileSync('fixtures/support-es.txt')),'Three numbered English-to-Spanish support replies.'],s=>assert.equal(s.tasks[task].status,'SUBMITTED'),0n]
];
let cursor=0,busy=false,uncertainBroadcast=false;
const input=readline.createInterface({input:process.stdin,output:process.stdout,terminal:false});
async function resume(){
 if(busy)return;if(uncertainBroadcast){console.error('Uncertain broadcast: inspect network state; automatic resubmission is blocked.');return;}busy=true;
 try{for(;cursor<steps.length;cursor++)await run(...steps[cursor]);log.setup_finished_at=new Date().toISOString();save();console.log(JSON.stringify({task,status:'SUBMITTED',next:'Evaluate through the task cockpit; no verdict is assumed.'}));input.close();}
 catch(error){uncertainBroadcast=!!error.broadcast_uncertain;console.error(String(error));console.log('Signers remain in memory. Inspect the failed RPC stage and pending hash before entering resume; an uncertain broadcast must not be repeated.');}
 finally{busy=false;}
}
input.on('line',line=>{if(line.trim()==='resume')resume();if(line.trim()==='close')input.close();});
await resume();
