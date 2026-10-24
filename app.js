(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const enc=new TextEncoder(), dec=new TextDecoder();
const WD=["일","월","화","수","목","금","토"];
const APP={ko:"같이가J",en:"GoTripJ",tag:"함께 짜고, 함께 기록하는 여행"};
const ST={todo:"예정",done:"완료",hold:"보류"};
const CATS={stay:"숙소",sight:"관광",food:"식사",move:"이동",shop:"쇼핑",etc:"기타"};
const PREP={doc:"서류",book:"예약",pack:"짐",etc:"기타"};
const DEFAULT_CK=[["doc","여권·신분증 확인"],["doc","여행자 보험"],["book","항공권 확인"],["book","숙소 예약 확인"],["book","렌터카·교통 예약"],["pack","충전기·어댑터"],["pack","상비약"],["pack","옷·세면도구"],["etc","현지 결제수단 준비"],["etc","출발 전 단체 사진 찍기"]];
const CODE_AB="abcdefghjkmnpqrstuvwxyz23456789";
const newCode=()=>{const a=new Uint32Array(12);crypto.getRandomValues(a);return [...a].map(x=>CODE_AB[x%CODE_AB.length]).join("")};
const fmtCode=c=>String(c||"").replace(/(.{4})(?=.)/g,"$1-");
const normCode=c=>String(c||"").toLowerCase().replace(/[^a-z0-9]/g,"");

const THEMES={teal:{n:"청록",l:["#0E6B78","#D6ECEE"],d:["#4FB3BF","#16363C"]},ocean:{n:"바다",l:["#1F5FAD","#DCE8F7"],d:["#6FA6E8","#152A42"]},sunset:{n:"노을",l:["#C2521F","#FBE3D6"],d:["#F08A5B","#3D2418"]},
  forest:{n:"숲",l:["#2D6A4F","#DCEFE4"],d:["#74C69D","#16322A"]},lavender:{n:"라벤더",l:["#6B4FB5","#E8E1F6"],d:["#A78BEA","#2A2342"]},rose:{n:"로즈",l:["#B23A6B","#F6DEE8"],d:["#EE85B0","#3C1D2C"]},ink:{n:"먹색",l:["#2F3E4A","#E1E7EB"],d:["#B8C7D1","#22303A"]}};
const SWATCH=["#7A4FB5","#2B74B8","#C2521F","#4F6B7C","#B23A73","#7D7F57","#2F8F6B","#C08A12","#D0453B","#1E8A9A","#8A5A3C","#5A5FD0"];
const EMOJIS=["✈️","🚗","🚢","🚆","🏨","🏖️","⛱️","🌊","⛰️","🌲","🏙️","🌃","🌅","🏛️","🎢","🎭","🍽️","☕","🛍️","🎉","🎁","❄️","☀️","❤️"];
const NAVN={google:"Google 지도",waze:"Waze",apple:"Apple 지도"};
const FONTS={normal:1,large:1.12,xl:1.25};
let prefs={appearance:"auto",font:"normal",cats:{},nav:"google",book:"on"};
// 예약 도우미: 제휴 승인이 나면 여기에 파트너 번호만 넣으면 돼요 (화면은 그대로)
const AFF={booking:"",gyg:"",amazon:""};
const hasAff=()=>!!(AFF.booking||AFF.gyg||AFF.amazon);
const bookOn=()=>prefs.book!=="off";
const nextDate=d=>{const x=new Date(d+"T12:00:00");x.setDate(x.getDate()+1);return x.toISOString().slice(0,10)};
function bkURL(kind,o={}){const q=encodeURIComponent;
  if(kind==="stay"){let u=`https://www.booking.com/searchresults.html?ss=${q(o.q||"")}`;if(o.in)u+=`&checkin=${o.in}&checkout=${o.out||nextDate(o.in)}`;if(AFF.booking)u+=`&aid=${q(AFF.booking)}`;return u}
  if(kind==="tour"){let u=`https://www.getyourguide.com/s/?q=${q(o.q||"")}`;if(AFF.gyg)u+=`&partner_id=${q(AFF.gyg)}`;return u}
  if(kind==="shop"){let u=`https://www.amazon.com/s?k=${q(o.q||"")}`;if(AFF.amazon)u+=`&tag=${q(AFF.amazon)}`;return u}
  if(kind==="car")return "https://www.discovercars.com/";
  if(kind==="esim")return "https://www.airalo.com/";return "#"}
try{prefs=Object.assign(prefs,JSON.parse(localStorage.getItem("tripnote:prefs")||"{}"))}catch(e){}
/* ---------- 언어 (한국어 / English) ---------- */
const LANG=(()=>{const p=prefs.lang||"auto";if(p==="ko"||p==="en")return p;return /^ko/i.test(navigator.language||"")?"ko":"en"})();
const HANGUL=/[가-힣]/;let TPATS=null;
function trCore(c){const I=window.I18N;if(!I)return null;if(I.exact[c]!=null)return I.exact[c];
  if(!TPATS)TPATS=I.pats.map(([r,v])=>[new RegExp(r,"s"),v]);
  for(const [rx,v] of TPATS){const mm=rx.exec(c);if(mm)return v.replace(/\{(\d+)\}/g,(_,k)=>{const g=mm[+k+1]||"";return HANGUL.test(g)?tt(g):g})}
  const lp=/^([.,·:]\s*)([\s\S]+)$/.exec(c);if(lp){const r=trCore(lp[2]);if(r!=null)return lp[1]+r}
  const tp=/^([\s\S]+?)(\s*[·:,]\s*)$/.exec(c);if(tp){const r=trCore(tp[1]);if(r!=null)return r+tp[2]}
  if(c.includes(" · ")){const ps=c.split(" · ");let ch=false;const o=ps.map(x=>{if(!HANGUL.test(x))return x;const r=trCore(x.trim());if(r!=null){ch=true;return r}return x});if(ch)return o.filter((x,i)=>x!==""||i<o.length-1).join(" · ")}
  let out=c,ch=false;for(const f of I.frag){if(out.includes(f)){out=out.split(f).join(I.exact[f]);ch=true}}return ch?out:null}
function tt(s){if(LANG!=="en"||!s||!HANGUL.test(s))return s;const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(s);const r=trCore(m[2]);if(r==null)return s;
  return (/^[,.;:!?)]/.test(r)?"":m[1])+r+m[3]}
const NOTR=new Set(["SCRIPT","STYLE","TEXTAREA"]);
function trNode(n){if(n.nodeType===3){const p=n.parentNode;if(!p||NOTR.has(p.nodeName))return;const v=n.nodeValue;if(HANGUL.test(v)){const t=tt(v);if(t!==v)n.nodeValue=t}return}
  if(n.nodeType!==1||n.hasAttribute("data-nt"))return;
  for(const a of ["placeholder","aria-label","title","alt"]){const v=n.getAttribute(a);if(v&&HANGUL.test(v)){const t=tt(v);if(t!==v)n.setAttribute(a,t)}}
  if(NOTR.has(n.nodeName))return;
  for(const c of [...n.childNodes])trNode(c)}
if(LANG==="en"){document.documentElement.lang="en";
  new MutationObserver(ms=>{for(const m of ms){if(m.type==="characterData")trNode(m.target);else m.addedNodes.forEach(trNode)}}).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  if(document.body)trNode(document.body)}
const deepTx=o=>LANG!=="en"?o:typeof o==="string"?tt(o):Array.isArray(o)?o.map(deepTx):o&&typeof o==="object"?Object.fromEntries(Object.entries(o).map(([k,v])=>[k,deepTx(v)])):o;
function savePrefs(){try{localStorage.setItem("tripnote:prefs",JSON.stringify(prefs))}catch(e){}applyTheme()}
const darkMQ=window.matchMedia?matchMedia("(prefers-color-scheme: dark)"):null;
const isDark=()=>prefs.appearance==="dark"||(prefs.appearance!=="light"&&!!darkMQ&&darkMQ.matches);
function applyTheme(){const r=document.documentElement;
  if(prefs.appearance==="auto")r.removeAttribute("data-theme");else r.dataset.theme=prefs.appearance;
  const th=THEMES[T&&T.theme]||THEMES.teal;const dk=isDark();const [a,soft]=dk?th.d:th.l;
  r.style.setProperty("--accent",a);r.style.setProperty("--accent-soft",soft);r.style.setProperty("--accent-ink",dk?"#0D171D":"#FFFFFF");
  Object.keys(CATS).forEach(k=>{const v=prefs.cats&&prefs.cats[k];if(v)r.style.setProperty("--c-"+k,v);else r.style.removeProperty("--c-"+k)});
  r.style.setProperty("--zoom",FONTS[prefs.font]||1);r.dataset.font=prefs.font;
  document.querySelectorAll('meta[name="theme-color"]').forEach(m=>m.setAttribute("content",dk?"#0D171D":a));
}
if(darkMQ&&darkMQ.addEventListener)darkMQ.addEventListener("change",applyTheme);
const CFG=window.FIREBASE_CONFIG||{};
let fs=null, auth=null, myUid=null;
let T=null, L=null, curId=null, curDay=null, view="plan", openEv=null, pf="";
let locals={};
let unsubs=[], pend={}, installEvt=null, needsRender=false;

/* ================= IndexedDB (this phone) ================= */
let _db=null;
function idb(){if(_db)return Promise.resolve(_db);return new Promise((res,rej)=>{const r=indexedDB.open("tripnote-share",2);
  r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains("local"))d.createObjectStore("local",{keyPath:"tid"});if(!d.objectStoreNames.contains("photos"))d.createObjectStore("photos",{keyPath:"id"});if(!d.objectStoreNames.contains("orig"))d.createObjectStore("orig",{keyPath:"id"})};
  r.onsuccess=()=>{_db=r.result;res(_db)};r.onerror=()=>rej(r.error)})}
function tx(store,mode,fn){return idb().then(d=>new Promise((res,rej)=>{const t=d.transaction(store,mode);const r=fn(t.objectStore(store));let out;if(r)r.onsuccess=()=>{out=r.result};t.oncomplete=()=>res(out);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)}))}
const dbAll=s=>tx(s,"readonly",st=>st.getAll());
const dbGet=(s,k)=>tx(s,"readonly",st=>st.get(k));
const dbPut=(s,v)=>tx(s,"readwrite",st=>st.put(v));
const dbDel=(s,k)=>tx(s,"readwrite",st=>st.delete(k));
const dbKeys=s=>tx(s,"readonly",st=>st.getAllKeys());
function newLocal(tid,o){return Object.assign({tid,name:"",start:"",joinedAt:Date.now(),me:"",cover:"",photos:{},receipts:{},priv:{},imported:[]},o||{})}
let localTimer=null;
function putLocal(rec){rec=rec||L;if(!rec)return;locals[rec.tid]=rec;clearTimeout(localTimer);localTimer=setTimeout(()=>flushLocal(),300)}
async function flushLocal(){clearTimeout(localTimer);for(const r of Object.values(locals)){try{await dbPut("local",JSON.parse(JSON.stringify(r)))}catch(e){setStatus("이 폰에 저장하지 못했어요. 저장 공간을 확인해 주세요.")}}}

/* ================= photos (this phone) ================= */
function imgFromBlob(blob){return new Promise((ok,no)=>{const u=URL.createObjectURL(blob);const i=new Image();i.onload=()=>{URL.revokeObjectURL(u);ok(i)};i.onerror=e=>{URL.revokeObjectURL(u);no(e)};i.src=u})}
async function resizeBlob(blob,max,q){
  try{let bmp;try{bmp=await createImageBitmap(blob,{imageOrientation:"from-image"})}catch(e){bmp=await imgFromBlob(blob)}
    const s=Math.min(1,max/Math.max(bmp.width,bmp.height));
    if(s===1&&blob.type==="image/jpeg"&&blob.size<500000){bmp.close&&bmp.close();return blob}
    const c=document.createElement("canvas");c.width=Math.round(bmp.width*s);c.height=Math.round(bmp.height*s);
    c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);bmp.close&&bmp.close();
    return await new Promise(r=>c.toBlob(b=>r(b||blob),"image/jpeg",q||.85))}catch(e){return blob}
}
async function savePhoto(file,max,keepOrig){const blob=await resizeBlob(file,max||1800);const id="ph_"+uid();await dbPut("photos",{id,blob,created:Date.now()});
  if(keepOrig&&file&&file.size)await dbPut("orig",{id,blob:file,name:file.name||(id+".jpg"),type:file.type||"image/jpeg",tid:curId,created:Date.now()}).catch(()=>{});return id}
const IS_IOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const urls=new Map();
async function photoURL(id){if(urls.has(id))return urls.get(id);const r=await dbGet("photos",id).catch(()=>null);if(!r)return null;const u=URL.createObjectURL(r.blob);urls.set(id,u);return u}
function hydrate(){document.querySelectorAll("img[data-ph]:not([data-h])").forEach(async img=>{img.dataset.h="1";const u=await photoURL(img.dataset.ph);if(u)img.src=u;else img.alt="사진을 찾을 수 없어요"})}
let hq=0;new MutationObserver(()=>{cancelAnimationFrame(hq);hq=requestAnimationFrame(hydrate)}).observe(document.body,{childList:true,subtree:true});
const phImg=(id,alt,extra)=>`<img data-ph="${esc(id)}" alt="${esc(alt)}" ${extra||""}>`;
function referenced(){const s=new Set();Object.values(locals).forEach(l=>{if(l.cover)s.add(l.cover);Object.values(l.photos||{}).forEach(a=>a.forEach(p=>s.add(p.id)));Object.values(l.receipts||{}).forEach(id=>id&&s.add(id))});return s}
async function dropPhoto(id){if(!id||referenced().has(id))return;await dbDel("photos",id).catch(()=>{});await dbDel("orig",id).catch(()=>{});const u=urls.get(id);if(u){URL.revokeObjectURL(u);urls.delete(id)}}
async function gc(){try{await flushLocal();const ref=referenced();for(const st of ["photos","orig"]){const keys=await dbKeys(st);for(const k of keys)if(!ref.has(k))await dbDel(st,k)}}catch(e){}}
function pickFiles(multiple,capture,accept){return new Promise(res=>{const i=document.createElement("input");i.type="file";i.accept=accept||"image/*";i.multiple=!!multiple;if(capture)i.setAttribute("capture","environment");
  i.onchange=()=>res([...i.files]);i.style.display="none";document.body.appendChild(i);i.click();setTimeout(()=>i.remove(),60000)})}
const photosOf=evId=>(L&&L.photos[evId])||[];

/* ================= zip (store, no deps) ================= */
const CRC_T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u8){let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=CRC_T[(c^u8[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
async function makeZip(files){
  const d=new Date();const time=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1);const date=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  const parts=[],central=[];let off=0;
  for(const f of files){const nb=enc.encode(f.name);let crc,sz,body;
    if(f.blob){crc=crc32(new Uint8Array(await f.blob.arrayBuffer()));sz=f.blob.size;body=f.blob}else{crc=crc32(f.data);sz=f.data.length;body=f.data}
    const lh=new DataView(new ArrayBuffer(30));lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(10,time,true);lh.setUint16(12,date,true);lh.setUint32(14,crc,true);lh.setUint32(18,sz,true);lh.setUint32(22,sz,true);lh.setUint16(26,nb.length,true);
    parts.push(lh.buffer,nb,body);
    const ch=new DataView(new ArrayBuffer(46));ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(12,time,true);ch.setUint16(14,date,true);ch.setUint32(16,crc,true);ch.setUint32(20,sz,true);ch.setUint32(24,sz,true);ch.setUint16(28,nb.length,true);ch.setUint32(42,off,true);
    central.push(ch.buffer,nb);off+=30+nb.length+sz}
  const cdSize=central.reduce((s,b)=>s+(b.byteLength??b.length),0);
  const end=new DataView(new ArrayBuffer(22));end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,cdSize,true);end.setUint32(16,off,true);
  return new Blob([...parts,...central,end.buffer],{type:"application/zip"});
}
async function readZip(u8){
  const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);let e=-1;
  for(let i=u8.length-22;i>=Math.max(0,u8.length-65557);i--){if(dv.getUint32(i,true)===0x06054b50){e=i;break}}
  if(e<0)throw new Error("zip 파일이 아니에요");
  const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const out=new Map();
  for(let k=0;k<n;k++){if(dv.getUint32(p,true)!==0x02014b50)throw new Error("손상된 파일이에요");
    const method=dv.getUint16(p+10,true),csize=dv.getUint32(p+20,true),nlen=dv.getUint16(p+28,true),xlen=dv.getUint16(p+30,true),clen=dv.getUint16(p+32,true),lho=dv.getUint32(p+42,true);
    const name=dec.decode(u8.subarray(p+46,p+46+nlen));p+=46+nlen+xlen+clen;if(name.endsWith("/"))continue;
    const start=lho+30+dv.getUint16(lho+26,true)+dv.getUint16(lho+28,true);let data=u8.subarray(start,start+csize);
    if(method===8){data=new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer())}
    else if(method!==0)throw new Error("지원하지 않는 압축 방식이에요");
    out.set(name.replace(/^[^/]*\/(?=(backup|manifest)\.json$|photos\/)/,""),data)}
  return out;
}
const fmtSize=b=>b>1048576?(b/1048576).toFixed(1)+" MB":Math.max(1,Math.round(b/1024))+" KB";
function offerFile(out,blob,name,note){
  const file=new File([blob],name,{type:blob.type});
  let canShare=false;try{canShare=!!(navigator.canShare&&navigator.canShare({files:[file]}))}catch(e){}
  out.innerHTML=`<div><b>${esc(name)}</b> · <span class="mono">${fmtSize(blob.size)}</span></div>${note?`<p class="hint">${esc(note)}</p>`:""}
    <div class="row"><button class="btn primary" type="button" data-dl>파일로 저장</button>${canShare?`<button class="btn" type="button" data-sh>공유하기</button>`:""}</div>`;
  out.querySelector("[data-dl]").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},5000);toast("다운로드 폴더(파일 앱)에 저장했어요")};
  if(canShare)out.querySelector("[data-sh]").onclick=()=>navigator.share({files:[file],title:name}).catch(()=>{});
}

/* ================= Firebase ================= */
const ref={
  trip:tid=>FB.doc(fs,"trips",tid||curId),
  col:(c,tid)=>FB.collection(fs,"trips",tid||curId,c),
  d:(c,id,tid)=>FB.doc(fs,"trips",tid||curId,c,id)};
function errMsg(e){const c=e&&e.code||"";if(c.includes("permission"))return "권한이 없어요. 초대 코드를 다시 확인해 주세요.";if(c.includes("resource-exhausted"))return "오늘 무료 사용량을 넘었어요. 내일 다시 동기화돼요.";if(c.includes("unavailable"))return "서버에 연결할 수 없어요. 연결되면 다시 시도해요.";return "저장하지 못했어요"}
let syncErr=null,pendSince=0;
function w(p){return p.catch(e=>{console.error(e);syncErr=errMsg(e);toast(syncErr);updStatus()})}
setInterval(()=>{if(pendSince)updStatus()},15000);
// 보안 규칙은 묶음(batch) 하나에 문서 확인을 20번까지만 허용해요. 하위 문서 쓰기 하나가 2번씩 쓰니 8개씩 나눠 보내요.
// 모든 묶음을 바로 줄 세워 두므로(오프라인이어도) 순서대로 올라가요.
function chunkedBatch(size=8){const parts=[];let b=null,n=0;
  const add=f=>{if(!b||n>=size){b=FB.writeBatch(fs);parts.push(b);n=0}f(b);n++};
  return {set:(r,d,o)=>add(x=>o?x.set(r,d,o):x.set(r,d)),update:(r,d)=>add(x=>x.update(r,d)),delete:r=>add(x=>x.delete(r)),
    commit:()=>Promise.all(parts.map(x=>x.commit()))}}
const clean=o=>JSON.parse(JSON.stringify(o));
const patches={ev:new Map(),trip:{}};let patchTimer=null;
function patchEv(id,obj){patches.ev.set(id,Object.assign(patches.ev.get(id)||{},obj));schedulePatch()}
function patchTrip(obj){Object.assign(patches.trip,obj);schedulePatch()}
function schedulePatch(){clearTimeout(patchTimer);patchTimer=setTimeout(flushPatches,450)}
function flushPatches(){clearTimeout(patchTimer);if(!curId||!fs)return;
  for(const [id,p] of patches.ev)w(FB.setDoc(ref.d("events",id),clean(p),{merge:true}));patches.ev.clear();
  if(Object.keys(patches.trip).length){const p=clean(patches.trip);patches.trip={};p.updatedAt=Date.now();w(FB.updateDoc(ref.trip(),p))}
  flushNotes();
}
function flushAll(){flushPatches();flushLocal()}
document.addEventListener("visibilitychange",()=>{if(document.hidden)flushAll()});
window.addEventListener("pagehide",flushAll);

async function initFirebase(){
  const app=FB.initializeApp(CFG);
  let cache;try{cache=FB.persistentLocalCache({tabManager:FB.persistentMultipleTabManager()})}catch(e){}
  fs=FB.initializeFirestore(app,cache?{localCache:cache,ignoreUndefinedProperties:true}:{ignoreUndefinedProperties:true});
  auth=FB.getAuth(app);
  if(CFG.useEmulator){FB.connectFirestoreEmulator(fs,location.hostname,8080);FB.connectAuthEmulator(auth,`http://${location.hostname}:9099`,{disableWarnings:true})}
  myUid=await new Promise((res,rej)=>{let tried=false;const un=FB.onAuthStateChanged(auth,u=>{if(u){un();res(u.uid)}else if(!tried){tried=true;FB.signInAnonymously(auth).catch(e=>{un();rej(e)})}})});
}
function compose(p){
  const tr=p.trip;const titles=tr.dayTitles||{};
  return {id:tr.id,name:tr.name||"여행",destination:tr.destination||"",start:tr.start,end:tr.end,currency:tr.currency??"$",budget:Number(tr.budget)||0,createdBy:tr.createdBy,example:!!tr.example,owners:tr.owners&&tr.owners.length?tr.owners:[tr.createdBy],viewers:tr.viewers||[],members:tr.members||{},
    theme:tr.theme||"teal",people:tr.people||[],days:(tr.days||[]).map(d=>({id:d.id,date:d.date,title:titles[d.id]||"",emoji:(tr.dayEmoji||{})[d.id]||""})),
    events:p.events.map(e=>({status:"todo",restaurants:[],stops:[],...e,cat:CATS[e.cat]?e.cat:"etc"})),
    expenses:p.expenses,checklist:p.checklist.slice().sort((a,b)=>(a.order||0)-(b.order||0)),notes:p.notes};
}
let tripMissing=false;
function subscribe(tid){
  unsubs.forEach(u=>u());unsubs=[];T=null;pend={};tripMissing=false;
  const parts={trip:null,events:[],expenses:[],checklist:[],notes:[]};
  const onErr=e=>{console.error(e);setStatus(errMsg(e))};
  const meta=(k,m)=>{pend[k]=m.hasPendingWrites;updStatus(m.fromCache)};
  const rebuild=()=>{if(curId!==tid)return;if(!parts.trip){if(tripMissing){T=null;scheduleRender()}return}
    T=compose(parts);applyTheme();const l=locals[tid];if(l&&l.me&&T.members[myUid]!==l.me&&!rebuild.fixed){rebuild.fixed=1;w(FB.updateDoc(ref.trip(tid),{["members."+myUid]:l.me}))}if(l&&(l.name!==T.name||l.start!==T.start)){l.name=T.name;l.start=T.start;putLocal(l);renderTripSel()}scheduleRender()};
  unsubs.push(FB.onSnapshot(ref.trip(tid),{includeMetadataChanges:true},s=>{meta("trip",s.metadata);
    if(s.exists()){parts.trip={id:s.id,...s.data()};tripMissing=false}else{parts.trip=null;tripMissing=!s.metadata.fromCache}rebuild()},onErr));
  ["events","expenses","checklist","notes"].forEach(c=>unsubs.push(FB.onSnapshot(ref.col(c,tid),{includeMetadataChanges:true},s=>{meta(c,s.metadata);parts[c]=s.docs.map(d=>({id:d.id,...d.data()}));rebuild()},onErr)));
}
let lastFromCache=false;
function updStatus(fromCache){if(fromCache!==undefined)lastFromCache=fromCache;if(!fs)return;
  const anyPend=Object.values(pend).some(Boolean);
  if(anyPend&&!pendSince)pendSince=Date.now();if(!anyPend)pendSince=0;
  const stuck=navigator.onLine&&pendSince&&Date.now()-pendSince>90000;
  syncWarn(syncErr?`⚠ 올리지 못한 내용이 있어요 (${syncErr}) 방금 바꾼 내용이 다른 사람에게 안 보일 수 있어요. 앱을 껐다 켠 뒤 다시 확인해 주세요.`
    :stuck?"⚠ 1분 넘게 못 올라간 내용이 있어요. 인터넷이 약하거나 막혀 있어요. 내용은 이 폰에 안전하게 저장돼 있고, 연결되면 자동으로 올라가요.":"");
  setStatus(!navigator.onLine?"오프라인 · 입력한 내용은 폰에 저장되고, 연결되면 자동으로 올라가요":anyPend?"올리는 중…":lastFromCache?"연결 중…":curId?"모두와 동기화됨":"");
  const dot=$("#syncDot");if(dot)dot.dataset.s=syncErr||stuck?"err":!navigator.onLine?"off":anyPend||lastFromCache?"busy":"ok";
}
window.addEventListener("online",()=>updStatus());window.addEventListener("offline",()=>updStatus());
function setStatus(t){$("#saveState").textContent=t}
function syncWarn(t){let el=$("#syncWarn");if(!t){if(el)el.remove();return}
  if(!el){el=document.createElement("div");el.id="syncWarn";el.className="syncwarn";el.setAttribute("role","alert");$(".topbar").appendChild(el)}
  el.innerHTML=`<span>${esc(t)}</span>${syncErr?`<button type="button" class="btn sm" data-act="clearSyncErr">확인</button>`:""}`}
function toastAction(text,label,href){document.querySelectorAll(".toast").forEach(t=>t.remove());const d=document.createElement("div");d.className="toast act";d.innerHTML=`<span>${esc(text)}</span><a href="${href}" target="_blank" rel="noopener">${esc(label)}</a><button type="button" aria-label="닫기">✕</button>`;d.querySelector("button").onclick=()=>d.remove();d.querySelector("a").onclick=()=>setTimeout(()=>d.remove(),300);document.body.appendChild(d);setTimeout(()=>d.remove(),8000)}
function toast(t){document.querySelectorAll(".toast:not(.act)").forEach(x=>x.remove());const d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2800)}

/* ================= notes (shared or private) ================= */
const noteDraft=new Map();let noteTimer=null;
const noteDocId=key=>`${key}~${L.me||"anon"}`;
function myNote(key){const d=noteDraft.get(key);if(d)return {...d};
  const s=T&&T.notes.find(n=>n.id===noteDocId(key));if(s)return {mood:s.mood||"",diary:s.diary||"",shared:true};
  const p=L&&L.priv[key];return {mood:p?.mood||"",diary:p?.diary||"",shared:false}}
