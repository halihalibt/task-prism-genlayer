// LOCAL MOCK browser validation. No external RPC, wallet signing, or transactions.
// Requires Playwright; PLAYWRIGHT_MODULE may specify an installed module path.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {abi} from 'genlayer-js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['scripts/dev-server.js','--port','5177'],{stdio:['ignore','pipe','inherit']});
let browser;
try{
  await once(server.stdout,'data');
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
  const state=JSON.parse(fs.readFileSync('evidence/final-state.json','utf8'));
  const id=Object.values(state.tasks).find(t=>t.origin!=='seed_demo').task_id;
  const results=[];
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
    const page=await browser.newPage({viewport,reducedMotion:'reduce'});
    const errors=[],methods=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.route('https://studio.genlayer.com/**',async route=>{
      const body=route.request().postDataJSON();methods.push(body.method);
      assert.equal(body.method,'gen_call','Browser preview must only read finalized state');
      const result='0x'+Buffer.from(abi.calldata.encode(JSON.stringify(state))).toString('hex');
      await route.fulfill({json:{jsonrpc:'2.0',id:body.id,result}});
    });
    await page.goto('http://127.0.0.1:5177/?task='+id);
    await page.locator('#read-status').filter({hasText:'Finalized state loaded'}).waitFor({timeout:10000}).catch(async()=>{
      await page.waitForFunction(()=>document.querySelectorAll('.roster-row').length>0);
    });
    assert.match(await page.locator('main > .ledger-notice').innerText(),/elapsed-time verification/);
    await page.locator('#connect').click();
    await page.locator('#temporary').click();
    await page.waitForFunction(()=>document.querySelector('#connect').textContent.includes('TEST'));
    for(const selector of ['#claim','#evaluate','#finalize','#expire','#post-form button[type=submit]','#challenge-form button']){
      assert(await page.locator(selector).isDisabled(),selector+' must be disabled for the old contract');
    }
    await page.locator('#language').click();
    assert.match(await page.locator('main > .ledger-notice').innerText(),/尚未完成/);
    assert.match(await page.locator('[data-t=challengeNote]').innerText(),/1 小时/);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    assert.equal(overflow,false,'no horizontal page overflow');
    assert.deepEqual(errors,[]);
    results.push({viewport,errors,old_contract_writes_disabled:true,english_and_chinese_notice:true,no_horizontal_overflow:true,rpc_methods:methods});
    await page.close();
  }
  fs.writeFileSync('evidence/timing-browser-local.json',JSON.stringify({scope:'LOCAL MOCK browser and RPC; no signed transactions',results},null,2)+'\n');
  console.log('LOCAL MOCK browser timing notices and write guards passed at desktop and mobile sizes.');
}finally{await browser?.close();server.kill();}
