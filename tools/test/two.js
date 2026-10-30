const { chromium } = require('playwright');
const SP=process.env.SP, URL='http://localhost:8770/';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await chromium.launch();
 const mk=async()=>{const c=await b.newContext({locale:'ko-KR',viewport:{width:400,height:860},acceptDownloads:true,serviceWorkers:'block'});const p=await c.newPage();p.errs=[];
   p.on('pageerror',e=>p.errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')p.errs.push('CONSOLE '+m.text())});return p};
 const A=await mk(), B=await mk();
 // A creates trip
 await A.goto(URL);await wait(500);
 await A.click('text=+ 새 여행 만들기');await A.fill('#t-name','가족 크루즈');await A.fill('#t-dest','Galveston');
 await A.fill('#t-start','2026-11-23');await A.fill('#t-end','2026-11-25');await A.fill('#t-me','나');await A.fill('#t-people','엄마');
 await A.click('.modal button.primary');await wait(800);
 const code=(await A.locator('.invite .code').innerText()).replace(/-/g,'');console.log('code',code,code.length);
 await A.screenshot({path:SP+'/t1.png',fullPage:true});
 // A adds event
 await A.click('[data-act=view][data-v=plan]');await wait(200);
 await A.click('[data-act=addEv]');await wait(600);
 await A.fill('#f-title','승선');await A.fill('#f-place','Galveston Cruise Terminal');await wait(700);
 await A.click('.drawer-head [data-act=close]');await wait(300);
 await A.click('[data-act=addEv]');await wait(600);await A.fill('#f-title','저녁 뷔페');await wait(700);await A.click('.drawer-head [data-act=close]');await wait(300);
 // A expense
 await A.click('[data-act=view][data-v=budget]');await A.click('[data-act=addExp] >> nth=0');await A.fill('#x-title','주차');await A.fill('#x-amt','60');await A.click('.modal button.primary');await wait(500);
 // B joins
 await B.goto(URL+'#join-'+code);await wait(900);
 await B.click('.modal button.primary');await wait(900);
 console.log('B who modal', await B.locator('.modal.who').count());
 await B.click('.modal.who [data-act=pickMe] >> text=엄마');await wait(400);
 await B.click('[data-act=view][data-v=plan]');await wait(300);
 console.log('B sees events', await B.locator('.ev-title').allInnerTexts());
 await B.click('[data-act=view][data-v=budget]');await wait(200);
 console.log('B sees expense', await B.locator('.exp .t').allInnerTexts());
 // B: mark 승선 done, shared note; private note on 저녁 뷔페
 await B.click('[data-act=view][data-v=plan]');await wait(200);
 await B.click('.ev:has-text("승선") [data-act=status][data-s=done]');await wait(300);
 await B.click('.ev-title:has-text("승선")');await wait(300);
 await B.click('#visBox [data-v="1"]');await wait(200);
 await B.fill('#n-mood','설렘');await B.fill('#n-diary','배가 엄청 크다!');await wait(900);
 const [fc]=await Promise.all([B.waitForEvent('filechooser'),B.click('[data-act=addPhoto]')]);await fc.setFiles(SP+'/test.jpg');await wait(1000);
 await B.click('.drawer-head [data-act=close]');await wait(300);
 await B.click('.ev-title:has-text("저녁 뷔페")');await wait(300);
 await B.fill('#n-diary','비밀 메모: 디저트 너무 많이 먹음');await wait(900);
 await B.click('.drawer-head [data-act=close]');await wait(500);
 // A view
 await A.click('[data-act=view][data-v=plan]');await wait(500);
 console.log('A status 승선', await A.locator('.ev:has-text("승선") .chip').innerText());
 await A.click('[data-act=view][data-v=journal]');await wait(500);
 const aj=await A.locator('#app').innerText();
 console.log('A journal has shared note', aj.includes('배가 엄청 크다'), '| has private', aj.includes('비밀 메모'));
 // B exports photos
 await B.click('#menuBtn');await wait(300);await B.click('[data-act=expMine]');await B.waitForSelector('#mineOut [data-dl]');
 const [dl]=await Promise.all([B.waitForEvent('download'),B.click('#mineOut [data-dl]')]);await dl.saveAs(SP+'/mine.zip');console.log('B export',dl.suggestedFilename());
 // A imports
 await A.click('#menuBtn');await wait(300);
 const [fc2]=await Promise.all([A.waitForEvent('filechooser'),A.click('[data-act=impPhotos]')]);await fc2.setFiles(SP+'/mine.zip');await wait(1200);
 console.log('A import:', await A.locator('#impOut').innerText());
 await A.click('[data-act=expJournal]');await A.waitForSelector('#jOut [data-dl]',{timeout:10000});
 const [dl2]=await Promise.all([A.waitForEvent('download'),A.click('#jOut [data-dl]')]);await dl2.saveAs(SP+'/journal2.zip');
 await A.click('.modal .card [data-act=closeModal] >> nth=0');await wait(500);
 await A.screenshot({path:SP+'/t2.png',fullPage:true});
 await B.click('.modal .card [data-act=closeModal] >> nth=0');await wait(300);await B.click('[data-act=view][data-v=prep]');await wait(300);
 await B.screenshot({path:SP+'/t3.png',fullPage:true});
 // offline-ish: B reload keeps trip & me
 await B.reload();await wait(1200);console.log('B after reload title', await B.locator('.pass h1').innerText().catch(()=>'none'), '| me', await B.locator('.pchip.is-me').innerText().catch(()=>'none'));
 console.log('ERR A',JSON.stringify(A.errs),'ERR B',JSON.stringify(B.errs));
 await b.close();
})().catch(e=>{console.error('TEST FAIL',e);process.exit(1)});
