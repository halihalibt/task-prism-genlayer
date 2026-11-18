export default {
  "task": {
    "agent_id": "stake-exit-20261118190723",
    "bounty": 200000000000000000,
    "challenge_deadline": 1795032992,
    "challenge_failed": true,
    "challenge_reason": "Check whether this cake recipe contains any of the manifest verification steps.",
    "challenger": "0xe13cf083cdf8adc25a0b37e6ea73a48f20fdd4d1",
    "claimed_at": 1795029215,
    "deliverable_spec": "Deliver a concise English three-step runbook for checking a public delivery manifest, with one hash-change example and limitations.",
    "delivery": {
      "sha256": "27f47297f34e9447d18ff5ec506bca4a4e1433c9278189f55cfdcfa3f48a3a87",
      "summary": "Chocolate cake recipe.",
      "url": "https://raw.githubusercontent.com/halihalibt/task-prism-genlayer/a24e07e5e9ed7aebb431f52c81898b36d4f29d6c/fixtures/probe-c-recipe.txt"
    },
    "delivery_deadline": 1795115615,
    "evaluated_at": 1795029392,
    "events": [
      {
        "actor": "0x00edfeb986cdf0344650c9c1613745b924d460f0",
        "event": "POSTED",
        "sequence": 1,
        "timestamp": 1795029156
      },
      {
        "actor": "0xe13cf083cdf8adc25a0b37e6ea73a48f20fdd4d1",
        "event": "CLAIMED",
        "sequence": 2,
        "timestamp": 1795029215
      },
      {
        "actor": "0xe13cf083cdf8adc25a0b37e6ea73a48f20fdd4d1",
        "event": "SUBMITTED",
        "sequence": 3,
        "timestamp": 1795029332
      },
      {
        "actor": "0x00edfeb986cdf0344650c9c1613745b924d460f0",
        "event": "PENDING_VERDICT",
        "sequence": 4,
        "timestamp": 1795029392
      },
      {
        "actor": "0xe13cf083cdf8adc25a0b37e6ea73a48f20fdd4d1",
        "event": "DISPUTED",
        "sequence": 5,
        "timestamp": 1795029521
      },
      {
        "actor": "0xe13cf083cdf8adc25a0b37e6ea73a48f20fdd4d1",
        "event": "FINALIZED",
        "sequence": 6,
        "timestamp": 1795029521
      }
    ],
    "final_verdict": "REJECT",
    "origin": "user",
    "pending_verdict": "REJECT",
    "poster": "0x00edfeb986cdf0344650c9c1613745b924d460f0",
    "requirements_hash": "71d2dbf2e7c596c8fd72503400856b6d6f1d9b3d4e9d0e1658db14ac6d17a2c2",
    "review_deadline": 1795115732,
    "rounds": [
      {
        "basis": "CONTENT_REVIEW",
        "contradictions": [
          "Specification requires a three-step runbook; delivered content is a chocolate cake recipe with no steps related to manifest checking",
          "Specification requires a hash-change example; no such example is present",
          "Specification requires a limitations section; no limitations are discussed",
          "Specification requires content about a public delivery manifest; subject matter is entirely about baking"
        ],
        "evidence_hash": "27f47297f34e9447d18ff5ec506bca4a4e1433c9278189f55cfdcfa3f48a3a87",
        "expected_hash": "27f47297f34e9447d18ff5ec506bca4a4e1433c9278189f55cfdcfa3f48a3a87",
        "rationale": "The delivered content is a chocolate cake recipe. The specification requires a concise English three-step runbook for checking a public delivery manifest, including a hash-change example and a discussion of limitations. None of these required elements are present: no runbook, no steps related to manifest checking, no hash-change example, and no limitations section. The delivered content is entirely unrelated to the specification.",
        "round": 1,
        "scores": [
          0,
          0,
          0
        ],
        "url": "https://raw.githubusercontent.com/halihalibt/task-prism-genlayer/a24e07e5e9ed7aebb431f52c81898b36d4f29d6c/fixtures/probe-c-recipe.txt",
        "verdict": "REJECT"
      },
      {
        "basis": "CONTENT_REVIEW",
        "contradictions": [
          "Specification requires a three-step runbook for checking a public delivery manifest with a hash-change example and limitations; delivered content is a chocolate cake recipe."
        ],
        "evidence_hash": "27f47297f34e9447d18ff5ec506bca4a4e1433c9278189f55cfdcfa3f48a3a87",
        "expected_hash": "27f47297f34e9447d18ff5ec506bca4a4e1433c9278189f55cfdcfa3f48a3a87",
        "rationale": "The delivered content is a chocolate cake recipe completely unrelated to the specification, which asked for a three-step runbook for checking a public delivery manifest.",
        "round": 2,
        "scores": [
          0,
          0,
          0
        ],
        "url": "https://raw.githubusercontent.com/halihalibt/task-prism-genlayer/a24e07e5e9ed7aebb431f52c81898b36d4f29d6c/fixtures/probe-c-recipe.txt",
        "verdict": "REJECT"
      }
    ],
    "settlement": {
      "agent_reputation_delta": -15,
      "paid_to_agent": 0,
      "refunded_to_poster": 200000000000000000,
      "slashed_to_treasury": 100000000000000000
    },
    "status": "FINALIZED",
    "submitted_at": 1795029332,
    "task_id": "stake-exit-20261118190723-task",
    "title": "Manifest runbook"
  },
  "hashes": [
    "0x103505232f12ed6968996a6378a19aa916e1e34c9d2de7b0b84529d20b426e2a",
    "0x72fde4e64a4703dfda7c66a4c0c61e612e5d54a99acc6d9bc6a782663bc4333b",
    "0xfdfb0130208c7555127530eeca9075deeea0788df30a4f441954eb10d2cf481c",
    "0xafa3865b3ce8f0a00ccad0b031f1a10316ddaa1fda582260e6a7359341cf7d15",
    "0xfb8e876c136eccb4284c5ba376d37b40d255aa44a07c7148e302b2a1ac51782d",
    "0xfb8e876c136eccb4284c5ba376d37b40d255aa44a07c7148e302b2a1ac51782d",
    "0x3393ae7c6c9d5252c49e1c2cffabdec0f0ddc54e067cbc7b21a981646c9a4e00"
  ],
  "withdrawTime": "2026-11-18T19:21:17.494Z"
};
