import {createClient,abi} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
const {calldata,transactions}=abi;
export const RPC='https://studio.genlayer.com/api';
export const chain={...studionet,rpcUrls:{default:{http:[RPC]}}};
export const reader=createClient({chain,endpoint:RPC});
export async function rpc(method,params=[]){const r=await fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});if(!r.ok)throw Error(`RPC_HTTP_${r.status}`); const j=await r.json(); if(j.error)throw Error(JSON.stringify(j.error));return j.result;}
export async function validateChain(request=rpc){const id=await request('eth_chainId');if(Number(BigInt(id))!==61999)throw Error('WRONG_CHAIN');return id;}
export function encoded(method,args=[]){return transactions.serialize([calldata.encode(calldata.makeCalldataObject(method,args,{})),false]);}
export async function sendLocal(account,to,data){await validateChain(); const nonce=await rpc('eth_getTransactionCount',[account.address,'latest']); const serialized=await account.signTransaction({chainId:61999,type:'legacy',to,data,nonce:Number(BigInt(nonce)),gas:20000000n,gasPrice:0n,value:0n});return rpc('eth_sendRawTransaction',[serialized]);}
