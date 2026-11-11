import {build} from 'vite';
import {readFile,writeFile,readdir,copyFile} from 'node:fs/promises';
import {RELEASE} from '../src/update.js';
await build();
const html=await readFile('dist/index.html','utf8');
if(!html.includes(`name="pocketa-build" content="${RELEASE.build}"`))throw Error('Release build and HTML build must match');
await writeFile('dist/version.json',JSON.stringify(RELEASE)+'\n');
// Keep these small modules available for older cached clients and backup tooling.
await copyFile('src/fx.js','dist/fx.js');await copyFile('src/amounts.js','dist/amounts.js');await copyFile('src/core.js','dist/core.js');await copyFile('src/update.js','dist/update.js');
const assets=(await readdir('dist/assets')).map(x=>'./assets/'+x);
const cache=`blue-ledger-v${RELEASE.build}`;
await writeFile('dist/sw.js',`const CACHE=${JSON.stringify(cache)};const ASSETS=${JSON.stringify(['./','./index.html','./core.js','./fx.js','./amounts.js','./update.js','./icon.svg','./manifest.webmanifest',...assets])};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('blue-ledger-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;const u=new URL(e.request.url);if(u.pathname.endsWith('/version.json')||u.searchParams.has('check')){e.respondWith(fetch(e.request,{cache:'no-store'}));return;}e.respondWith(fetch(e.request).then(r=>{if(r.ok&&r.type==='basic'){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request).then(r=>r||(e.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));});\n`);
await writeFile('dist/.nojekyll','');
