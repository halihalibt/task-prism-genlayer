// LOCAL MOCK HTTP transport tests. No RPC, signing or blockchain transactions.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {rpc} from '../scripts/network.js';

test('transient read failures retry; uncertain writes never resubmit',async()=>{
 const originalFetch=globalThis.fetch,originalTimeout=globalThis.setTimeout;
 const waits=[];
 globalThis.setTimeout=(fn,ms)=>{waits.push(ms);return originalTimeout(fn,0);};
 try{
  let calls=0;
  globalThis.fetch=async()=>++calls===1?new Response('',{status:502}):Response.json({result:'0xf22f'});
  assert.equal(await rpc('eth_chainId'),'0xf22f');assert.equal(calls,2);assert.equal(waits[0],5000);
  calls=0;
  globalThis.fetch=async()=>{calls++;return new Response('',{status:502});};
  await assert.rejects(()=>rpc('eth_sendRawTransaction',['0x00']),e=>e.broadcast_uncertain===true&&e.message==='RPC_HTTP_502');
  assert.equal(calls,1);
  calls=0;
  globalThis.fetch=async()=>{calls++;throw Error('Connection interrupted');};
  await assert.rejects(()=>rpc('eth_sendRawTransaction',['0x00']),e=>e.broadcast_uncertain===true);
  assert.equal(calls,1);
 }finally{globalThis.fetch=originalFetch;globalThis.setTimeout=originalTimeout;}
});
