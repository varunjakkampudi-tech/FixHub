import asyncio,json,time,re
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[2]; OUT=Path('/tmp/browser/final')
OUT.mkdir(parents=True,exist_ok=True)
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True);context=await browser.new_context(viewport={'width':1280,'height':1800});page=await context.new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)));registry=json.loads((ROOT/'src/features/fixhub/route-registry.json').read_text());results=[];start=time.time()
  await page.goto('http://localhost:8080/sign-in');await page.locator('#auth-persona').wait_for();await page.locator('#auth-persona').select_option('sample-c1');await page.get_by_role('button',name='Continue',exact=True).click();await page.wait_for_timeout(600)
  for row in registry:
   role=row['role'];persona={'customer':'sample-c1','merchant':'sample-m1','technician':'sample-t1','admin':'sample-admin','demo':'sample-c1','public':'sample-c1'}[role]
   await page.evaluate('(id)=>sessionStorage.setItem("fixhub-demo-persona",id)',persona)
   route=row['route'];url=route.replace('$category','electrician').replace('$service','inspection')
   if '$id' in url:
    id='sample-m1' if '/merchants/' in url else 'sample-t1' if '/technicians/' in url else 'sample-c1' if '/customers/' in url else 'tanuku' if '/cities/' in url else 'electrician' if '/service/' in url else 'SAMPLE-001'
    url=url.replace('$id',id)
   before=len(errors)
   try:
    response=await page.goto('http://localhost:8080'+url,wait_until='domcontentloaded',timeout=20000);await page.locator('h1').first.wait_for(timeout=6000);await page.get_by_text('DEMO MODE · Fictional local browser simulation',exact=True).wait_for(timeout=12000);await page.wait_for_timeout(800) if route in ['/otp-expired','/session-expired'] else await page.locator('.demo-tools button').first.filter(has_text='SAMPLE').wait_for(timeout=12000)
    title=await page.title();text=await page.locator('main').inner_text();checks=[]
    for lang in ['EN','తెలుగు']:
     control=page.get_by_role('button',name=lang,exact=True).first
     if await control.count():await control.click();await page.wait_for_timeout(30)
     for width in [320,360,390,430,768,820,1024,1280,1440]:
      await page.set_viewport_size({'width':width,'height':900 if width<600 else 1180 if width<1100 else 1800})
      checks.append({'language':lang,'width':width,**await page.evaluate('''()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,h1:document.querySelectorAll('h1').length,unlabelled:[...document.querySelectorAll('main input,main select,main textarea')].filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&e.type!=='hidden').length,unnamedButtons:[...document.querySelectorAll('main button')].filter(e=>!e.innerText.trim()&&!e.getAttribute('aria-label')&&!e.getAttribute('title')).length})''')})
    if route in ['/','/customer/book/new','/merchant/requests','/technician/jobs','/admin/cities','/communications/verify']:
     await page.set_viewport_size({'width':390,'height':900});await page.screenshot(path=str(OUT/((route.strip('/').replace('/','-') or 'home')+'.png')))
    results.append({'route':route,'role':role,'url':url,'status':response.status if response else None,'finalUrl':page.url,'title':title,'heading':await page.locator('h1').first.inner_text(),'excerpt':text[:130],'checks':checks,'errors':errors[before:]})
   except Exception as e:results.append({'route':route,'role':role,'url':url,'error':str(e)[:220],'errors':errors[before:]})
   (OUT/'route-audit.json').write_text(json.dumps({'results':results,'pageErrors':errors,'elapsedSeconds':round(time.time()-start)},indent=2,ensure_ascii=False))
   if len(results)%20==0:print('audited',len(results),flush=True)
  print('TOTAL',len(results),'checks',sum(len(r.get('checks',[])) for r in results),'failures',sum(1 for r in results if r.get('error') or r.get('errors') or any(c['overflow'] or c['h1']!=1 or c['unlabelled'] or c['unnamedButtons'] for c in r.get('checks',[]))), 'errors',len(errors));await browser.close()
asyncio.run(main())
