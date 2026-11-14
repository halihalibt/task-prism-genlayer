"""LOCAL MOCK tests. No network consensus is simulated as deployment evidence.

Money is real testnet GEN in wei in the contract under test. The mock
simulates value flow: the harness sets gl.message.value before each payable
call, Runtime records external transfers, and TaskPrism.balance is the
accounting sum (escrow + stakes + withdrawable + treasury), which the
conservation check ties to value in minus value out.
"""
import copy
from datetime import datetime, timezone
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
        self.value_in = 0
        self.external_transfers = []
        self.eoa_balances = {}
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

class _EoaProxy:
    def __init__(self, address):
        self.address = str(address).lower()
    def emit_transfer(self, value=0, **kw):
        runtime.external_transfers.append({'to': self.address, 'value': int(value)})
        runtime.eoa_balances[self.address] = runtime.eoa_balances.get(self.address, 0) + int(value)

def _contract_interface(cls):
    def factory(address):
        return _EoaProxy(address)
    return factory

class Address(str):
    pass

class _Write:
    def __call__(self, f):
        return f
    def payable(self, f):
        return f

gl = types.SimpleNamespace(message_raw={'datetime':'2026-11-13T00:00:00Z'},Contract=object,public=types.SimpleNamespace(write=_Write(),view=lambda f:f),message=types.SimpleNamespace(sender_address='0x'+ 'a'*40, value=0),vm=types.SimpleNamespace(Return=Return,run_nondet_unsafe=lambda a,b:runtime.run(a,b)),nondet=types.SimpleNamespace(web=types.SimpleNamespace(get=lambda url:runtime.get(url)),exec_prompt=lambda prompt:runtime.prompt(prompt)),evm=types.SimpleNamespace(contract_interface=_contract_interface))
sys.modules['genlayer'] = types.SimpleNamespace(gl=gl, Address=Address, u256=int)
spec = importlib.util.spec_from_file_location('contract',Path(__file__).parents[1]/'contracts/task_prism.py')
contract = importlib.util.module_from_spec(spec)
spec.loader.exec_module(contract)

def _mock_balance(self):
    s = json.loads(self.state_json)
    escrow = sum(t['bounty'] for t in s['tasks'].values() if t['origin']!='seed_demo' and t['status'] not in ('FINALIZED','EXPIRED'))
    stakes = sum(a['stake'] for a in s['agents'].values() if a['origin']!='seed_demo')
    return escrow + stakes + sum(s['withdrawable'].values()) + s['treasury']
contract.TaskPrism.balance = property(_mock_balance)

A,B,C = ['0x'+x*40 for x in 'abc']
SPEC='Deliver a correct, complete and useful evidence brief.'
BOUNTY = 2 * 10**17
STAKE = 10**18
SLASH = 10**17

