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
assert code==(root/'contracts/task_prism.py').read_bytes()
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
    assert receipt['result_name']=='MAJORITY_AGREE' and leader['execution_result']=='SUCCESS'
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
 assert t['settlement']=={'paid_to_agent':100,'refunded_to_poster':100,'slashed_to_treasury':0,'agent_reputation_delta':2}
 owner=after['agents'][t['agent_id']]['owner'];poster=t['poster']
 assert after['balances'][owner]-before['balances'][owner]==100
 assert after['balances'][poster]-before['balances'][poster]==100
 assert after['reputation'][owner]-before['reputation'][owner]==2
 assert before['agents'][t['agent_id']]['stake']==after['agents'][t['agent_id']]['stake']==1000
 assert after['agents'][t['agent_id']]['open_claim']==''
 assert after['treasury']==before['treasury']
 for state in (before,after):
  escrow=sum(t['bounty'] for t in state['tasks'].values() if t['origin']!='seed_demo' and t['status'] not in ('FINALIZED','EXPIRED'))
  stake=sum(a['stake'] for a in state['agents'].values() if a['origin']!='seed_demo')
  assert sum(state['balances'].values())+stake+escrow+state['treasury']==state['issued']
 assert manifest['scenario_verified'] is True
 print('Browser PARTIAL consensus, immutable round, 100/100 settlement and +2 reputation match saved read-backs.')
