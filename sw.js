const PREFIX='minamigo-test-'+new URL(self.registration.scope).pathname+'-';
const CACHE=PREFIX+'20261013-photos-food-2';
const SHELL=['./','./index.html','./offline.html','./styles.css','./src/app.js','./src/data.js','./src/quiz.js','./src/media.js','./config.json','./data/spots.json','./manifest.json','./icon-192.png','./icon-512.png','./assets/mark.svg','./assets/vendor/leaflet.js','./assets/vendor/leaflet.css'];
const urls=new Set(SHELL.map(p=>new URL(p,self.registration.scope).href));
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(url=>new Request(url,{cache:'reload'}))))));
self.addEventListener('message',e=>{if(e.data==='ACTIVATE')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.href.startsWith(self.registration.scope))return;
 // Never intercept or prefetch map tiles, external links, or private sources.
 if(e.request.mode==='navigate'){e.respondWith(caches.open(CACHE).then(async c=>(await c.match('./index.html'))||fetch(e.request).catch(()=>c.match('./offline.html'))));return;}
 if(!urls.has(u.href))return;
 if(u.pathname.endsWith('/data/spots.json')){e.respondWith(fetch(e.request).catch(()=>caches.open(CACHE).then(async c=>{const saved=await c.match(e.request);if(!saved)throw new Error('No saved data');const headers=new Headers(saved.headers);headers.set('X-MinamiGo-Offline','1');return new Response(await saved.blob(),{status:saved.status,headers});})));return;}
 // Keep code/config/data as one versioned bundle; activate updates with user consent.
 e.respondWith(caches.open(CACHE).then(async c=>(await c.match(e.request))||fetch(e.request)));
});