function setMyNote(key,patch,now){noteDraft.set(key,{...myNote(key),...patch});clearTimeout(noteTimer);if(now)flushNotes();else noteTimer=setTimeout(flushNotes,600)}
function flushNotes(){clearTimeout(noteTimer);if(!L||!T||!fs)return;
  for(const [key,n] of noteDraft){const sid=noteDocId(key);const exists=T.notes.some(x=>x.id===sid);
    if(n.shared){w(FB.setDoc(ref.d("notes",sid),{key,author:L.me,mood:n.mood||"",diary:n.diary||"",updatedAt:Date.now()},{merge:true}));if(L.priv[key]){delete L.priv[key];putLocal()}}
    else{if(n.mood||n.diary)L.priv[key]={mood:n.mood||"",diary:n.diary||""};else delete L.priv[key];putLocal();if(exists)w(FB.deleteDoc(ref.d("notes",sid)))}}
  noteDraft.clear()}
function otherNotes(key){if(!T)return [];
  const shared=T.notes.filter(n=>n.key===key&&n.author!==L.me&&(n.mood||n.diary)).map(n=>({id:n.id,by:n.author,mood:n.mood,diary:n.diary,reactions:n.reactions||{}}));
  const imp=(L.imported||[]).filter(n=>n.key===key&&!shared.some(s=>s.by===n.by)).map(n=>({...n,imported:true}));
  return [...shared,...imp]}
function myNoteDoc(key){return T&&L.me?T.notes.find(n=>n.id===noteDocId(key)):null}
function allNotes(key){const m=myNote(key);const d=m.shared?myNoteDoc(key):null;const mine=(m.mood||m.diary)?[{by:L.me,mood:m.mood,diary:m.diary,mine:true,shared:m.shared,id:d?.id,reactions:d?.reactions||{}}]:[];return [...mine,...otherNotes(key)]}
const REACTS=["❤️","😂","👍","😮","😢"];
function reactBar(n){if(!n.id)return "";const r=n.reactions||{};
  if(n.mine){const list=Object.entries(r).filter(([,e])=>e);return list.length?`<div class="reacts got">${list.map(([k,e])=>`<span class="rx">${e} ${esc(pName(T,k)||"")}</span>`).join("")}</div>`:""}
  const counts={};Object.values(r).forEach(e=>{if(e)counts[e]=(counts[e]||0)+1});
  return `<div class="reacts">${REACTS.map(e=>`<button type="button" class="rx ${r[L.me]===e?"on":""}" data-act="react" data-id="${esc(n.id)}" data-e="${e}" aria-pressed="${r[L.me]===e}" aria-label="${e} 반응">${e}${counts[e]?`<b>${counts[e]}</b>`:""}</button>`).join("")}</div>`}
const reactText=n=>{const l=Object.entries(n.reactions||{}).filter(([,e])=>e);return l.length?` (반응: ${l.map(([k,e])=>`${pName(T,k)||"누군가"} ${e}`).join(", ")})`:""};

/* ================= helpers ================= */
const todayISO=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const WD_EN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],MO_EN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(iso,long){if(!iso)return "";const d=new Date(iso+"T12:00:00");const m=d.getMonth()+1,dd=d.getDate();
  if(LANG==="en")return long?`${WD_EN[d.getDay()]}, ${MO_EN[m-1]} ${dd}, ${d.getFullYear()}`:`${WD_EN[d.getDay()]} ${m}/${dd}`;
  return long?`${d.getFullYear()}.${String(m).padStart(2,"0")}.${String(dd).padStart(2,"0")} (${WD[d.getDay()]})`:`${m}/${dd} ${WD[d.getDay()]}`}
function daysBetween(a,b){const out=[];const d=new Date(a+"T12:00:00");const e=new Date(b+"T12:00:00");let g=0;while(d<=e&&g<60){out.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);d.setDate(d.getDate()+1);g++}return out}
const evsOf=(t,dayId)=>t.events.filter(e=>e.dayId===dayId).sort((a,b)=>(a.start||"99").localeCompare(b.start||"99"));
const inEv=(e,pid)=>!pid||!e.with||e.with.includes(pid);
const evsVis=(t,dayId)=>evsOf(t,dayId).filter(e=>e.status!=="hold"&&inEv(e,pf));
function setPf(id){pf=id||"";try{localStorage.setItem("tripnote:pf:"+curId,pf)}catch(e){}}
const q=s=>encodeURIComponent(s);
const money=(n,t)=>{t=t||T;const v=Number(n)||0;return (t.currency||"")+v.toLocaleString(undefined,{minimumFractionDigits:v%1?2:0,maximumFractionDigits:2})};
const initial=n=>esc((n||"?").trim().slice(0,1).toUpperCase());
const pName=(t,id)=>(t&&t.people.find(p=>p.id===id)?.name)||"";
const isOwner=()=>!!T&&T.owners.includes(myUid);
const isViewer=()=>!!T&&T.viewers.includes(myUid)&&!isOwner();
function uidsOf(pid){return Object.entries(T.members||{}).filter(([,p])=>p===pid).map(([u])=>u)}
function roleOf(pid){const u=uidsOf(pid);if(!u.length)return "none";if(u.some(x=>T.owners.includes(x)))return "owner";if(u.every(x=>T.viewers.includes(x)))return "viewer";return "editor"}
const ROLE_BADGE={owner:`<i class="role">👑</i>`,viewer:`<i class="role">👀</i>`,editor:"",none:""};
function routeOf(e){return {dest:(e.address||e.place||"").trim(),origin:e.cat==="move"?(e.origin||"").trim():"",stops:e.cat==="move"?(e.stops||[]).map(x=>String(x||"").trim()).filter(Boolean):[]}}
function navURL(app,r,preview){
  if(app==="waze")return `https://waze.com/ul?q=${q(r.dest)}&navigate=yes`;
  if(app==="apple")return `https://maps.apple.com/?daddr=${q(r.dest)}&dirflg=d${r.origin?`&saddr=${q(r.origin)}`:""}`;
  return `https://www.google.com/maps/dir/?api=1&hl=ko&destination=${q(r.dest)}&travelmode=driving${preview?"":"&dir_action=navigate"}${r.origin?`&origin=${q(r.origin)}`:""}${r.stops&&r.stops.length?`&waypoints=${r.stops.map(q).join("%7C")}`:""}`}
function navLinks(e){const r=routeOf(e);if(!r.dest)return `<p class="hint">장소나 주소를 넣으면 내비 버튼이 생겨요.</p>`;const pref=prefs.nav||"google";
  return `<a class="navgo" href="${navURL(pref,r)}" target="_blank" rel="noopener">🚗 ${NAVN[pref]}로 안내 시작</a>
  <a href="${navURL("google",r,true)}" target="_blank" rel="noopener">경로 미리보기</a>
  ${Object.keys(NAVN).filter(k=>k!==pref).map(k=>`<a href="${navURL(k,r)}" target="_blank" rel="noopener">${NAVN[k]}</a>`).join("")}
  ${(r.stops.length||r.origin)&&pref!=="google"?`<p class="hint" style="width:100%">출발지·경유지는 Google 지도에서만 함께 들어가요.</p>`:""}`}
function orderedEvents(t){const di=Object.fromEntries(t.days.map((d,i)=>[d.id,i]));return t.events.filter(e=>e.status!=="hold"&&di[e.dayId]!=null&&inEv(e,pf||(L&&L.me))).sort((a,b)=>(di[a.dayId]-di[b.dayId])||(a.start||"99").localeCompare(b.start||"99"))}
function nextEvent(e){const list=orderedEvents(T);const i=list.findIndex(x=>x.id===e.id);for(let k=i+1;k<list.length;k++){if(list[k].status!=="done"&&routeOf(list[k]).dest)return list[k]}return null}
function goNextHTML(e){const n=nextEvent(e);if(!n)return "";const r=routeOf(n);r.origin="";return `<a class="nextgo" href="${navURL(prefs.nav||"google",r)}" target="_blank" rel="noopener">🚗 다음 장소로 출발 · ${esc(n.title)}${n.dayId!==e.dayId?` <span class="hint">(${fmtDate(T.days.find(d=>d.id===n.dayId)?.date)})</span>`:""}</a>`}
function dayRouteHTML(t,d){const rem=evsOf(t,d.id).filter(e=>inEv(e,pf||(L&&L.me))).filter(e=>e.status==="todo"&&routeOf(e).dest);if(rem.length<2)return "";
  const pts=rem.slice(0,4).map(e=>routeOf(e).dest);const r={dest:pts[pts.length-1],origin:"",stops:pts.slice(0,-1)};
  return `<a class="btn sm dayroute" href="${navURL("google",r,true)}" target="_blank" rel="noopener">🗺 남은 일정 ${pts.length}곳 한 번에 경로</a>`}
function stopsHTML(e){return (e.stops||[]).map((x,i)=>`<div class="addline"><input class="inp" data-stop="${i}" value="${esc(x)}" placeholder="경유지 ${i+1} (주유소, 휴게소 등)"><button type="button" class="btn sm ghost" data-act="rmStop" data-i="${i}" aria-label="경유지 삭제">✕</button></div>`).join("")}
const catPick=(sel,act)=>`<div class="catpick" role="group" aria-label="카테고리">${Object.entries(CATS).map(([k,v])=>`<button type="button" class="cat-${k}" data-act="${act}" data-c="${k}" aria-pressed="${sel===k}">${v}</button>`).join("")}</div>`;
const legend=()=>`<div class="legend">${Object.entries(CATS).map(([k,v])=>`<span class="cat-${k}"><i></i>${v}</span>`).join("")}</div>`;
const visPick=(key,shared)=>`<div class="vis" role="group" aria-label="공개 범위"><button type="button" data-act="vis" data-k="${key}" data-v="0" aria-pressed="${!shared}">🔒 나만 보기</button><button type="button" data-act="vis" data-k="${key}" data-v="1" aria-pressed="${!!shared}">👥 함께 보기</button></div>`;
function confirmTap(b,label){if(b.dataset.confirm==="1")return true;b.dataset.confirm="1";const o=b.textContent;b.textContent=label||"한 번 더 누르면 삭제";setTimeout(()=>{if(b.isConnected){b.dataset.confirm="";b.textContent=o}},3000);return false}
function withNames(t,e){if(!t.people.length)return "";const ids=e.with||t.people.map(p=>p.id);if(ids.length===t.people.length)return t.people.length>1?"모두":"";return ids.map(id=>pName(t,id)).filter(Boolean).join(", ")}
function lastBackupText(){let v=null;try{v=+localStorage.getItem("tripnote:lastBackup")}catch(e){}if(!v)return "아직 없음";const d=Math.floor((Date.now()-v)/864e5);return d<=0?"오늘":d+"일 전"}
const sum=a=>a.reduce((s,x)=>s+(Number(x.amount)||0),0);
const inviteLink=()=>`${location.origin}${location.pathname}#join-${curId}`;

/* ================= rendering ================= */
let rq=0;
function scheduleRender(){cancelAnimationFrame(rq);rq=requestAnimationFrame(()=>{
  const busy=document.querySelector(".modal")||openEv||document.activeElement?.matches?.("#app input,#app textarea,#app select");
  if(busy){needsRender=true;renderTripSel();refreshDrawerOthers();return}needsRender=false;render()})}
document.addEventListener("focusout",()=>{if(needsRender)setTimeout(()=>{if(!document.activeElement?.matches?.("input,textarea,select"))scheduleRender()},50)});
function applyBrand(){const nm=LANG==="en"?APP.en:APP.ko;const b=document.querySelector(".brand");if(b&&!b.dataset.n){b.dataset.n=1;b.lastChild.textContent=nm}document.title=nm}
function render(){applyBrand();
  renderTripSel();updStatus();applyTheme();document.body.classList.toggle("ro",isViewer());document.body.classList.toggle("owner",isOwner());
  const app=$("#app");
  if(!curId){app.innerHTML=`<section class="welcome">
    <div class="w-hero"><img src="icons/icon-192.png" alt="" width="72" height="72"><div><h1>${LANG==="en"?APP.en:APP.ko}</h1><p>${APP.tag}</p></div></div>
    <ol class="w-steps">
      <li><span class="w-ico">🗓️</span><div><b>일정은 쉽게</b><p>날짜별로 직접 넣거나, Claude에게 짜 달라고 한 일정을 붙여넣으면 한 번에 들어가요. 못 간 곳은 보류함에 모아 뒀다가 시간 날 때 다시 넣어요.</p></div></li>
      <li><span class="w-ico">👨‍👩‍👧</span><div><b>같이 쓰는 여행</b><p>초대 링크 하나로 가족, 친구가 들어와요. 일정, 예산, 체크리스트를 함께 고치고, 아이 일정처럼 사람마다 다른 일정도 따로 둘 수 있어요. 배 위처럼 인터넷이 없어도 돼요.</p></div></li>
      <li><span class="w-ico">📖</span><div><b>추억은 사진첩으로</b><p>일정마다 사진과 한 줄을 남기면, 여행이 끝난 뒤 사진첩 PDF가 만들어져요. 커플 Her·His 사진첩과 롤링페이퍼도 있어요.</p></div></li>
    </ol>
    <div class="w-cta"><button class="btn primary" data-act="newTrip">+ 새 여행 만들기</button><button class="btn" data-act="join">초대 코드로 참여</button></div>
    <div class="row" style="justify-content:center"><button class="btn ghost sm" data-act="loadExample">예시로 둘러보기</button><button class="btn ghost sm" data-act="settings">백업 불러오기</button></div>
    <p class="w-foot">회원가입 없음 · 광고 없음 · 사진은 내 폰에만<br><a href="privacy.html">개인정보 처리방침</a> · <a href="terms.html">이용약관</a></p>
  </section>`;return}
  if(!T){app.innerHTML=tripMissing?`<div class="empty"><h2>이 여행을 찾을 수 없어요</h2><p>여행을 만든 사람이 삭제했거나 코드가 바뀌었어요. 이 폰의 백업 파일이 있으면 다시 만들 수 있어요.</p><div class="row"><button class="btn" data-act="settings">백업에서 다시 만들기</button><button class="btn danger" data-act="leave">목록에서 지우기</button></div></div>`
    :`<div class="empty"><h2>불러오는 중…</h2><p>${navigator.onLine?"잠시만 기다려 주세요.":"오프라인이에요. 이 폰에서 한 번도 열지 않은 여행은 인터넷이 연결되어야 보여요."}</p></div>`;return}
  const t=T;
  if(!curDay||(curDay!=="hold"&&!t.days.find(d=>d.id===curDay))){const td=t.days.find(d=>d.date===todayISO());curDay=(td||t.days[0])?.id}
  const total=t.events.length,done=t.events.filter(e=>e.status==="done").length,hold=t.events.filter(e=>e.status==="hold").length;
  const pct=total?Math.round(done/total*100):0;
  app.innerHTML=`
  <section class="pass">
    <div class="pass-main">
      <span class="eyebrow">${esc(t.destination||"여행")}${t.example?" · 예시":""}</span>
      <h1>${esc(t.name)}</h1>
      <div class="pass-meta">
        <div><span class="eyebrow">출발</span><b>${fmtDate(t.start,true)}</b></div>
        <div><span class="eyebrow">도착</span><b>${fmtDate(t.end,true)}</b></div>
        <div><span class="eyebrow">지출</span><b>${money(sum(t.expenses),t)}</b></div>
        ${t.people.length?`<div><span class="eyebrow">함께 ${t.people.length}명</span><span class="avatars" title="${esc(t.people.map(p=>p.name).join(", "))}">${t.people.slice(0,6).map(p=>`<b class="${p.id===L.me?"me":""}">${initial(p.name)}</b>`).join("")}</span></div>`:""}
      </div>
    </div>
    <div class="pass-stub">
      <span class="eyebrow">일정 완료</span><span class="pct">${pct}%</span>
      <div class="bar" title="완료 ${done} · 보류 ${hold}"><span style="width:${total?done/total*100:0}%;background:var(--done)"></span><span style="width:${total?hold/total*100:0}%;background:var(--hold)"></span></div>
    </div>
  </section>
  ${isViewer()?`<div class="notice"><span>👀 보기 전용으로 참여 중이에요. 일정과 예산은 볼 수만 있고, 내 기록·사진·반응은 남길 수 있어요.</span></div>`:""}
  ${!L.me?`<div class="notice"><span>이 폰을 쓰는 사람이 누구인지 정해 주세요. 기록과 지출에 이름이 붙어요.</span><button class="btn sm primary" data-act="whoami">선택하기</button></div>`:""}
  <div class="row" style="justify-content:space-between;margin-top:14px">
    <div class="seg" role="group" aria-label="보기">
      ${[["prep","준비"],["plan","일정"],["budget","예산"],["journal","여행기"]].map(([k,v])=>`<button data-act="view" data-v="${k}" aria-pressed="${view===k}">${v}</button>`).join("")}
    </div>
    <button class="btn sm ghost" data-act="editTrip">여행 정보 수정</button>
  </div>
  ${view==="plan"?planHTML(t):view==="prep"?prepHTML(t):view==="budget"?budgetHTML(t):journalHTML(t)}`;
}
function renderTripSel(){
  const s=$("#tripSel");const list=Object.values(locals).sort((a,b)=>(a.start||"").localeCompare(b.start||""));
  s.innerHTML=list.length?list.map(l=>`<option value="${l.tid}" ${l.tid===curId?"selected":""}>${esc(l.name||"여행")}</option>`).join(""):`<option>여행 없음</option>`;
  s.disabled=!list.length;
}

const hhmm=m=>{m=Math.max(0,Math.min(23*60+59,m));return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0")};
function renamePersonModal(id){const t=T;const p=t.people.find(x=>x.id===id);if(!p)return;
  if(isViewer()&&id!==L.me){toast("보기 전용은 내 이름만 바꿀 수 있어요");return}
  const m=modal(`<form class="card"><h3>이름 바꾸기</h3><div class="field"><label for="rn-in">이름</label><input class="inp" id="rn-in" value="${esc(p.name)}" maxlength="20" autocomplete="off"></div>
    <p class="hint">바꾼 이름은 모두에게 보여요. 일정의 "누구 일정", 기록, 지출에 붙은 이름도 함께 바뀌어요.</p>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">취소</button><button class="btn primary">저장</button></div></form>`);
  const inp=m.querySelector("#rn-in");setTimeout(()=>{inp.focus();inp.select()},50);
  m.querySelector("form").addEventListener("submit",ev=>{ev.preventDefault();const name=inp.value.trim();if(!name){inp.focus();return}
    if(t.people.some(x=>x.id!==id&&x.name===name)){toast("같은 이름이 이미 있어요");return}
    const people=t.people.map(x=>x.id===id?{...x,name}:x);t.people=people;w(FB.updateDoc(ref.trip(),{people,updatedAt:Date.now()}));closeModalEl(m);render();toast("이름을 바꿨어요")})}
function unholdModal(id){const t=T;const e=t.events.find(x=>x.id===id);if(!e)return;
  const today=t.days.find(d=>d.date===todayISO());const nowM=Math.ceil((new Date().getHours()*60+new Date().getMinutes())/5)*5;
  const st=toMin(e.start),en=toMin(e.end);const dur=st!=null&&en!=null&&en>st?en-st:null;
  const defDay=today?today.id:(t.days.some(d=>d.id===e.dayId)?e.dayId:t.days[0].id);const defStart=today?hhmm(nowM):(e.start||"");
  const orig=t.days.find(d=>d.id===e.dayId);const oi=t.days.indexOf(orig);
  const m=modal(`<form class="card"><h3>📅 언제 갈까요?</h3><p class="hint">${esc(e.title)}</p>
    ${today?`<button type="button" class="btn" data-q="now">지금 바로 (오늘 ${hhmm(nowM)})</button>`:""}
    ${orig&&e.start?`<button type="button" class="btn" data-q="orig">원래 자리 (Day ${oi+1} ${esc(e.start)})</button>`:""}
    <div class="grid2"><div class="field"><label for="u-day">날짜</label><select class="inp" id="u-day">${t.days.map((d,i)=>`<option value="${d.id}" ${d.id===defDay?"selected":""}>Day ${i+1} · ${fmtDate(d.date)}${d.date===todayISO()?" (오늘)":""}</option>`).join("")}</select></div>
    <div class="field"><label for="u-start">시작 시간</label><input class="inp mono" id="u-start" type="time" value="${esc(defStart)}"></div></div>
    ${dur?`<p class="hint">끝나는 시간은 원래 길이(${dur}분)에 맞춰 정해져요.</p>`:""}
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">취소</button><button class="btn primary">일정에 넣기</button></div></form>`);
  const put=(dayId,start)=>{const s2=toMin(start);const end=s2!=null&&dur?hhmm(s2+dur):(s2!=null?"":e.end||"");
    const o={status:"todo",dayId,start:start||"",end};Object.assign(e,o);patchEv(e.id,o);flushPatches();closeModalEl(m);
    if(openEv===e.id)closeDrawer();curDay=dayId;render();const i=t.days.findIndex(d=>d.id===dayId);toast(`Day ${i+1}${start?" "+start:""}에 넣었어요`)};
  m.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>b.dataset.q==="now"?put(today.id,hhmm(nowM)):put(e.dayId,e.start));
  m.querySelector("form").addEventListener("submit",ev=>{ev.preventDefault();put(m.querySelector("#u-day").value,m.querySelector("#u-start").value)});
}
function planHTML(t){
  const holdEvs=t.events.filter(e=>e.status==="hold"&&inEv(e,pf));
  if(pf&&!t.people.some(p=>p.id===pf))pf="";
  const tabs=t.days.map((d,i)=>{const ev=evsVis(t,d.id);return `<button class="tab" role="tab" aria-selected="${curDay===d.id}" data-act="day" data-id="${d.id}">
    <span class="d">${fmtDate(d.date)}${d.date===todayISO()?" · 오늘":""}</span><span class="n">${d.emoji?d.emoji+" ":""}Day ${i+1}</span>
    <span class="dots">${ev.slice(0,10).map(e=>`<i class="${e.status}"></i>`).join("")}</span></button>`}).join("")
    +`<button class="tab holdbox" role="tab" aria-selected="${curDay==="hold"}" data-act="day" data-id="hold"><span class="d">모아보기</span><span class="n">보류 ${holdEvs.length}</span><span class="dots"></span></button>`;
  let body;
  if(curDay==="hold"){
    body=`<div class="dayhead"><div><span class="eyebrow">보류함</span><h2>보류한 일정</h2></div></div>
    <p class="hint">보류한 일정은 날짜별 일정에서 빠져 여기 모여요. 시간이 남으면 골라서 <b>📅 일정에 넣기</b>를 누르세요. 원하는 날, 원하는 시간으로 다시 들어가요.</p>
    <div class="timeline">${holdEvs.length?holdEvs.map(e=>evHTML(e,true)).join(""):`<div class="empty"><p>보류한 일정이 없어요.</p></div>`}</div>`;
  }else{
    const d=t.days.find(x=>x.id===curDay);const idx=t.days.indexOf(d);const ev=evsVis(t,d.id);
    const daySpent=sum(t.expenses.filter(x=>x.dayId===d.id));
    body=`<div class="dayhead"><div style="flex:1;min-width:0"><span class="eyebrow">Day ${idx+1} · ${fmtDate(d.date,true)}${daySpent?` · 지출 ${money(daySpent,t)}`:""}</span>
      <div class="titlerow"><button type="button" class="emo" data-act="dayEmoji" aria-label="이날 이모지">${d.emoji||"＋"}</button><input id="dayTitle" aria-label="이날 제목" placeholder="이날의 테마 (예: 시내 걷기)" value="${esc(d.title||"")}"></div>
      ${dayRouteHTML(t,d)}</div></div>
      <div class="timeline">${timelineHTML(ev)||(pf?`<div class="empty"><p>${esc(pName(t,pf))} 일정이 이날은 없어요.</p></div>`:"")}
      <button class="add-ev" data-act="addEv">+ 이 날에 일정 추가${pf?` (${esc(pName(t,pf))})`:""}</button></div>`;
  }
  const pfRow=t.people.length>1?`<div class="pfilter" role="group" aria-label="누구 일정 보기"><span class="hint">보기</span><button type="button" data-act="pf" data-id="" aria-pressed="${!pf}">모두</button>${t.people.map(p=>`<button type="button" data-act="pf" data-id="${p.id}" aria-pressed="${pf===p.id}"><b>${initial(p.name)}</b>${esc(p.name)}${p.id===L.me?" (나)":""}</button>`).join("")}</div>`:"";
  return `<nav class="tabs" role="tablist" aria-label="날짜">${tabs}</nav>${pfRow}${legend()}${body}`;
}
const toMin=t=>{const m=/^(\d{1,2}):(\d{2})/.exec(t||"");return m?(+m[1])*60+(+m[2]):null};
function timelineHTML(ev){
  const groups=[];let cur=null,curEnd=-1;
  ev.forEach(e=>{const st=toMin(e.start);let en=toMin(e.end);if(st==null){groups.push([e]);cur=null;return}if(en==null||en<=st)en=st+60;
    if(cur&&st<curEnd){cur.push(e);curEnd=Math.max(curEnd,en)}else{cur=[e];groups.push(cur);curEnd=en}});
  return groups.map(g=>g.length<2?evHTML(g[0]):`<div class="par"><div class="par-head">⏱ ${esc(g[0].start)} 같은 시간 · ${g.length}개 일정</div>${g.map(e=>evHTML(e)).join("")}</div>`).join("")}
function evHTML(e,showDay){
  const t=T;const day=t.days.find(d=>d.id===e.dayId);
  const tags=[];const nr=(e.restaurants||[]).length,np=photosOf(e.id).length,nn=allNotes("ev-"+e.id).length;
  if(nr)tags.push(`맛집 ${nr}`);if(np)tags.push(`사진 ${np}`);if(nn)tags.push(`기록 ${nn}`);
  const ex=sum(t.expenses.filter(x=>x.evId===e.id));if(ex)tags.push(money(ex,t));
  if(showDay&&day)tags.unshift(fmtDate(day.date));
  return `<article class="ev ${e.status} cat-${e.cat}">
    <div class="ev-time"><b>${esc(e.start||"--:--")}</b><span>${e.end?"~ "+esc(e.end):""}</span></div>
    <div class="ev-body">
      <div class="ev-top"><button class="ev-title" data-act="open" data-id="${e.id}">${esc(e.title||"제목 없음")}</button><span class="chip ${e.status}">${ST[e.status]}</span></div>
      ${e.place?`<div class="ev-place">${esc(e.place)}</div>`:""}
      <div class="ev-tags"><span class="cchip cat-${e.cat}">${CATS[e.cat]}</span>${e.with&&t.people.length&&e.with.length<t.people.length?`<span class="who">👤 ${esc(e.with.map(id=>pName(t,id)).filter(Boolean).join(", ")||"정하지 않음")}</span>`:""}${tags.map(x=>`<span>${esc(x)}</span>`).join("")}</div>
      <div class="ev-actions">${e.status==="hold"?`
        <button class="st-btn primary" data-act="unhold" data-id="${e.id}">📅 일정에 넣기</button>`:`
        <button class="st-btn done" aria-pressed="${e.status==="done"}" data-act="status" data-s="done" data-id="${e.id}">✓ 완료</button>
        <button class="st-btn hold" aria-pressed="false" data-act="status" data-s="hold" data-id="${e.id}">보류</button>`}
        <button class="st-btn" data-act="open" data-id="${e.id}">상세 · 기록</button>
        ${evBookHTML(e,day)}
        ${routeOf(e).dest&&e.status!=="done"?`<a class="st-btn go" href="${navURL(prefs.nav||"google",routeOf(e))}" target="_blank" rel="noopener">🚗 가기</a>`:""}
      </div>
      ${e.status==="done"?goNextHTML(e):""}
    </div></article>`;
}

