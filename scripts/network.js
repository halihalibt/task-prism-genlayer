import {createClient,abi} from 'genlayer-js';
import {encodeFunctionData} from 'viem';
import {studionet} from 'genlayer-js/chains';
const {calldata,transactions}=abi;
export const RPC='https://studio.genlayer.com/api';
export const chain={...studionet,rpcUrls:{default:{http:[RPC]}}};
export const reader=createClient({chain,endpoint:RPC});
export async function rpc(method,params=[]){
 for(let attempt=0;attempt<8;attempt++){
  let r;try{r=await fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(60000)});}catch(error){if(method==='eth_sendRawTransaction'){error.broadcast_uncertain=true;throw error;}const seconds=Math.min(15*(attempt+1),60);if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('task-prism-network-delay',{detail:{seconds}}));await new Promise(resolve=>setTimeout(resolve,seconds*1000));continue;}
  if(r.status===429){const seconds=Math.max(15,Number(r.headers.get('retry-after')||r.headers.get('x-ratelimit-reset')||60)+1);console.warn(`RPC rate limit for ${method}; waiting ${seconds}s as requested by server.`);if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('task-prism-rate-limit',{detail:{seconds}}));await new Promise(resolve=>setTimeout(resolve,Math.min(seconds,3600)*1000));attempt--;continue;}
  if([408,502,503,504].includes(r.status)&&method!=='eth_sendRawTransaction'){const seconds=Math.min(5*(attempt+1),30);if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('task-prism-network-delay',{detail:{seconds}}));await new Promise(resolve=>setTimeout(resolve,seconds*1000));continue;}
  if(!r.ok){const error=Error(`RPC_HTTP_${r.status}`);if(method==='eth_sendRawTransaction')error.broadcast_uncertain=true;throw error;}
  const j=await r.json();if(j.error){if(j.error.code===-32029){const seconds=Math.max(15,Number(j.error.data?.retry_after_seconds||60)+1);console.warn(`RPC quota for ${method}; waiting ${seconds}s.`);if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('task-prism-rate-limit',{detail:{seconds}}));await new Promise(resolve=>setTimeout(resolve,seconds*1000));attempt--;continue;}throw Error(JSON.stringify(j.error));}return j.result;
 }
 throw Error('RPC_RATE_LIMIT_RETRY_LATER');
}
export async function validateChain(request=rpc){const id=await request('eth_chainId');if(Number(BigInt(id))!==61999)throw Error('WRONG_CHAIN');return id;}
export function encoded(method,args=[]){return transactions.serialize([calldata.encode(calldata.makeCalldataObject(method,args,{})),false]);}
export function envelope(sender,to,data){const entry=chain.consensusMainContract.abi.find(x=>x.type==='function'&&x.name==='addTransaction');const args=[sender,to,5,3,data];if(entry.inputs.length===6)args.push(BigInt(Math.floor(Date.now()/1000)+3600));return encodeFunctionData({abi:[entry],functionName:'addTransaction',args});}
export async function sendLocal(account,to,data){await validateChain();const nonce=await rpc('eth_getTransactionCount',[account.address,'latest']);const serialized=await account.signTransaction({chainId:61999,type:'legacy',to:chain.consensusMainContract.address,data:envelope(account.address,to,data),nonce:Number(BigInt(nonce)),gas:20000000n,gasPrice:0n,value:0n});return rpc('eth_sendRawTransaction',[serialized]);}

export async function readFinal(address,functionName='get_state',args=[]){
 const result=await rpc('gen_call',[{type:'read',to:address,from:'0x0000000000000000000000000000000000000000',data:encoded(functionName,args),transaction_hash_variant:'latest-final'}]);
 if(result&&typeof result==='object'&&result.status&&result.status.code!==0)throw Error(result.status.message);
 const hex=typeof result==='string'?result:result?.data;if(typeof hex!=='string')throw Error('INVALID_READ_RESULT');
 const plain=hex.startsWith('0x')?hex.slice(2):hex;return calldata.decode(Uint8Array.from(plain.match(/../g)||[],x=>parseInt(x,16)));
}
