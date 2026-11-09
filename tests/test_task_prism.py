"""LOCAL MOCK tests. No network consensus is simulated as deployment evidence."""
import copy
from dataclasses import dataclass
import hashlib
import importlib.util
import json
from pathlib import Path
import random
import sys
import types
import unittest

@dataclass
class Response:
    status: int
    headers: dict
    body: bytes | None

class Return:
    def __init__(self, value): self.calldata = value

class Runtime:
    def __init__(self):
        self.bodies = [b'Complete evidence.']
        self.scores = [[90,90,90]]
        self.fetches = 0
        self.validator = None
        self.proposal = None
        self.unreachable = False
        self.http_status = 200
    def get(self,url):
        if self.unreachable: raise Exception('unreachable')
        body = self.bodies[min(self.fetches,len(self.bodies)-1)]
        self.fetches += 1
        return Response(status=self.http_status,headers={},body=body)
    def prompt(self,prompt):
        s = self.scores.pop(0) if len(self.scores)>1 else self.scores[0]
        return json.dumps({'scores':s,'rationale':'Grounded local mock assessment.','contradictions':['A retained local mock witness.']})
    def run(self,leader,validator):
        self.validator = validator
        r = leader()
        self.proposal = copy.deepcopy(r)
        if not validator(Return(r)): raise Exception('CONSENSUS_REJECTED_LOCAL_MOCK')
        return r

runtime = Runtime()
gl = types.SimpleNamespace(Contract=object,public=types.SimpleNamespace(write=lambda f:f,view=lambda f:f),message=types.SimpleNamespace(sender_address='0x'+ 'a'*40),vm=types.SimpleNamespace(Return=Return,run_nondet_unsafe=lambda a,b:runtime.run(a,b)),nondet=types.SimpleNamespace(web=types.SimpleNamespace(get=lambda url:runtime.get(url)),exec_prompt=lambda prompt:runtime.prompt(prompt)))
sys.modules['genlayer'] = types.SimpleNamespace(gl=gl)
spec = importlib.util.spec_from_file_location('contract',Path(__file__).parents[1]/'contracts/task_prism.py')
contract = importlib.util.module_from_spec(spec)
spec.loader.exec_module(contract)
A,B,C = ['0x'+x*40 for x in 'abc']
SPEC='Deliver a correct, complete and useful evidence brief.'

