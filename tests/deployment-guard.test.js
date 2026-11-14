import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {requireDeployedSource} from '../scripts/deployment-source.js';
test('pending source cannot be used by historical signed verification flows',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'task-prism-guard-'));
  try{
    fs.mkdirSync(path.join(root,'evidence'));fs.mkdirSync(path.join(root,'contracts'));
    const file=path.join(root,'contracts/task_prism.py');fs.writeFileSync(file,'deployed source');
    const deployment={source_sha256:createHash('sha256').update('deployed source').digest('hex')};
    fs.writeFileSync(path.join(root,'evidence/deployment.json'),JSON.stringify(deployment));
    assert.deepEqual(requireDeployedSource(root),deployment);
    fs.writeFileSync(file,'changed source');
    assert.throws(()=>requireDeployedSource(root),/SOURCE_NOT_DEPLOYED/);
  }finally{fs.rmSync(root,{recursive:true});}
});
test('deployment without explicit signing flag stops before network or signing',()=>{
  const result=spawnSync(process.execPath,['scripts/deploy.js'],{encoding:'utf8',timeout:5000});
  assert.equal(result.status,1);
  assert.match(result.stderr,/DEPLOY_SIGNATURE_CONFIRMATION_REQUIRED/);
  assert.equal(result.stdout,'');
});

test('live timing verification without confirmation stops before network or signing',()=>{
  const result=spawnSync(process.execPath,['scripts/timing-live.js'],{encoding:'utf8',timeout:5000});
  assert.equal(result.status,1);assert.match(result.stderr,/LIVE_SIGNATURE_CONFIRMATION_REQUIRED/);
  assert.equal(result.stdout,'');
});
