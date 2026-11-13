import assert from 'node:assert/strict';import fs from 'node:fs';import {translations,styles} from '../i18n_and_styles.js';import {validateChain,encoded} from './network.js';import {decodeInputData} from 'genlayer-js';
assert.deepEqual(Object.keys(translations.en).sort(),Object.keys(translations.zh).sort(),'i18n key parity');
const html=fs.readFileSync('index.html','utf8');for(const [,key]of html.matchAll(/data-t="([^"]+)"/g))assert(key in translations.en,`missing ${key}`);
const colors=[...styles.matchAll(/#[a-f0-9]{6}\b/gi)].map(x=>x[0].toUpperCase());assert(colors.every(c=>['#17191C','#F2F0E9','#2CE07A','#FFB224','#8A9199'].includes(c)),'five colour tokens');
await assert.rejects(()=>validateChain(async()=> '0x1'),/WRONG_CHAIN/);
const data=encoded('post_task',['id','title',200,'0'.repeat(64),'spec']);assert.equal(typeof data,'string');
const source=fs.readFileSync('contracts/task_prism.py','utf8');assert(!/\bfloat\s*\(/.test(source));
for(const file of ['README.md','config.js','index.html','app.js','KNOWN_LIMITATIONS.md'])assert(!new RegExp('__REPO'+'_NAME__|xiaoyu'+'7799').test(fs.readFileSync(file,'utf8')),`${file}: placeholder residue`);
if(fs.existsSync('evidence/deployment.json')){
 const {createHash}=await import('node:crypto');
 const deployment=JSON.parse(fs.readFileSync('evidence/deployment.json'));
 const currentHash=createHash('sha256').update(source).digest('hex');
 const {CONFIG}=await import('../config.js');
 const candidate=fs.existsSync('evidence/timing-candidate.json')?JSON.parse(fs.readFileSync('evidence/timing-candidate.json')):null;
 if(candidate&&['NOT_DEPLOYED','DEPLOYED_TIMING_VALIDATION_PENDING'].includes(candidate.status)){
  assert.equal(currentHash,candidate.source_sha256,'candidate source bytes');
  assert.notEqual(currentHash,deployment.source_sha256,'old deployment is not timing evidence');
  assert.equal(CONFIG.deploymentPending,true,'pending source must disable UI writes');
  assert.equal(CONFIG.contract,candidate.contract_address||deployment.contract_address,'read-only version identified by candidate');
  assert.equal(createHash('sha256').update(fs.readFileSync(candidate.previous_source_snapshot)).digest('hex'),deployment.source_sha256);
 }else{assert.equal(currentHash,deployment.source_sha256,'deployed source bytes');assert(!CONFIG.deploymentPending);}
}
console.log('i18n parity, five-colour styles, wrong-chain guard, integer source and placeholder checks passed.');
