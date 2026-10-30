// Tiny fake Firestore server for testing: in-memory docs, SSE change feed, static file serving.
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=process.argv[2], FAKE=process.argv[3];
const docs=new Map(); const subs=new Set();
function setPath(o,k,v){const ks=k.split('.');let c=o;for(let i=0;i<ks.length-1;i++){c[ks[i]]=c[ks[i]]&&typeof c[ks[i]]==='object'?c[ks[i]]:{};c=c[ks[i]]}const last=ks[ks.length-1];
  if(v&&v.__op==='union'){const a=Array.isArray(c[last])?c[last]:[];v.vals.forEach(x=>{if(!a.some(y=>JSON.stringify(y)===JSON.stringify(x)))a.push(x)});c[last]=a}
  else if(v&&v.__op==='remove'){const a=Array.isArray(c[last])?c[last]:[];c[last]=a.filter(y=>!v.vals.some(x=>JSON.stringify(x)===JSON.stringify(y)))}
  else if(v&&v.__op==='del'){delete c[last]} else c[last]=v}
function mergeInto(a,b){for(const k of Object.keys(b)){const v=b[k];if(v&&typeof v==='object'&&!Array.isArray(v)&&!v.__op&&a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k]))mergeInto(a[k],v);else a[k]=v}return a}
function apply(op){const p=op.path;
  if(op.type==='set'){const base=op.merge&&docs.has(p)?JSON.parse(JSON.stringify(docs.get(p))):{};docs.set(p,mergeInto(base,op.data))}
  else if(op.type==='update'){if(!docs.has(p))throw new Error('not-found '+p);const d=JSON.parse(JSON.stringify(docs.get(p)));for(const [k,v] of Object.entries(op.data))setPath(d,k,v);docs.set(p,d)}
  else if(op.type==='delete')docs.delete(p)}
function snap(p){const segs=p.split('/');if(segs.length%2===0)return {kind:'doc',path:p,exists:docs.has(p),data:docs.get(p)||null};
  const out=[];for(const [k,v] of docs){const s=k.split('/');if(s.length===segs.length+1&&k.startsWith(p+'/'))out.push({id:s[s.length-1],path:k,data:v})}return {kind:'col',path:p,docs:out}}
function notify(){for(const s of subs){const j=JSON.stringify(snap(s.p));if(j!==s.last){s.last=j;s.res.write(`data: ${j}\n\n`)}}}
http.createServer((req,res)=>{const u=new URL(req.url,'http://x');
  if(u.pathname==='/__sse'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache'});const s={p:u.searchParams.get('p'),res,last:''};subs.add(s);s.last=JSON.stringify(snap(s.p));res.write(`data: ${s.last}\n\n`);req.on('close',()=>subs.delete(s));return}
  if(u.pathname==='/__get'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(snap(u.searchParams.get('p'))));return}
  if(u.pathname==='/__write'){let b='';req.on('data',c=>b+=c);req.on('end',()=>{try{const ops=JSON.parse(b).ops;if(b.includes('__reject__'))throw new Error('permission-denied: test');const sub=ops.filter(o=>o.path.split('/').length>2).length;if(sub*2>20)throw new Error('permission-denied: too many access calls ('+sub*2+')');ops.forEach(apply);notify();res.writeHead(200);res.end('{}')}catch(e){res.writeHead(400);res.end(JSON.stringify({error:e.message}))}});return}
  if(u.pathname==='/__dump'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(Object.fromEntries(docs)));return}
  const f=u.pathname==='/'?'/index.html':u.pathname;
  if(f==='/firebase-config.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end('window.FIREBASE_CONFIG={apiKey:"fake",projectId:"fake",appId:"x"};');return}
  const file=f==='/firebase-bundle.js'?FAKE:path.join(ROOT,f);
  fs.readFile(file,(e,d)=>{if(e){res.writeHead(404);res.end();return}const ext=path.extname(file);res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'}[ext]||'application/octet-stream'});res.end(d)})
}).listen(8770,()=>console.log('fake on 8770'));
