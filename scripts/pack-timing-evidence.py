"""Preserve full live receipts losslessly, with hashes and a compact review index."""
import gzip
import hashlib
import json
from pathlib import Path

root=Path(__file__).resolve().parents[1]
directory=root/'evidence/timing-deployment'
index={'scope':'Original LIVE receipts and state snapshots; gzip is lossless, not a replacement for verification.','archives':{}}
for name in ['deploy-receipt.json','live-timing.json']:
    raw=(directory/name).read_bytes()
    parsed=json.loads(raw)
    packed=gzip.compress(raw,mtime=0)
    assert gzip.decompress(packed)==raw
    (directory/(name+'.gz')).write_bytes(packed)
    index['archives'][name]={'archive':name+'.gz','sha256':hashlib.sha256(raw).hexdigest(),'original_bytes':len(raw)}
    if name=='live-timing.json':
        index.update({k:parsed.get(k) for k in ['contract','source_sha256','checks','deadlines','completed','last_observed_at']})
        index['transactions']=[{k:tx.get(k) for k in ['tag','method','who','hash','execution','expected_error','verified','read_back_at']}|{'status':tx.get('receipt',{}).get('status'),'consensus':tx.get('receipt',{}).get('result_name')} for tx in parsed['transactions']]
(directory/'index.json').write_text(json.dumps(index,indent=2)+'\n')
print('Lossless timing evidence archives and SHA-256 index written.')