function evBookHTML(e,day){if(!bookOn()||e.status==="done")return "";const t=T;
  if(e.cat==="stay"&&day&&!/체크\s*아웃|check.?out/i.test(e.title||""))return `<a class="st-btn bk" href="${bkURL("stay",{q:e.place||e.title||t.destination,in:day.date})}" target="_blank" rel="noopener">🏨 <span>숙소 예약</span></a>`;
  if(e.cat==="sight")return `<a class="st-btn bk" href="${bkURL("tour",{q:[e.place||e.title,t.destination].filter(Boolean).join(" ")})}" target="_blank" rel="noopener">🎟 <span>투어·티켓</span></a>`;
  return ""}
function bookCardHTML(t){if(!bookOn())return "";const dest=t.destination||t.name||"";
  const L2=[["🏨","숙소 찾기",bkURL("stay",{q:dest,in:t.start,out:t.end&&t.end>t.start?t.end:null})],["🎟","투어 찾기",bkURL("tour",{q:dest})],["🚙","렌터카",bkURL("car")],["📶","eSIM",bkURL("esim")]];
  return `<div class="card bookhelp"><h3>예약 도우미 <span class="hint">${esc(dest)} · 여행 날짜로 바로 검색해요</span></h3>
    <div class="bklinks">${L2.map(([i,n,u])=>`<a href="${u}" target="_blank" rel="noopener"><span>${i}</span>${n}</a>`).join("")}</div>
    <p class="hint">${hasAff()?"일부는 제휴 링크예요. 이 링크로 예약하면 같이가J가 수수료를 받을 수 있어요. 가격은 똑같아요.":"검색 결과로 바로 연결돼요. 같이가J는 이 링크로 돈을 받지 않아요."} 꾸미기에서 숨길 수 있어요.</p></div>`}
function prepHTML(t){
  const ck=t.checklist,n=ck.filter(c=>c.done).length;
  const groups=Object.entries(PREP).map(([k,v])=>{const items=ck.filter(c=>c.cat===k);if(!items.length)return "";
    return `<div class="ck-group"><span class="eyebrow" style="margin-top:6px">${v}</span>${items.map(c=>`<label class="ck ${c.done?"on":""}"><input type="checkbox" data-act="ck" data-id="${c.id}" ${c.done?"checked":""}><span class="txt">${esc(c.text)}</span>${bookOn()&&c.cat==="pack"&&!c.done?`<a class="buy" href="${bkURL("shop",{q:c.text})}" target="_blank" rel="noopener" aria-label="사러 가기">🛒</a>`:""}<button type="button" class="x" data-act="rmCk" data-id="${c.id}" aria-label="항목 삭제">✕</button></label>`).join("")}</div>`}).join("");
  return `<div style="display:flex;flex-direction:column;gap:14px;margin-top:16px">
    <div class="card invite">
      <h3>함께 갈 사람 초대 <span class="hint">코드를 아는 사람만 들어올 수 있어요</span></h3>
      <div class="code mono" aria-label="초대 코드">${esc(fmtCode(curId))}</div>
      <div class="row"><button class="btn sm primary" data-act="shareInvite">초대 링크 보내기</button><button class="btn sm" data-act="copyCode">코드 복사</button></div>
      <p class="hint">받은 사람은 링크를 열어 앱을 설치하고, 자기 이름을 고르면 돼요.</p>
    </div>
    <div class="card">
      <h3>함께하는 사람 <span class="hint">${t.people.length}명</span></h3>
      <div class="people">${t.people.map(p=>`<span class="pchip ${p.id===L.me?"is-me":""}"><button type="button" class="pname" data-act="renamePerson" data-id="${p.id}" aria-label="${esc(p.name)} 이름 바꾸기"><b>${initial(p.name)}</b>${esc(p.name)}${p.id===L.me?" (나)":""}</button>${ROLE_BADGE[roleOf(p.id)]}<button data-act="rmPerson" data-id="${p.id}" aria-label="${esc(p.name)} 빼기">✕</button></span>`).join("")||`<span class="hint">아직 없어요.</span>`}</div>
      <p class="hint">👑 주인 · 👀 보기 전용 · 표시 없음 = 참가자 (일정·예산을 함께 고칠 수 있어요)<br>이름을 누르면 바꾸고, ✕를 두 번 누르면 빼요 (빼기는 주인만)</p>
      ${isOwner()?`<button class="btn sm" data-act="roles" style="align-self:flex-start">역할 관리 · 주인 넘기기</button>`:""}
      <form class="addline" id="personForm"><input class="inp" id="personIn" placeholder="이름 (예: 엄마, 지훈)" autocomplete="off"><button class="btn">추가</button></form>
      <div class="row"><span class="hint">이 폰 사용자: <b>${esc(pName(t,L.me)||"정하지 않음")}</b></span><button class="btn sm ghost" data-act="whoami">바꾸기</button></div>
    </div>
    <div class="card">
      <h3>출발 전 단체 사진 <span class="hint">여행기 표지가 돼요 · 이 폰에 저장</span></h3>
      <button type="button" class="cover-pick" data-act="pickCover">${L.cover?phImg(L.cover,"단체 사진"):""}<span>${L.cover?"사진 바꾸기":"+ 갤러리에서 고르기"}</span></button>
    </div>
    ${bookCardHTML(t)}
    <div class="card">
      <h3>준비 체크리스트 <span class="hint mono">${n}/${ck.length} 완료 · 함께 보기</span></h3>
      <div class="bar" style="width:100%"><span style="width:${ck.length?n/ck.length*100:0}%;background:var(--accent)"></span></div>
      ${groups||`<p class="hint">항목을 추가해 보세요.</p>`}
      <form id="ckForm" style="display:grid;grid-template-columns:84px 1fr auto;gap:6px;margin-top:6px">
        <select class="inp" id="ckCat" aria-label="분류">${Object.entries(PREP).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select>
        <input class="inp" id="ckIn" placeholder="준비할 것" autocomplete="off"><button class="btn">추가</button></form>
    </div></div>`;
}

function rcCell(x){const rid=L.receipts[x.id];
  if(rid)return `<button class="rc" data-act="zoom" data-ph="${esc(rid)}" aria-label="영수증 보기">${phImg(rid,"영수증",'loading="lazy"')}</button>`;
  if(x.receiptBy&&x.receiptBy!==L.me)return `<button class="rc" data-act="editExp" data-id="${x.id}" aria-label="영수증">영수증<br>${esc(pName(T,x.receiptBy)||"다른 폰")}</button>`;
  return `<button class="rc" data-act="editExp" data-id="${x.id}" aria-label="영수증 추가">영수증<br>없음</button>`}
function budgetHTML(t){
  const ex=t.expenses,spent=sum(ex),bud=Number(t.budget)||0,left=bud-spent;
  const byCat=Object.keys(CATS).map(k=>[k,sum(ex.filter(x=>x.cat===k))]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
  const maxCat=Math.max(1,...byCat.map(x=>x[1]));
  const byP=t.people.map(p=>[p,sum(ex.filter(x=>x.paidBy===p.id))]);
  const share=t.people.length?spent/t.people.length:0;
  const list=[...t.days.map(d=>d.id),""].map(did=>{const items=ex.filter(x=>(x.dayId||"")===did).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));if(!items.length)return "";const d=t.days.find(x=>x.id===did);
    return `<div class="exp-day">${d?`Day ${t.days.indexOf(d)+1} · ${fmtDate(d.date)}`:"날짜 미지정"} · ${money(sum(items),t)}</div>`+items.map(x=>`<div class="exp cat-${x.cat}">
      ${rcCell(x)}
      <div style="min-width:0"><div class="t">${esc(x.title||CATS[x.cat])}</div><div class="m"><span class="cchip cat-${x.cat}">${CATS[x.cat]}</span>${x.paidBy?`<span>${esc(pName(t,x.paidBy))} 결제</span>`:""}${x.memo?`<span>${esc(x.memo)}</span>`:""}</div></div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><span class="a">${money(x.amount,t)}</span><button class="btn sm ghost" data-act="editExp" data-id="${x.id}">수정</button></div></div>`).join("")}).join("");
  return `<div style="display:flex;flex-direction:column;gap:14px;margin-top:16px">
    <div class="sumgrid">
      <div class="stat"><span class="eyebrow">총 예산</span><div class="row" style="flex-wrap:nowrap;gap:4px"><input class="inp mono" id="curIn" value="${esc(t.currency)}" style="width:44px;text-align:center" aria-label="통화 기호"><input class="inp mono" id="budgetIn" inputmode="decimal" value="${bud||""}" placeholder="0" aria-label="총 예산"></div></div>
      <div class="stat"><span class="eyebrow">사용</span><b>${money(spent,t)}</b></div>
      <div class="stat ${bud&&left<0?"over":""}"><span class="eyebrow">${bud&&left<0?"초과":"남음"}</span><b>${bud?money(Math.abs(left),t):"—"}</b></div>
    </div>
    <div class="card">
      <h3>카테고리별 <span class="hint">${ex.length}건 · 함께 보기</span></h3>
      ${byCat.length?`<div class="stack">${byCat.map(([k,v])=>`<span class="cat-${k}" style="width:${v/spent*100}%" title="${CATS[k]} ${money(v,t)}"></span>`).join("")}</div>
      <div class="catbars">${byCat.map(([k,v])=>`<div class="cbar cat-${k}"><span>${CATS[k]}</span><div class="track"><span style="width:${v/maxCat*100}%"></span></div><span class="amt">${money(v,t)}</span></div>`).join("")}</div>`:`<p class="hint">지출을 추가하면 카테고리별로 모여요.</p>`}
    </div>
    ${t.people.length?`<div class="card"><h3>누가 냈나 <span class="hint mono">1인당 ${money(share,t)}</span></h3>
      <div class="catbars">${byP.map(([p,v])=>{const diff=v-share;return `<div class="cbar" style="grid-template-columns:72px 1fr auto"><span>${esc(p.name)}</span><span class="mono">${money(v,t)}</span><span class="amt" style="color:${Math.abs(diff)<0.01?"var(--muted)":diff>0?"var(--done)":"var(--hold)"}">${Math.abs(diff)<0.01?"정산 완료":diff>0?"받을 돈 "+money(diff,t):"낼 돈 "+money(-diff,t)}</span></div>`}).join("")}</div>
      <p class="hint">모두 똑같이 나눈다고 가정한 계산이에요. 결제한 사람이 지정된 지출만 합산합니다.</p></div>`:""}
    <div class="row" style="justify-content:space-between"><h2 style="font-size:18px">지출 내역</h2><button class="btn primary" data-act="addExp">+ 지출 추가</button></div>
    <div style="display:flex;flex-direction:column;gap:8px">${list||`<div class="empty"><p>영수증을 찍어 두고 금액만 입력하면, 모두의 지출이 카테고리별·사람별로 정리돼요. 영수증 사진은 찍은 사람 폰에만 저장돼요.</p><button class="btn primary" data-act="addExp">+ 첫 지출 추가</button></div>`}</div>
  </div>`;
}

function noteBlock(n){const nm=n.mine?"나":(pName(T,n.by)||"누군가");return `<div class="onote ${n.mine?"mine":""}"><div class="by"><b>${esc(nm)}</b>${n.mine?` <span class="hint">${n.shared?"👥 함께 보기":"🔒 나만 보기"}</span>`:""}${n.mood?` <span class="badge">${esc(n.mood)}</span>`:""}</div>${n.diary?`<p>${esc(n.diary)}</p>`:""}${reactBar(n)}</div>`}
function photoStrip(list,alt){return list.length?`<div class="jphotos">${list.map(p=>`<figure>${phImg(p.id,alt,'loading="lazy" data-act="zoom"')}${p.by&&p.by!==L.me?`<figcaption>${esc(pName(T,p.by)||"")}</figcaption>`:""}</figure>`).join("")}</div>`:""}
function journalHTML(t){
  const cover=`<section class="jcover">${L.cover?phImg(L.cover,t.name+" 단체 사진"):""}<div class="veil"></div>
    <div class="txt"><span class="eyebrow" style="color:#fff;opacity:.85">${esc(t.destination||"여행기")}</span><h1>${esc(t.name)}</h1>
    <span class="sub">${fmtDate(t.start,true)} — ${fmtDate(t.end,true)}</span>
    ${t.people.length?`<span>${esc(t.people.map(p=>p.name).join(" · "))}</span>`:""}
    ${!L.cover?`<button class="btn sm" data-act="pickCover" style="align-self:flex-start;margin-top:6px;color:var(--ink)">+ 표지 사진 올리기</button>`:""}</div></section>`;
  const days=t.days.map((d,i)=>{
    const ev=evsOf(t,d.id).filter(e=>e.status==="done");const dn=allNotes("day-"+d.id);
    if(!ev.length&&!dn.length)return "";
    return `<section class="jday">
      <div><span class="eyebrow">Day ${i+1} · ${fmtDate(d.date,true)}</span><h2>${d.emoji?d.emoji+" ":""}${esc(d.title||"Day "+(i+1))}</h2></div>
      ${dn.map(noteBlock).join("")}
      ${ev.map(e=>{const w=withNames(t,e);const ns=allNotes("ev-"+e.id);return `<div class="jentry"><span class="t">${esc(e.start||"")}</span><div style="min-width:0">
        <h3>${esc(e.title)} <span class="cchip cat-${e.cat}">${CATS[e.cat]}</span></h3>
        ${e.place||w?`<div class="ev-place">${esc(e.place||"")}${e.place&&w?" · ":""}${w?"함께: "+esc(w):""}</div>`:""}
        ${ns.map(noteBlock).join("")}
        ${photoStrip(photosOf(e.id),e.title+" 사진")}
      </div></div>`}).join("")}
      <div class="row"><button class="btn sm ghost" data-act="editJournal" data-id="${d.id}">${myNote("day-"+d.id).diary?"내 하루 글 고치기":"내 하루 글 쓰기"}</button></div>
    </section>`}).join("");
  return `<div class="journal-list">${cover}
    ${t.people.length>=2?letterCard(t):""}
    <div class="card"><h3>여행기 완성하기</h3><p class="hint">1) 여행이 끝나면 각자 ⋯ → '내 사진 보내기'로 파일을 만들어 한 사람에게 보내요. 2) 받은 사람은 '사진 합치기'로 모아요. 3) '여행기용 내보내기' 파일을 Claude 채팅에 올리고 "여행기 만들어줘"라고 하면 됩니다.</p><div class="row"><button class="btn sm primary" data-act="photobook">📖 사진첩 만들기</button><button class="btn sm" data-act="settings">사진 모으기 · 내보내기</button></div></div>
    ${days||`<div class="empty"><span class="eyebrow">여행기</span><h2>완료한 일정이 여기 쌓여요</h2><p>일정을 완료로 넘기고 상세 화면에서 기록과 사진을 남기면, 날짜별 여행기로 정리됩니다. '함께 보기'로 남긴 기록은 다른 사람 여행기에도 보여요.</p></div>`}</div>`;
}

/* ================= photobook (사진첩 PDF · 페이지 사진) ================= */
const PB_FONT='system-ui,-apple-system,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
async function pbImage(id,useOrig){let r=null;if(useOrig)r=await dbGet("orig",id).catch(()=>null);if(!r)r=await dbGet("photos",id).catch(()=>null);if(!r||!r.blob)return null;
  try{return await createImageBitmap(r.blob,{imageOrientation:"from-image"})}catch(e){try{return await imgFromBlob(r.blob)}catch(e2){return null}}}
const phCap=id=>{if(!L)return "";for(const l of Object.values(L.photos||{})){const p=l.find(q=>q.id===id);if(p)return p.cap||""}return ""};
function pbCap(ctx,txt,x,y,w,h,u,font){if(!txt)return;font(Math.min(3,w/(18*u)*3),600);const lines=pbLines(ctx,txt,w-4*u,2);const lh=parseFloat(ctx.font.match(/(\d+)px/)[1])*1.3;
  const bh=lines.length*lh+3*u;const g=ctx.createLinearGradient(0,y+h-bh-4*u,0,y+h);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.62)");
  ctx.fillStyle=g;ctx.fillRect(x,y+h-bh-4*u,w,bh+4*u);ctx.fillStyle="#fff";lines.forEach((l,k)=>ctx.fillText(l,x+2*u,y+h-bh+1.5*u+k*lh))}
function pbFill(ctx,img,x,y,w,h){const iw=img.width,ih=img.height;const s=Math.max(w/iw,h/ih);const sw=w/s,sh=h/s;ctx.drawImage(img,(iw-sw)/2,(ih-sh)/2,sw,sh,x,y,w,h)}
function pbLines(ctx,text,maxW,maxLines){const out=[];
  for(const para of String(text||"").split("\n")){let line="";
    for(const tok of para.split(/(\s+)/)){if(!tok)continue;
      if(ctx.measureText(line+tok).width<=maxW){line+=tok;continue}
      if(line.trim()){out.push(line.trimEnd());line=""}
      if(ctx.measureText(tok).width<=maxW){line=tok.trimStart();continue}
      for(const ch of tok){if(ctx.measureText(line+ch).width>maxW&&line){out.push(line);line=ch}else line+=ch}}
    out.push(line.trimEnd());if(out.length>maxLines)break}
  while(out.length&&!out[out.length-1])out.pop();
  if(out.length>maxLines){out.length=maxLines;let l=out[maxLines-1];while(l&&ctx.measureText(l+"…").width>maxW)l=l.slice(0,-1);out[maxLines-1]=l+"…"}
  return out}
function pbText(ctx,lines,x,y,lh){lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lh));return y+lines.length*lh}
const ROLL_COL=["#FFF3B0","#FDE2E4","#E2F0CB","#DCEBFA","#EADCF8","#FFE5CC"];
function lettersTo(t,o){const who=n=>n.mine?L.me:n.by;const ok=n=>n.diary&&n.diary.trim();const out=[];
  const msgs=key=>allNotes(key).filter(ok).map(n=>({from:who(n),text:n.diary.trim()}));
  if(o.couple){const A=o.couple.a,B=o.couple.b;
    for(const [to,fr] of [[B,A],[A,B]]){const ms=[...msgs("letter-"+to.id),...msgs("letter").filter(x=>x.from===fr.id)];
      if(ms.length)out.push({to:to.label,list:ms.map(x=>({...x,fromL:x.from===fr.id?`${fr.label} · ${pName(t,fr.id)}`:pName(t,x.from)}))})}
    return out}
  t.people.forEach(p=>{const ms=msgs("letter-"+p.id);if(ms.length)out.push({to:p.name,list:ms.map(x=>({...x,fromL:pName(t,x.from)}))})});
  const all=msgs("letter");if(all.length)out.push({to:tt("우리 모두"),list:all.map(x=>({...x,fromL:pName(t,x.from)}))});
  return out}
function rollLayout(x,S,list,sc){sc=sc||1;const u0=S/100,u=u0*sc,m=Math.round(S*.07),gap=2.4*u0,cw=list.length===1?S-2*m:(S-2*m-gap)/2,pad=2.6*u,top=m*1.3+15*u0,bottom=S-m;
  const colY=[top,top];const placed=[];
  for(let k=0;k<list.length;k++){const it=list[k];x.font=`400 ${Math.round(3.1*u)}px ${PB_FONT}`;const lines=pbLines(x,it.text,cw-2*pad,40);
    const h=pad*2+lines.length*4.6*u+5*u;const c=colY[0]<=colY[1]?0:1;
    if(colY[c]+h>bottom){if(!placed.length){placed.push({it,lines,x:m,y:top,w:S-2*m,h:Math.min(h,bottom-top),k});return {placed,next:k+1}}return {placed,next:k}}
    placed.push({it,lines,x:m+c*(cw+gap),y:colY[c],w:cw,h,k});colY[c]+=h+gap}
  return {placed,next:list.length}}
const RING_INK=["#C2414F","#2E78A8","#3A8A57","#8A55B0","#D4711B","#B5527A"];
function rrect(x,X,Y,W,H,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+W,Y,X+W,Y+H,r);x.arcTo(X+W,Y+H,X,Y+H,r);x.arcTo(X,Y+H,X,Y,r);x.arcTo(X,Y,X+W,Y,r);x.closePath()}
function ringFits(x,list){const u=10;x.font=`400 ${Math.round(3*u)}px ${PB_FONT}`;return list.every(it=>pbLines(x,it.text,300,99).length<=7)}
/* --- 스티커 · 말풍선 · 우표 (롤링페이퍼 꾸미기) --- */
function prng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hashStr=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
const STK_CACHE=new Map();
function stickerCanvas(ch,px){const k=ch+"|"+px;if(STK_CACHE.has(k))return STK_CACHE.get(k);
  const b=Math.round(px*.12),W=px+b*4,c=document.createElement("canvas");c.width=c.height=W;const x=c.getContext("2d");
  const g=document.createElement("canvas");g.width=g.height=W;const gx=g.getContext("2d");gx.textAlign="center";gx.textBaseline="middle";gx.font=`${px}px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif`;gx.fillText(ch,W/2,W/2+px*.06);
  const w=document.createElement("canvas");w.width=w.height=W;const wx=w.getContext("2d");wx.drawImage(g,0,0);wx.globalCompositeOperation="source-in";wx.fillStyle="#fff";wx.fillRect(0,0,W,W);
  x.shadowColor="rgba(0,0,0,.22)";x.shadowBlur=b*1.2;x.shadowOffsetY=b*.4;
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;x.drawImage(w,Math.cos(a)*b,Math.sin(a)*b)}
  x.shadowColor="transparent";x.drawImage(g,0,0);STK_CACHE.set(k,c);return c}
function stickerSet(t,o){
  const day=t.days.map(d=>d.emoji).filter(Boolean);const s=(t.name+" "+(t.destination||"")).toLowerCase();
  let base=["✈️","📸","⭐","🌈","🍀","💛","🗺️","☀️"];
  if(/크루즈|cruise|ship|배|바다|beach|해변|island|섬/.test(s))base=["🚢","⚓","🌊","🐬","🌴","☀️","🐚","🍹"];
  else if(/캠핑|camp|산|mountain|hike|하이킹/.test(s))base=["⛺","🌲","🏔️","🔥","🌙","⭐","🍂","🥾"];
  if(o.couple)base=["💕","💌","🌹","✨","🥂","💗",...base.slice(0,3)];
  return [...new Set([...day,...base])]}
function placeStickers(x,S,occ,set,seed,count){const u=S/100,m=S*.05,rnd=prng(seed),put=[];
  const hit=(r,p)=>occ.concat(put).some(o=>r.x<o.x+o.w+p&&r.x+r.w+p>o.x&&r.y<o.y+o.h+p&&r.y+r.h+p>o.y);
  for(let tries=0;tries<220&&put.length<count;tries++){const sz=(6.5+rnd()*4)*u;const r={x:m+rnd()*(S-2*m-sz),y:m+rnd()*(S-2*m-sz),w:sz,h:sz};
    if(hit(r,2*u))continue;put.push(r);const ch=set[Math.floor(rnd()*set.length)];const c=stickerCanvas(ch,Math.round(sz));
    x.save();x.translate(r.x+sz/2,r.y+sz/2);x.rotate((rnd()-.5)*.6);x.drawImage(c,-c.width/2,-c.height/2);x.restore()}
  return put}
function cornerSticker(x,p,set,k,u){if(k%2)return;const ch=set[(k*3+1)%set.length];const sz=Math.round(7*u);const c=stickerCanvas(ch,sz);
  x.save();x.translate(p.x+p.w+.6*u,p.y-.6*u);x.rotate((k%4?.25:-.2));x.drawImage(c,-c.width/2,-c.height/2);x.restore()}
function bubbleLayout(x,S,list,sc){sc=sc||1;const u0=S/100,u=u0*sc,m=Math.round(S*.07),top=m*1.3+15*u0,bottom=S-m,av=7*u,maxW=(S-2*m)*.72,pad=2.4*u;let y=top;const placed=[];
  for(let k=0;k<list.length;k++){const it=list[k];x.font=`400 ${Math.round(3.2*u)}px ${PB_FONT}`;const lines=pbLines(x,it.text,maxW-2*pad,40);
    const tw=Math.max(...lines.map(l=>x.measureText(l).width),x.measureText("— "+it.fromL).width*.8);const w=Math.min(maxW,tw+2*pad),h=pad*2+lines.length*4.8*u;
    const tot=3.6*u+h;if(y+tot>bottom&&placed.length)return {placed,next:k};
    const right=k%2===1;const bx=right?S-m-av-1.6*u-w:m+av+1.6*u;placed.push({it,lines,x:bx,y:y+3.6*u,w,h,right,k,av,sc});y+=tot+2.4*u0}
  return {placed,next:list.length}}
function pbLetters(t,o,pages){const mc=document.createElement("canvas").getContext("2d");
  for(const g of lettersTo(t,o)){
    if(g.list.length===1&&g.list[0].text.length>140){pages.push({type:"letter",to:g.to,from:g.list[0].fromL,text:g.list[0].text});continue}
    if((o.roll||"ring")==="ring"&&ringFits(mc,g.list)){for(let k=0;k<g.list.length;k+=6)pages.push({type:"ring",to:g.to,n:g.list.length,list:g.list.slice(k,k+6),cont:k>0});continue}
    const lay=(o.roll==="bubble")?bubbleLayout:rollLayout;
    let rest=g.list,first=true;while(rest.length){let sc=1;for(const t2 of [1.6,1.45,1.3,1.15]){if(lay(mc,1000,rest,t2).next===rest.length){sc=t2;break}}
      const {next}=lay(mc,1000,rest,sc);pages.push({type:o.roll==="bubble"?"bubble":"roll",to:g.to,n:g.list.length,list:rest.slice(0,next),cont:!first,sc});rest=rest.slice(next);first=false}}}
