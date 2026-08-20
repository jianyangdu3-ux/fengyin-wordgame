const CACHE_NAME='fengyin-v8-2';
const CORE=[
  './','./index.html','./vocab.js','./manual.html','./manifest.webmanifest',
  './assets/app-icon.svg','./assets/char-maid.webp','./assets/char-steward.webp',
  './assets/char-consort.webp','./assets/char-queen.webp'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{
      const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy));return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(!response||response.status!==200||response.type==='opaque')return response;
    const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;
  }).catch(()=>caches.match('./index.html'))));
});