class LocalMockTests(unittest.TestCase):
    def setUp(self):
        global runtime
        runtime=Runtime()
        self.at(1794528000)
        self.c=contract.TaskPrism()
        gl.message.value = 0
        self.pay(STAKE); self.as_(B).register_agent('agent',STAKE,'research'); runtime.value_in += STAKE
    def as_(self,addr): gl.message.sender_address=addr; return self.c
    def pay(self,amount):
        # Sets the value the next payable call carries. Value only counts
        # as received once the call succeeds; helpers credit value_in
        # after the call returns.
        gl.message.value = amount
        return self.c
    def at(self,seconds):
        gl.message_raw['datetime']=datetime.fromtimestamp(seconds,timezone.utc).isoformat()
    def finalize(self):
        self.at(self.task()['challenge_deadline'])
        self.c.finalize_delivery('task')
    def state(self): return json.loads(self.c.get_state())
    def task(self,name='task'): return json.loads(self.c.get_task(name))
    def account(self,addr): return json.loads(self.c.get_account(addr))
    def post(self,name='task',bounty=BOUNTY):
        self.pay(bounty); self.as_(A).post_task(name,'Evidence brief',bounty,contract.sha256(SPEC.encode()),SPEC); runtime.value_in += bounty
    def submit(self):
        self.post(); self.as_(B).claim_task('task','agent')
        self.c.submit_delivery('task','https://example.com/evidence.txt',hashlib.sha256(runtime.bodies[0]).hexdigest(),'A delivery manifest.')
    def pending(self,scores=None):
        self.submit()
        if scores is not None: runtime.scores=[scores]
        self.as_(C).evaluate_delivery('task')
    def conserve(self):
        s=self.state()
        escrow=sum(x['bounty'] for x in s['tasks'].values() if x['origin']!='seed_demo' and x['status'] not in ['FINALIZED','EXPIRED'])
        stakes=sum(x['stake'] for x in s['agents'].values() if x['origin']!='seed_demo')
        withdrawable=sum(s['withdrawable'].values())
        self.assertEqual(self.c.balance,escrow+stakes+withdrawable+s['treasury'])
        self.assertEqual(runtime.value_in,self.c.balance+sum(x['value'] for x in runtime.external_transfers))
    def nochange(self,call,error):
        before=self.c.state_json
        with self.assertRaisesRegex(Exception,error): call()
        self.assertEqual(self.c.state_json,before)
    def test_positive_even_bounty_and_noninteger_rejection(self):
        for n in [-2,0,1,3,True,'200']:
            self.nochange(lambda:self.post('x',n),'INVALID_INTEGER|BOUNTY_MUST_BE_POSITIVE_EVEN')
        self.post(bounty=2); self.conserve()
    def test_value_must_equal_stake_and_bounty(self):
        self.pay(STAKE-1); self.as_(B)
        self.nochange(lambda:self.c.register_agent('agent2',STAKE,'research'),'VALUE_MUST_EQUAL_STAKE')
        self.pay(BOUNTY-1); self.as_(A)
        self.nochange(lambda:self.c.post_task('x','Bad',BOUNTY,contract.sha256(SPEC.encode()),SPEC),'VALUE_MUST_EQUAL_BOUNTY')
        self.conserve()
    def test_registration_locks_stake_and_reputation(self):
        s=self.state(); self.assertEqual(s['agents']['agent']['stake'],STAKE); self.assertEqual(s['reputation'][B],100)
        self.post(); self.assertEqual(self.state()['reputation'][A],100); self.conserve()
    def test_post_escrow(self):
        self.post(); self.assertEqual(self.task()['status'],'OPEN'); self.conserve()
    def test_requirements_hash_mismatch(self):
        self.pay(BOUNTY); self.as_(A); self.nochange(lambda:self.c.post_task('bad','Bad',BOUNTY,'0'*64,SPEC),'REQUIREMENTS_HASH_MISMATCH')
    def test_duplicate_task(self):
        self.post(); self.nochange(self.post,'TASK_ALREADY_EXISTS')
    def test_claim_owner_binding(self):
        self.post(); self.as_(C); self.nochange(lambda:self.c.claim_task('task','agent'),'CALLER_ADDRESS_MISMATCH')
    def test_one_open_claim_and_locked_stake(self):
        self.post(); self.post('other'); self.as_(B).claim_task('task','agent')
        self.nochange(lambda:self.c.claim_task('other','agent'),'OPEN_CLAIM')
        self.pay(100); self.nochange(lambda:self.c.top_up_stake('agent',100),'STAKE_LOCKED')
    def test_submit_owner_binding(self):
        self.post(); self.as_(B).claim_task('task','agent'); self.as_(A)
        self.nochange(lambda:self.c.submit_delivery('task','https://example.com','0'*64,'manifest'),'CALLER_ADDRESS_MISMATCH')
    def test_submit_validates_delivery_before_write(self):
        self.post(); self.as_(B).claim_task('task','agent')
        runtime.bodies=[b'x'*24001]
        self.nochange(lambda:self.c.submit_delivery('task','https://example.com/big.txt',hashlib.sha256(runtime.bodies[0]).hexdigest(),'too big'),'DELIVERY_TOO_LARGE')
        self.assertEqual(self.task()['status'],'CLAIMED'); self.assertIsNone(self.task()['delivery'])
        runtime.bodies=[b'Complete evidence.']
        self.nochange(lambda:self.c.submit_delivery('task','https://example.com/evidence.txt','0'*64,'wrong hash'),'DELIVERY_HASH_MISMATCH')
        self.assertEqual(self.task()['status'],'CLAIMED')
        runtime.bodies=[b'Bad \xff\xfe bytes']
        self.nochange(lambda:self.c.submit_delivery('task','https://example.com/bad.bin',hashlib.sha256(runtime.bodies[0]).hexdigest(),'not utf-8'),'DELIVERY_NOT_UTF8')
        self.assertEqual(self.task()['status'],'CLAIMED')
        runtime.unreachable=True
        self.nochange(lambda:self.c.submit_delivery('task','https://example.com/evidence.txt',hashlib.sha256(b'Complete evidence.').hexdigest(),'unreachable'),'DELIVERY_UNREACHABLE_RETRYABLE')
        runtime.unreachable=False; runtime.bodies=[b'Complete evidence.']
        self.c.submit_delivery('task','https://example.com/evidence.txt',hashlib.sha256(b'Complete evidence.').hexdigest(),'A delivery manifest.')
        self.assertEqual(self.task()['status'],'SUBMITTED'); self.conserve()
    def test_resubmit_before_evaluation_replaces_delivery(self):
        self.submit()
        runtime.bodies=[b'Revised complete evidence.']
        self.as_(B).submit_delivery('task','https://example.com/revised.txt',hashlib.sha256(runtime.bodies[0]).hexdigest(),'Revised delivery.')
        t=self.task(); self.assertEqual(t['status'],'SUBMITTED'); self.assertEqual(t['delivery']['url'],'https://example.com/revised.txt')
        self.assertEqual(t['events'][-1]['event'],'DELIVERY_RESUBMITTED'); self.conserve()
    def test_resubmit_after_evaluation_forbidden(self):
        self.pending()
        runtime.bodies=[b'Revised complete evidence.']
        self.as_(B); self.nochange(lambda:self.c.submit_delivery('task','https://example.com/revised.txt',hashlib.sha256(runtime.bodies[0]).hexdigest(),'Too late.'),'TASK_NOT_CLAIMABLE_FOR_DELIVERY')
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
        self.pending(); t=self.task(); self.assertEqual(t['status'],'EVALUATING'); self.assertIsNone(t['settlement']); self.assertEqual(self.state()['withdrawable'].get(B,0),0); self.conserve()
    def test_accept_full_settlement_and_withdraw(self):
        self.pending(); self.as_(C); self.finalize(); s=self.state()
        self.assertEqual(s['withdrawable'][B],BOUNTY); self.assertEqual(s['reputation'][B],110); self.assertEqual(s['agents']['agent']['stake'],STAKE); self.conserve()
        self.as_(B).withdraw()
        self.assertEqual(self.state()['withdrawable'].get(B,0),0)
        self.assertEqual(runtime.external_transfers,[{'to':B,'value':BOUNTY}])
        self.assertEqual(runtime.eoa_balances[B],BOUNTY); self.conserve()
        self.nochange(lambda:self.c.withdraw(),'NOTHING_WITHDRAWABLE')
    def test_partial_exact_split(self):
        self.pending([70,69,40]); self.finalize(); s=self.state()
        self.assertEqual(s['withdrawable'][B],BOUNTY//2); self.assertEqual(s['withdrawable'][A],BOUNTY//2); self.assertEqual(s['reputation'][B],102); self.conserve()
    def test_reject_refund_slash_reputation(self):
        self.pending([100,39,100]); self.finalize(); s=self.state()
        self.assertEqual(s['withdrawable'][A],BOUNTY); self.assertEqual(s['treasury'],SLASH); self.assertEqual(s['agents']['agent']['stake'],STAKE-SLASH); self.assertEqual(s['reputation'][B],85); self.conserve()
    def test_hash_mismatch_is_pending_reject(self):
        self.submit(); runtime.bodies=[b'Changed bytes']; self.c.evaluate_delivery('task'); t=self.task()
        self.assertEqual(t['status'],'EVALUATING'); self.assertEqual(t['rounds'][0]['scores'],[0,0,0]); self.assertIsNone(t['settlement'])
        self.finalize(); self.conserve()
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
        self.pending(); self.finalize()
        for fn,error in [(lambda:self.c.evaluate_delivery('task'),'TASK_NOT_SUBMITTED'),(lambda:self.c.expire_task('task'),'CALLER_ADDRESS_MISMATCH'),(lambda:self.c.finalize_delivery('task'),'TASK_NOT_EVALUATING')]: self.nochange(fn,error)
    def test_challenge_binding_and_unreachable_no_partial_write(self):
        self.pending(); self.as_(C); self.nochange(lambda:self.c.challenge_delivery('task','Reassess.'),'CALLER_ADDRESS_MISMATCH')
        self.as_(A); runtime.unreachable=True; self.nochange(lambda:self.c.challenge_delivery('task','Reassess.'),'UNREACHABLE_RETRYABLE')
    def test_top_up_after_slash_enables_next_claim(self):
        self.pending([0,0,0]); self.finalize(); self.post('next'); self.as_(B)
        self.nochange(lambda:self.c.claim_task('next','agent'),'STAKE_BELOW_MINIMUM')
        self.pay(SLASH); self.c.top_up_stake('agent',SLASH); runtime.value_in += SLASH; self.assertEqual(self.state()['agents']['agent']['stake'],STAKE)
        self.c.claim_task('next','agent'); self.assertEqual(self.task('next')['status'],'CLAIMED'); self.conserve()
    def test_expire_open_refunds_once(self):
        self.post(); self.c.expire_task('task'); self.assertEqual(self.task()['status'],'EXPIRED'); self.assertEqual(self.state()['withdrawable'][A],BOUNTY); self.conserve()
        self.nochange(lambda:self.c.expire_task('task'),'TASK_NOT_EXPIRABLE')
    def test_expire_claimed_unlocks_agent(self):
        self.post(); self.as_(B).claim_task('task','agent'); self.at(self.task()['delivery_deadline']); self.as_(A).expire_task('task')
        self.assertEqual(self.state()['agents']['agent']['open_claim'],''); self.assertEqual(self.state()['withdrawable'][A],BOUNTY); self.conserve()
    def test_expire_submitted_without_rounds_refunds(self):
        self.submit(); self.at(self.task()['review_deadline']); self.as_(A).expire_task('task')
        self.assertEqual(self.task()['status'],'EXPIRED'); self.assertEqual(self.state()['withdrawable'][A],BOUNTY)
        self.assertEqual(self.state()['agents']['agent']['open_claim'],''); self.conserve()
    def test_expire_after_evaluation_forbidden(self):
        self.pending(); self.as_(A); self.nochange(lambda:self.c.expire_task('task'),'TASK_NOT_EXPIRABLE')
    def test_seed_fixtures_are_not_consensus_evidence(self):
        s=self.state(); self.assertEqual(len([a for a in s['agents'].values() if a['origin']=='seed_demo']),3)
        for t in s['tasks'].values(): self.assertEqual(t['rounds'],[]); self.assertEqual(t['origin'],'seed_demo')
        self.nochange(lambda:self.c.evaluate_delivery('seed-1'),'SEED_DEMO_READ_ONLY')
    def test_threshold_boundaries(self):
        for scores,expected in [([70,70,70],'ACCEPT'),([69,100,100],'PARTIAL'),([40,40,40],'PARTIAL'),([39,100,100],'REJECT'),([0,0,0],'REJECT'),([100,100,100],'ACCEPT')]: self.assertEqual(contract.verdict(scores),expected)
        for scores in [[True,90,90],[101,90,90],[-1,90,90],[70,70]]:
            with self.assertRaises(Exception): contract.verdict(scores)
    def test_validator_refetch_and_hash_disagreement(self):
        # Submit validation consumes fetches 0-1 (both see the same bytes);
        # at evaluate time the leader sees the original bytes and the
        # validator sees changed bytes, so consensus must reject.
        self.submit(); runtime.bodies=[b'Complete evidence.',b'Complete evidence.',b'Complete evidence.',b'Changed bytes']
        self.nochange(lambda:self.c.evaluate_delivery('task'),'CONSENSUS_REJECTED')
        self.assertEqual(runtime.fetches,4)
    def test_validator_score_tolerance_and_threshold_gate(self):
        self.submit(); runtime.scores=[[70,80,80],[69,80,80]]
        self.nochange(lambda:self.c.evaluate_delivery('task'),'CONSENSUS_REJECTED')
        runtime.scores=[[90,90,90],[79,90,90]]
        self.nochange(lambda:self.c.evaluate_delivery('task'),'CONSENSUS_REJECTED')
    def test_validator_rejects_forged_verdict(self):
        self.pending(); forged=copy.deepcopy(runtime.proposal); forged['verdict']='REJECT'
        self.assertFalse(runtime.validator(Return(forged)))
    def test_partial_same_verdict_can_cross_a_nondecisive_dimension_boundary(self):
        self.submit(); runtime.scores=[[60,100,70],[60,100,60]]
        self.c.evaluate_delivery('task')
        self.assertEqual(self.task()['pending_verdict'],'PARTIAL')
        self.assertEqual(self.task()['rounds'][0]['scores'],[60,100,70])
        self.assertIsNone(self.task()['settlement'])
    def test_partial_still_rejects_score_distance_over_ten(self):
        self.submit(); runtime.scores=[[60,100,70],[60,100,59]]
        self.nochange(lambda:self.c.evaluate_delivery('task'),'CONSENSUS_REJECTED')
    def test_json_fences_do_not_change_integer_scores(self):
        obj={'scores':[60,100,70],'rationale':'Only three of five replies are present.','contradictions':['Two replies are missing.']}
        for text in [json.dumps(obj),'```json\n'+json.dumps(obj)+'\n```','```\n'+json.dumps(obj)+'\n```']:
            self.assertEqual(contract.model_object(text),obj)
        for text in ['```json\n{"scores":[60.0,100,70]}\n```','{"scores":[NaN,100,70]}','prefix {"scores":[60,100,70]}','```json\n{"scores":[60,100,70]}']:
            with self.assertRaises(Exception):contract.model_object(text)
    def test_transaction_time_uses_context_and_integer_utc_seconds(self):
        gl.message_raw['datetime']='2026-11-13T08:00:00.999999+08:00'
        self.assertEqual(contract.transaction_time(),1794528000)
        gl.message_raw['datetime']='2026-11-13T00:00:00Z'
        self.assertEqual(contract.transaction_time(),1794528000)
        gl.message_raw['datetime']='2026-11-13T00:00:00'
        with self.assertRaisesRegex(Exception,'TRANSACTION_TIME_REQUIRES_TIMEZONE'):
            contract.transaction_time()
        gl.message_raw={}
        self.nochange(self.post,'datetime')
    def test_first_verdict_blocks_all_early_finalizers(self):
        for scores in [[90,90,90],[60,60,60],[0,0,0]]:
            with self.subTest(scores=scores):
                self.setUp()
                self.pending(scores); t=self.task()
                self.assertEqual(t['challenge_deadline']-t['evaluated_at'],3600)
                for now in [t['evaluated_at'],t['challenge_deadline']-1]:
                    self.at(now)
                    for who in [A,B,C]:
                        self.as_(who)
                        self.nochange(lambda:self.c.finalize_delivery('task'),'CHALLENGE_PERIOD_ACTIVE')
                        self.conserve()
                self.at(t['challenge_deadline']); self.as_(C).finalize_delivery('task')
                self.nochange(lambda:self.c.finalize_delivery('task'),'TASK_NOT_EVALUATING')
                self.conserve()
    def test_challenge_last_second_survives_early_finalize_attempt(self):
        self.pending(); first=copy.deepcopy(self.task()['rounds'][0])
        self.as_(A); self.nochange(lambda:self.c.finalize_delivery('task'),'CHALLENGE_PERIOD_ACTIVE')
        self.at(self.task()['challenge_deadline']-1)
        self.as_(B).challenge_delivery('task','Reassess within the protected window.')
        self.assertEqual(self.task()['rounds'][0],first)
        self.assertEqual(len(self.task()['rounds']),2)
        self.assertEqual(self.task()['status'],'FINALIZED'); self.conserve()
    def test_challenge_at_or_after_deadline_cannot_race_finalization(self):
        for offset in [0,1,86400]:
            with self.subTest(offset=offset):
                self.setUp(); self.pending(); self.at(self.task()['challenge_deadline']+offset)
                self.as_(A); self.nochange(lambda:self.c.challenge_delivery('task','Late challenge.'),'CHALLENGE_DEADLINE_PASSED')
                self.as_(C).finalize_delivery('task'); self.conserve()
    def test_claim_has_full_delivery_period_and_no_early_poster_refund(self):
        self.post(); self.as_(B).claim_task('task','agent'); t=self.task()
        self.assertEqual(t['delivery_deadline']-t['claimed_at'],86400)
        for now in [t['claimed_at'],t['delivery_deadline']-1]:
            self.at(now); self.as_(A)
            self.nochange(lambda:self.c.expire_task('task'),'DELIVERY_PERIOD_ACTIVE')
            self.assertEqual(self.state()['agents']['agent']['open_claim'],'task')
            self.assertIsNone(self.task()['settlement']); self.conserve()
        self.at(t['delivery_deadline']); self.as_(A).expire_task('task')
        self.assertEqual(self.state()['agents']['agent']['open_claim'],''); self.conserve()
        self.nochange(lambda:self.c.expire_task('task'),'TASK_NOT_EXPIRABLE')
    def test_last_second_delivery_starts_independent_full_review_period(self):
        self.post(); self.as_(B).claim_task('task','agent'); old=self.task()['delivery_deadline']
        self.at(old-1)
        self.c.submit_delivery('task','https://example.com/evidence.txt',hashlib.sha256(runtime.bodies[0]).hexdigest(),'Manifest.')
        t=self.task(); self.assertEqual(t['submitted_at'],old-1)
        self.assertEqual(t['review_deadline'],old-1+86400)
        for now in [old,t['review_deadline']-1]:
            self.at(now); self.as_(A)
            self.nochange(lambda:self.c.expire_task('task'),'REVIEW_PERIOD_ACTIVE')
        self.as_(C).evaluate_delivery('task'); self.conserve()
    def test_late_delivery_rejected_before_fetch_and_no_deadline_reset(self):
        self.post(); self.as_(B).claim_task('task','agent')
        for offset in [0,1]:
            self.at(self.task()['delivery_deadline']+offset); fetched=runtime.fetches
            self.nochange(lambda:self.c.submit_delivery('task','https://example.com','0'*64,'Late.'),'DELIVERY_DEADLINE_PASSED')
            self.assertEqual(runtime.fetches,fetched)
        self.as_(A).expire_task('task'); self.conserve()
    def test_submitted_expiry_protects_review_and_refunds_once_at_deadline(self):
        self.submit(); t=self.task()
        for now in [t['submitted_at'],t['review_deadline']-1]:
            self.at(now); self.as_(A)
            self.nochange(lambda:self.c.expire_task('task'),'REVIEW_PERIOD_ACTIVE')
            self.conserve()
        self.at(t['review_deadline']); self.c.expire_task('task')
        self.assertEqual(self.task()['status'],'EXPIRED')
        self.assertEqual(self.state()['withdrawable'][A],BOUNTY)
        self.assertEqual(self.state()['agents']['agent']['stake'],STAKE)
        self.assertEqual(self.state()['reputation'][B],100)
        self.nochange(lambda:self.c.expire_task('task'),'TASK_NOT_EXPIRABLE'); self.conserve()
    def test_resubmission_cannot_grief_poster_by_extending_review(self):
        self.submit(); t=self.task(); self.at(t['review_deadline']-1)
        self.as_(B).submit_delivery('task','https://example.com/revised',hashlib.sha256(runtime.bodies[0]).hexdigest(),'Revised.')
        self.assertEqual(self.task()['submitted_at'],t['submitted_at'])
        self.assertEqual(self.task()['review_deadline'],t['review_deadline'])
        self.at(t['review_deadline'])
        self.nochange(lambda:self.c.submit_delivery('task','https://example.com/revised','0'*64,'Too late.'),'DELIVERY_DEADLINE_PASSED')
        self.as_(A).expire_task('task'); self.conserve()
    def test_late_evaluation_cannot_remove_poster_expiry_right(self):
        self.submit(); self.at(self.task()['review_deadline']); self.as_(C)
        fetched=runtime.fetches
        self.nochange(lambda:self.c.evaluate_delivery('task'),'REVIEW_DEADLINE_PASSED')
        self.assertEqual(runtime.fetches,fetched)
        self.as_(A).expire_task('task'); self.conserve()
    def test_evaluated_task_cannot_be_expired_even_after_all_deadlines(self):
        self.pending(); self.at(self.task()['review_deadline']+86400); self.as_(A)
        self.nochange(lambda:self.c.expire_task('task'),'TASK_NOT_EXPIRABLE')
        self.as_(C).finalize_delivery('task'); self.conserve()
    def test_nonposter_cannot_expire_before_or_after_deadlines(self):
        self.submit()
        for now in [self.task()['submitted_at'],self.task()['review_deadline']]:
            self.at(now)
            for who in [B,C]:
                self.as_(who); self.nochange(lambda:self.c.expire_task('task'),'CALLER_ADDRESS_MISMATCH')
        self.conserve()
    def test_failed_consensus_does_not_create_or_extend_any_deadline(self):
        self.submit(); self.at(self.task()['review_deadline']-1)
        runtime.scores=[[90,90,90],[40,40,40]]
        self.nochange(lambda:self.c.evaluate_delivery('task'),'CONSENSUS_REJECTED')
        self.assertIsNone(self.task()['challenge_deadline'])
        self.at(self.task()['review_deadline']); self.as_(A).expire_task('task'); self.conserve()
    def test_failed_challenge_preserves_original_window_for_retry(self):
        self.pending(); deadline=self.task()['challenge_deadline']
        self.at(deadline-2); runtime.unreachable=True; self.as_(A)
        self.nochange(lambda:self.c.challenge_delivery('task','Retryable failure.'),'UNREACHABLE_RETRYABLE')
        self.assertEqual(self.task()['challenge_deadline'],deadline)
        self.at(deadline-1); runtime.unreachable=False
        self.c.challenge_delivery('task','Retry before original deadline.')
        self.assertEqual(self.task()['status'],'FINALIZED'); self.conserve()
    def test_event_timestamps_record_transaction_time(self):
        self.submit(); t=self.task()
        self.assertEqual([x['timestamp'] for x in t['events']],[1794528000]*3)

    def test_sha256_vectors_and_random_payloads(self):
        rng=random.Random(99)
        for b in [b'',b'abc',b'a'*55,b'a'*56,b'a'*64,b'a'*1000,'中文交付'.encode()] + [rng.randbytes(n) for n in [1,17,63,65,512,24000]]:
            self.assertEqual(contract.sha256(b),hashlib.sha256(b).hexdigest())

if __name__=='__main__': unittest.main(verbosity=2)