function pbPlan(t,o){const pages=[{type:"cover"}];let nPh=0;
  const notesOf=key=>allNotes(key).filter(n=>o.priv||!n.mine||n.shared);
  if(o.couple){const A=o.couple.a.id,B=o.couple.b.id;const who=n=>n.mine?L.me:n.by;
    t.days.forEach((d,i)=>{const evs=evsOf(t,d.id).filter(e=>e.status==="done");const dn=notesOf("day-"+d.id);const list=[];let any=false;
      const pagesOfDay=[];
      evs.forEach(e=>{const ph=photosOf(e.id);const ns=notesOf("ev-"+e.id);
        const pa=ph.filter(x=>(x.by||L.me)===A).map(x=>x.id),pb=ph.filter(x=>(x.by||L.me)===B).map(x=>x.id);
        const na=ns.find(n=>who(n)===A),nb=ns.find(n=>who(n)===B);
        if(!pa.length&&!pb.length){if(e.cat!=="move"||na||nb)list.push({e,n:na||nb});return}
        nPh+=pa.length+pb.length;const k=Math.max(Math.ceil(pa.length/2),Math.ceil(pb.length/2));
        for(let j=0;j<k;j++)pagesOfDay.push({type:"cpl",d,i,e,pa:pa.slice(j*2,j*2+2),pb:pb.slice(j*2,j*2+2),na:j?null:na,nb:j?null:nb,cont:j>0})});
      if(!evs.length&&!dn.length)return;
      pages.push({type:"day",d,i,notes:dn,list},...pagesOfDay)});
    pbLetters(t,o,pages);pages.push({type:"end",nPh});return pages}
  t.days.forEach((d,i)=>{const evs=evsOf(t,d.id).filter(e=>e.status==="done");const dn=notesOf("day-"+d.id);
    const withPh=evs.filter(e=>photosOf(e.id).length),noPh=evs.filter(e=>!photosOf(e.id).length);
    if(!evs.length&&!dn.length)return;
    pages.push({type:"day",d,i,notes:dn,list:noPh.filter(e=>e.cat!=="move"||notesOf("ev-"+e.id).length).map(e=>({e,n:notesOf("ev-"+e.id)[0]}))});
    withPh.forEach(e=>{const ph=photosOf(e.id).map(p=>p.id);nPh+=ph.length;const ns=notesOf("ev-"+e.id);
      const per=Math.ceil(ph.length/Math.ceil(ph.length/4));for(let k=0;k<ph.length;k+=per)pages.push({type:"photos",d,i,e,ph:ph.slice(k,k+per),notes:k?[]:ns,cont:k>0})})});
  pbLetters(t,o,pages);pages.push({type:"end",nPh});return pages}
const EN=()=>LANG==="en";const nNotes=(n,ko,en1,enN)=>EN()?`${n} ${n===1?en1:enN}`:`${n}${ko}`;const CONT=()=>EN()?" (continued)":" (계속)";
async function pbDraw(t,pg,S,o,cover){
  const c=document.createElement("canvas");c.width=c.height=S;const x=c.getContext("2d");
  const th=o.couple?["#B5527A","#FBEAF1"]:(THEMES[t.theme]||THEMES.teal).l,acc=th[0],soft=th[1],ink=o.couple?"#3A2230":"#17232B",mut=o.couple?"#8A6878":"#5E6B73";
  const SERIF=`Georgia,"Times New Roman",${PB_FONT}`;const m=Math.round(S*.07),u=S/100;
  const F=(sz,w)=>x.font=`${w||400} ${Math.round(sz*u)}px ${PB_FONT}`;x.textBaseline="top";
  x.fillStyle="#FFFFFF";x.fillRect(0,0,S,S);
  if(pg.type==="cover"){
    if(cover){pbFill(x,cover,0,0,S,S);const g=x.createLinearGradient(0,S*.45,0,S);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.72)");x.fillStyle=g;x.fillRect(0,0,S,S);x.fillStyle="#fff"}
    else{x.fillStyle=acc;x.fillRect(0,0,S,S);x.fillStyle="#fff"}
    if(o.couple){const cp=o.couple;F(8,800);const ctl=pbLines(x,t.name,S-2*m,2).length;let y=Math.min(S*.6,S-m-(13+ctl*9.4+1.5+5+(cp.line?4.5:0))*u);x.font=`italic 400 ${Math.round(4*u)}px ${SERIF}`;x.globalAlpha=.9;
      x.fillText(`${cp.a.label} & ${cp.b.label}`,m,y);x.globalAlpha=1;y+=6.5*u;
      F(4.2,600);x.fillText(`${pName(t,cp.a.id)} & ${pName(t,cp.b.id)}`,m,y);y+=6.5*u;
      F(8,800);y=pbText(x,pbLines(x,t.name,S-2*m,2),m,y,9.4*u)+1.5*u;
      F(3.2,500);x.fillText(`${fmtDate(t.start,true)} — ${fmtDate(t.end,true)}`,m,y);y+=5*u;
      if(cp.line){F(3.2,400);x.globalAlpha=.9;x.fillText(pbLines(x,cp.line,S-2*m,1)[0],m,y);x.globalAlpha=1}
      return await new Promise(r=>c.toBlob(b=>r(b),"image/jpeg",.9))}
    F(8.5,800);const tl=pbLines(x,t.name,S-2*m,2);let y=S-m-(5+tl.length*10+1.5+5.2+(t.people.length?5:0))*u;y=Math.min(y,S*.66);F(3.2,600);x.globalAlpha=.85;x.fillText(pbLines(x,(t.destination||"").toUpperCase(),S-2*m,1)[0]||"",m,y);x.globalAlpha=1;y+=5*u;
    F(8.5,800);y=pbText(x,pbLines(x,t.name,S-2*m,2),m,y,10*u)+1.5*u;
    F(3.4,500);x.fillText(`${fmtDate(t.start,true)} — ${fmtDate(t.end,true)}`,m,y);y+=5.2*u;
    if(t.people.length){F(3.4,400);x.fillText(t.people.map(p=>p.name).join(" · "),m,y)}
  }else if(pg.type==="day"){
    x.fillStyle=soft;x.fillRect(0,0,S,S);x.fillStyle=acc;x.fillRect(0,0,S,S*.012);
    let y=m*1.3;x.fillStyle=acc;F(3.6,700);x.fillText(`DAY ${pg.i+1}  ·  ${fmtDate(pg.d.date,true)}`,m,y);y+=7*u;
    x.fillStyle=ink;F(7.2,800);y=pbText(x,pbLines(x,(pg.d.emoji?pg.d.emoji+" ":"")+(pg.d.title||`Day ${pg.i+1}`),S-2*m,2),m,y,8.6*u)+3*u;
    if(o.text){
      for(const n of pg.notes){const who=n.mine?pName(t,L.me):pName(t,n.by);F(3,600);x.fillStyle=acc;x.fillText(who||"",m,y);y+=4.4*u;
        x.fillStyle=ink;F(3.4,400);y=pbText(x,pbLines(x,[n.mood,n.diary].filter(Boolean).join("\n"),S-2*m,7),m,y,5*u)+3*u;if(y>S*.7)break}
      if(pg.list.length&&y<S*.86){x.fillStyle=mut;F(2.8,700);x.fillText(tt("이날 다닌 곳"),m,y);y+=4.6*u;
        for(const {e,n} of pg.list){if(y>S-m-4*u)break;x.fillStyle=mut;F(2.9,500);x.fillText(e.start||"",m,y);x.fillStyle=ink;F(3.2,600);
          const line=e.title+(n&&n.mood?`  — ${n.mood}`:"");x.fillText(pbLines(x,line,S-2*m-12*u,1)[0]||"",m+12*u,y);y+=5*u}}
    }
  }else if(pg.type==="ring"){
    x.fillStyle="#FFFAF1";x.fillRect(0,0,S,S);x.strokeStyle=acc;x.globalAlpha=.25;x.setLineDash([.8*u,1.2*u]);x.lineWidth=.35*u;rrect(x,m*.5,m*.5,S-m,S-m,3*u);x.stroke();x.setLineDash([]);x.globalAlpha=1;
    const cx=S/2,cy=S/2,R0=13*u;x.fillStyle=soft;x.beginPath();x.arc(cx,cy,R0,0,Math.PI*2);x.fill();
    x.strokeStyle=acc;x.globalAlpha=.5;x.setLineDash([.6*u,.9*u]);x.lineWidth=.3*u;x.beginPath();x.arc(cx,cy,R0+1.6*u,0,Math.PI*2);x.stroke();x.setLineDash([]);x.globalAlpha=1;
    x.textAlign="center";x.fillStyle=acc;x.font=`italic 400 ${Math.round(3.4*u)}px ${SERIF}`;x.fillText("To",cx,cy-9*u);
    x.fillStyle=ink;let fz=6.2;F(fz,800);while(fz>3.4&&x.measureText(pg.to).width>R0*1.75){fz-=.2;F(fz,800)}x.fillText(pg.to,cx,cy-fz*.6*u);
    if(pg.cont){x.fillStyle=mut;F(2.4,500);x.fillText(CONT().trim(),cx,cy+6.4*u)}
    if(!o.stk)[[.16,.2,"♥"],[.84,.18,"★"],[.12,.82,"✿"],[.88,.84,"♥"],[.5,.07,"✦"],[.5,.94,"✦"]].forEach(([a,b2,ch])=>{x.fillStyle=acc;x.globalAlpha=.35;F(3.4,400);x.fillText(ch,a*S,b2*S);x.globalAlpha=1});
    const occ=[{x:cx-R0-3*u,y:cy-R0-3*u,w:2*R0+6*u,h:2*R0+6*u}];
    const n=pg.list.length,sc=n<=2?1.4:n<=4?1.2:1,nw=(n<=2?60:n<=4?34:30)*u,su=u*sc;
    pg.list.forEach((it,k)=>{const th=n===1?Math.PI/2:-Math.PI/2+k*2*Math.PI/n;
      x.font=`500 ${Math.round(3*su)}px ${PB_FONT}`;const ln=pbLines(x,it.text,nw,7);const lh=4.4*su,h=ln.length*lh+4.4*su;
      const rx=Math.max(0,S/2-m*.9-nw/2),ry=S/2-m*.9-h/2;const px=cx+rx*Math.cos(th),py=cy+ry*Math.sin(th);
      const lw=Math.max(...ln.map(l=>x.measureText(l).width));occ.push({x:px-lw/2-1*u,y:py-h/2-1*u,w:lw+2*u,h:h+2*u});
      x.save();x.translate(px,py);x.rotate(((k*37)%9-4)*.01);x.fillStyle=RING_INK[k%RING_INK.length];pbText(x,ln,0,-h/2,lh);
      x.font=`italic 400 ${Math.round(2.8*su)}px ${SERIF}`;x.globalAlpha=.85;x.fillText("— "+it.fromL,0,-h/2+ln.length*lh+1*su);x.globalAlpha=1;x.restore()});
    x.textAlign="left";if(o.stk)placeStickers(x,S,occ,stickerSet(t,o),hashStr(pg.to),7);
  }else if(pg.type==="bubble"){
    const g=x.createLinearGradient(0,0,0,S);g.addColorStop(0,"#FFF7FB");g.addColorStop(1,soft);x.fillStyle=g;x.fillRect(0,0,S,S);
    x.fillStyle=acc;x.globalAlpha=.08;for(let i=0;i<14;i++)for(let j=0;j<14;j++){x.beginPath();x.arc((i+.5)*S/14,(j+.5)*S/14,.35*u,0,7);x.fill()}x.globalAlpha=1;
    let y=m*1.3;x.textAlign="center";x.fillStyle=acc;x.font=`italic 400 ${Math.round(6.5*u)}px ${SERIF}`;x.fillText(`To ${pg.to}${pg.cont?CONT():""}`,S/2,y);
    x.textAlign="left";
    const {placed}=bubbleLayout(x,S,pg.list,pg.sc);const occ=[{x:S*.25,y:y-2*u,w:S*.5,h:13*u}];
    placed.forEach(p=>{const su=u*(p.sc||1);const col=RING_INK[hashStr(p.it.from)%RING_INK.length];
      const ax=p.right?S-m-p.av/2:m+p.av/2,ay=p.y+p.h-p.av/2;x.fillStyle=col;x.beginPath();x.arc(ax,ay,p.av/2,0,7);x.fill();
      x.fillStyle="#fff";x.textAlign="center";F(3.2*(p.sc||1),700);x.fillText((p.it.fromL.split("·").pop().trim()||"?").slice(0,1),ax,ay-1.8*su);
      x.fillStyle=mut;x.textAlign=p.right?"right":"left";x.font=`600 ${Math.round(2.5*su)}px ${PB_FONT}`;x.fillText(p.it.fromL,p.right?p.x+p.w:p.x,p.y-3.2*su);
      x.shadowColor="rgba(0,0,0,.08)";x.shadowBlur=1.2*u;x.shadowOffsetY=.4*u;x.fillStyle=p.right?"#FFFFFF":"#FFF2C6";rrect(x,p.x,p.y,p.w,p.h,3*su);x.fill();
      x.beginPath();if(p.right){x.moveTo(p.x+p.w-2*su,p.y+p.h-4*su);x.lineTo(p.x+p.w+1.8*su,p.y+p.h-1*su);x.lineTo(p.x+p.w-5*su,p.y+p.h)}else{x.moveTo(p.x+2*su,p.y+p.h-4*su);x.lineTo(p.x-1.8*su,p.y+p.h-1*su);x.lineTo(p.x+5*su,p.y+p.h)}x.fill();x.shadowColor="transparent";
      x.fillStyle="#2E2A2C";x.textAlign="left";x.font=`400 ${Math.round(3.2*su)}px ${PB_FONT}`;pbText(x,p.lines,p.x+2.4*su,p.y+2.4*su,4.8*su);
      occ.push({x:Math.min(p.x,ax-p.av/2)-1*u,y:p.y-4*su,w:p.w+p.av+3*u,h:p.h+4*su})});
    if(o.stk)placeStickers(x,S,occ,stickerSet(t,o),hashStr(pg.to)+3,6);
  }else if(pg.type==="roll"&&o.roll==="stamp"){
    x.fillStyle="#F2EADC";x.fillRect(0,0,S,S);x.fillStyle="#E7DCC8";for(let i=0;i<900;i++){const r=prng(i*7+1);x.globalAlpha=.25;x.fillRect(r()*S,r()*S,.25*u,.25*u)}x.globalAlpha=1;
    let y=m*1.3;x.fillStyle="#5A4632";x.font=`italic 400 ${Math.round(6.5*u)}px ${SERIF}`;x.fillText(`To ${pg.to}${pg.cont?CONT():""}`,m,y);

    const {placed}=rollLayout(x,S,pg.list,pg.sc);const su=u*(pg.sc||1);const occ=[{x:m,y:y,w:S*.5,h:13*u}];
    placed.forEach(p=>{const pc=document.createElement("canvas");pc.width=Math.ceil(p.w);pc.height=Math.ceil(p.h);const q=pc.getContext("2d");
      q.fillStyle="#FFFDF8";q.fillRect(0,0,p.w,p.h);q.globalCompositeOperation="destination-out";const hr=.9*u,st=2.6*u;
      for(let a=st/2;a<p.w;a+=st){q.beginPath();q.arc(a,0,hr,0,7);q.arc(a,p.h,hr,0,7);q.fill()}for(let b2=st/2;b2<p.h;b2+=st){q.beginPath();q.arc(0,b2,hr,0,7);q.arc(p.w,b2,hr,0,7);q.fill()}
      x.save();x.translate(p.x+p.w/2,p.y+p.h/2);x.rotate((p.k%2?1:-1)*.012);x.translate(-p.w/2,-p.h/2);
      x.shadowColor="rgba(60,40,20,.22)";x.shadowBlur=1.4*u;x.shadowOffsetY=.5*u;x.drawImage(pc,0,0);x.shadowColor="transparent";x.strokeStyle=ROLL_COL[p.k%ROLL_COL.length];x.lineWidth=.5*u;x.strokeRect(1.8*u,1.8*u,p.w-3.6*u,p.h-3.6*u);
      x.fillStyle="#3A2E25";x.font=`400 ${Math.round(3.1*su)}px ${PB_FONT}`;pbText(x,p.lines,2.6*su,3*su,4.6*su);
      x.save();x.translate(p.w-7*u,p.h-5.6*u);x.rotate(-.2);x.strokeStyle="rgba(90,60,120,.55)";x.lineWidth=.35*u;x.beginPath();x.arc(0,0,4.6*u,0,7);x.stroke();x.beginPath();x.arc(0,0,3.6*u,0,7);x.stroke();
      x.fillStyle="rgba(90,60,120,.7)";x.textAlign="center";x.font=`700 ${Math.round(1.7*u)}px ${PB_FONT}`;x.fillText("FROM",0,-2.4*u);x.font=`700 ${Math.round(2.1*u)}px ${PB_FONT}`;x.fillText(pbLines(x,p.it.fromL.split("·").pop().trim(),6.4*u,1)[0]||"",0,-.6*u);x.restore();
      x.restore();occ.push({x:p.x,y:p.y,w:p.w,h:p.h});if(o.stk)cornerSticker(x,p,stickerSet(t,o),p.k,u)});
    if(o.stk)placeStickers(x,S,occ,stickerSet(t,o),hashStr(pg.to)+5,4);
  }else if(pg.type==="roll"&&(o.roll||"ring")!=="note"){
    x.fillStyle="#FBF7F0";x.fillRect(0,0,S,S);let y=m*1.3;x.fillStyle=acc;x.font=`italic 400 ${Math.round(6.5*u)}px ${SERIF}`;x.fillText(`To ${pg.to}${pg.cont?CONT():""}`,m,y);

    const {placed}=rollLayout(x,S,pg.list,pg.sc);const su=u*(pg.sc||1);
    placed.forEach(p=>{x.save();x.translate(p.x+p.w/2,p.y+p.h/2);x.rotate((p.k%2?1:-1)*.008);x.translate(-p.w/2,-p.h/2);
      x.shadowColor="rgba(60,40,30,.16)";x.shadowBlur=1.6*u;x.shadowOffsetY=.5*u;x.fillStyle="#FFFFFF";rrect(x,0,0,p.w,p.h,1.6*u);x.fill();x.shadowColor="transparent";
      x.save();x.translate(p.w/2,0);x.rotate((p.k%2?1:-1)*.06);x.fillStyle=ROLL_COL[p.k%ROLL_COL.length];x.globalAlpha=.85;x.fillRect(-7*u,-1.6*u,14*u,3.4*u);x.restore();x.globalAlpha=1;
      x.fillStyle="#3A3330";x.font=`400 ${Math.round(3.1*su)}px ${PB_FONT}`;pbText(x,p.lines,2.6*su,3.2*su,4.6*su);
      x.fillStyle=acc;x.font=`italic 400 ${Math.round(2.9*su)}px ${SERIF}`;x.textAlign="right";x.fillText("— "+p.it.fromL,p.w-2.6*su,p.h-2.6*su-3.4*su);x.textAlign="left";x.restore();if(o.stk)cornerSticker(x,p,stickerSet(t,o),p.k+1,u)});
    if(o.stk)placeStickers(x,S,[{x:m,y:m,w:S*.5,h:16*u},...placed.map(p=>({x:p.x,y:p.y-2*u,w:p.w,h:p.h+2*u}))],stickerSet(t,o),hashStr(pg.to)+1,4);
  }else if(pg.type==="roll"){
    x.fillStyle=soft;x.fillRect(0,0,S,S);let y=m*1.3;x.fillStyle=acc;x.font=`italic 400 ${Math.round(6.5*u)}px ${SERIF}`;x.fillText(`To ${pg.to}${pg.cont?CONT():""}`,m,y);

    const {placed}=rollLayout(x,S,pg.list,pg.sc);const su=u*(pg.sc||1);
    placed.forEach(p=>{x.save();x.translate(p.x+p.w/2,p.y+p.h/2);x.rotate((p.k%2?1:-1)*.012);x.translate(-p.w/2,-p.h/2);
      x.shadowColor="rgba(0,0,0,.12)";x.shadowBlur=1.2*u;x.shadowOffsetY=.4*u;x.fillStyle=ROLL_COL[p.k%ROLL_COL.length];x.fillRect(0,0,p.w,p.h);x.shadowColor="transparent";
      x.fillStyle="#2B2B2B";x.font=`400 ${Math.round(3.1*su)}px ${PB_FONT}`;pbText(x,p.lines,2.6*su,2.6*su,4.6*su);
      x.fillStyle="#6B5B63";x.font=`italic 400 ${Math.round(2.9*su)}px ${SERIF}`;x.textAlign="right";x.fillText("— "+p.it.fromL,p.w-2.6*su,p.h-2.6*su-3.4*su);x.textAlign="left";x.restore();if(o.stk)cornerSticker(x,p,stickerSet(t,o),p.k,u)});
    if(o.stk)placeStickers(x,S,[{x:m,y:m,w:S*.5,h:16*u},...placed.map(p=>({x:p.x,y:p.y,w:p.w,h:p.h}))],stickerSet(t,o),hashStr(pg.to)+2,4);
  }else if(pg.type==="letter"){
    x.fillStyle=soft;x.fillRect(0,0,S,S);let y=m*1.4;x.fillStyle=acc;x.font=`italic 400 ${Math.round(6.5*u)}px ${SERIF}`;x.fillText(`To ${pg.to}`,m,y);y+=12*u;
    x.fillStyle=ink;F(3.5,400);const lines=pbLines(x,pg.text,S-2*m,Math.floor((S-m*2.6-y)/(5.6*u)));pbText(x,lines,m,y,5.6*u);
    x.fillStyle=acc;x.font=`italic 400 ${Math.round(3.6*u)}px ${SERIF}`;x.textAlign="right";x.fillText(`— ${pg.from}`,S-m,S-m*1.3);x.textAlign="left";
  }else if(pg.type==="cpl"){
    const e=pg.e,cp=o.couple;let y=m*.9;
    x.fillStyle=acc;F(2.7,700);x.fillText(`DAY ${pg.i+1}${e.start?"  ·  "+e.start:""}`,m,y);y+=4.2*u;
    x.fillStyle=ink;F(4.4,800);x.fillText(pbLines(x,e.title+(pg.cont?CONT():""),S-2*m,1)[0],m,y);y+=6*u;
    if(e.place&&!pg.cont){x.fillStyle=mut;F(2.8,500);x.fillText(pbLines(x,e.place,S-2*m,1)[0],m,y)}y+=5.5*u;
    const gap=Math.round(2.4*u),cw=(S-2*m-gap)/2,top=y,bottom=S-m*.8;
    const txtOf=n=>o.text&&n?[n.mood,n.diary].filter(Boolean).join(" — "):"";
    const emptyA=!pg.pa.length&&!txtOf(pg.na),emptyB=!pg.pb.length&&!txtOf(pg.nb);
    const col=async(cx,label,ids,n,cw)=>{let yy=top;x.fillStyle=acc;x.font=`italic 600 ${Math.round(3.6*u)}px ${SERIF}`;x.fillText(label,cx,yy);yy+=5.4*u;
      const txt=txtOf(n);F(2.9,400);const tl=txt?pbLines(x,txt,cw,pg.cont?0:4):[];const th2=tl.length?tl.length*4.3*u+1.5*u:0;
      const ph=bottom-th2-yy;const gh=Math.round(1.2*u);
      if(ids.length){const imgs=[];for(const id of ids)imgs.push(await pbImage(id,o.orig));const h=ids.length>1?(ph-gh)/2:ph;
        imgs.forEach((im,k)=>{const by=yy+k*(h+gh);if(im){pbFill(x,im,cx,by,cw,h);im.close&&im.close()}else{x.fillStyle="#EEE4E8";x.fillRect(cx,by,cw,h)}if(o.text)pbCap(x,phCap(ids[k]),cx,by,cw,h,u,F)})}
      else{x.fillStyle=soft;x.fillRect(cx,top+5.4*u,cw,bottom-top-5.4*u);x.fillStyle=ink;F(3.6,500);const q=pbLines(x,"“"+txt+"”",cw-6*u,8);
        const qh=q.length*5.4*u;pbText(x,q,cx+3*u,top+5.4*u+(bottom-top-5.4*u-qh)/2,5.4*u);return}
      if(tl.length){x.fillStyle=ink;F(2.9,400);pbText(x,tl,cx,bottom-th2+1.5*u,4.3*u)}};
    if(emptyA||emptyB){const sd=emptyA?[cp.b.label,pg.pb,pg.nb]:[cp.a.label,pg.pa,pg.na];await col(m,sd[0],sd[1],sd[2],S-2*m)}
    else{await col(m,cp.a.label,pg.pa,pg.na,cw);await col(m+cw+gap,cp.b.label,pg.pb,pg.nb,cw);x.fillStyle=soft;x.fillRect(m+cw+gap/2-.5,top,1,bottom-top)}
  }else if(pg.type==="photos"){
    const capH=o.text&&!pg.cont?S*.2:S*.13;const W=S-2*m,H=S-m-capH-m*.4;const gap=Math.round(1.2*u);
    const imgs=[];for(const id of pg.ph)imgs.push(await pbImage(id,o.orig));
    const box=(i,bx,by,bw,bh)=>{const im=imgs[i];if(im)pbFill(x,im,bx,by,bw,bh);else{x.fillStyle="#E6EBEE";x.fillRect(bx,by,bw,bh)}if(o.text)pbCap(x,phCap(pg.ph[i]),bx,by,bw,bh,u,F)};
    const n=imgs.length,X=m,Y=m;
    if(n===1&&o.single!=="full"){const im=imgs[0],rnd=prng(hashStr(pg.ph[0]));
      x.fillStyle=soft;x.fillRect(0,0,S,S);
      const ar=im?Math.min(1.35,Math.max(.75,im.width/im.height)):1,pad=3*u,bot=o.text&&phCap(pg.ph[0])?13*u:9*u;
      let pw=W*.74-2*pad,ph=pw/ar;const maxPh=H*.9-pad-bot;if(ph>maxPh){ph=maxPh;pw=ph*ar}
      const fw=pw+2*pad,fh=ph+pad+bot,cx=S/2,cy=Y+H/2,rot=(rnd()-.5)*.09;
      x.save();x.translate(cx,cy);x.rotate(rot);x.shadowColor="rgba(0,0,0,.22)";x.shadowBlur=3*u;x.shadowOffsetY=1*u;x.fillStyle="#fff";x.fillRect(-fw/2,-fh/2,fw,fh);x.shadowColor="transparent";
      if(im)pbFill(x,im,-fw/2+pad,-fh/2+pad,pw,ph);else{x.fillStyle="#E6EBEE";x.fillRect(-fw/2+pad,-fh/2+pad,pw,ph)}
      const cap=o.text?phCap(pg.ph[0]):"";if(cap){x.fillStyle=ink;x.font=`italic 400 ${Math.round(3.6*u)}px ${SERIF}`;x.textAlign="center";x.fillText(pbLines(x,cap,pw,1)[0],0,fh/2-bot+3.4*u);x.textAlign="left"}
      x.fillStyle="rgba(255,236,170,.78)";x.save();x.translate(0,-fh/2);x.rotate(-.06+rnd()*.12);x.fillRect(-9*u,-2.4*u,18*u,4.8*u);x.restore();x.restore();
      if(o.stk){const occ=[{x:cx-fw/2-3*u,y:cy-fh/2-4*u,w:fw+6*u,h:fh+8*u},{x:0,y:Y+H,w:S,h:S}];placeStickers(x,S,occ,stickerSet(t,o),hashStr(pg.ph[0]),4)}}
    else if(n===1)box(0,X,Y,W,H);
    else if(n===2){const w=(W-gap)/2;box(0,X,Y,w,H);box(1,X+w+gap,Y,w,H)}
    else if(n===3){const w=(W-gap)*.6;box(0,X,Y,w,H);const h=(H-gap)/2;box(1,X+w+gap,Y,W-w-gap,h);box(2,X+w+gap,Y+h+gap,W-w-gap,h)}
    else{const w=(W-gap)/2,h=(H-gap)/2;box(0,X,Y,w,h);box(1,X+w+gap,Y,w,h);box(2,X,Y+h+gap,w,h);box(3,X+w+gap,Y+h+gap,w,h)}
    imgs.forEach(im=>im&&im.close&&im.close());
    let y=Y+H+m*.45;const e=pg.e;
    x.fillStyle=acc;F(2.7,700);x.fillText(`DAY ${pg.i+1}${e.start?"  ·  "+e.start:""}`,m,y);y+=4.2*u;
    x.fillStyle=ink;F(4,800);x.fillText(pbLines(x,e.title+(pg.cont?CONT():""),W,1)[0],m,y);y+=5.6*u;
    if(o.text&&!pg.cont){const w=withNames(t,e);const sub=[e.place,w&&w!=="모두"?(EN()?"With: ":"함께: ")+w:""].filter(Boolean).join("  ·  ");
      if(sub){x.fillStyle=mut;F(2.8,500);x.fillText(pbLines(x,sub,W,1)[0],m,y);y+=4.4*u}
      const n=pg.notes[0];if(n){x.fillStyle=ink;F(3,400);pbText(x,pbLines(x,[n.mood,n.diary].filter(Boolean).join(" — "),W,Math.max(1,Math.floor((S-m*.6-y)/(4.4*u)))),m,y,4.4*u)}}
  }else{
    x.fillStyle=soft;x.fillRect(0,0,S,S);let y=m*1.3;x.fillStyle=acc;F(3.6,700);x.fillText(tt("함께한 시간"),m,y);y+=8*u;
    const done=t.events.filter(e=>e.status==="done"&&e.cat!=="move").length;const stats=EN()?[[`${t.days.length}`,"Days"],[`${done}`,"Places"],[`${pg.nPh}`,"Photos"]]:[[`${t.days.length}일`,"여행"],[`${done}곳`,"다닌 곳"],[`${pg.nPh}장`,"사진"]];
    if(sum(t.expenses))stats.push([money(sum(t.expenses),t),EN()?"Spent":"쓴 돈"]);
    const cw=(S-2*m)/stats.length;stats.forEach(([a,b],k)=>{x.fillStyle=ink;F(6,800);x.fillText(a,m+k*cw,y);x.fillStyle=mut;F(2.8,500);x.fillText(b,m+k*cw,y+8*u)});y+=17*u;
    if(t.people.length){x.fillStyle=mut;F(2.8,700);x.fillText(tt("함께한 사람"),m,y);y+=4.6*u;x.fillStyle=ink;F(3.8,600);y=pbText(x,pbLines(x,t.people.map(p=>p.name).join(" · "),S-2*m,2),m,y,5.4*u)+4*u}
    const held=t.events.filter(e=>e.status==="hold");
    if(held.length){x.fillStyle=mut;F(2.8,700);x.fillText(tt("다음에 꼭 갈 곳"),m,y);y+=4.6*u;x.fillStyle=ink;F(3.2,500);
      for(const e of held.slice(0,8)){x.fillText("· "+pbLines(x,e.title,S-2*m-4*u,1)[0],m,y);y+=4.8*u}}
    if(o.couple){x.fillStyle=acc;x.font=`italic 400 ${Math.round(5*u)}px ${SERIF}`;x.fillText(`${o.couple.a.label} & ${o.couple.b.label}`,m,S-m-9*u)}
    x.fillStyle=mut;F(2.4,500);x.fillText(EN()?"Made with GoTripJ":"같이가J로 만든 사진첩",m,S-m)}
  return await new Promise(r=>c.toBlob(b=>r(b),"image/jpeg",.9))}
