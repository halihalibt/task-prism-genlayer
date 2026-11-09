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
