import {createClient,abi} from 'genlayer-js';
import {encodeFunctionData} from 'viem';
import {studionet} from 'genlayer-js/chains';
const {calldata,transactions}=abi;
export const RPC='https://studio.genlayer.com/api';
export const chain={...studionet,rpcUrls:{default:{http:[RPC]}}};
export const reader=createClient({chain,endpoint:RPC});
export async function rpc(method,params=[]){
 for(let attempt=0;attempt<8;attempt++){
  const r=await fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(60000)});
  if(r.status===429){const seconds=Math.max(1,Number(r.headers.get('retry-after')||r.headers.get('x-ratelimit-reset')||60));console.warn(`RPC rate limit for ${method}; waiting ${seconds}s as requested by server.`);await new Promise(resolve=>setTimeout(resolve,Math.min(seconds,3600)*1000));continue;}
  if(!r.ok)throw Error(`RPC_HTTP_${r.status}`);
  const j=await r.json();if(j.error)throw Error(JSON.stringify(j.error));return j.result;
 }
 throw Error('RPC_RATE_LIMIT_RETRY_LATER');
}
export async function validateChain(request=rpc){const id=await request('eth_chainId');if(Number(BigInt(id))!==61999)throw Error('WRONG_CHAIN');return id;}
export function encoded(method,args=[]){return transactions.serialize([calldata.encode(calldata.makeCalldataObject(method,args,{})),false]);}
export function envelope(sender,to,data){const entry=chain.consensusMainContract.abi.find(x=>x.type==='function'&&x.name==='addTransaction');const args=[sender,to,5,3,data];if(entry.inputs.length===6)args.push(BigInt(Math.floor(Date.now()/1000)+3600));return encodeFunctionData({abi:[entry],functionName:'addTransaction',args});}
export async function sendLocal(account,to,data){await validateChain();const nonce=await rpc('eth_getTransactionCount',[account.address,'latest']);const serialized=await account.signTransaction({chainId:61999,type:'legacy',to:chain.consensusMainContract.address,data:envelope(account.address,to,data),nonce:Number(BigInt(nonce)),gas:20000000n,gasPrice:0n,value:0n});return rpc('eth_sendRawTransaction',[serialized]);}
