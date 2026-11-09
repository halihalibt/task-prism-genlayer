"""Offline checks of saved receipts and source provenance; does not send transactions."""
import base64
import hashlib
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
d=json.loads((root/'evidence/deployment.json').read_text())
r=json.loads((root/'evidence/deploy-receipt.json').read_text())
assert r['status']=='FINALIZED'
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
 for tx in log['transactions']:
  if not tx.get('verified'):continue
  assert tx['receipt']['status']=='FINALIZED'
  assert 'read_back' in tx
 print('Saved verified core transactions:',sum(bool(x.get('verified')) for x in log['transactions']))
