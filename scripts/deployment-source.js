import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
// Run before loading signing accounts or broadcasting historical workflows.
export function requireDeployedSource(root=process.cwd()) {
  const deployment=JSON.parse(fs.readFileSync(path.join(root,'evidence/deployment.json'),'utf8'));
  const actual=createHash('sha256').update(fs.readFileSync(path.join(root,'contracts/task_prism.py'))).digest('hex');
  if(actual!==deployment.source_sha256)throw Error('SOURCE_NOT_DEPLOYED: existing evidence belongs to the previous contract.');
  return deployment;
}
