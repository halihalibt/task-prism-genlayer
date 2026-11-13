import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createAccount,abi} from 'genlayer-js';
import {reader,readFinal,rpc,validateChain,sendLocal} from './network.js';
if(!process.argv.includes('--dry-validate')&&!process.argv.includes('--confirm-deploy'))throw Error('DEPLOY_SIGNATURE_CONFIRMATION_REQUIRED: use --dry-validate for read-only checks.');
const code=fs.readFileSync('contracts/task_prism.py','utf8');
await validateChain();
let wrongRejected=false;try{await validateChain(async()=> '0x1');}catch(e){wrongRejected=e.message==='WRONG_CHAIN';}
if(!wrongRejected)throw Error('WRONG_CHAIN_CHECK_FAILED');
const schema=await reader.getContractSchemaForCode(code);
if(schema?.error)throw Error(JSON.stringify(schema));
console.log(JSON.stringify({mode:'dry-validate',chain:61999,source_sha256:createHash('sha256').update(code).digest('hex'),wrong_chain_rejected:wrongRejected,schema}));
if(!process.argv.includes('--dry-validate')){
 const candidate=fs.existsSync('evidence/timing-candidate.json')?JSON.parse(fs.readFileSync('evidence/timing-candidate.json')):null;
 const evidenceDir=candidate?.status==='NOT_DEPLOYED'?'evidence/timing-deployment':'evidence';
 fs.mkdirSync(evidenceDir,{recursive:true});
 if(evidenceDir!=='evidence'&&fs.existsSync(`${evidenceDir}/deployment.json`))throw Error('TIMING_DEPLOYMENT_ALREADY_RECORDED: inspect the existing attempt before signing again.');
 const account=createAccount();
 const data=abi.transactions.serialize([new TextEncoder().encode(code),abi.calldata.encode(abi.calldata.makeCalldataObject(undefined,[],{})),false]);
 const hash=await sendLocal(account,'0x0000000000000000000000000000000000000000',data);
 const record={network:'Stable Studionet',chain_id:61999,rpc:'https://studio.genlayer.com/api',deploy_tx:hash,deployer:account.address,source_commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),source_path:'contracts/task_prism.py',source_sha256:createHash('sha256').update(code).digest('hex'),submitted_at:new Date().toISOString()};
 fs.writeFileSync(`${evidenceDir}/deployment.json`,JSON.stringify(record,null,2)+'\n');
 console.log(JSON.stringify(record));
 let receipt;
 for(let i=0;i<120;i++){receipt=await rpc('eth_getTransactionByHash',[hash]);if(receipt?.status==='FINALIZED')break;await new Promise(resolve=>setTimeout(resolve,6000));}
 fs.writeFileSync(`${evidenceDir}/deploy-receipt.json`,JSON.stringify(receipt,null,2)+'\n');
 if(receipt?.status!=='FINALIZED')throw Error('DEPLOYMENT_PENDING');
 const leaders=receipt.consensus_data?.leader_receipt;const leader=Array.isArray(leaders)?leaders.find(x=>x.mode==='leader')||leaders[0]:leaders;
 if(receipt.result_name!=='MAJORITY_AGREE'||leader?.execution_result!=='SUCCESS'||!receipt.to_address||receipt.to_address==='0x0000000000000000000000000000000000000000')throw Error('DEPLOYMENT_EXECUTION_FAILED');
 record.contract_address=receipt.to_address;record.finalized_status='FINALIZED';
 fs.writeFileSync(`${evidenceDir}/deployment.json`,JSON.stringify(record,null,2)+'\n');
 const state=await readFinal(record.contract_address);
 fs.writeFileSync(`${evidenceDir}/deploy-read-back.json`,typeof state==='string'?state:JSON.stringify(state));
 console.log(JSON.stringify({contract:record.contract_address,status:'FINALIZED',execution:'SUCCESS',read_back:true}));
}
