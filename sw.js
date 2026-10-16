const CACHE="tripnote-share-v8";
const ASSETS=["./","./index.html","./style.css","./app.js","./firebase-bundle.js","./firebase-config.js","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-512.png","./icons/apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// 앱 파일: 인터넷이 되면 최신 버전을 받고, 안 되면 저장된 버전으로 열기
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const res=await Promise.race([fetch(r),new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),4000))]);
      if(res&&res.ok)cache.put(r.mode==="navigate"?"./index.html":r,res.clone());
      return res;
    }catch(err){
      return (await cache.match(r.mode==="navigate"?"./index.html":r,{ignoreSearch:true}))||(await cache.match("./index.html"))||Response.error();
    }
  })());
});