async function pdfFromJpegs(list,pt){const parts=[],offs=[];let off=0;
  const push=b=>{if(typeof b==="string")b=enc.encode(b);parts.push(b);off+=b instanceof Blob?b.size:b.byteLength};
  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");const N=2+list.length*3;
  offs[1]=off;push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  offs[2]=off;push(`2 0 obj\n<< /Type /Pages /Count ${list.length} /Kids [${list.map((_,i)=>`${3+i*3} 0 R`).join(" ")}] >>\nendobj\n`);
  list.forEach((p,i)=>{const a=3+i*3,cs=`q ${pt} 0 0 ${pt} 0 0 cm /Im0 Do Q`;
    offs[a]=off;push(`${a} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pt} ${pt}] /Resources << /XObject << /Im0 ${a+2} 0 R >> >> /Contents ${a+1} 0 R >>\nendobj\n`);
    offs[a+1]=off;push(`${a+1} 0 obj\n<< /Length ${cs.length} >>\nstream\n${cs}\nendstream\nendobj\n`);
    offs[a+2]=off;push(`${a+2} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.blob.size} >>\nstream\n`);push(p.blob);push("\nendstream\nendobj\n")});
  const x0=off;push(`xref\n0 ${N+1}\n0000000000 65535 f \n`+Array.from({length:N},(_,k)=>String(offs[k+1]).padStart(10,"0")+" 00000 n \n").join(""));
  push(`trailer\n<< /Size ${N+1} /Root 1 0 R >>\nstartxref\n${x0}\n%%EOF\n`);
  return new Blob(parts,{type:"application/pdf"})}
function photobookModal(){const t=T;if(!t)return;
  const pages=pbPlan(t,{priv:true,text:true});const nPh=pages[pages.length-1].nPh;
  const m=modal(`<div class="card" style="max-height:92vh;overflow-y:auto"><h3>📖 사진첩 만들기</h3>
    <p class="hint">완료한 일정의 사진과 기록으로 8×8 인치 정사각 사진첩을 만들어요. 표지 → 날짜별 첫 장 → 사진 페이지 → 마무리 순서예요. 지금 기준 <b>${pages.length}쪽 · 사진 ${nPh}장</b>.${nPh?"":" 아직 사진이 없어요. 일정 상세에서 사진을 넣어 주세요."}</p>
    <p class="hint">이 폰에 있는 사진만 들어가요. 다른 사람 사진까지 넣으려면 먼저 ⋯ → '사진 모으기'로 합쳐 주세요.</p>
    <div class="field"><label for="pb-q">화질</label><select class="inp" id="pb-q"><option value="1600">보기·공유용 (가벼움)</option><option value="2400">인쇄용 (고화질, 원본 사진 사용)</option></select></div>
    <div class="field"><label for="pb-f">파일 형태</label><select class="inp" id="pb-f"><option value="pdf">PDF 한 파일 (보기, 인쇄소 맡기기)</option><option value="jpg">페이지별 사진 묶음 (Mixbook·Shutterfly에 한 장씩 꽉 차게 올리기)</option></select></div>
    ${t.people.length>=2?`<div class="field"><label for="pb-d">디자인</label><select class="inp" id="pb-d"><option value="basic">기본</option><option value="couple">커플 (Her · His)</option></select></div>
    <div id="pbCpl" hidden><p class="hint">일정마다 두 칸으로 나눠, 각자 찍은 사진과 각자 쓴 한 줄을 나란히 넣어요.</p>
      <div class="grid2">${["a","b"].map((k,j)=>`<div class="field"><label>${j?"오른쪽":"왼쪽"}</label><div class="row" style="flex-wrap:nowrap;gap:6px"><input class="inp" id="pb-l${k}" value="${j?"His":"Her"}" style="width:64px"><select class="inp" id="pb-p${k}">${t.people.map((p,i)=>`<option value="${p.id}" ${i===j?"selected":""}>${esc(p.name)}</option>`).join("")}</select></div></div>`).join("")}</div>
      <div class="field"><label for="pb-line">표지 한 줄 (선택)</label><input class="inp" id="pb-line" placeholder="예: 우리의 세 번째 여행 · D+1000"></div></div>`:""}
    <div class="field"><label for="pb-r">롤링페이퍼 모양</label><select class="inp" id="pb-r"><option value="ring">가운데 이름 + 둘레 쪽지</option><option value="bubble">말풍선 메시지</option><option value="stamp">우표 엽서</option><option value="card">편지 카드 + 마스킹테이프</option><option value="note">포스트잇</option></select></div>
    <div class="field"><label for="pb-1">사진 한 장 페이지</label><select class="inp" id="pb-1"><option value="pola">폴라로이드 + 스티커</option><option value="full">꽉 채우기</option></select></div>
    <label class="row" style="gap:8px"><input type="checkbox" id="pb-s" checked> 스티커 붙이기 <span class="hint">(롤링페이퍼 · 폴라로이드, 여행 이모지로 자동)</span></label>
    <label class="row" style="gap:8px"><input type="checkbox" id="pb-t" checked> 기록(한 줄 감정 · 일기) 넣기</label>
    <label class="row" style="gap:8px"><input type="checkbox" id="pb-p" checked> 나만 보기 기록도 넣기 <span class="hint">(남에게 줄 사진첩이면 끄세요)</span></label>
    <div id="pbOut" class="hint"></div><div id="pbPrev" class="pbprev"></div>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">닫기</button><button type="button" class="btn" id="pbPv"${pages.length<3?" disabled":""}>미리보기</button><button type="button" class="btn primary" id="pbGo"${pages.length<3?" disabled":""}>만들기</button></div></div>`);
  const readO=out=>{const o={text:m.querySelector("#pb-t").checked,priv:m.querySelector("#pb-p").checked,roll:m.querySelector("#pb-r").value,stk:m.querySelector("#pb-s").checked,single:m.querySelector("#pb-1").value};
    if(dSel&&dSel.value==="couple"){const g=k=>({id:m.querySelector("#pb-p"+k).value,label:m.querySelector("#pb-l"+k).value.trim()||(k==="a"?"Her":"His")});
      o.couple={a:g("a"),b:g("b"),line:m.querySelector("#pb-line").value.trim()};if(o.couple.a.id===o.couple.b.id){out.textContent="왼쪽과 오른쪽에 서로 다른 사람을 골라 주세요.";return null}}
    return o};
  m.querySelector("#pbPv").onclick=async ev=>{const b=ev.currentTarget;const out=m.querySelector("#pbOut"),prev=m.querySelector("#pbPrev");const o=readO(out);if(!o)return;b.disabled=true;prev.innerHTML="";
    try{flushAll();const pl=pbPlan(t,o);const cover=L.cover?await pbImage(L.cover,false):null;
      for(let k=0;k<pl.length;k++){out.textContent=`미리보기 ${k+1} / ${pl.length}쪽…`;const blob=await pbDraw(t,pl[k],560,o,cover);const im=document.createElement("img");im.src=URL.createObjectURL(blob);im.alt=`${k+1}쪽`;
        im.onclick=()=>{const l=document.createElement("div");l.className="lightbox";l.innerHTML=`<img src="${im.src}" alt="${k+1}쪽 크게 보기">`;l.onclick=()=>l.remove();document.body.appendChild(l)};prev.appendChild(im)}
      cover&&cover.close&&cover.close();out.textContent=`${pl.length}쪽 미리보기예요. 눌러서 크게 볼 수 있어요. 옵션을 바꾸고 다시 눌러 보세요.`}
    catch(e){console.error(e);out.textContent="미리보기를 만들지 못했어요."}b.disabled=false};
  const dSel=m.querySelector("#pb-d");if(dSel)dSel.onchange=()=>{m.querySelector("#pbCpl").hidden=dSel.value!=="couple"};
  m.querySelector("#pbGo").onclick=async ev=>{const b=ev.currentTarget;b.disabled=true;const out=m.querySelector("#pbOut");
    const S=+m.querySelector("#pb-q").value,fmt=m.querySelector("#pb-f").value;const o=readO(out);if(!o){b.disabled=false;return}o.orig=S>2000;
    try{flushAll();const pl=pbPlan(t,o);const cover=L.cover?await pbImage(L.cover,o.orig):null;const res=[];
      for(let k=0;k<pl.length;k++){out.textContent=`${k+1} / ${pl.length}쪽 만드는 중…`;const blob=await pbDraw(t,pl[k],S,o,cover);res.push({blob,w:S,h:S})}
      cover&&cover.close&&cover.close();const day=t.start||todayISO();
      if(fmt==="pdf"){const pdf=await pdfFromJpegs(res,576);offerFile(out,pdf,`gotripj-${o.couple?"couple-":""}photobook-${day}.pdf`,`${pl.length}쪽 · 8×8 인치. 인쇄할 때는 '8×8 정사각, 여백 없음'으로 맡기세요.`)}
      else{const z=await makeZip(res.map((r,k)=>({name:`page-${String(k+1).padStart(2,"0")}.jpg`,blob:r.blob})));offerFile(out,z,`gotripj-photobook-pages-${day}.zip`,`${pl.length}장. 8×8 사진첩을 만들고 한 쪽에 한 장씩 '꽉 채우기'로 넣으면 이 모양 그대로 나와요.`)}
    }catch(e){console.error(e);out.textContent="사진첩을 만들지 못했어요. 화질을 '보기·공유용'으로 바꿔 다시 해 보세요."}
    b.disabled=false}}

/* ================= detail drawer ================= */
function openDrawer(id){
  const t=T;const e=t&&t.events.find(x=>x.id===id);if(!e)return;openEv=id;
  const key="ev-"+e.id,mn=myNote(key);
  const dayOpts=t.days.map((d,i)=>`<option value="${d.id}" ${d.id===e.dayId?"selected":""}>Day ${i+1} · ${fmtDate(d.date)}</option>`).join("");
  const exs=t.expenses.filter(x=>x.evId===e.id);
  $("#layer").innerHTML=`<div class="scrim" data-act="close"></div>
  <aside class="drawer" role="dialog" aria-label="일정 상세">
    <div class="drawer-head"><div class="row"><span class="chip ${e.status}" id="dChip">${ST[e.status]}</span>
      <button class="st-btn done" aria-pressed="${e.status==="done"}" data-act="dstatus" data-s="done">✓ 완료</button>
      <button class="st-btn hold" aria-pressed="${e.status==="hold"}" data-act="dstatus" data-s="hold">보류</button>${e.status==="hold"?`<button class="st-btn primary" data-act="unhold" data-id="${e.id}">📅 일정에 넣기</button>`:""}</div>
      <button class="btn sm" data-act="close">닫기</button></div>
    <div class="drawer-body">
      <div class="card">
        <div class="field"><label for="f-title">일정</label><input class="inp" id="f-title" data-f="title" value="${esc(e.title)}"></div>
        <div class="field"><label>카테고리</label><div id="evCat">${catPick(e.cat,"evCat")}</div></div>
        ${t.people.length?`<div class="field"><label>누구 일정인가요? <span class="hint">눌러서 빼거나 넣어요 · 모두 보여요</span></label><div class="people" id="withRow">${withChips(t,e)}</div></div>`:""}
        <div class="grid3">
          <div class="field"><label for="f-start">시작</label><input class="inp mono" type="time" id="f-start" data-f="start" value="${esc(e.start)}"></div>
          <div class="field"><label for="f-end">종료</label><input class="inp mono" type="time" id="f-end" data-f="end" value="${esc(e.end)}"></div>
          <div class="field"><label for="f-day">날짜</label><select class="inp" id="f-day" data-f="dayId">${dayOpts}</select></div>
        </div>
        ${e.cat==="move"?`<div class="field"><label for="f-origin">출발지 <span class="hint">비우면 현재 위치에서 출발</span></label><input class="inp" id="f-origin" data-f="origin" value="${esc(e.origin)}" placeholder="예: 숙소 주소"></div>
        <div class="field"><label>경유지</label><div id="stopsBox" style="display:flex;flex-direction:column;gap:6px">${stopsHTML(e)}</div><button type="button" class="btn sm ghost" data-act="addStop" style="align-self:flex-start">+ 경유지 추가</button></div>`:""}
        <div class="field"><label for="f-place">${e.cat==="move"?"도착지":"장소"}</label><input class="inp" id="f-place" data-f="place" value="${esc(e.place)}" placeholder="장소 이름"></div>
        <div class="field"><label for="f-address">주소 (내비 연결용)</label><input class="inp" id="f-address" data-f="address" value="${esc(e.address)}" placeholder="정확한 주소를 넣으면 길찾기가 정확해져요"></div>
        <div class="navrow" id="navRow">${navLinks(e)}</div>
        <div class="field"><label for="f-memo">메모 (예약번호, 준비물 등 · 함께 보기)</label><textarea class="inp" id="f-memo" data-f="memo">${esc(e.memo)}</textarea></div>
      </div>
      <div class="card">
        <h3>내 기록 <span id="visBox">${visPick(key,mn.shared)}</span></h3>
        <div class="field"><label for="n-mood">한 줄 감정 · 평가</label><input class="inp" id="n-mood" data-note="mood" data-k="${key}" value="${esc(mn.mood)}" placeholder="예: 최고였음, 또 오고 싶다"></div>
        <div class="field"><label for="n-diary">일기</label><textarea class="inp" id="n-diary" data-note="diary" data-k="${key}" rows="4" placeholder="무엇을 보고, 먹고, 느꼈는지">${esc(mn.diary)}</textarea></div>
        <div class="field"><label>사진 <span class="hint">이 폰에 저장돼요</span></label><div class="photos" id="photoGrid">${photosHTML(e)}</div></div>
        <div id="othersBox">${othersHTML(key)}</div>
      </div>
      <div class="card">
        <h3>이 일정의 지출 <span class="row"><span class="hint mono">${money(sum(exs),t)}</span><button class="btn sm" data-act="addExpEv">+ 영수증·지출</button></span></h3>
        ${exs.length?exs.map(x=>`<div class="row" style="justify-content:space-between"><span class="cchip cat-${x.cat}">${CATS[x.cat]}</span><span style="flex:1;min-width:0">${esc(x.title)}${x.paidBy?` <span class="hint">· ${esc(pName(t,x.paidBy))}</span>`:""}</span><span class="mono">${money(x.amount,t)}</span><button class="btn sm ghost" data-act="editExp" data-id="${x.id}">수정</button></div>`).join(""):`<p class="hint">결제한 영수증을 찍어 두면 예산 탭에 모두의 지출로 모여요.</p>`}
      </div>
      <div class="card">
        <h3>근처 맛집 <span class="row"><button class="btn sm" data-act="pasteRest">붙여넣기</button><button class="btn sm" data-act="addRest">+ 추가</button></span></h3>
        ${(e.address||e.place)?`<div class="navrow"><a href="https://www.google.com/maps/search/?api=1&hl=ko&query=${q("restaurants near "+(e.address||e.place))}" target="_blank" rel="noopener">Google 지도에서 근처 맛집 찾기</a></div>`:""}
        <div id="restList" style="display:flex;flex-direction:column;gap:10px">${restListHTML(e)}</div>
      </div>
      <div class="row" style="justify-content:space-between">
        <button class="btn sm" data-act="dupEv">복제</button>
        <button class="btn sm danger" data-act="delEv">일정 삭제</button>
      </div>
    </div>
  </aside>`;
  if(!(history.state&&history.state.drawer))history.pushState({drawer:1},"");
}
function othersHTML(key){const o=otherNotes(key);const mine=allNotes(key).find(n=>n.mine);const got=mine?reactBar(mine):"";
  return (got?`<div class="field"><label>내 기록에 남긴 반응</label>${got}</div>`:"")+(o.length?`<div class="field"><label>다른 사람 기록</label>${o.map(noteBlock).join("")}</div>`:"")}
function refreshDrawerOthers(){if(!openEv)return;const b=$("#othersBox");if(b)b.innerHTML=othersHTML("ev-"+openEv)}
function withChips(t,e){const ids=e.with||t.people.map(p=>p.id);return t.people.map(p=>`<button type="button" class="pchip" data-act="toggleWith" data-id="${p.id}" aria-pressed="${ids.includes(p.id)}"><b>${initial(p.name)}</b>${esc(p.name)}</button>`).join("")}
function photosHTML(e){
  return photosOf(e.id).map((p,i)=>`<div class="ph">${phImg(p.id,"사진 "+(i+1),'loading="lazy" data-act="zoom"')}${p.by&&p.by!==L.me?`<span class="by">${esc(pName(T,p.by))}</span>`:""}<button data-act="rmPhoto" data-i="${i}" aria-label="사진 빼기">✕</button>${!p.by||p.by===L.me?`<button type="button" class="cap${p.cap?" on":""}" data-act="capPhoto" data-i="${i}">${p.cap?esc(p.cap):"+ 한 줄"}</button>`:(p.cap?`<span class="cap on">${esc(p.cap)}</span>`:"")}</div>`).join("")
    +`<button class="ph-add" data-act="addPhoto">+ 갤러리에서<br>추가</button>`;
}
function stars(r){const n=parseFloat(r);if(isNaN(n))return "";return `<span class="stars">★ ${n.toFixed(1)}</span>`}
function restListHTML(e){
  const list=e.restaurants||[];
  if(!list.length)return `<p class="hint">아직 정리한 맛집이 없어요. 직접 추가하거나, Claude가 정리해 준 목록을 붙여넣으세요.</p>`;
  return list.map(r=>`<div class="rest">
    <div class="rest-top"><div style="min-width:0"><div class="rest-name">${esc(r.name)}</div>
      <div class="rest-meta">${stars(r.rating)}${r.ratingSource?`<span>${esc(r.ratingSource)}</span>`:""}${r.cuisine?`<span>${esc(r.cuisine)}</span>`:""}${r.price?`<span class="mono">${esc(r.price)}</span>`:""}${r.distance?`<span>${esc(r.distance)}</span>`:""}</div></div>
      <button class="btn sm ghost" data-act="editRest" data-id="${r.id}">수정</button></div>
    ${r.menu?.length?`<table class="menu"><tbody>${r.menu.map(m=>`<tr><td>${esc(m.name)}</td><td>${esc(m.price)}</td></tr>`).join("")}</tbody></table>`:""}
    ${r.note?`<div class="hint">${esc(r.note)}</div>`:""}
    <div class="navrow"><a href="https://www.google.com/maps/search/?api=1&hl=ko&query=${q(r.name+" "+(r.address||e.address||e.place||""))}" target="_blank" rel="noopener">지도에서 보기</a><a href="https://www.google.com/maps/dir/?api=1&hl=ko&destination=${q(r.name+" "+(r.address||e.address||e.place||""))}" target="_blank" rel="noopener">길찾기</a></div>
  </div>`).join("");
}
function closeDrawer(fromPop){if(!openEv)return;flushPatches();openEv=null;$("#layer").innerHTML="";render();if(!fromPop&&history.state&&history.state.drawer)history.back()}
function curEv(){return T?.events.find(x=>x.id===openEv)}
window.addEventListener("popstate",()=>{const m=document.querySelector(".modal,.lightbox");if(m){m.remove();if(openEv)history.pushState({drawer:1},"");return}if(openEv)closeDrawer(true)});

