import test from 'node:test';
import assert from 'node:assert/strict';
import {RELEASE,checkRelease,prepareRelease} from '../src/update.js';
const base='https://example.test/blue-ledger/';
test('update checks bypass cache and only accept newer build numbers',async()=>{
 for(const build of [RELEASE.build-1,RELEASE.build,RELEASE.build+1]){
  const r=await checkRelease(base,async(url,options)=>{
   assert.equal(url.pathname,'/blue-ledger/version.json');assert.ok(url.searchParams.has('check'));assert.equal(options.cache,'no-store');
   return {ok:true,json:async()=>({version:'1.2.0',build})};
  });assert.equal(r.available,build>RELEASE.build);
 }
});
test('offline, HTTP failures and malformed releases do not trigger an upgrade',async()=>{
 await assert.rejects(checkRelease(base,async()=>{throw new TypeError('offline')}));
 await assert.rejects(checkRelease(base,async()=>({ok:false})));
 await assert.rejects(checkRelease(base,async()=>({ok:true,json:async()=>({version:'bad',build:6})})));
});
test('partially published release is rejected before navigation',async()=>{
 await assert.rejects(prepareRelease(base,{build:6},async()=>({ok:true,text:async()=>'<meta name="pocketa-build" content="5">'})));
 const target=await prepareRelease(base,{build:6},async()=>({ok:true,text:async()=>'<meta name="pocketa-build" content="6">'}));
 assert.equal(target.pathname,'/blue-ledger/index.html');assert.equal(target.searchParams.get('release'),'6');
});
