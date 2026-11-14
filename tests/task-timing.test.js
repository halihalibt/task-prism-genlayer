import test from 'node:test';
import assert from 'node:assert/strict';
import {taskActions} from '../scripts/task-timing.js';
const task={origin:'user',status:'EVALUATING',rounds:[{}],challenge_deadline:4600,challenger:''};
test('first verdict challenge and finalize have disjoint boundary permissions',()=>{
  assert.equal(taskActions(task,4599).finalize,false);
  assert.equal(taskActions(task,4599).challenge,true);
  for(const now of [4600,4601]){
    assert.equal(taskActions(task,now).finalize,true);
    assert.equal(taskActions(task,now).challenge,false);
  }
});
test('claimed and submitted work cannot expire early; late submissions are disabled',()=>{
  for(const [status,key,action] of [['CLAIMED','delivery_deadline','submit'],['SUBMITTED','review_deadline','evaluate']]){
    const t={...task,status,rounds:[],[key]:100};
    assert.equal(taskActions(t,99).expire,false);
    assert.equal(taskActions(t,99)[action],true);
    assert.equal(taskActions(t,100).expire,true);
    assert.equal(taskActions(t,100)[action],false);
    assert.equal(taskActions(t,100).submit,false);
  }
});
test('legacy missing deadlines, finalized tasks and seed fixtures fail closed',()=>{
  for(const t of [{origin:'user',status:'EVALUATING'}, {...task,status:'FINALIZED'}, {...task,origin:'seed_demo'}]){
    assert(Object.values(taskActions(t,9999)).every(x=>x===false));
  }
  assert.equal(taskActions({...task,status:'CLAIMED'},9999).expire,false);
  assert.equal(taskActions({...task,status:'SUBMITTED'},9999).expire,false);
  assert.equal(taskActions({...task,status:'OPEN'},9999).expire,true);
});
test('second round and an already challenged verdict cannot be challenged again',()=>{
  assert.equal(taskActions({...task,rounds:[{},{}]},100).challenge,false);
  assert.equal(taskActions({...task,challenger:'poster'},100).challenge,false);
});