/* ================= modals ================= */
function modal(html){const m=document.createElement("div");m.className="modal";m.innerHTML=`<div class="scrim" data-act="closeModal" style="z-index:-1"></div>`+html;document.body.appendChild(m);return m}
function closeModalEl(m){if(m)m.remove();if(needsRender&&!document.querySelector(".modal")&&!openEv)scheduleRender()}
const menuLine=m=>`<div class="menu-line"><input class="inp mn" placeholder="메뉴" value="${esc(m.name)}" aria-label="메뉴 이름"><input class="inp mp mono" placeholder="$12" value="${esc(m.price)}" aria-label="가격"><button type="button" class="btn sm ghost" data-act="rmMenu" aria-label="줄 삭제">✕</button></div>`;
function saveRests(e){patchEv(e.id,{restaurants:clean(e.restaurants)});flushPatches();const rl=$("#restList");if(rl)rl.innerHTML=restListHTML(e)}
function restModal(rid){
  const e=curEv();e.restaurants=e.restaurants||[];const r=rid?e.restaurants.find(x=>x.id===rid):{name:"",cuisine:"",rating:"",ratingSource:"",price:"",distance:"",address:"",note:"",menu:[]};
  const lines=(r.menu?.length?r.menu:[{name:"",price:""}]).map(menuLine).join("");
  const m=modal(`<form class="card" style="max-height:90vh;overflow-y:auto">
    <h3>${rid?"맛집 수정":"맛집 추가"}</h3>
    <div class="field"><label for="r-name">이름</label><input class="inp" id="r-name" required value="${esc(r.name)}"></div>
    <div class="grid2"><div class="field"><label for="r-cuisine">종류</label><input class="inp" id="r-cuisine" value="${esc(r.cuisine)}" placeholder="한식, 타코…"></div>
      <div class="field"><label for="r-price">가격대</label><input class="inp" id="r-price" value="${esc(r.price)}" placeholder="$$ 또는 1인 $20"></div></div>
    <div class="grid3"><div class="field"><label for="r-rating">평점</label><input class="inp mono" id="r-rating" inputmode="decimal" value="${esc(r.rating)}" placeholder="4.5"></div>
      <div class="field"><label for="r-src">평점 출처</label><input class="inp" id="r-src" value="${esc(r.ratingSource)}" placeholder="Google"></div>
      <div class="field"><label for="r-dist">거리</label><input class="inp" id="r-dist" value="${esc(r.distance)}" placeholder="도보 5분"></div></div>
    <div class="field"><label for="r-addr">주소</label><input class="inp" id="r-addr" value="${esc(r.address)}"></div>
    <div class="field"><label>메뉴 · 가격</label><div class="menu-edit" id="menuEdit">${lines}</div><button type="button" class="btn sm ghost" data-act="addMenu" style="align-self:flex-start">+ 메뉴 줄</button></div>
    <div class="field"><label for="r-note">메모</label><input class="inp" id="r-note" value="${esc(r.note)}" placeholder="웨이팅, 예약 필요 등"></div>
    <div class="row" style="justify-content:space-between">${rid?`<button type="button" class="btn sm danger" data-act="delRest" data-id="${rid}">삭제</button>`:"<span></span>"}
      <div class="row"><button type="button" class="btn" data-act="closeModal">취소</button><button class="btn primary">저장</button></div></div></form>`);
  m.querySelector("form").addEventListener("submit",ev=>{ev.preventDefault();
    const menu=[...m.querySelectorAll(".menu-line")].map(l=>({name:l.querySelector(".mn").value.trim(),price:l.querySelector(".mp").value.trim()})).filter(x=>x.name);
    const g=id=>m.querySelector(id).value.trim();
    const data={name:g("#r-name"),cuisine:g("#r-cuisine"),price:g("#r-price"),rating:g("#r-rating"),ratingSource:g("#r-src"),distance:g("#r-dist"),address:g("#r-addr"),note:g("#r-note"),menu};
    if(!data.name)return;
    if(rid)Object.assign(r,data);else e.restaurants.push({id:uid(),...data});
    saveRests(e);closeModalEl(m);toast("맛집을 저장했어요");
  });
}
function expModal(xid,preset){
  const t=T;const x=xid?t.expenses.find(z=>z.id===xid):Object.assign({title:"",amount:"",cat:"food",dayId:curDay&&curDay!=="hold"?curDay:"",paidBy:L.me||"",memo:"",evId:""},preset||{});
  if(!x)return;
  const st={cat:x.cat,receipt:xid?(L.receipts[xid]||""):""};
  const dayOpts=`<option value="">날짜 미지정</option>`+t.days.map((d,i)=>`<option value="${d.id}" ${d.id===x.dayId?"selected":""}>Day ${i+1} · ${fmtDate(d.date)}</option>`).join("");
  const pOpts=`<option value="">미지정</option>`+t.people.map(p=>`<option value="${p.id}" ${p.id===x.paidBy?"selected":""}>${esc(p.name)}</option>`).join("");
  const otherRc=!st.receipt&&x.receiptBy&&x.receiptBy!==L.me;
  const m=modal(`<form class="card" style="max-height:92vh;overflow-y:auto">
    <h3>${xid?"지출 수정":"지출 추가"}${x.evId?` <span class="hint">${esc(t.events.find(e=>e.id===x.evId)?.title||"")}</span>`:""}</h3>
    <div class="field"><label>영수증 <span class="hint">사진은 이 폰에만 저장돼요</span></label><div id="rcBox">${st.receipt?phImg(st.receipt,"영수증",'class="receipt-prev"'):otherRc?`<p class="hint">${esc(pName(t,x.receiptBy))} 폰에 영수증 사진이 있어요.</p>`:""}</div>
      <div class="row"><button type="button" class="btn sm" data-act="rcPick" data-cap="1">📷 촬영</button><button type="button" class="btn sm" data-act="rcPick">앨범에서</button></div></div>
    <div class="grid2"><div class="field"><label for="x-title">내용</label><input class="inp" id="x-title" value="${esc(x.title)}" placeholder="가게 이름이나 항목"></div>
      <div class="field"><label for="x-amt">금액 (${esc(t.currency)})</label><input class="inp mono" id="x-amt" inputmode="decimal" value="${esc(x.amount)}" placeholder="0" required></div></div>
    <div class="field"><label>카테고리</label><div id="xCat">${catPick(st.cat,"xCat")}</div></div>
    <div class="grid2"><div class="field"><label for="x-day">날짜</label><select class="inp" id="x-day">${dayOpts}</select></div>
      <div class="field"><label for="x-paid">낸 사람</label><select class="inp" id="x-paid">${pOpts}</select></div></div>
    <div class="field"><label for="x-memo">메모</label><input class="inp" id="x-memo" value="${esc(x.memo)}" placeholder="팁 포함, 카드 결제 등"></div>
    <div class="row" style="justify-content:space-between">${xid?`<button type="button" class="btn sm danger" data-act="delExp" data-id="${xid}">삭제</button>`:"<span></span>"}
      <div class="row"><button type="button" class="btn" data-act="closeModal">취소</button><button class="btn primary">저장</button></div></div></form>`);
  m._st=st;
  m.querySelector("form").addEventListener("submit",ev=>{ev.preventDefault();
    const amt=parseFloat(String(m.querySelector("#x-amt").value).replace(/[^0-9.\-]/g,""));
    if(isNaN(amt)){toast("금액을 숫자로 넣어주세요");return}
    const id=xid||("x"+uid());const old=L.receipts[id];
    const data={title:m.querySelector("#x-title").value.trim(),amount:amt,cat:st.cat,dayId:m.querySelector("#x-day").value,paidBy:m.querySelector("#x-paid").value,memo:m.querySelector("#x-memo").value.trim(),evId:x.evId||"",
      receiptBy:st.receipt?(L.me||"?"):(x.receiptBy&&x.receiptBy!==L.me?x.receiptBy:""),createdAt:x.createdAt||Date.now(),by:x.by||L.me||""};
    w(FB.setDoc(ref.d("expenses",id),data));
    if(st.receipt)L.receipts[id]=st.receipt;else delete L.receipts[id];putLocal();if(old&&old!==st.receipt)setTimeout(()=>dropPhoto(old),400);
    closeModalEl(m);if(openEv)setTimeout(()=>openDrawer(openEv),80);toast("지출을 저장했어요");
  });
}
function tripModal(edit){
  const t=edit?T:null;const today=todayISO();if(edit&&!t)return;
  const m=modal(`<form class="card" style="max-height:92vh;overflow-y:auto">
    <h3>${edit?"여행 정보 수정":"새 여행"}</h3>
    <div class="field"><label for="t-name">여행 이름</label><input class="inp" id="t-name" required value="${esc(t?.name||"")}" placeholder="예: 11월 가족 크루즈"></div>
    <div class="field"><label for="t-dest">여행지</label><input class="inp" id="t-dest" value="${esc(t?.destination||"")}" placeholder="도시나 지역"></div>
    <div class="grid2"><div class="field"><label for="t-start">시작일</label><input class="inp mono" type="date" id="t-start" required value="${t?.start||today}"></div>
      <div class="field"><label for="t-end">종료일</label><input class="inp mono" type="date" id="t-end" required value="${t?.end||today}"></div></div>
    ${edit?"":`<div class="field"><label for="t-me">내 이름</label><input class="inp" id="t-me" required placeholder="예: 나, 민수"></div>
      <div class="field"><label for="t-people">함께 가는 사람 (쉼표로 구분, 각자 참여할 때 넣어도 돼요)</label><input class="inp" id="t-people" placeholder="엄마, 아빠"></div>`}
    <p class="hint">${edit?"기간을 줄이면 빠지는 날짜의 일정은 보류함으로 옮겨져요. 바꾼 내용은 모두에게 보여요.":"기간에 맞춰 날짜별 탭과 기본 준비 체크리스트가 만들어지고, 초대 코드가 생겨요 (최대 60일)."}</p>
    <p class="hint" id="t-err" style="color:var(--danger)" hidden></p>
    <div class="row" style="justify-content:space-between">${edit?`<div class="row"><button type="button" class="btn sm" data-act="leave">이 폰에서만 빼기</button>${isOwner()?`<button type="button" class="btn sm danger" data-act="delTrip">모두에게서 삭제</button>`:""}</div>`:"<span></span>"}
    <div class="row"><button type="button" class="btn" data-act="closeModal">취소</button><button class="btn primary">${edit?"저장":"만들기"}</button></div></div></form>`);
  m.querySelector("form").addEventListener("submit",async ev=>{ev.preventDefault();
    const name=m.querySelector("#t-name").value.trim(),dest=m.querySelector("#t-dest").value.trim(),s=m.querySelector("#t-start").value,e=m.querySelector("#t-end").value;
    const err=m.querySelector("#t-err");
    if(!s||!e||e<s){err.textContent="종료일이 시작일보다 빠를 수 없어요.";err.hidden=false;return}
    const dates=daysBetween(s,e);
    if(edit){
      const days=dates.map(dt=>{const o=t.days.find(d=>d.date===dt);return {id:o?o.id:"d"+uid(),date:dt}});
      const keep=new Set(days.map(d=>d.id));
      patchTrip({name,destination:dest,start:s,end:e,days,example:false});
      t.events.forEach(ev=>{if(!keep.has(ev.dayId))patchEv(ev.id,{dayId:days[days.length-1].id,status:"hold"})});
      t.expenses.forEach(x=>{if(x.dayId&&!keep.has(x.dayId))w(FB.updateDoc(ref.d("expenses",x.id),{dayId:""}))});
      flushPatches();closeModalEl(m);
    }else{
      const me=m.querySelector("#t-me").value.trim();if(!me){err.textContent="내 이름을 넣어주세요.";err.hidden=false;return}
      const others=m.querySelector("#t-people").value.split(",").map(x=>x.trim()).filter(Boolean);
      closeModalEl(m);await createTrip({name,destination:dest,start:s,end:e,people:[me,...others],meIndex:0});
    }
  });
}
async function createTrip(o,tid){
  tid=tid||newCode();const dates=daysBetween(o.start,o.end);
  const people=(o.people||[]).map(p=>({id:"p"+uid(),name:typeof p==="string"?p:String(p.name||"")})).filter(p=>p.name);
  const days=dates.map(dt=>({id:"d"+uid(),date:dt}));const titles={};
  const byDate=Object.fromEntries(days.map(d=>[d.date,d.id]));
  const emo={};(o.days||[]).forEach(d=>{const did=byDate[d.date];if(did&&d.title)titles[did]=String(d.title);if(did&&d.emoji)emo[did]=String(d.emoji).slice(0,8)});
  const meId=o.meIndex!=null&&people[o.meIndex]?people[o.meIndex].id:"";
  const b=chunkedBatch();let ops=1;
  b.set(FB.doc(fs,"trips",tid),{name:o.name||"새 여행",destination:o.destination||"",start:o.start,end:o.end,currency:o.currency||"$",budget:Number(o.budget)||0,days,dayTitles:titles,dayEmoji:emo,theme:THEMES[o.theme]?o.theme:"teal",people,createdBy:myUid,owners:[myUid],viewers:[],members:meId?{[myUid]:meId}:{},createdAt:Date.now(),updatedAt:Date.now(),example:!!o.example});
  const ck=(o.checklist&&o.checklist.length?o.checklist.map(c=>[PREP[c.cat]?c.cat:"etc",String(c.text||c),!!c.done]):DEFAULT_CK.map(([c,x])=>[c,tt(x)]));
  ck.forEach(([c,x,dn],i)=>{b.set(FB.doc(fs,"trips",tid,"checklist","c"+uid()),{cat:c,text:x,done:!!dn,order:i});ops++});
  (o.days||[]).forEach(d=>{const did=byDate[d.date];if(!did)return;(d.events||[]).forEach(e=>{if(ops>480)return;b.set(FB.doc(fs,"trips",tid,"events","e"+uid()),evFrom(e,did,people));ops++})});
  (o.expenses||[]).forEach(x=>{b.set(FB.doc(fs,"trips",tid,"expenses","x"+uid()),{title:x.title||"",amount:Number(x.amount)||0,cat:CATS[x.cat]?x.cat:"etc",dayId:byDate[x.date]||"",paidBy:people[x.paidByIndex]?.id||"",memo:x.memo||"",evId:"",receiptBy:"",createdAt:Date.now(),by:""});ops++});
  w(b.commit());
  locals[tid]=newLocal(tid,{name:o.name,start:o.start,me:meId});putLocal(locals[tid]);
  view=o.example?"plan":"prep";selectTrip(tid);
  if(!o.example)toast("여행을 만들었어요. 준비 탭에서 초대 링크를 보내세요");
  return tid;
}
function selectTrip(tid){flushAll();curId=tid;L=tid?locals[tid]:null;curDay=null;pf="";try{pf=localStorage.getItem("tripnote:pf:"+tid)||""}catch(e){}openEv=null;$("#layer").innerHTML="";try{localStorage.setItem("tripnote:cur",tid||"")}catch(_){}if(tid)subscribe(tid);else{unsubs.forEach(u=>u());unsubs=[];T=null}render()}
function joinModal(prefill){
  const m=modal(`<form class="card"><h3>초대 코드로 참여</h3>
    <div class="field"><label for="j-code">초대 코드</label><input class="inp mono" id="j-code" autocomplete="off" autocapitalize="off" placeholder="xxxx-xxxx-xxxx" value="${esc(prefill?fmtCode(prefill):"")}"></div>
    <p class="hint" id="j-msg">처음 참여할 때는 인터넷이 필요해요.</p>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">취소</button><button class="btn primary">참여하기</button></div></form>`);
  m.querySelector("form").addEventListener("submit",async ev=>{ev.preventDefault();
    const code=normCode(m.querySelector("#j-code").value);const msg=m.querySelector("#j-msg");
    if(code.length<12){msg.textContent="코드 12자리를 모두 넣어주세요.";msg.style.color="var(--danger)";return}
    if(locals[code]){closeModalEl(m);selectTrip(code);return}
    msg.textContent="확인 중…";msg.style.color="";
    try{const s=await FB.getDoc(FB.doc(fs,"trips",code));
      if(!s.exists()){msg.textContent="이 코드의 여행을 찾을 수 없어요. 코드를 다시 확인해 주세요.";msg.style.color="var(--danger)";return}
      const d=s.data();locals[code]=newLocal(code,{name:d.name,start:d.start});putLocal(locals[code]);
      closeModalEl(m);view="prep";selectTrip(code);setTimeout(()=>whoModal(),300);
    }catch(e){msg.textContent=navigator.onLine?errMsg(e):"인터넷에 연결된 뒤 다시 시도해 주세요.";msg.style.color="var(--danger)"}
  });
  if(!prefill)m.querySelector("#j-code").focus();
}
function whoModal(){
  if(!T){setTimeout(whoModal,400);return}
  if(document.querySelector(".modal.who"))return;
  const m=modal(`<form class="card"><h3>이 폰을 쓰는 사람은 누구인가요?</h3>
    <p class="hint">기록과 지출에 이 이름이 붙어요. 나중에 바꿀 수 있어요.</p>
    <div class="people">${T.people.map(p=>`<button type="button" class="pchip" data-act="pickMe" data-id="${p.id}" aria-pressed="${p.id===L.me}"><b>${initial(p.name)}</b>${esc(p.name)}</button>`).join("")||`<span class="hint">아직 등록된 사람이 없어요.</span>`}</div>
    <div class="field"><label for="w-new">목록에 없으면 내 이름 추가</label><div class="addline"><input class="inp" id="w-new" placeholder="내 이름"><button class="btn">추가하고 선택</button></div></div>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">나중에</button></div></form>`);
  m.classList.add("who");
  m.querySelector("form").addEventListener("submit",ev=>{ev.preventDefault();const v=m.querySelector("#w-new").value.trim();if(!v)return;
    const p={id:"p"+uid(),name:v};w(FB.updateDoc(ref.trip(),{people:FB.arrayUnion(p)}));T.people=[...T.people,p];setMe(p.id);closeModalEl(m)});
}
function setMe(id){const old=L.me;if(old===id)return;flushNotes();if(T)w(FB.updateDoc(ref.trip(),{["members."+myUid]:id}));
  if(old&&T){T.notes.filter(n=>n.author===old).forEach(n=>{const {id:nid,...rest}=n;w(FB.setDoc(ref.d("notes",n.key+"~"+id),{...rest,author:id}));w(FB.deleteDoc(ref.d("notes",nid)))})}
  L.me=id;Object.values(L.photos).forEach(a=>a.forEach(p=>{if(!p.by||p.by===old)p.by=id}));putLocal();render();toast(`${pName(T,id)}(으)로 정했어요`)}
function letterCard(t){const cnt=key=>allNotes(key).filter(n=>!n.mine&&n.diary&&n.diary.trim()).length;
  const rows=[...t.people.filter(p=>p.id!==L.me).map(p=>({to:p.id,name:p.name})),{to:"all",name:"우리 모두"}];
  const toMe=L.me?cnt("letter-"+L.me):0;
  return `<div class="card"><h3>💌 롤링페이퍼</h3><p class="hint">함께한 사람에게 한 명씩 쪽지를 남겨요. 사진첩 마지막에 "To 이름" 페이지로 모여요. 다른 사람이 쓴 쪽지는 사진첩을 만들 때 처음 열려요.</p>
    ${toMe?`<p class="hint">✉️ <span data-nt>${LANG==="en"?(toMe===1?"1 note is waiting for you":toMe+" notes are waiting for you"):"나에게 온 쪽지 "+toMe+"개가 기다리고 있어요"}</span></p>`:""}
    <div class="lrows">${rows.map(r=>{const key=r.to==="all"?"letter":"letter-"+r.to;const mine=myNote(key).diary;const n=cnt(key);
      return `<div class="lrow"><span><b>To ${esc(r.name)}</b>${n?` <span class="hint">· 다른 사람 쪽지 ${n}개</span>`:""}</span><button class="btn sm${mine?"":" primary"}" data-act="editLetter" data-to="${r.to}">${mine?"✓ 고치기":"쓰기"}</button></div>`}).join("")}</div></div>`}
function capModal(e,i){const p=e&&(L.photos[e.id]||[])[i];if(!p)return;
  const m=modal(`<form class="card"><h3>사진 한 줄</h3><p class="hint">이 사진 아래에 붙어요. 사진첩에도 사진 위에 작게 들어가요.</p>
    <input class="inp" id="cap-in" maxlength="60" placeholder="예: 정상에서 본 노을" value="${esc(p.cap||"")}" autocomplete="off">
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">취소</button><button class="btn primary">저장</button></div></form>`);
  const inp=m.querySelector("#cap-in");setTimeout(()=>inp.focus(),50);
  m.querySelector("form").addEventListener("submit",ev=>{ev.preventDefault();const v=inp.value.trim();if(v)p.cap=v;else delete p.cap;putLocal();closeModalEl(m);if(openEv===e.id)$("#photoGrid").innerHTML=photosHTML(e)})}
function letterModal(to){if(!L.me){whoModal();return}const key=to==="all"?"letter":"letter-"+to;const n=myNote(key);const name=to==="all"?"우리 모두":pName(T,to);
  const m=modal(`<form class="card"><h3>💌 To ${esc(name)}</h3><p class="hint">${to==="all"?"함께한 모두에게 쓰는 쪽지예요.":esc(name)+"에게만 쓰는 쪽지예요. 사진첩의 'To "+esc(name)+"' 페이지에 붙어요."} 짧아도 좋아요.</p>
    <textarea class="inp" id="lt-text" rows="8" placeholder="이번 여행에서 고마웠던 것, 기억에 남는 순간…">${esc(n.diary||"")}</textarea>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">취소</button><button class="btn primary">저장</button></div></form>`);
  m.querySelector("form").addEventListener("submit",ev=>{ev.preventDefault();setMyNote(key,{diary:m.querySelector("#lt-text").value,shared:true},true);closeModalEl(m);toast("쪽지를 저장했어요");setTimeout(render,80)})}
function journalModal(dayId){
  const d=T.days.find(x=>x.id===dayId);const key="day-"+dayId;const n=myNote(key);let shared=n.shared;
  const m=modal(`<form class="card"><h3>${fmtDate(d.date,true)} 내 하루 글</h3>
  <div id="jvis">${visPick("__j",shared)}</div>
  <textarea class="inp" id="j-text" rows="12" placeholder="이날의 이야기">${esc(n.diary||"")}</textarea>
  <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">취소</button><button class="btn primary">저장</button></div></form>`);
  m.addEventListener("click",ev=>{const b=ev.target.closest('[data-act="vis"]');if(!b)return;ev.stopPropagation();shared=b.dataset.v==="1";if(shared&&!L.me){shared=false;whoModal();return}m.querySelector("#jvis").innerHTML=visPick("__j",shared)},true);
  m.querySelector("form").addEventListener("submit",ev=>{ev.preventDefault();setMyNote(key,{diary:m.querySelector("#j-text").value,shared},true);closeModalEl(m);setTimeout(render,80)});
}

/* ================= paste import (from Claude) ================= */
const FORMAT_HINT=`'여행 일정 노트' 앱에 붙여넣을 수 있게 JSON으로만 답해줘. 코드블록 하나에 아래 형식 그대로.
일정 전체일 때:
{"type":"tripnote","name":"여행 이름","destination":"도시","start":"YYYY-MM-DD","end":"YYYY-MM-DD","people":["나","엄마"],
 "days":[{"date":"YYYY-MM-DD","title":"이날 테마","emoji":"🚢","events":[{"start":"HH:MM","end":"HH:MM","title":"일정","cat":"stay|sight|food|move|shop|etc","place":"장소(이동이면 도착지) 이름","address":"주소","origin":"이동 일정의 출발지(없으면 생략)","stops":["경유지"],"with":["이 일정에 참여하는 사람 이름 (모두면 생략)"],"memo":"메모",
   "restaurants":[{"name":"식당","cuisine":"종류","rating":4.5,"ratingSource":"Google","price":"$$","distance":"도보 5분","address":"주소","menu":[{"name":"메뉴","price":"$12"}],"note":"팁"}]}]}],
 "checklist":[{"cat":"doc|book|pack|etc","text":"준비할 것"}]}
맛집만일 때: [{"name":...,"cuisine":...,"rating":...,"ratingSource":...,"price":...,"distance":...,"address":...,"menu":[...],"note":...}]`;
const FORMAT_HINT_EN=`Reply with JSON only so I can paste it into the GoTripJ app. One code block, exactly in this format.
For a full trip:
{"type":"tripnote","name":"Trip name","destination":"City","start":"YYYY-MM-DD","end":"YYYY-MM-DD","people":["Me","Mom"],
 "days":[{"date":"YYYY-MM-DD","title":"Theme of the day","emoji":"🚢","events":[{"start":"HH:MM","end":"HH:MM","title":"Plan","cat":"stay|sight|food|move|shop|etc","place":"Place name (destination if it's a drive)","address":"Address","origin":"Start point of a drive (omit if none)","stops":["Stop"],"with":["Names of people in this plan (omit if everyone)"],"memo":"Memo",
   "restaurants":[{"name":"Restaurant","cuisine":"Cuisine","rating":4.5,"ratingSource":"Google","price":"$$","distance":"5 min walk","address":"Address","menu":[{"name":"Dish","price":"$12"}],"note":"Tip"}]}]}],
 "checklist":[{"cat":"doc|book|pack|etc","text":"Thing to prepare"}]}
For restaurants only: [{"name":...,"cuisine":...,"rating":...,"ratingSource":...,"price":...,"distance":...,"address":...,"menu":[...],"note":...}]
Write all text in English.`;
function parseLoose(text){
  let s=String(text||"").trim().replace(/^```(?:json)?/i,"").replace(/```\s*$/,"").trim();
  const i=Math.min(...["{","["].map(c=>{const k=s.indexOf(c);return k<0?Infinity:k}));if(i===Infinity)throw new Error("no json");
  s=s.slice(i);const close=s[0]==="{"?"}":"]";s=s.slice(0,s.lastIndexOf(close)+1);return JSON.parse(s);
}
const restFrom=r=>({id:uid(),name:String(r.name||""),cuisine:String(r.cuisine||""),rating:r.rating==null?"":String(r.rating),ratingSource:String(r.ratingSource||""),price:String(r.price||""),distance:String(r.distance||""),address:String(r.address||""),note:String(r.note||""),menu:(Array.isArray(r.menu)?r.menu:[]).map(m=>({name:String(m.name||""),price:String(m.price||"")})).filter(m=>m.name)});
const withFrom=(e,pl)=>{if(!Array.isArray(e.with)||!pl||!pl.length)return {};const ids=e.with.map(n=>(pl.find(p=>p.name===String(n).trim())||{}).id).filter(Boolean);return ids.length&&ids.length<pl.length?{with:ids}:{}};
const evFrom=(e,dayId,pl)=>({...withFrom(e,pl),dayId,start:String(e.start||""),end:String(e.end||""),title:String(e.title||"일정"),cat:CATS[e.cat]?e.cat:"etc",place:String(e.place||""),address:String(e.address||""),memo:String(e.memo||""),origin:String(e.origin||""),stops:(Array.isArray(e.stops)?e.stops:[]).map(String).slice(0,8),status:ST[e.status]?e.status:"todo",restaurants:(Array.isArray(e.restaurants)?e.restaurants:[]).map(restFrom).filter(r=>r.name),createdAt:Date.now()});
function pasteModal(){
  const m=modal(`<form class="card" style="max-height:92vh;overflow-y:auto">
    <h3>Claude가 만든 내용 붙여넣기</h3>
    <p class="hint">Claude 채팅에서 받은 JSON을 그대로 붙여넣으세요. 형식을 모르면 '요청 문구 복사'를 눌러 Claude에게 보내면 이 형식으로 만들어줘요.</p>
    <button type="button" class="btn sm" data-act="copyFmt" style="align-self:flex-start">요청 문구 복사</button>
    <textarea class="inp mono" id="pasteIn" rows="9" placeholder='{"type":"tripnote", ...}' style="font-size:12px"></textarea>
    <p class="hint" id="pasteMsg" hidden></p>
    <div class="row" id="pasteBtns" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">취소</button><button class="btn primary">확인</button></div></form>`);
  const msg=m.querySelector("#pasteMsg"),btns=m.querySelector("#pasteBtns");
  m.querySelector("form").addEventListener("submit",ev=>{ev.preventDefault();
    let o;try{o=parseLoose(m.querySelector("#pasteIn").value)}catch(e){msg.hidden=false;msg.style.color="var(--danger)";msg.textContent="읽을 수 없는 형식이에요. JSON 부분만 다시 붙여넣어 주세요.";return}
    msg.style.color="";
    const rests=Array.isArray(o)?o:Array.isArray(o.restaurants)&&!o.days?o.restaurants:null;
    if(rests){const e=curEv();if(!e){msg.hidden=false;msg.textContent="맛집 목록이에요. 일정 상세 화면의 '붙여넣기'에서 넣어주세요.";return}
      const list=rests.map(restFrom).filter(r=>r.name);e.restaurants=[...(e.restaurants||[]),...list];saveRests(e);closeModalEl(m);toast(`맛집 ${list.length}곳을 추가했어요`);return}
    if(!o.days&&!o.start){msg.hidden=false;msg.textContent="여행 일정 형식이 아니에요.";return}
    const dates=(o.days||[]).map(d=>d.date).filter(Boolean).sort();
    const start=o.start||dates[0],end=o.end||dates[dates.length-1];
    if(!start||!end){msg.hidden=false;msg.textContent="여행 날짜(start, end)가 필요해요.";return}
    const nEv=(o.days||[]).reduce((s,d)=>s+(d.events||[]).length,0);
    msg.hidden=false;msg.textContent=`"${o.name||"여행"}" ${fmtDate(start)} ~ ${fmtDate(end)} · 일정 ${nEv}개`;
    btns.innerHTML=`<button type="button" class="btn" data-act="closeModal">취소</button>${T&&!isViewer()?`<button type="button" class="btn" data-pick="merge">현재 여행에 추가</button>`:""}<button type="button" class="btn primary" data-pick="new">새 여행으로 만들기</button>`;
    btns.querySelectorAll("[data-pick]").forEach(b=>b.onclick=async()=>{
      if(b.dataset.pick==="new"){closeModalEl(m);await createTrip({...o,start,end,meIndex:0});toast(`일정 ${nEv}개를 넣었어요`);return}
      let added=0,skipped=0;const bt=chunkedBatch();const titles={};
      (o.days||[]).forEach(d=>{const td=T.days.find(x=>x.date===d.date);if(!td){skipped+=(d.events||[]).length;return}if(d.title&&!td.title)titles["dayTitles."+td.id]=String(d.title);if(d.emoji&&!td.emoji)titles["dayEmoji."+td.id]=String(d.emoji).slice(0,8);
        (d.events||[]).forEach(e=>{bt.set(ref.d("events","e"+uid()),evFrom(e,td.id,T.people));added++})});
      (o.checklist||[]).forEach((c,i)=>bt.set(ref.d("checklist","c"+uid()),{cat:PREP[c.cat]?c.cat:"etc",text:String(c.text||c),done:false,order:Date.now()+i}));
      if(Object.keys(titles).length)bt.update(ref.trip(),titles);
      w(bt.commit());closeModalEl(m);toast(`일정 ${added}개를 넣었어요`+(skipped?` (여행 기간 밖 ${skipped}개 제외)`:""));
    });
  });
}

