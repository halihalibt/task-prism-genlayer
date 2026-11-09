"""Package recorded network receipts without submitting transactions."""
from pathlib import Path
import gzip
import hashlib
import json

root=Path(__file__).resolve().parents[1]
evidence=root/'evidence'
p=evidence/'live-verification.json'
log=json.loads(p.read_text())
if 'archive' in log:
    raise SystemExit('Evidence is already packaged.')
if not (log.get('completed_at') or log.get('run_finished_at')):
    raise SystemExit('Verification sequence has not completed.')
deployment=json.loads((evidence/'deployment.json').read_text())
assert log['contract'].lower()==deployment['contract_address'].lower()
raw=p.read_bytes()
archive=evidence/'live-verification.full.json.gz'
archive.write_bytes(gzip.compress(raw,mtime=0))
rows=[]
last=None
failed_attempts=0
for tx in log['transactions']:
    receipt=tx['receipt']
    assert receipt['status']=='FINALIZED'
    assert receipt['hash']==tx['hash']
    assert receipt['to_address'].lower()==log['contract'].lower()
    leaders=receipt['consensus_data']['leader_receipt']
    leader=next(x for x in leaders if x['mode']=='leader') if isinstance(leaders,list) else leaders
    assert leader['execution_result']==tx['execution']
    error=None
    classification='SUCCESS'
    if receipt.get('result_name')!='MAJORITY_AGREE':
        assert tx['read_back']==last, 'Rejected consensus changed contract state'
        classification='CONSENSUS_NOT_REACHED'
        error='CONSENSUS_NOT_REACHED'
        failed_attempts+=1
    elif tx['execution']=='ERROR':
        stderr=leader['genvm_result']['stderr']
        if tx['method']=='claim_task' and 'STAKE_BELOW_MINIMUM' in stderr:
            assert tx.get('verified') is True
            error='STAKE_BELOW_MINIMUM'
            classification='EXPECTED_REJECTION'
        else:
            assert tx['method']=='evaluate_delivery' and 'JSONDecodeError' in stderr
            assert tx['read_back']==last, 'Failed evaluation changed contract state'
            error='MODEL_JSON_FORMAT_ERROR'
            classification='FAILED_ATTEMPT_NO_STATE_CHANGE'
            failed_attempts+=1
    else:
        assert tx['execution']=='SUCCESS' and tx.get('verified') is True
    s=tx['read_back']
    agents={k:v for k,v in s['agents'].items() if v['origin']!='seed_demo'}
    tasks={k:v for k,v in s['tasks'].items() if v['origin']!='seed_demo'}
    escrow=sum(t['bounty'] for t in tasks.values() if t['status'] not in ['FINALIZED','EXPIRED'])
    assert s['issued']==sum(s['balances'].values())+sum(a['stake'] for a in agents.values())+escrow+s['treasury']
    key=tx['args'][0] if tx.get('args') else None
    affected=tasks.get(key)
    rows.append({'method':tx['method'],'args':tx['args'],'sender':tx['sender'],'hash':tx['hash'],'explorer':'https://explorer-studio.genlayer.com/tx/'+tx['hash'],'transaction_status':receipt['status'],'execution':tx['execution'],'consensus':receipt.get('result_name'),'expected_error':error,'read_back_at':tx['read_back_at'],'read_back':{'task':affected,'agents':agents,'balances':s['balances'],'reputation':s['reputation'],'treasury':s['treasury'],'issued':s['issued']},'verification':classification,'verified':bool(tx.get('verified'))})
    last=s
(evidence/'final-state.json').write_text(json.dumps(last,indent=2)+'\n')
summary={k:v for k,v in log.items() if k!='transactions'}
summary.update({'archive':archive.name,'original_json_sha256':hashlib.sha256(raw).hexdigest(),'archive_scope':'Complete original FINALIZED receipts and full latest-final read-backs for every transaction below.','transactions':rows})
p.write_text(json.dumps(summary,indent=2)+'\n')
tasks=[t for t in last['tasks'].values() if t['origin']!='seed_demo']
md=['# Live contract verification','',f"Contract: `{log['contract']}` on Stable Studionet, Chain ID 61999.",'',f"{len(rows)} signed transactions have FINALIZED receipts and latest-final read-backs. These include {sum(x['verification']=='SUCCESS' for x in rows)} consensus-accepted successful executions, {sum(x['verification']=='EXPECTED_REJECTION' for x in rows)} intentional stake-threshold rejection and {failed_attempts} consensus-rejected evaluation attempts with unchanged state. Amounts are simulated mGEN; no real GEN moves.",'','## Task outcomes','','| Task | State | Verdict | Scores by round | Agent payment | Poster refund | Slash pool contribution |','| --- | --- | --- | --- | ---: | ---: | ---: |']
for task in tasks:
    settlement=task['settlement'] or {}
    scores='; '.join('/'.join(str(x) for x in r['scores']) for r in task['rounds']) or '—'
    md.append(f"| {task['task_id']} | {task['status']} | {task.get('final_verdict') or '—'} | {scores} | {settlement.get('paid_to_agent',0)} | {settlement.get('refunded_to_poster',0)} | {settlement.get('slashed_to_treasury',0)} |")
md += ['', '## Transaction receipts and read-backs','','| Method | Transaction | Status | Execution |','| --- | --- | --- | --- |']
for x in rows:
    execution=x['execution']+' · '+x['consensus']+(f" · {x['expected_error']}" if x['expected_error'] else '')
    md.append(f"| `{x['method']}` | [{x['hash'][:10]}…]({x['explorer']}) | FINALIZED | {execution} |")
md += ['', 'The readable per-transaction state projections are in [live-verification.json](live-verification.json). Complete original receipts and full read-backs are preserved losslessly in [live-verification.full.json.gz](live-verification.full.json.gz); its uncompressed SHA-256 is recorded in the index. [final-state.json](final-state.json) is the last finalized read-back.','','Seed fixtures are excluded from these outcomes and from issued-funds conservation checks. Local mock results are separate from network evidence.','']
(evidence/'LIVE_VERIFICATION.md').write_text('\n'.join(md))
print(f'Packaged {len(rows)} finalized transactions and {len(tasks)} task outcomes.')
