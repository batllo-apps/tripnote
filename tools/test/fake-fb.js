// Fake Firebase client implementing the subset the app uses, talking to server.js
(function(){
const mkRef=segs=>({path:segs.join('/'),id:segs[segs.length-1]});
const flat=a=>a.flatMap(x=>typeof x==='string'?x.split('/'):[]);
const post=ops=>fetch('/__write',{method:'POST',body:JSON.stringify({ops})}).then(async r=>{if(!r.ok){const e=new Error((await r.json()).error);e.code='not-found';throw e}});
const meta={hasPendingWrites:false,fromCache:false};
function toSnap(s){if(s.kind==='doc')return {id:s.path.split('/').pop(),exists:()=>s.exists,data:()=>s.data?JSON.parse(JSON.stringify(s.data)):undefined,metadata:meta};
  return {docs:s.docs.map(d=>({id:d.id,data:()=>JSON.parse(JSON.stringify(d.data)),ref:mkRef(d.path.split('/'))})),metadata:meta,size:s.docs.length}}
const enc=v=>JSON.parse(JSON.stringify(v));
let authCb=null;
window.FB={
  initializeApp:c=>({c}),initializeFirestore:()=>({}),persistentLocalCache:()=>({}),persistentMultipleTabManager:()=>({}),connectFirestoreEmulator(){},connectAuthEmulator(){},
  doc:(fs,...s)=>mkRef(flat(s)),collection:(fs,...s)=>mkRef(flat(s)),
  onSnapshot(ref,opts,next,err){if(typeof opts==='function'){err=next;next=opts}const es=new EventSource('/__sse?p='+encodeURIComponent(ref.path));es.onmessage=m=>next(toSnap(JSON.parse(m.data)));return ()=>es.close()},
  setDoc:(ref,data,o)=>post([{type:'set',path:ref.path,data:enc(data),merge:!!(o&&o.merge)}]),
  updateDoc:(ref,data)=>post([{type:'update',path:ref.path,data:enc(data)}]),
  deleteDoc:ref=>post([{type:'delete',path:ref.path}]),
  getDoc:ref=>fetch('/__get?p='+encodeURIComponent(ref.path)).then(r=>r.json()).then(toSnap),
  getDocs:ref=>fetch('/__get?p='+encodeURIComponent(ref.path)).then(r=>r.json()).then(toSnap),
  writeBatch(){const ops=[];return {set(r,d,o){ops.push({type:'set',path:r.path,data:enc(d),merge:!!(o&&o.merge)})},update(r,d){ops.push({type:'update',path:r.path,data:enc(d)})},delete(r){ops.push({type:'delete',path:r.path})},commit:()=>post(ops)}},
  arrayUnion:(...v)=>({__op:'union',vals:v}),arrayRemove:(...v)=>({__op:'remove',vals:v}),deleteField:()=>({__op:'del'}),
  getAuth:()=>({}),
  onAuthStateChanged(a,cb){authCb=cb;const u=localStorage.getItem('fakeuid');setTimeout(()=>cb(u?{uid:u}:null),0);return ()=>{authCb=null}},
  signInAnonymously(){const u='u'+Math.random().toString(36).slice(2,10);localStorage.setItem('fakeuid',u);setTimeout(()=>authCb&&authCb({uid:u}),0);return Promise.resolve({user:{uid:u}})}
};
})();