/* ================= settings / photos / backup ================= */
async function settingsModal(){
  const t=T;
  const m=modal(`<div class="card" style="max-height:92vh;overflow-y:auto">
    <h3>메뉴 <button type="button" class="btn sm" data-act="closeModal">닫기</button></h3>
    <button type="button" class="btn" data-act="decor">🎨 꾸미기 · 화면 · 내비 앱</button><hr>
    ${t?`<span class="eyebrow">이 여행 · ${esc(t.name)}</span>
    <div class="slist">
      <button type="button" class="btn" data-act="expMine">내 사진 보내기 (모으기용)</button>
      <div class="row"><label class="hint" for="mineDay">보낼 날짜</label><select class="inp" id="mineDay" style="width:auto"><option value="">모든 날</option>${t.days.map((d,i)=>`<option value="${d.id}">Day ${i+1} · ${fmtDate(d.date)}</option>`).join("")}</select></div>
      <label class="hint"><input type="checkbox" id="incOrig" checked> 원본 사진 포함 (받는 사람 갤러리에 저장돼요)</label>
      <label class="hint"><input type="checkbox" id="incPriv"> '나만 보기' 기록도 함께 보내기</label>
      <div class="out" id="mineOut"></div>
      <button type="button" class="btn ghost sm" data-act="clearOrig" id="clearOrigBtn">앱에 보관 중인 원본 정리</button>
      <button type="button" class="btn" data-act="impPhotos">사진 합치기 (받은 파일 넣기)</button>
      <div class="out" id="impOut"></div>
      <button type="button" class="btn" data-act="expJournal">여행기용 내보내기</button>
      <div class="row"><label class="hint" for="jSize">사진 크기</label><select class="inp" id="jSize" style="width:auto"><option value="1280">보통 (1280px)</option><option value="900">작게 (900px, 용량 절약)</option></select></div>
      <p class="hint">모든 사람의 함께 보기 기록, 내 기록, 이 폰에 모인 사진과 지출이 들어가요. Claude 채팅에 올리고 "여행기 만들어줘"라고 하세요.</p>
      <div class="out" id="jOut"></div>
      <button type="button" class="btn" data-act="pasteTrip">Claude 일정 붙여넣기</button>
    </div><hr>`:`<div class="slist"><button type="button" class="btn" data-act="pasteTrip">Claude 일정 붙여넣기</button></div><hr>`}
    <span class="eyebrow">이 폰</span>
    <p class="hint" id="stInfo">저장 공간 확인 중…</p>
    <div class="slist">
      <button type="button" class="btn" data-act="expBackup">이 폰 백업 만들기</button>
      <p class="hint">사진, 영수증, 나만 보기 기록과 참여한 여행 목록을 저장해요. 폰을 바꿀 때 '백업 불러오기'로 옮기세요. 마지막 백업: <b>${lastBackupText()}</b></p>
      <button type="button" class="btn" data-act="impBackup">백업 불러오기</button>
      <div class="out" id="bkOut"></div>
      ${installEvt?`<button type="button" class="btn primary" data-act="install">홈 화면에 앱 설치</button>`:""}
    </div><hr><p class="hint" style="text-align:center">${APP.ko} (${APP.en}) · <a href="privacy.html">개인정보 처리방침</a> · <a href="terms.html">이용약관</a></p></div>`);
  try{const est=await navigator.storage.estimate();const per=await (navigator.storage.persisted?navigator.storage.persisted():false);const n=(await dbKeys("photos")).length;
    const origs=(await dbAll("orig").catch(()=>[])).filter(o=>!curId||o.tid===curId);const ob=m.querySelector("#clearOrigBtn");if(ob)ob.textContent=origs.length?`앱에 보관 중인 원본 정리 (${origs.length}장 · ${fmtSize(origs.reduce((a,o)=>a+(o.blob.size||0),0))})`:"보관 중인 원본 없음";if(ob&&!origs.length)ob.disabled=true;
    m.querySelector("#stInfo").innerHTML=`${LANG==="en"?n+(n===1?" photo":" photos"):"사진 "+n+"장"} · 사용 ${fmtSize(est.usage||0)}${est.quota?` / 가능 ${fmtSize(est.quota)}`:""} · ${per?"자동 삭제 방지 켜짐":"<span style='color:var(--hold)'>자동 삭제 방지 꺼짐: 앱을 홈 화면에 설치하면 켜져요</span>"}`}
  catch(e){m.querySelector("#stInfo").textContent=""}
}
const seg=(k,opts)=>`<div class="seg wide" role="group">${opts.map(([v,n])=>`<button type="button" data-act="setPref" data-k="${k}" data-v="${v}" aria-pressed="${prefs[k]===v}">${n}</button>`).join("")}</div>`;
function decorHTML(){const t=T;
  return `<h3>꾸미기 <button type="button" class="btn sm" data-act="closeModal">닫기</button></h3>
  ${t?`<div class="field"><label>이 여행 색 <span class="hint">함께하는 모두에게 보여요</span></label><div class="swatches">${Object.entries(THEMES).map(([k,v])=>`<button type="button" class="sw" data-act="setTheme" data-v="${k}" aria-pressed="${t.theme===k}" style="--sw:${(isDark()?v.d:v.l)[0]}"><i></i>${v.n}</button>`).join("")}</div></div><hr>`:""}
  <span class="eyebrow">이 폰에서만 바뀌어요</span>
  <div class="field"><label>언어 · Language</label><div class="seg" role="group">${[["auto","자동 (폰 설정)"],["ko","한국어"],["en","English"]].map(([k,n])=>`<button type="button" data-act="setLang" data-v="${k}" aria-pressed="${(prefs.lang||"auto")===k}">${n}</button>`).join("")}</div></div>
  <div class="field"><label>화면 밝기</label>${seg("appearance",[["auto","폰 설정 따라"],["light","밝게"],["dark","어둡게"]])}</div>
  <div class="field"><label>글씨 크기</label>${seg("font",[["normal","보통"],["large","크게"],["xl","아주 크게"]])}</div>
  <div class="field"><label>운전 안내에 쓸 앱</label>${seg("nav",[["google","Google 지도"],["waze","Waze"],["apple","Apple 지도"]])}</div>
  <div class="field"><label>예약 도우미 링크</label>${seg("book",[["on","켜기"],["off","끄기"]])}</div>
  <div class="field"><label>카테고리 색</label>${Object.entries(CATS).map(([k,v])=>`<div class="catrow"><span class="cchip cat-${k}" style="align-self:flex-start">${v}</span><div class="dots">${SWATCH.map(c=>`<button type="button" class="dot" data-act="setCatColor" data-k="${k}" data-v="${c}" aria-label="${v} 색 ${c}" aria-pressed="${(prefs.cats||{})[k]===c}" style="background:${c}"></button>`).join("")}<button type="button" class="dot reset" data-act="setCatColor" data-k="${k}" data-v="" aria-pressed="${!(prefs.cats||{})[k]}" aria-label="${v} 기본 색">↺</button></div></div>`).join("")}</div>`}
function decorModal(){modal(`<div class="card decor" style="max-height:92vh;overflow-y:auto">${decorHTML()}</div>`)}
function refreshDecor(b){const c=b.closest(".decor");if(c){const st=c.scrollTop;c.innerHTML=decorHTML();c.scrollTop=st}needsRender=true}
function rolesHTML(){const RL=[["owner","👑 주인"],["editor","참가자"],["viewer","👀 보기 전용"]];
  return `<h3>역할 관리 <button type="button" class="btn sm" data-act="closeModal">닫기</button></h3>
  <p class="hint">주인: 여행 삭제, 역할 바꾸기, 사람 빼기까지 할 수 있어요. 여러 명이어도 돼요.<br>참가자: 일정·예산·체크리스트를 함께 고쳐요.<br>보기 전용: 일정과 예산은 보기만 하고, 자기 기록·사진·반응만 남겨요.</p>
  ${T.people.map(p=>{const r=roleOf(p.id);return `<div class="rolerow"><b>${esc(p.name)}${p.id===L.me?" (나)":""}</b>${r==="none"?`<span class="hint">아직 앱으로 참여하지 않았어요</span>`:`<div class="seg wide" role="group">${RL.map(([k,n])=>`<button type="button" data-act="setRole" data-p="${p.id}" data-r="${k}" aria-pressed="${r===k}">${n}</button>`).join("")}</div>`}</div>`}).join("")}
  <p class="hint">주인을 넘기려면: 넘겨받을 사람을 '주인'으로 바꾼 뒤, 내 역할을 '참가자'로 바꾸세요.</p>`}
function rolesModal(){if(!T)return;modal(`<div class="card">${rolesHTML()}</div>`)}
function emojiModal(dayId){const d=T&&T.days.find(x=>x.id===dayId);if(!d)return;
  modal(`<div class="card"><h3>${fmtDate(d.date,true)} 이모지 <button type="button" class="btn sm" data-act="closeModal">닫기</button></h3>
  <div class="emogrid">${EMOJIS.map(x=>`<button type="button" data-act="setEmoji" data-day="${d.id}" data-v="${x}" aria-pressed="${d.emoji===x}">${x}</button>`).join("")}</div>
  <div class="row" style="justify-content:space-between"><span class="hint">날짜 탭과 여행기에 붙어요 · 모두에게 보여요</span><button type="button" class="btn sm ghost" data-act="setEmoji" data-day="${d.id}" data-v="">빼기</button></div></div>`)}