class LocalMockTests(unittest.TestCase):
    def setUp(self):
        global runtime
        runtime=Runtime()
        self.c=contract.TaskPrism()
        for addr in [A,B,C]: self.as_(addr).claim_demo_funds()
        self.as_(B).register_agent('agent',1000,'research')
    def as_(self,addr): gl.message.sender_address=addr; return self.c
    def state(self): return json.loads(self.c.get_state())
    def task(self,name='task'): return json.loads(self.c.get_task(name))
    def post(self,name='task',bounty=200): self.as_(A).post_task(name,'Evidence brief',bounty,contract.sha256(SPEC.encode()),SPEC)
    def submit(self):
        self.post(); self.as_(B).claim_task('task','agent')
        self.c.submit_delivery('task','https://example.com/evidence.txt',hashlib.sha256(runtime.bodies[0]).hexdigest(),'A delivery manifest.')
    def pending(self,scores=None):
        self.submit()
        if scores is not None: runtime.scores=[scores]
        self.as_(C).evaluate_delivery('task')
    def conserve(self):
        s=self.state()
        wallets=sum(s['balances'].values())
        stakes=sum(x['stake'] for x in s['agents'].values() if x['origin']!='seed_demo')
        escrow=sum(x['bounty'] for x in s['tasks'].values() if x['origin']!='seed_demo' and x['status'] not in ['FINALIZED','EXPIRED'])
        self.assertEqual(s['issued'],wallets+stakes+escrow+s['treasury'])
    def nochange(self,call,error):
        before=self.c.state_json
        with self.assertRaisesRegex(Exception,error): call()
        self.assertEqual(self.c.state_json,before)
    def test_positive_even_bounty_and_noninteger_rejection(self):
        for n in [-2,0,1,3,True,'200']:
            self.nochange(lambda:self.post('x',n),'INVALID_INTEGER|BOUNTY_MUST_BE_POSITIVE_EVEN')
        self.post(bounty=2); self.conserve()
    def test_faucet_once_per_address(self):
        self.as_(A); self.nochange(self.c.claim_demo_funds,'ALREADY_CLAIMED'); self.conserve()
    def test_registration_debits_balance_and_shared_reputation(self):
        s=self.state(); self.assertEqual(s['balances'][B],9000); self.assertEqual(s['reputation'][B],100)
        self.post(); self.assertEqual(self.state()['reputation'][A],100); self.conserve()
    def test_post_escrow(self):
        self.post(); self.assertEqual(self.state()['balances'][A],9800); self.conserve()
    def test_requirements_hash_mismatch(self):
        self.as_(A); self.nochange(lambda:self.c.post_task('bad','Bad',200,'0'*64,SPEC),'REQUIREMENTS_HASH_MISMATCH')
    def test_duplicate_task(self):
        self.post(); self.nochange(self.post,'TASK_ALREADY_EXISTS')
    def test_claim_owner_binding(self):
        self.post(); self.as_(C); self.nochange(lambda:self.c.claim_task('task','agent'),'CALLER_ADDRESS_MISMATCH')
    def test_one_open_claim_and_locked_stake(self):
        self.post(); self.post('other'); self.as_(B).claim_task('task','agent')
        self.nochange(lambda:self.c.claim_task('other','agent'),'OPEN_CLAIM')
        self.nochange(lambda:self.c.top_up_stake('agent',100),'STAKE_LOCKED')
    def test_submit_owner_binding(self):
        self.post(); self.as_(B).claim_task('task','agent'); self.as_(A)
        self.nochange(lambda:self.c.submit_delivery('task','https://example.com','0'*64,'manifest'),'CALLER_ADDRESS_MISMATCH')
    def test_unreachable_before_write_retryable(self):
        self.submit(); runtime.unreachable=True
        self.nochange(lambda:self.c.evaluate_delivery('task'),'UNREACHABLE_RETRYABLE')
        self.assertEqual(self.task()['rounds'],[])
        runtime.unreachable=False; self.c.evaluate_delivery('task'); self.assertEqual(self.task()['status'],'EVALUATING')
    def test_sdk_response_uses_status_field_and_rejects_http_errors(self):
        self.submit()
        for status in [404,500]:
            runtime.http_status=status
            self.nochange(lambda:self.c.evaluate_delivery('task'),'UNREACHABLE_RETRYABLE')
        runtime.http_status=200
        self.c.evaluate_delivery('task')
        self.assertEqual(self.task()['status'],'EVALUATING')
    def test_first_round_pending_without_settlement(self):
        self.pending(); t=self.task(); self.assertEqual(t['status'],'EVALUATING'); self.assertIsNone(t['settlement']); self.assertEqual(self.state()['balances'][B],9000); self.conserve()
    def test_accept_full_settlement_any_caller(self):
        self.pending(); self.as_(C).finalize_delivery('task'); s=self.state()
        self.assertEqual(s['balances'][B],9200); self.assertEqual(s['reputation'][B],110); self.assertEqual(s['agents']['agent']['stake'],1000); self.conserve()
    def test_partial_exact_split(self):
        self.pending([70,69,40]); self.c.finalize_delivery('task'); s=self.state()
        self.assertEqual(s['balances'][B],9100); self.assertEqual(s['balances'][A],9900); self.assertEqual(s['reputation'][B],102); self.conserve()
    def test_reject_refund_slash_reputation(self):
        self.pending([100,39,100]); self.c.finalize_delivery('task'); s=self.state()
        self.assertEqual(s['balances'][A],10000); self.assertEqual(s['treasury'],100); self.assertEqual(s['agents']['agent']['stake'],900); self.assertEqual(s['reputation'][B],85); self.conserve()
    def test_hash_mismatch_is_pending_reject(self):
        self.submit(); runtime.bodies=[b'Changed bytes']; self.c.evaluate_delivery('task'); t=self.task()
        self.assertEqual(t['status'],'EVALUATING'); self.assertEqual(t['rounds'][0]['scores'],[0,0,0]); self.assertIsNone(t['settlement'])
        self.c.finalize_delivery('task'); self.conserve()
    def test_failed_challenge_poster_reputation_and_two_rounds(self):
        self.pending(); before=copy.deepcopy(self.task()['rounds'][0]); self.as_(A).challenge_delivery('task','Please reassess completeness.')
        t=self.task(); self.assertEqual(t['status'],'FINALIZED'); self.assertEqual(t['rounds'][0],before); self.assertEqual(len(t['rounds']),2); self.assertTrue(t['challenge_failed']); self.assertEqual(self.state()['reputation'][A],95); self.conserve()
    def test_successful_challenge_no_penalty(self):
        self.pending(); runtime.scores=[[60,60,60]]; self.as_(B).challenge_delivery('task','Material omissions need reassessment.')
        self.assertFalse(self.task()['challenge_failed']); self.assertEqual(self.state()['reputation'][B],102); self.assertEqual(self.task()['final_verdict'],'PARTIAL'); self.conserve()
    def test_failed_agent_challenge_combines_penalty(self):
        self.pending([30,30,30]); self.as_(B).challenge_delivery('task','Please reconsider.')
        self.assertEqual(self.state()['reputation'][B],80); self.conserve()
    def test_no_third_round_or_double_finalize(self):
        self.pending(); self.as_(A).challenge_delivery('task','Reassess.')
        self.nochange(lambda:self.c.challenge_delivery('task','Again.'),'CHALLENGE_NOT_AVAILABLE')
        self.nochange(lambda:self.c.finalize_delivery('task'),'TASK_NOT_EVALUATING')
    def test_finalized_immutable(self):
        self.pending(); self.c.finalize_delivery('task')
        for fn,error in [(lambda:self.c.evaluate_delivery('task'),'TASK_NOT_SUBMITTED'),(lambda:self.c.expire_task('task'),'CALLER_ADDRESS_MISMATCH'),(lambda:self.c.finalize_delivery('task'),'TASK_NOT_EVALUATING')]: self.nochange(fn,error)
    def test_challenge_binding_and_unreachable_no_partial_write(self):
        self.pending(); self.as_(C); self.nochange(lambda:self.c.challenge_delivery('task','Reassess.'),'CALLER_ADDRESS_MISMATCH')
        self.as_(A); runtime.unreachable=True; self.nochange(lambda:self.c.challenge_delivery('task','Reassess.'),'UNREACHABLE_RETRYABLE')
    def test_top_up_after_slash_enables_next_claim(self):
        self.pending([0,0,0]); self.c.finalize_delivery('task'); self.post('next'); self.as_(B)
        self.nochange(lambda:self.c.claim_task('next','agent'),'STAKE_BELOW_MINIMUM')
        self.c.top_up_stake('agent',100); self.assertEqual(self.state()['balances'][B],8900)
        self.c.claim_task('next','agent'); self.assertEqual(self.task('next')['status'],'CLAIMED'); self.conserve()
    def test_expire_open_refunds_once(self):
        self.post(); self.c.expire_task('task'); self.assertEqual(self.task()['status'],'EXPIRED'); self.conserve()
        self.nochange(lambda:self.c.expire_task('task'),'TASK_NOT_EXPIRABLE')
    def test_expire_claimed_unlocks_agent(self):
        self.post(); self.as_(B).claim_task('task','agent'); self.as_(A).expire_task('task')
        self.assertEqual(self.state()['agents']['agent']['open_claim'],''); self.conserve()
    def test_expire_after_submit_forbidden(self):
        self.submit(); self.as_(A); self.nochange(lambda:self.c.expire_task('task'),'TASK_NOT_EXPIRABLE')
    def test_seed_fixtures_are_not_consensus_evidence(self):
        s=self.state(); self.assertEqual(len([a for a in s['agents'].values() if a['origin']=='seed_demo']),3)
        for t in s['tasks'].values(): self.assertEqual(t['rounds'],[]); self.assertEqual(t['origin'],'seed_demo')
        self.nochange(lambda:self.c.evaluate_delivery('seed-1'),'SEED_DEMO_READ_ONLY')
    def test_threshold_boundaries(self):
        for scores,expected in [([70,70,70],'ACCEPT'),([69,100,100],'PARTIAL'),([40,40,40],'PARTIAL'),([39,100,100],'REJECT'),([0,0,0],'REJECT'),([100,100,100],'ACCEPT')]: self.assertEqual(contract.verdict(scores),expected)
        for scores in [[True,90,90],[101,90,90],[-1,90,90],[70,70]]:
            with self.assertRaises(Exception): contract.verdict(scores)
    def test_validator_refetch_and_hash_disagreement(self):
        self.submit(); runtime.bodies=[b'Complete evidence.',b'Changed bytes']
        self.nochange(lambda:self.c.evaluate_delivery('task'),'CONSENSUS_REJECTED')
        self.assertEqual(runtime.fetches,2)
    def test_validator_score_tolerance_and_threshold_gate(self):
        self.submit(); runtime.scores=[[70,80,80],[69,80,80]]
        self.nochange(lambda:self.c.evaluate_delivery('task'),'CONSENSUS_REJECTED')
        runtime.scores=[[90,90,90],[79,90,90]]
        self.nochange(lambda:self.c.evaluate_delivery('task'),'CONSENSUS_REJECTED')
    def test_validator_rejects_forged_verdict(self):
        self.pending(); forged=copy.deepcopy(runtime.proposal); forged['verdict']='REJECT'
        self.assertFalse(runtime.validator(Return(forged)))
    def test_sha256_vectors_and_random_payloads(self):
        rng=random.Random(99)
        for b in [b'',b'abc',b'a'*55,b'a'*56,b'a'*64,b'a'*1000,'中文交付'.encode()] + [rng.randbytes(n) for n in [1,17,63,65,512,24000]]:
            self.assertEqual(contract.sha256(b),hashlib.sha256(b).hexdigest())

if __name__=='__main__': unittest.main(verbosity=2)
