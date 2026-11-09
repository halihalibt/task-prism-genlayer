import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createAccount,abi} from 'genlayer-js';
import {reader,rpc,validateChain,sendLocal} from './network.js';
const code=fs.readFileSync('contracts/task_prism.py','utf8');
await validateChain();
let wrongRejected=false;try{await validateChain(async()=> '0x1');}catch(e){wrongRejected=e.message==='WRONG_CHAIN';}
if(!wrongRejected)throw Error('WRONG_CHAIN_CHECK_FAILED');
const schema=await reader.getContractSchemaForCode(code);
if(schema?.error)throw Error(JSON.stringify(schema));
console.log(JSON.stringify({mode:'dry-validate',chain:61999,source_sha256:createHash('sha256').update(code).digest('hex'),wrong_chain_rejected:wrongRejected,schema}));
if(!process.argv.includes('--dry-validate')){
 const account=createAccount();
 const data=abi.transactions.serialize([new TextEncoder().encode(code),abi.calldata.encode(abi.calldata.makeCalldataObject(undefined,[],{})),false]);
 const hash=await sendLocal(account,'0x0000000000000000000000000000000000000000',data);
 const record={network:'Stable Studionet',chain_id:61999,rpc:'https://studio.genlayer.com/api',deploy_tx:hash,deployer:account.address,source_commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),source_path:'contracts/task_prism.py',source_sha256:createHash('sha256').update(code).digest('hex'),submitted_at:new Date().toISOString()};
 fs.writeFileSync('evidence/deployment.json',JSON.stringify(record,null,2)+'\n');
 console.log(JSON.stringify(record));
}