async function exportMine(out,incPriv,incOrig,dayId){
  out.textContent="만드는 중…";flushAll();
  const files=[],photos=[];let origN=0,origMissing=0;
  const evDay=Object.fromEntries(T.events.map(e=>[e.id,e.dayId]));
  for(const [evId,list] of Object.entries(L.photos)){if(dayId&&evDay[evId]!==dayId)continue;
    for(const p of list){if(p.by&&p.by!==L.me)continue;const r=await dbGet("photos",p.id).catch(()=>null);if(!r)continue;
      files.push({name:`photos/${p.id}.jpg`,blob:r.blob});const ent={id:p.id,evId};if(p.cap)ent.cap=p.cap;
      if(incOrig){const o=await dbGet("orig",p.id).catch(()=>null);if(o){const ext=(o.name.match(/\.[a-z0-9]+$/i)||[".jpg"])[0];ent.orig=`originals/${p.id}${ext}`;ent.origName=o.name;ent.origType=o.type;files.push({name:ent.orig,blob:o.blob});origN++}else origMissing++}
      photos.push(ent);out.textContent=`만드는 중… ${photos.length}장`}}
  let cover=null,coverOrig=null;
  if(L.cover&&!dayId){const r=await dbGet("photos",L.cover).catch(()=>null);if(r){files.push({name:`photos/${L.cover}.jpg`,blob:r.blob});cover=L.cover;
    if(incOrig){const o=await dbGet("orig",L.cover).catch(()=>null);if(o){const ext=(o.name.match(/\.[a-z0-9]+$/i)||[".jpg"])[0];coverOrig={file:`originals/${L.cover}${ext}`,name:o.name,type:o.type};files.push({name:coverOrig.file,blob:o.blob});origN++}}}}
  const notes=incPriv?Object.entries(L.priv).map(([key,n])=>({key,mood:n.mood||"",diary:n.diary||""})):[];
  files.unshift({name:"manifest.json",data:enc.encode(JSON.stringify({app:"tripnote-photos",format:2,tid:curId,trip:T.name,from:L.me,fromName:pName(T,L.me),cover,coverOrig,photos,notes}))});
  if(!photos.length&&!cover&&!notes.length){out.textContent="보낼 사진이 아직 없어요.";return}
  const nm=(pName(T,L.me)||"me").replace(/[^\w가-힣]/g,"");
  const blob=await makeZip(files);const big=blob.size>80*1048576;
  offerFile(out,blob,`gotripj-photos-${encodeURIComponent(nm)===nm?nm:"member"}-${todayISO()}${dayId?"-day"+(T.days.findIndex(d=>d.id===dayId)+1):""}.zip`,
    `사진 ${photos.length}장${cover?" + 표지":""}${origN?` (원본 ${origN}장 포함)`:""}${notes.length?` + 기록 ${notes.length}개`:""}.`+(origMissing?` 원본을 정리한 사진 ${origMissing}장은 가벼운 버전만 들어갔어요.`:"")+(big?" 파일이 커요. Google 드라이브로 보내거나, 날짜별로 나눠서 보내세요.":" 여행기를 만들 사람에게 카톡·메일·드라이브로 보내세요."));
}
function origSaveUI(out,list){
  if(!list.length)return;let idx=0;const B=20;
  const files=list.map(o=>new File([o.blob],o.name,{type:o.type||"image/jpeg"}));
  const box=document.createElement("div");box.className="slist";out.appendChild(box);
  const draw=()=>{const left=files.length-idx;
    box.innerHTML=left<=0?`<p class="hint">원본 ${files.length}장을 모두 넘겼어요.</p>`:IS_IOS
      ?`<button type="button" class="btn primary" data-sv>📥 원본 ${Math.min(B,left)}장 사진 앱에 저장 (${idx+1}~${idx+Math.min(B,left)} / ${files.length})</button><p class="hint">공유 창에서 "이미지 저장"을 누르세요. ${B}장씩 나눠서 저장해요.</p>`
      :`<button type="button" class="btn primary" data-sv>📥 원본 ${files.length}장 갤러리에 저장</button><p class="hint">다운로드 폴더에 저장되고 갤러리의 "Download" 앨범에 보여요. "여러 파일 다운로드" 허용 창이 뜨면 허용을 눌러주세요.</p>`;
    const btn=box.querySelector("[data-sv]");if(!btn)return;
    btn.onclick=async()=>{
      if(IS_IOS&&navigator.canShare){const batch=files.slice(idx,idx+B);try{if(!navigator.canShare({files:batch}))throw new Error("x");await navigator.share({files:batch});idx+=batch.length;draw()}catch(e){if(e&&e.name==="AbortError")return;toast("공유 창을 열 수 없어 다운로드로 저장할게요");dl(batch);idx+=batch.length;draw()}}
      else{btn.disabled=true;await dl(files.slice(idx));idx=files.length;draw();toast("갤러리(Download 앨범)에 저장했어요")}};
  };
  const dl=async arr=>{for(const f of arr){const a=document.createElement("a");a.href=URL.createObjectURL(f);a.download=f.name;document.body.appendChild(a);a.click();setTimeout(((h,el)=>()=>{URL.revokeObjectURL(h);el.remove()})(a.href,a),8000);await new Promise(r=>setTimeout(r,350))}};
  draw();
}
async function importPhotos(out){
  const files=await pickFiles(true,false,".zip,application/zip");if(!files.length)return;
  let added=0,skipped=0,notesN=0;const errs=[],origs=[];
  for(const f of files){out.textContent=`${f.name} 읽는 중…`;
    try{const en=await readZip(new Uint8Array(await f.arrayBuffer()));const mf=en.get("manifest.json");if(!mf)throw new Error("사진 보내기 파일이 아니에요");
      const man=JSON.parse(dec.decode(mf));if(man.app!=="tripnote-photos")throw new Error("사진 보내기 파일이 아니에요");
      if(man.tid!==curId)throw new Error(`다른 여행(${man.trip||"?"})의 파일이에요`);
      const have=new Set(Object.values(L.photos).flat().map(p=>p.id));
      if(man.from!==L.me){for(const p of man.photos){if(p.orig&&en.get(p.orig))origs.push({blob:new Blob([en.get(p.orig)],{type:p.origType||"image/jpeg"}),name:p.origName||p.orig.split("/").pop(),type:p.origType})}
        if(man.coverOrig&&en.get(man.coverOrig.file))origs.push({blob:new Blob([en.get(man.coverOrig.file)],{type:man.coverOrig.type||"image/jpeg"}),name:man.coverOrig.name,type:man.coverOrig.type})}
      for(const p of man.photos){if(have.has(p.id)){if(p.cap){const ex=(L.photos[p.evId]||[]).find(x=>x.id===p.id);if(ex)ex.cap=p.cap}skipped++;continue}const data=en.get(`photos/${p.id}.jpg`);if(!data)continue;
        if(!T.events.some(e=>e.id===p.evId)){skipped++;continue}
        await dbPut("photos",{id:p.id,blob:new Blob([data],{type:"image/jpeg"}),created:Date.now()});(L.photos[p.evId]=L.photos[p.evId]||[]).push(p.cap?{id:p.id,by:man.from,cap:p.cap}:{id:p.id,by:man.from});added++}
      if(man.cover&&!L.cover){const data=en.get(`photos/${man.cover}.jpg`);if(data){await dbPut("photos",{id:man.cover,blob:new Blob([data],{type:"image/jpeg"}),created:Date.now()});L.cover=man.cover}}
      if(man.from!==L.me)(man.notes||[]).forEach(n=>{L.imported=(L.imported||[]).filter(x=>!(x.key===n.key&&x.by===man.from));L.imported.push({key:n.key,by:man.from,mood:n.mood,diary:n.diary});notesN++});
    }catch(e){errs.push(`${f.name}: ${e.message}`)}}
  putLocal();await flushLocal();
  out.innerHTML=`<div>앱에 사진 ${added}장을 합쳤어요${skipped?` (이미 있거나 지워진 일정 ${skipped}장 제외)`:""}${notesN?` · 기록 ${notesN}개`:""}.</div>${errs.map(x=>`<p class="warnline">${esc(x)}</p>`).join("")}`;
  origSaveUI(out,origs);
  needsRender=true;
}
async function exportBackup(out){
  out.textContent="백업 파일을 만드는 중…";flushAll();await flushLocal();
  const snaps={};
  for(const tid of Object.keys(locals)){try{const s=await FB.getDoc(FB.doc(fs,"trips",tid));if(!s.exists())continue;const sub={};for(const c of ["events","expenses","checklist","notes"]){sub[c]=(await FB.getDocs(FB.collection(fs,"trips",tid,c))).docs.map(d=>({id:d.id,...d.data()}))}snaps[tid]={trip:s.data(),...sub}}catch(e){}}
  const files=[{name:"backup.json",data:enc.encode(JSON.stringify({app:"tripnote-share",format:2,exportedAt:new Date().toISOString(),locals:Object.values(locals),snaps}))}];
  for(const id of referenced()){const r=await dbGet("photos",id).catch(()=>null);if(r)files.push({name:"photos/"+id+".jpg",data:new Uint8Array(await r.blob.arrayBuffer())})}
  try{localStorage.setItem("tripnote:lastBackup",String(Date.now()))}catch(e){}
  offerFile(out,await makeZip(files),`gotripj-backup-${todayISO()}.zip`,"Google Drive 같은 폰 밖의 곳에도 한 부 보관해 두세요.");
}
async function importBackup(out){
  const [f]=await pickFiles(false,false,".zip,application/zip");if(!f)return;
  out.textContent="파일을 읽는 중…";
  try{
    const en=await readZip(new Uint8Array(await f.arrayBuffer()));const raw=en.get("backup.json");if(!raw)throw new Error("백업 파일이 아니에요");
    const data=JSON.parse(dec.decode(raw));if(data.app!=="tripnote-share")throw new Error("이 앱의 백업 파일이 아니에요");
    const photos=[...en.keys()].filter(k=>k.startsWith("photos/"));
    out.innerHTML=`<div>여행 ${data.locals.length}개 · 사진 ${photos.length}장${data.exportedAt?` · ${esc(data.exportedAt.slice(0,10))} 백업`:""}</div><div class="row"><button type="button" class="btn primary" data-go>불러오기</button></div>`;
    out.querySelector("[data-go]").onclick=async()=>{out.textContent="불러오는 중…";
      for(const k of photos){await dbPut("photos",{id:k.slice(7).replace(/\.[a-z]+$/i,""),blob:new Blob([en.get(k)],{type:"image/jpeg"}),created:Date.now()})}
      for(const l of data.locals)locals[l.tid]=newLocal(l.tid,l);await flushLocal();
      const missing=[];for(const l of data.locals){try{const s=await FB.getDoc(FB.doc(fs,"trips",l.tid));if(!s.exists()&&data.snaps&&data.snaps[l.tid])missing.push(l.tid)}catch(e){}}
      out.innerHTML=`<div>불러왔어요.</div>${missing.length?`<p class="warnline">서버에서 지워진 여행 ${missing.length}개가 있어요. 백업 내용으로 다시 만들 수 있어요.</p><button type="button" class="btn" data-re>다시 만들기</button>`:""}`;
      const re=out.querySelector("[data-re]");if(re)re.onclick=async()=>{re.disabled=true;for(const tid of missing)await restoreTrip(tid,data.snaps[tid]);out.innerHTML="<div>다시 만들었어요. 초대 코드는 그대로예요.</div>";selectTrip(missing[0])};
      selectTrip(data.locals[0]?.tid||curId);toast("백업을 불러왔어요")};
  }catch(e){out.innerHTML=`<span style="color:var(--danger)">${esc(e.message||"불러오지 못했어요")}</span>`}
}
async function restoreTrip(tid,snap){
  const b=chunkedBatch();b.set(FB.doc(fs,"trips",tid),{...snap.trip,createdBy:myUid,owners:[myUid],viewers:[],members:{...(snap.trip.members||{}),[myUid]:(locals[tid]&&locals[tid].me)||""},updatedAt:Date.now()});let n=1;
  for(const c of ["events","expenses","checklist","notes"])for(const d of snap[c]||[]){if(n>=495)break;const {id,...rest}=d;b.set(FB.doc(fs,"trips",tid,c,id),rest);n++}
  await b.commit().catch(e=>toast(errMsg(e)));
}
const slug=s=>String(s||"").replace(/[\\/:*?"<>|\s]+/g,"_").replace(/^_+|_+$/g,"").slice(0,24)||"사진";
async function exportJournal(out,max){
  const t=T;if(!t)return;out.textContent="여행기 파일을 만드는 중…";flushAll();
  const files=[],L2=[],jobs=[];const nm=id=>pName(t,id)||"누군가";
  const PHD=LANG==="en"?"photos/":"사진/";if(L.cover)jobs.push({name:LANG==="en"?"photos/00_cover.jpg":"사진/00_표지.jpg",id:L.cover});
  L2.push(`# ${t.name}`,"",`- 여행지: ${t.destination||"-"}`,`- 기간: ${fmtDate(t.start,true)} ~ ${fmtDate(t.end,true)} (${t.days.length}일)`,`- 함께: ${t.people.map(p=>p.name).join(", ")||"-"}`,`- 이 파일을 만든 사람: ${nm(L.me)}`,`- 표지 사진: ${L.cover?"사진/00_표지.jpg":"없음"}`,"",
    "> '여행 일정 노트' 앱에서 내보낸 여행 기록입니다. 이 압축 파일을 Claude에게 올리고 여행기를 만들어 달라고 하세요. 기록마다 쓴 사람, 사진마다 찍은 사람이 적혀 있어요.","");
  const evJson=[];const noteLines=ns=>ns.flatMap(n=>[`- ${n.mine?nm(L.me):nm(n.by)}의 기록${n.mood?` (한 줄: ${n.mood})`:""}${reactText(n)}${n.diary?":":""}`,...(n.diary?n.diary.trim().split("\n").map(x=>"  > "+x):[])]);
  t.days.forEach((d,i)=>{
    L2.push(`## ${d.emoji?d.emoji+" ":""}Day ${i+1} · ${fmtDate(d.date,true)}${d.title?" · "+d.title:""}`,"");
    const dn=allNotes("day-"+d.id);if(dn.length)L2.push(...noteLines(dn),"");
    const evs=evsOf(t,d.id).filter(e=>e.status!=="hold");if(!evs.length)L2.push("(일정 없음)","");
    evs.forEach(e=>{
      const names=photosOf(e.id).map((p,j)=>{const n=`${PHD}D${String(i+1).padStart(2,"0")}_${(e.start||"0000").replace(":","")}_${slug(e.title)}_${j+1}.jpg`;jobs.push({name:n,id:p.id});return `${n} (${nm(p.by||L.me)})`});
      const w=withNames(t,e);const exs=t.expenses.filter(x=>x.evId===e.id);const ns=allNotes("ev-"+e.id);
      L2.push(`### ${e.start||""}${e.end?"–"+e.end:""} ${e.title} [${tt(CATS[e.cat])}] · ${tt(ST[e.status])}`);
      if(e.place||e.address)L2.push(`- ${tt(e.cat==="move"?"도착지":"장소")}: ${e.place||""}${e.address?` (${e.address})`:""}`);
      if(e.cat==="move"&&(e.origin||(e.stops||[]).length))L2.push(`- 경로: ${[e.origin||"(현재 위치)",...(e.stops||[]).filter(Boolean),e.place||e.address].join(" → ")}`);
      if(w)L2.push(`- 함께: ${w}`);if(e.memo)L2.push(`- 메모: ${e.memo.replace(/\n/g," / ")}`);
      if(ns.length)L2.push(...noteLines(ns));
      if(names.length)L2.push(`- 사진: ${names.join(", ")}`);
      if((e.restaurants||[]).length)L2.push(`- 맛집 후보: `+e.restaurants.map(r=>`${r.name}${r.cuisine?` (${r.cuisine})`:""}${r.rating?` ★${r.rating}`:""}${r.price?` ${r.price}`:""}`).join("; "));
      if(exs.length)L2.push(`- 지출: `+exs.map(x=>`${x.title||CATS[x.cat]} ${money(x.amount,t)}${x.paidBy?` (${nm(x.paidBy)})`:""}`).join("; "));
      L2.push("");
      evJson.push({day:i+1,date:d.date,start:e.start,end:e.end,title:e.title,category:CATS[e.cat],status:ST[e.status],place:e.place,address:e.address,with:w,memo:e.memo,notes:ns.map(n=>({author:n.mine?nm(L.me):nm(n.by),mood:n.mood,diary:n.diary})),photos:names,restaurants:(e.restaurants||[]).map(({id,...r})=>r)});
    });
  });
  const held=t.events.filter(e=>e.status==="hold");
  if(held.length){L2.push("## 보류한 곳 (이번엔 못 감)","");held.forEach(e=>L2.push(`- ${e.title}${e.place?` · ${e.place}`:""}${e.memo?` (${e.memo.replace(/\n/g," / ")})`:""}`));L2.push("")}
  L2.push("## 지출 요약","",`- 총 지출: ${money(sum(t.expenses),t)}${t.budget?` / 예산 ${money(t.budget,t)}`:""}`);
  Object.keys(CATS).forEach(k=>{const v=sum(t.expenses.filter(x=>x.cat===k));if(v)L2.push(`- ${CATS[k]}: ${money(v,t)}`)});
  t.people.forEach(p=>{const v=sum(t.expenses.filter(x=>x.paidBy===p.id));if(v)L2.push(`- ${p.name} 결제: ${money(v,t)}`)});L2.push("");
  const tj={name:t.name,destination:t.destination,start:t.start,end:t.end,people:t.people.map(p=>p.name),cover:L.cover?"사진/00_표지.jpg":null,currency:t.currency,budget:t.budget,
    days:t.days.map((d,i)=>({day:i+1,date:d.date,title:d.title,notes:allNotes("day-"+d.id).map(n=>({author:n.mine?nm(L.me):nm(n.by),diary:n.diary}))})),events:evJson,
    expenses:t.expenses.map(x=>({date:t.days.find(d=>d.id===x.dayId)?.date||null,title:x.title,amount:x.amount,category:CATS[x.cat],paidBy:nm(x.paidBy),memo:x.memo,event:t.events.find(e=>e.id===x.evId)?.title||null}))};
  files.push({name:LANG==="en"?"trip-info.md":"여행정보.md",data:enc.encode(L2.map(l=>tt(l)).join("\n"))},{name:"trip.json",data:enc.encode(JSON.stringify(tj,null,1))});
  let k=0;for(const j of jobs){k++;out.textContent=`사진 정리 중… ${k}/${jobs.length}`;const r=await dbGet("photos",j.id).catch(()=>null);if(!r)continue;const b=await resizeBlob(r.blob,max,.8);files.push({name:j.name,data:new Uint8Array(await b.arrayBuffer())})}
  const blob=await makeZip(files);
  offerFile(out,blob,`gotripj-journal-${t.start||todayISO()}.zip`,blob.size>25*1048576?"파일이 커요. 올리기 어려우면 사진 크기를 '작게'로 바꿔 다시 만들어 보세요.":"Claude 채팅에 이 파일을 올리고 \"여행기 만들어줘\"라고 하세요.");
}
async function leaveTrip(){const tid=curId;delete locals[tid];await dbDel("local",tid).catch(()=>{});gc();const next=Object.keys(locals)[0]||null;selectTrip(next);toast("이 폰에서 여행을 지웠어요")}
function delTripModal(){const t=T;if(!t)return;
  const m=modal(`<form class="card"><h3 style="color:var(--danger)">여행을 모두에게서 삭제할까요?</h3>
    <p>지우면 <b>함께하는 모든 사람의 폰에서</b> 일정, 예산, 체크리스트, 함께 보기 기록이 사라지고 <b>되돌릴 수 없어요.</b></p>
    <p class="hint">이 폰에서만 안 보이게 하려면 취소하고 '이 폰에서만 빼기'를 누르세요. 초대 코드로 언제든 다시 들어올 수 있어요. 지우기 전에 ⋯ 메뉴에서 백업을 받아 두면 되살릴 수 있어요.</p>
    <div class="field"><label for="dt-name">확인을 위해 여행 이름 <b>${esc(t.name)}</b>을 그대로 입력하세요</label><input class="inp" id="dt-name" autocomplete="off"></div>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">취소</button><button class="btn danger" id="dt-go" disabled>모두에게서 삭제</button></div></form>`);
  const inp=m.querySelector("#dt-name"),go=m.querySelector("#dt-go");inp.oninput=()=>go.disabled=inp.value.trim()!==String(t.name).trim();
  m.querySelector("form").addEventListener("submit",ev=>{ev.preventDefault();if(go.disabled)return;closeModalEl(m);deleteTrip()});setTimeout(()=>inp.focus(),50)}
async function deleteTrip(){const tid=curId;toast("삭제하는 중…");
  try{for(const c of ["events","expenses","checklist","notes"]){const s=await FB.getDocs(ref.col(c,tid));const b=chunkedBatch();s.docs.forEach(d=>b.delete(d.ref));await b.commit()}
    await FB.deleteDoc(ref.trip(tid));await leaveTrip();toast("여행을 삭제했어요")}catch(e){toast(errMsg(e))}}

/* ================= events ================= */
document.addEventListener("submit",ev=>{
  if(!T)return;
  if(ev.target.id==="personForm"){ev.preventDefault();const v=$("#personIn").value.trim();if(!v)return;w(FB.updateDoc(ref.trip(),{people:FB.arrayUnion({id:"p"+uid(),name:v})}));$("#personIn").value=""}
  if(ev.target.id==="ckForm"){ev.preventDefault();const v=$("#ckIn").value.trim();if(!v)return;const c=$("#ckCat").value;w(FB.setDoc(ref.d("checklist","c"+uid()),{cat:c,text:v,done:false,order:Date.now()}));$("#ckIn").value="";$("#ckIn").focus()}
});
document.addEventListener("click",async ev=>{
  const b=ev.target.closest("[data-act]");if(!b)return;
  const a=b.dataset.act,t=T;
  switch(a){
    case "newTrip":tripModal(false);break;
    case "join":joinModal();break;
    case "editTrip":tripModal(true);break;
    case "settings":document.querySelectorAll(".modal").forEach(x=>x.remove());settingsModal();break;
    case "closeModal":closeModalEl(b.closest(".modal"));break;
    case "view":view=b.dataset.v;render();window.scrollTo({top:0});break;
    case "day":curDay=b.dataset.id;render();break;
    case "zoom":{const id=b.dataset.ph;if(!id)break;const u=await photoURL(id);if(!u)break;const l=document.createElement("div");l.className="lightbox";l.innerHTML=`<img src="${u}" alt="크게 보기">`;l.onclick=()=>l.remove();document.body.appendChild(l);break}
    case "loadExample":loadExample();break;
    case "whoami":whoModal();break;
    case "pickMe":setMe(b.dataset.id);closeModalEl(b.closest(".modal"));break;
    case "shareInvite":{const txt=`'${t.name}' 여행에 초대해요.\n안드로이드: 링크를 Chrome으로 열고 ⋮ → 앱 설치\n아이폰: 링크를 Safari로 열고 공유 → 홈 화면에 추가 → 홈 화면 아이콘으로 열어서 '초대 코드로 참여'에 코드 입력\n초대 코드: ${fmtCode(curId)}`;
      if(navigator.share){navigator.share({title:t.name,text:txt,url:inviteLink()}).catch(()=>{})}else{const ok=await navigator.clipboard?.writeText(txt+"\n"+inviteLink()).then(()=>true,()=>false);toast(ok?"초대 문구를 복사했어요":"복사하지 못했어요")}break}
    case "copyCode":{const ok=await navigator.clipboard?.writeText(fmtCode(curId)).then(()=>true,()=>false);toast(ok?"코드를 복사했어요":"복사하지 못했어요");break}
    case "addEv":{const last=evsVis(t,curDay).slice(-1)[0];const id="e"+uid();const nx=last?(last.end||(()=>{const [h,mi]=(last.start||"09:00").split(":").map(Number);return `${String(Math.min(23,(h||9)+1)).padStart(2,"0")}:${String(mi||0).padStart(2,"0")}`})()):"09:00";w(FB.setDoc(ref.d("events",id),{dayId:curDay,start:nx,end:"",title:"새 일정",cat:"sight",place:"",address:"",memo:"",status:"todo",restaurants:[],...(pf?{with:[pf]}:{}),createdAt:Date.now()}));
      setTimeout(()=>{openDrawer(id);const i=$("#f-title");i&&(i.focus(),i.select())},150);break}
    case "open":openDrawer(b.dataset.id);break;
    case "close":closeDrawer();break;
    case "status":{const e=t.events.find(x=>x.id===b.dataset.id);const s=e.status===b.dataset.s?"todo":b.dataset.s;e.status=s;patchEv(e.id,{status:s});flushPatches();render();if(s==="done"){const n=nextEvent(e);if(n){const r=routeOf(n);r.origin="";toastAction(`완료! 다음: ${n.title}`,"🚗 출발",navURL(prefs.nav||"google",r))}else toast("완료! 상세에서 기록과 사진을 남겨보세요")}if(s==="hold")toast("보류함으로 옮겼어요. 모아보기에서 언제든 다시 넣을 수 있어요");break}
    case "unhold":unholdModal(b.dataset.id);break;
    case "photobook":photobookModal();break;
    case "clearSyncErr":syncErr=null;updStatus();break;
    case "dstatus":{const e=curEv();e.status=e.status===b.dataset.s?"todo":b.dataset.s;patchEv(e.id,{status:e.status});flushPatches();
      document.querySelectorAll('.drawer [data-act="dstatus"]').forEach(x=>x.setAttribute("aria-pressed",x.dataset.s===e.status));
      const c=$("#dChip");c.className="chip "+e.status;c.textContent=ST[e.status];break}
    case "evCat":{const e=curEv();const was=e.cat;e.cat=b.dataset.c;patchEv(e.id,{cat:e.cat});if((was==="move")!==(e.cat==="move")){const sc=$(".drawer-body").scrollTop;openDrawer(e.id);$(".drawer-body").scrollTop=sc}else{$("#evCat").innerHTML=catPick(e.cat,"evCat");$("#navRow").innerHTML=navLinks(e)}break}
    case "addStop":{const e=curEv();e.stops=[...(e.stops||[]),""];patchEv(e.id,{stops:e.stops});$("#stopsBox").innerHTML=stopsHTML(e);const ins=document.querySelectorAll("#stopsBox input");ins[ins.length-1]?.focus();break}
    case "rmStop":{const e=curEv();e.stops=(e.stops||[]).filter((_,i)=>i!==+b.dataset.i);patchEv(e.id,{stops:e.stops});$("#stopsBox").innerHTML=stopsHTML(e);$("#navRow").innerHTML=navLinks(e);break}
    case "dayEmoji":emojiModal(curDay);break;
    case "roles":rolesModal();break;
    case "pf":setPf(b.dataset.id);render();break;
    case "setRole":{if(!isOwner())break;const pid=b.dataset.p,r=b.dataset.r;const u=uidsOf(pid);if(!u.length)break;
      const owners=new Set(T.owners),viewers=new Set(T.viewers);u.forEach(x=>{owners.delete(x);viewers.delete(x)});if(r==="owner")u.forEach(x=>owners.add(x));if(r==="viewer")u.forEach(x=>viewers.add(x));
      if(!owners.size){toast("주인이 최소 한 명은 있어야 해요");break}
      const selfOut=u.includes(myUid)&&r!=="owner";if(selfOut&&!confirmTap(b,"한 번 더 누르면 내 주인 권한을 넘겨요"))break;
      T.owners=[...owners];T.viewers=[...viewers];w(FB.updateDoc(ref.trip(),{owners:T.owners,viewers:T.viewers}));
      const c=b.closest(".card");if(c&&isOwner())c.innerHTML=rolesHTML();else{closeModalEl(b.closest(".modal"));toast("주인 권한을 넘겼어요")}needsRender=true;break}
    case "react":{if(!L.me){whoModal();break}const n=T.notes.find(x=>x.id===b.dataset.id);if(!n)break;const cur=(n.reactions||{})[L.me];const v=cur===b.dataset.e?FB.deleteField():b.dataset.e;
      n.reactions=Object.assign({},n.reactions);if(cur===b.dataset.e)delete n.reactions[L.me];else n.reactions[L.me]=b.dataset.e;
      const bar=b.closest(".reacts");if(bar)bar.outerHTML=reactBar({id:n.id,reactions:n.reactions});w(FB.updateDoc(ref.d("notes",n.id),{["reactions."+L.me]:v}));break}
    case "setEmoji":{const v=b.dataset.v;const d=T.days.find(x=>x.id===b.dataset.day);d.emoji=v;patchTrip({["dayEmoji."+d.id]:v});flushPatches();closeModalEl(b.closest(".modal"));render();break}
    case "decor":document.querySelectorAll(".modal").forEach(x=>x.remove());decorModal();break;
    case "setTheme":{T.theme=b.dataset.v;patchTrip({theme:b.dataset.v});flushPatches();applyTheme();refreshDecor(b);break}
    case "setLang":prefs.lang=b.dataset.v;savePrefs();location.reload();break;
    case "setPref":{const k=b.dataset.k,v=b.dataset.v;prefs[k]=v;savePrefs();refreshDecor(b);break}
    case "setCatColor":{const k=b.dataset.k,v=b.dataset.v;prefs.cats=Object.assign({},prefs.cats);if(v)prefs.cats[k]=v;else delete prefs.cats[k];savePrefs();refreshDecor(b);break}
    case "toggleWith":{const e=curEv();let ids=e.with||t.people.map(p=>p.id);ids=ids.includes(b.dataset.id)?ids.filter(i=>i!==b.dataset.id):[...ids,b.dataset.id];e.with=ids;patchEv(e.id,{with:ids});$("#withRow").innerHTML=withChips(t,e);break}
    case "vis":{if(b.closest(".modal"))break;const key=b.dataset.k;const shared=b.dataset.v==="1";if(shared&&!L.me){whoModal();break}
      setMyNote(key,{shared},true);$("#visBox").innerHTML=visPick(key,shared);toast(shared?"함께 보기: 다른 사람도 이 기록을 볼 수 있어요":"나만 보기: 이 폰에만 저장돼요");break}
    case "dupEv":{const e=curEv();flushPatches();const {id,...rest}=e;const nid="e"+uid();w(FB.setDoc(ref.d("events",nid),clean({...rest,status:"todo",restaurants:(e.restaurants||[]).map(r=>({...r,id:uid()})),createdAt:Date.now()})));setTimeout(()=>openDrawer(nid),150);toast("복제했어요");break}
    case "delEv":{if(!confirmTap(b))break;const id=openEv;patches.ev.delete(id);w(FB.deleteDoc(ref.d("events",id)));t.expenses.filter(x=>x.evId===id).forEach(x=>w(FB.updateDoc(ref.d("expenses",x.id),{evId:""})));
      const ph=photosOf(id);delete L.photos[id];putLocal();setTimeout(()=>ph.forEach(p=>dropPhoto(p.id)),400);closeDrawer();toast("삭제했어요");break}
    case "addPhoto":{const e=curEv();const files=await pickFiles(true);if(!files.length)break;const grid=$("#photoGrid");
      for(const f of files){grid&&grid.insertAdjacentHTML("afterbegin",`<div class="ph"><div class="hint" style="padding:8px">저장 중…</div></div>`);
        try{const id=await savePhoto(f,1800,true);(L.photos[e.id]=L.photos[e.id]||[]).push({id,by:L.me||""});putLocal()}catch(err){toast("사진을 저장하지 못했어요. 저장 공간을 확인해 주세요.")}}
      if(openEv===e.id)$("#photoGrid").innerHTML=photosHTML(e);break}
    case "capPhoto":capModal(curEv(),+b.dataset.i);break;
    case "rmPhoto":{const e=curEv();const [p]=L.photos[e.id].splice(+b.dataset.i,1);putLocal();$("#photoGrid").innerHTML=photosHTML(e);if(p)setTimeout(()=>dropPhoto(p.id),400);break}
    case "pickCover":{const [f]=await pickFiles(false);if(!f)break;try{const old=L.cover;L.cover=await savePhoto(f,2400,true);putLocal();render();setTimeout(()=>dropPhoto(old),400);toast("표지 사진을 저장했어요")}catch(err){toast("사진을 저장하지 못했어요")}break}
    case "renamePerson":renamePersonModal(b.dataset.id);break;
    case "rmPerson":{if(!isOwner()){toast("사람 빼기는 주인만 할 수 있어요");break}if(!confirmTap(b,"빼기?"))break;const p=t.people.find(x=>x.id===b.dataset.id);if(p)w(FB.updateDoc(ref.trip(),{people:FB.arrayRemove(p)}));if(p&&p.id===L.me){L.me="";putLocal()}break}
    case "ck":{const c=t.checklist.find(x=>x.id===b.dataset.id);c.done=b.checked;b.closest(".ck").classList.toggle("on",c.done);w(FB.updateDoc(ref.d("checklist",c.id),{done:c.done}));break}
    case "rmCk":ev.preventDefault();w(FB.deleteDoc(ref.d("checklist",b.dataset.id)));break;
    case "addExp":expModal(null);break;
    case "addExpEv":{const e=curEv();expModal(null,{evId:e.id,dayId:e.dayId,cat:e.cat,title:e.title});break}
    case "editExp":expModal(b.dataset.id);break;
    case "delExp":{if(!confirmTap(b))break;const id=b.dataset.id;w(FB.deleteDoc(ref.d("expenses",id)));const rc=L.receipts[id];delete L.receipts[id];putLocal();setTimeout(()=>dropPhoto(rc),400);closeModalEl(b.closest(".modal"));if(openEv)setTimeout(()=>openDrawer(openEv),120);break}
    case "xCat":{const m=b.closest(".modal");m._st.cat=b.dataset.c;m.querySelector("#xCat").innerHTML=catPick(m._st.cat,"xCat");break}
    case "rcPick":{const m=b.closest(".modal");const [f]=await pickFiles(false,!!b.dataset.cap);if(!f||!m.isConnected)break;
      try{const id=await savePhoto(f,2000);m._st.receipt=id;m.querySelector("#rcBox").innerHTML=phImg(id,"영수증",'class="receipt-prev"');m.querySelector("#x-amt").focus()}catch(err){toast("영수증을 저장하지 못했어요")}break}
    case "addRest":restModal(null);break;
    case "pasteRest":pasteModal();break;
    case "pasteTrip":document.querySelectorAll(".modal").forEach(x=>x.remove());pasteModal();break;
    case "copyFmt":{const ok=await navigator.clipboard?.writeText(LANG==="en"?FORMAT_HINT_EN:FORMAT_HINT).then(()=>true,()=>false);toast(ok?"복사했어요. Claude에게 원하는 일정과 함께 보내세요":"복사하지 못했어요");break}
    case "editRest":restModal(b.dataset.id);break;
    case "delRest":{if(!confirmTap(b))break;const e=curEv();e.restaurants=(e.restaurants||[]).filter(r=>r.id!==b.dataset.id);saveRests(e);closeModalEl(b.closest(".modal"));break}
    case "addMenu":$("#menuEdit").insertAdjacentHTML("beforeend",menuLine({name:"",price:""}));break;
    case "rmMenu":b.closest(".menu-line").remove();break;
    case "editJournal":journalModal(b.dataset.id);break;
    case "editLetter":letterModal(b.dataset.to||"all");break;
    case "expMine":{const m=b.closest(".modal");b.disabled=true;await exportMine(m.querySelector("#mineOut"),m.querySelector("#incPriv").checked,m.querySelector("#incOrig").checked,m.querySelector("#mineDay").value).catch(e=>{console.error(e);toast("파일을 만들지 못했어요")});b.disabled=false;break}
    case "clearOrig":{if(!confirmTap(b,"보내기를 마쳤다면 한 번 더 누르세요"))break;const all=await dbAll("orig").catch(()=>[]);let n=0;for(const o of all)if(o.tid===curId){await dbDel("orig",o.id);n++}b.textContent=`원본 ${n}장을 정리했어요 (갤러리 원본은 그대로예요)`;b.disabled=true;break}
    case "impPhotos":importPhotos(b.closest(".modal").querySelector("#impOut"));break;
    case "expBackup":b.disabled=true;await exportBackup(b.closest(".modal").querySelector("#bkOut")).catch(e=>{console.error(e);toast("백업을 만들지 못했어요")});b.disabled=false;break;
    case "impBackup":importBackup(b.closest(".modal").querySelector("#bkOut"));break;
    case "expJournal":{const m=b.closest(".modal");b.disabled=true;await exportJournal(m.querySelector("#jOut"),+m.querySelector("#jSize").value).catch(e=>{console.error(e);toast("파일을 만들지 못했어요")});b.disabled=false;break}
    case "install":if(installEvt){installEvt.prompt();installEvt=null;b.remove()}break;
    case "leave":{if(!confirmTap(b,"한 번 더: 이 폰에서만 빼요"))break;closeModalEl(b.closest(".modal"));leaveTrip();break}
    case "delTrip":closeModalEl(b.closest(".modal"));delTripModal();break;
  }
});
document.addEventListener("input",ev=>{
  const el=ev.target;if(!T)return;
  if(el.id==="dayTitle"){const d=T.days.find(x=>x.id===curDay);d.title=el.value;patchTrip({["dayTitles."+curDay]:el.value});return}
  if(el.id==="budgetIn"){T.budget=parseFloat(el.value.replace(/[^0-9.]/g,""))||0;patchTrip({budget:T.budget});return}
  if(el.id==="curIn"){T.currency=el.value.trim().slice(0,4);patchTrip({currency:T.currency});return}
  if(el.dataset.note){setMyNote(el.dataset.k,{[el.dataset.note]:el.value});return}
  if(el.dataset.stop!=null&&openEv){const e=curEv();if(!e)return;e.stops=[...(e.stops||[])];e.stops[+el.dataset.stop]=el.value;patchEv(e.id,{stops:e.stops});$("#navRow").innerHTML=navLinks(e);return}
  const f=el.dataset.f;if(!f||!openEv)return;const e=curEv();if(!e)return;e[f]=el.value;patchEv(e.id,{[f]:el.value});
  if(f==="address"||f==="place"||f==="origin")$("#navRow").innerHTML=navLinks(e);
});
document.addEventListener("change",ev=>{
  const el=ev.target;
  if(el.id==="tripSel"){selectTrip(el.value);return}
  if(el.id==="budgetIn"||el.id==="curIn"){flushPatches();render();return}
});
document.addEventListener("keydown",ev=>{if(ev.key==="Escape"){const l=document.querySelector(".lightbox");if(l){l.remove();return}const m=document.querySelector(".modal");if(m)closeModalEl(m);else if(openEv)closeDrawer()}});
$("#newTripBtn").addEventListener("click",()=>{if(!fs)return;const m=modal(`<div class="card"><h3>여행 추가</h3><div class="slist"><button class="btn primary" data-act="newTrip">+ 새 여행 만들기</button><button class="btn" data-act="join">초대 코드로 참여</button><button class="btn" data-act="pasteTrip">Claude 일정 붙여넣기</button></div><div class="row" style="justify-content:flex-end"><button class="btn" data-act="closeModal">닫기</button></div></div>`);m.addEventListener("click",e=>{if(e.target.closest('[data-act="newTrip"],[data-act="join"]'))m.remove()},true)});
$("#menuBtn").addEventListener("click",()=>{if(fs)settingsModal()});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e});

/* ================= example ================= */
function loadExample(){
  createTrip(deepTx({name:"예시 · 샌안토니오 주말",destination:"San Antonio, TX",start:"2026-11-07",end:"2026-11-08",people:["나","친구"],meIndex:0,budget:400,example:true,
    checklist:[{cat:"doc",text:"신분증 확인",done:true},{cat:"book",text:"숙소 예약 확인",done:true},{cat:"book",text:"리버워크 보트 티켓"},{cat:"pack",text:"편한 신발"},{cat:"etc",text:"출발 전 단체 사진 찍기"}],
    days:[{date:"2026-11-07",title:"다운타운 걷기",events:[
      {start:"10:00",end:"11:30",title:"알라모 둘러보기",cat:"sight",place:"The Alamo",address:"300 Alamo Plaza, San Antonio, TX",memo:"입장 무료, 교회 내부는 시간 지정 티켓",status:"done"},
      {start:"12:00",end:"13:30",title:"점심 · 마켓 스퀘어",cat:"food",place:"Historic Market Square",address:"514 W Commerce St, San Antonio, TX",restaurants:[{name:"Mi Tierra Café y Panadería",cuisine:"텍스멕스 · 베이커리",price:"$$",distance:"마켓 스퀘어 안",note:"예시 항목입니다. 평점과 가격은 직접 확인해서 채워 보세요.",menu:[{name:"엔칠라다 플레이트",price:"확인 필요"}]}]},
      {start:"18:30",end:"20:00",title:"리버워크 보트 투어",cat:"sight",place:"San Antonio River Walk",address:"San Antonio River Walk, San Antonio, TX",memo:"해 질 무렵 출발이 예쁨",status:"hold"}]},
     {date:"2026-11-08",title:"펄 디스트릭트와 미션",events:[
      {start:"09:30",end:"11:00",title:"펄 파머스 마켓",cat:"shop",place:"Pearl District",address:"303 Pearl Pkwy, San Antonio, TX"},
      {start:"13:00",end:"15:00",title:"미션 산호세",cat:"sight",place:"Mission San José",address:"6701 San Jose Dr, San Antonio, TX"}]}],
    expenses:[{title:"주유 (예시)",amount:42.5,cat:"move",date:"2026-11-07",paidByIndex:0},{title:"호텔 1박 (예시)",amount:139,cat:"stay",date:"2026-11-07",paidByIndex:1}]}));
}

/* ================= boot ================= */
function setupScreen(msg){$("#app").innerHTML=`<div class="empty"><span class="eyebrow">설정 필요</span><h2>${esc(msg.title)}</h2><p>${msg.body}</p></div>`;setStatus("")}
async function boot(){
  if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
  applyTheme();
  if(!window.FB){setupScreen({title:"앱 파일이 빠졌어요",body:"firebase-bundle.js 파일이 함께 올라갔는지 확인해 주세요."});return}
  if(!CFG.apiKey||!CFG.projectId){setupScreen({title:"Firebase 설정을 넣어주세요",body:"firebase-config.js 파일에 Firebase 프로젝트 값을 붙여넣고 다시 올려주세요. 방법은 README.txt에 있어요."});return}
  try{(await dbAll("local")).forEach(l=>{locals[l.tid]=newLocal(l.tid,l)})}catch(e){setStatus("이 브라우저에서는 저장할 수 없어요. Chrome이나 Safari로 열어주세요.")}
  setStatus("연결 중…");
  try{await initFirebase()}catch(e){console.error(e);const c=e&&e.code||"";
    setupScreen(c.includes("operation-not-allowed")||c.includes("admin-restricted")?{title:"익명 로그인을 켜주세요",body:"Firebase 콘솔 → Authentication → 로그인 방법에서 '익명'을 사용 설정해 주세요."}
      :c.includes("network")||!navigator.onLine?{title:"인터넷 연결이 필요해요",body:"처음 한 번은 인터넷에 연결된 상태에서 열어야 해요. 그 뒤로는 오프라인에서도 열려요."}
      :c.includes("api-key")||c.includes("invalid")?{title:"Firebase 설정 값을 확인해 주세요",body:"firebase-config.js의 값이 Firebase 콘솔의 값과 같은지 확인해 주세요."}
      :{title:"연결하지 못했어요",body:esc(c||String(e))});return}
  let s=null;try{s=localStorage.getItem("tripnote:cur")}catch(_){}
  const first=locals[s]?s:(Object.values(locals).sort((a,b)=>(a.start||"").localeCompare(b.start||""))[0]?.tid||null);
  selectTrip(first);
  const m=location.hash.match(/^#join-([a-z0-9]{12,})$/i);
  if(m){history.replaceState(null,"",location.pathname+location.search);const code=normCode(m[1]);if(locals[code])selectTrip(code);else joinModal(code)}
  gc();
}
boot();
})();
