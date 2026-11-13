"""Offline checks of saved receipts and source provenance; does not send transactions."""
import base64
import gzip
import hashlib
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
d=json.loads((root/'evidence/deployment.json').read_text())
r=json.loads((root/'evidence/deploy-receipt.json').read_text())
assert r['status']=='FINALIZED'
assert r['result_name']=='MAJORITY_AGREE'
leaders=r['consensus_data']['leader_receipt']
leader=next(x for x in leaders if x['mode']=='leader') if isinstance(leaders,list) else leaders
assert leader['execution_result']=='SUCCESS'
code=base64.b64decode(r['data']['contract_code'])
candidate_path=root/'evidence/timing-candidate.json'
current=(root/'contracts/task_prism.py').read_bytes()
if candidate_path.exists():
 candidate=json.loads(candidate_path.read_text())
 if candidate['status'] in ('NOT_DEPLOYED','DEPLOYED_TIMING_VALIDATION_PENDING'):
  if candidate['status']=='NOT_DEPLOYED':
   assert candidate['contract_address'] is None and candidate['deploy_tx'] is None
  else:
   assert candidate['contract_address'] and candidate['deploy_tx']
  assert candidate['live_timing_verified'] is False
  assert hashlib.sha256(current).hexdigest()==candidate['source_sha256']
  assert candidate['previous_contract']==d['contract_address']
  assert candidate['previous_source_sha256']==d['source_sha256']
  assert code==(root/candidate['previous_source_snapshot']).read_bytes()
  assert hashlib.sha256(current).hexdigest()!=d['source_sha256']
  print('Previous-version receipts validate the preserved source snapshot. Timing-version evidence is checked separately.')
 else:
  assert code==current
else:
 assert code==current
assert hashlib.sha256(code).hexdigest()==d['source_sha256']
assert d['contract_address']==r['to_address']
print('Saved deployment receipt, successful execution, contract address and source bytes match.')
if (root/'evidence/live-verification.json').exists():
 log=json.loads((root/'evidence/live-verification.json').read_text())
 index=log
 if 'archive' in log:
  raw=gzip.decompress((root/'evidence'/log['archive']).read_bytes())
  assert hashlib.sha256(raw).hexdigest()==log['original_json_sha256']
  log=json.loads(raw)
 assert log['contract'].lower()==d['contract_address'].lower(), 'Core evidence must belong to the active contract'
 previous=None
 for tx,row in zip(log['transactions'],index['transactions'],strict=True):
  receipt=tx['receipt']
  assert receipt['hash']==tx['hash']==row['hash']
  assert receipt['status']=='FINALIZED'
  assert receipt['to_address'].lower()==log['contract'].lower()
  assert receipt['result_name']==row['consensus']
  assert tx.get('verified')==row.get('verified')
  leaders=receipt['consensus_data']['leader_receipt']
  leader=next(x for x in leaders if x['mode']=='leader') if isinstance(leaders,list) else leaders
  assert leader['execution_result']==tx['execution']==row['execution']
  assert 'read_back' in tx
  if receipt['result_name']!='MAJORITY_AGREE':
   assert tx.get('verified') is False
   assert row['verification']=='CONSENSUS_NOT_REACHED'
   assert tx['read_back']==previous
  elif tx.get('verified'):
   if row['verification']=='EXPECTED_REJECTION':
    assert tx['method']=='claim_task' and tx['execution']=='ERROR'
    assert 'STAKE_BELOW_MINIMUM' in leader['genvm_result']['stderr']
    assert tx['read_back']==previous
   else:
    assert row['verification']=='SUCCESS' and tx['execution']=='SUCCESS'
  previous=tx['read_back']
 if any(tx['receipt']['result_name']!='MAJORITY_AGREE' for tx in log['transactions']):
  assert index.get('all_scenarios_passed') is False
 print('Saved verified core transactions:',sum(bool(x.get('verified')) for x in log['transactions']))

