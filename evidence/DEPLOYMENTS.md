# Contract deployments

All deployments below use Stable Studionet, Chain ID 61999, RPC `https://studio.genlayer.com/api`. Money movements are simulated mGEN ledger entries; no real GEN moves.

| Version | Contract | Deployment transaction | Source commit | Source SHA-256 |
| --- | --- | --- | --- | --- |
| Initial HTTP response version | `0xdbfA1b3EfFd0fcB38A5f6f208D3247a5C77Ab1b3` | [0xce27abb39cf29afc959f7c52d6c4bb4f5c26271aad310360304135b35bd0e795](https://explorer-studio.genlayer.com/tx/0xce27abb39cf29afc959f7c52d6c4bb4f5c26271aad310360304135b35bd0e795) | `4174a5a996e3e41c5994f990e018289cd6cd3f7f` | `f747d1ba19ab476fa9979aaf552300d17324cc98b250a3f1b43a1e9f5febaf78` |
| Strict score-band version | `0x2Bc2ec661ecbF8f76be6777A56481Eb1012fB4bE` | [0x39eb3e9b257cd31b2ff6046168ca6c2b66358167060d83c8fd52a7d8ec4962db](https://explorer-studio.genlayer.com/tx/0x39eb3e9b257cd31b2ff6046168ca6c2b66358167060d83c8fd52a7d8ec4962db) | `4df9c7a38753809dae7c87f878396d9107e77813` | `54437c822d51540a422fb2679dc4f322b234b3c7fbeaf1989b10973851ff8877` |
| Active consensus-compatible version | `0x2D5d39cE2414F154D0D2cd574079167B26deA68c` | [0x48dd22f470d04f9939e1a97b037282f5149d2ba09d849e7232e5694be1e594ae](https://explorer-studio.genlayer.com/tx/0x48dd22f470d04f9939e1a97b037282f5149d2ba09d849e7232e5694be1e594ae) | `356c398101b1e3ff7549a98c341add0e20ee90d2` | `37dbb612c3619b350bfa5a045db7e5246b1f8f72c9a97361d7eb9741379393f6` |

Previous deployments retain their original records. There is no task migration or rewriting of finalized verdicts. The [unsuccessful initial envelope](initial-envelope-receipt.json) did not create a contract and is excluded from the deployment table.
