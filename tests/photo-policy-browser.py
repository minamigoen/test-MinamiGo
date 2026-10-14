from playwright.sync_api import sync_playwright,expect
from browser_env import start_site,launch_browser,PROJECT
import json
data=json.loads((PROJECT/'data/spots.json').read_text(encoding='utf-8'))
foods=[s for s in data['spots'] if s['category']=='food']
rows=[{'no':s['upstreamId'],'name':s['name'],'address':s['address'],'lat':s.get('lat'),'lng':s.get('lng'),'image':s.get('photoUrl')} for s in foods]
old=[{k:v for k,v in s.items() if k!='image'} for s in rows]
tmp,site,server,base=start_site()
with sync_playwright() as p:
 b=launch_browser(p);c=b.new_context(service_workers='block');page=c.new_page();calls={'n':0}
 page.add_init_script('localStorage.setItem("minamigo-test-v2-shared-food",JSON.stringify({sourceRows:'+json.dumps(old,ensure_ascii=False)+',fetchedAt:new Date().toISOString()}))')
 def api(r):calls['n']+=1;r.fulfill(json=rows,headers={'Access-Control-Allow-Origin':'*'})
 page.route('https://script.google.com/**',api)
 for host in ['https://www.town.minami.lg.jp/**','https://lh3.googleusercontent.com/**']:
  page.route(host,lambda r:r.fulfill(content_type='image/png',path=str(PROJECT/'icon-192.png')))
 page.goto(base,wait_until='domcontentloaded');expect(page.locator('#food-sync-info')).to_contain_text('共通データ 37件');assert calls['n']==1
 page.get_by_role('button',name='食べる',exact=True).click();expect(page.locator('#cards .has-photo')).to_have_count(37);expect(page.locator('#cards .has-photo').first).to_have_attribute('data-state','loaded')
 policy=page.evaluate('JSON.parse(localStorage.getItem("minamigo-test-v2-shared-food")).photoPolicy');assert policy=='facility-permission-20261014'
 # Malformed public photo strings never become an image or overwrite source identity.
 rows[0]['image']='';page.get_by_role('link',name='使い方',exact=True).click();page.locator('#refresh').evaluate('(e)=>e.click()');expect(page.locator('#food-sync-info')).to_contain_text('共通データ 37件');page.get_by_role('link',name='探す',exact=True).click();page.get_by_role('button',name='食べる',exact=True).click();expect(page.locator('#cards .has-photo')).to_have_count(36);expect(page.locator('.card').first.locator('.photo-fallback-label')).to_have_text('写真未登録')
 b.close();server.shutdown();tmp.cleanup()
print('PASS: legacy cache cannot hide newly permitted photos; explicit policy migrates and source-removed photo has an honest missing state')