supplement=root/'evidence/browser-adjudication-manifest.json'
if supplement.exists():
 manifest=json.loads(supplement.read_text())
 assert manifest['contract'].lower()==d['contract_address'].lower()
 def load_archive(key):
  item=manifest[key]
  raw=gzip.decompress((root/'evidence'/item['archive']).read_bytes())
  assert hashlib.sha256(raw).hexdigest()==item['sha256']
  return json.loads(raw)
 setup=load_archive('setup')
 browser=load_archive('browser')
 task_id=manifest['task_id']
 assert setup.get('task',setup.get('awaiting_browser_adjudication',{}).get('task_id'))==task_id
 for record in (setup,browser):
  assert record['contract'].lower()==d['contract_address'].lower()
  for tx in record['transactions']:
   receipt=tx['receipt']
   assert receipt['hash']==tx['hash'] and receipt['status']=='FINALIZED'
   assert receipt['to_address'].lower()==d['contract_address'].lower()
   leaders=receipt['consensus_data']['leader_receipt']
   leader=next(x for x in leaders if x['mode']=='leader') if isinstance(leaders,list) else leaders
   if tx.get('verified'):
    assert receipt['result_name']=='MAJORITY_AGREE'
    if record is setup and tx.get('expect_error'):
     assert tx['method']=='claim_task' and leader['execution_result']=='ERROR'
     assert 'STAKE_BELOW_MINIMUM' in leader['genvm_result']['stderr']
    else:
     assert leader['execution_result']=='SUCCESS'
    assert tx.get('read_back') and tx.get('read_back_at')
   else:
    assert tx.get('verified') is False
    assert receipt['result_name']!='MAJORITY_AGREE' or leader['execution_result']!='SUCCESS'
 pending=next(x for x in browser['transactions'] if x['method']=='evaluate_delivery' and x['args']==[task_id] and x['verified'])
 final=next(x for x in browser['transactions'] if x['method']=='finalize_delivery' and x['args']==[task_id] and x['verified'])
 assert pending['phase']==final['phase']=='confirmed'
 before=pending['read_back'];after=final['read_back']
 p=before['tasks'][task_id];t=after['tasks'][task_id]
 assert p['status']=='EVALUATING' and p['pending_verdict']=='PARTIAL' and p['settlement'] is None
 assert t['status']=='FINALIZED' and t['final_verdict']=='PARTIAL'
 assert p['rounds']==t['rounds'] and len(t['rounds'])==1
 scores=t['rounds'][0]['scores']
 assert all(type(x)is int and 40<=x<=100 for x in scores) and any(x<70 for x in scores)
 assert t['settlement']=={'paid_to_agent':10**17,'refunded_to_poster':10**17,'slashed_to_treasury':0,'agent_reputation_delta':2}
 owner=after['agents'][t['agent_id']]['owner'];poster=t['poster']
 assert after['withdrawable'][owner]-before['withdrawable'][owner]==10**17
 assert after['withdrawable'][poster]-before['withdrawable'][poster]==10**17
 assert after['reputation'][owner]-before['reputation'][owner]==2
 assert before['agents'][t['agent_id']]['stake']==after['agents'][t['agent_id']]['stake']==10**18
 assert after['agents'][t['agent_id']]['open_claim']==''
 assert after['treasury']==before['treasury']
 for state,balance_wei in ((before,int(pending['contract_balance_wei'])),(after,int(final['contract_balance_wei']))):
  escrow=sum(t['bounty'] for t in state['tasks'].values() if t['origin']!='seed_demo' and t['status'] not in ('FINALIZED','EXPIRED'))
  stake=sum(a['stake'] for a in state['agents'].values() if a['origin']!='seed_demo')
  assert sum(state.get('withdrawable',{}).values())+stake+escrow+state['treasury']==balance_wei
 assert manifest['scenario_verified'] is True
 print('Browser PARTIAL consensus, immutable round, 0.1/0.1 GEN settlement and +2 reputation match saved read-backs.')

# Timing deployment is kept separately so original historical evidence stays intact.
timing=root/'evidence/timing-deployment'
def timing_json(name):
 p=timing/name
 return json.loads(p.read_text()) if p.exists() else json.loads(gzip.decompress(Path(str(p)+'.gz').read_bytes()))
if (timing/'deployment.json').exists():
 index_path=timing/'index.json'
 if index_path.exists():
  ix=json.loads(index_path.read_text())
  for meta in ix['archives'].values():
   raw=gzip.decompress((timing/meta['archive']).read_bytes())
   assert hashlib.sha256(raw).hexdigest()==meta['sha256'] and len(raw)==meta['original_bytes']
 td=timing_json('deployment.json');tr=timing_json('deploy-receipt.json')
 assert tr['status']=='FINALIZED' and tr['result_name']=='MAJORITY_AGREE'
 entries=tr['consensus_data']['leader_receipt']
 tl=next(x for x in entries if x['mode']=='leader') if isinstance(entries,list) else entries
 assert tl['execution_result']=='SUCCESS'
 assert tr['hash']==td['deploy_tx'] and tr['to_address']==td['contract_address']
 assert base64.b64decode(tr['data']['contract_code'])==current
 assert hashlib.sha256(current).hexdigest()==td['source_sha256']==candidate['source_sha256']
 assert td['contract_address']==candidate['contract_address']
 print('New timing deployment: FINALIZED, MAJORITY_AGREE, SUCCESS; exact source bytes match.')
 if (timing/'live-timing.json').exists() or (timing/'live-timing.json.gz').exists():
  live=timing_json('live-timing.json')
  assert live['contract']==td['contract_address'] and live['source_sha256']==td['source_sha256']
  verified=0
  for tx in live['transactions']:
   if not tx.get('verified'): continue
   r=tx['receipt'];assert r['hash']==tx['hash']
   assert r['status']=='FINALIZED' and r['result_name']=='MAJORITY_AGREE'
   assert r['to_address'].lower()==td['contract_address'].lower()
   ls=r['consensus_data']['leader_receipt']
   leader=next(x for x in ls if x['mode']=='leader') if isinstance(ls,list) else ls
   assert leader['execution_result']==tx['execution']
   assert tx['read_back_at'] and tx['read_back']
   if tx.get('expected_error'):
    assert tx['execution']=='ERROR' and tx['expected_error'] in leader['genvm_result']['stderr']
    assert tx['read_back']==tx['before']
   else:
    assert tx['execution']=='SUCCESS'
   s=tx['read_back']
   escrow=sum(t['bounty'] for t in s['tasks'].values() if t['origin']!='seed_demo' and t['status'] not in ('FINALIZED','EXPIRED'))
   stake=sum(a['stake'] for a in s['agents'].values() if a['origin']!='seed_demo')
   assert int(tx['contract_balance_wei'],16 if tx['contract_balance_wei'].startswith('0x') else 10)==escrow+stake+sum(s['withdrawable'].values())+s['treasury']
   for t in s['tasks'].values():
    if t['origin']=='seed_demo' or t['status']!='FINALIZED': continue
    v=t['final_verdict'];b=t['bounty']
    paid,refund,slash,rep=(b,0,0,10) if v=='ACCEPT' else (b//2,b//2,0,2) if v=='PARTIAL' else (0,b,10**17,-15)
    assert t['settlement']=={'paid_to_agent':paid,'refunded_to_poster':refund,'slashed_to_treasury':slash,'agent_reputation_delta':rep}
   verified+=1
  print('Timing-version verified transactions:',verified,'; full elapsed-time suite complete:',live['completed'])
