/**
 * Browser QA for the Editorial homepage.
 * IMPORTANT: the local test server substitutes a blank config.js so no production
 * Firebase project, Telegram bot or payment provider is contacted.
 * Run: npm install --no-save playwright && npx playwright install chromium
 *      node tests/editorial-browser.mjs
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts','editorial-browser');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    if(path==='/config.js'){
      res.writeHead(200,{'content-type':'text/javascript','cache-control':'no-store'});
      res.end('export const firebaseConfig=null; export const TEACHER_EMAIL="";');
      return;
    }
    const full=resolve(root,'.'+path.replace(/\/$/,'/index.html'));
    if(full!==root&&!full.startsWith(root+'/'))throw Error('Invalid path');
    const bytes=await readFile(full);
    res.writeHead(200,{'content-type':mime[extname(full)]||'application/octet-stream'});
    res.end(bytes);
  }catch(e){res.writeHead(404);res.end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port+'/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];
let failed=false;
async function check(label,fn){
  try {await fn();results.push({label,status:'PASS'});console.log('PASS',label);}
  catch(e){failed=true;results.push({label,status:'FAIL',error:String(e.message||e)});console.error('FAIL',label,String(e.message||e));}
}
async function guest(page){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('[data-act="demo-role"][data-role="guest"]').waitFor({timeout:15000});
  await page.locator('[data-act="demo-role"][data-role="guest"]').click();
  await page.locator('.ed-stage').waitFor({timeout:15000});
  await page.locator('.lx-teach .tcard').first().waitFor({timeout:15000});
}
async function open({width,height=900,mobile=false}){
 const context=await browser.newContext({viewport:{width,height},isMobile:mobile,deviceScaleFactor:1,reducedMotion:'reduce'});
 const page=await context.newPage();
 page.on('pageerror',e=>console.error('PAGE ERROR',e.message));
 await guest(page);
 return {page,context};
}
try{
  for(const width of [360,390,768,1440]){
    const {page,context}=await open({width,height:width>800?950:850});
    await check('No horizontal overflow at '+width+'px',async()=>{
      const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:innerWidth}));
      if(d.scroll>d.view+3)throw Error(JSON.stringify(d));
    });
    await check('Editorial visual styles loaded at '+width+'px',async()=>{
      const styles=await page.evaluate(()=>({
        background:getComputedStyle(document.body).backgroundColor,
        stage:getComputedStyle(document.querySelector('.ed-stage')).backgroundColor,
        display:getComputedStyle(document.querySelector('.ed-stage')).display
      }));
      if(styles.background!=='rgb(248, 246, 238)')throw Error('Wrong body color: '+JSON.stringify(styles));
      if(styles.display==='none')throw Error('Hero hidden');
    });
    await page.screenshot({path:join(out,'editorial-'+width+'px.png'),fullPage:true,animations:'disabled'});
    await context.close();
  }
  const {page,context}=await open({width:1280,height:900});
  await check('EN/UZ/RU locale switches',async()=>{
    for(const l of ['uz','ru','en']){
      await page.locator('[data-act="lang"][data-l="'+l+'"]').click();
      await page.waitForFunction(x=>document.documentElement.lang===x,l);
      if(await page.locator('h1').count()===0)throw Error('Header disappeared after '+l);
    }
  });
  await check('Individual/group format updates quote',async()=>{
    await page.locator('[data-act="lx-fmt"][data-f="group"]').click();
    if(await page.locator('[data-act="lx-fmt"][data-f="group"]').getAttribute('aria-pressed')!=='true')throw Error('Group not selected');
    await page.locator('[data-act="lx-fmt"][data-f="ind"]').click();
    if(await page.locator('[data-act="lx-fmt"][data-f="ind"]').getAttribute('aria-pressed')!=='true')throw Error('Individual not selected');
    if(!await page.locator('#lx-out').isVisible())throw Error('Price quote hidden');
  });
  await check('Student/teacher audience tabs',async()=>{
    await page.locator('#lx-tab-t').click();
    if(await page.locator('#lx-tab-t').getAttribute('aria-selected')!=='true')throw Error('Teacher tab not selected');
    await page.locator('#lx-tab-s').click();
    if(await page.locator('#lx-tab-s').getAttribute('aria-selected')!=='true')throw Error('Student tab not selected');
  });
  await check('Teacher profile opens and closes',async()=>{
    await page.locator('.lx-teach .tcard').first().click();
    await page.locator('#dlg .tprof').waitFor();
    await page.locator('#dlg [data-act="dlg-close"]').first().click();
    await page.locator('#dlg .tprof').waitFor({state:'hidden'});
  });
  await check('Free trial form opens without submitting user data',async()=>{
    await page.locator('.lx-hero [data-act="c-trial"]').first().click();
    await page.locator('#tr-form').waitFor();
    if(!await page.locator('#tr-contact').isVisible())throw Error('Contact field missing');
    await page.locator('#tr-form [data-act="dlg-close"]').click();
  });
  await check('FAQ expands',async()=>{
    await page.locator('.lx-acc details').first().locator('summary').click();
    const opened=await page.locator('.lx-acc details').first().getAttribute('open');
    if(opened===null)throw Error('FAQ not expanded');
  });
  await check('Sign-in opens existing login page',async()=>{
    await page.locator('.lx-foot [data-act="c-signin"]').click();
    const v=await page.locator('#main').innerText();
    if(!v.toLowerCase().includes('sign in')&&!v.toLowerCase().includes('login'))throw Error('No login form: '+v.slice(0,160));
  });
  await context.close();
}finally{
 await browser.close();
 await new Promise(r=>server.close(r));
}
await (await import('node:fs/promises')).writeFile(join(out,'results.json'),JSON.stringify(results,null,2));
console.log('RESULTS',results.filter(r=>r.status==='PASS').length,'passed,',results.filter(r=>r.status==='FAIL').length,'failed');
if(failed)process.exitCode=1;
