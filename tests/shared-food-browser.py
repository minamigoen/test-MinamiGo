from playwright.sync_api import sync_playwright,expect
from browser_env import start_site,launch_browser,PROJECT
import json
base_data=json.loads((PROJECT/'data/spots.json').read_text())
rows=[{k:s.get(v,'') for k,v in {'no':'upstreamId','name':'name','address':'address','lat':'lat','lng':'lng','hours':'hours','closed':'closed','tel':'tel','url':'url'}.items()} for s in base_data['spots'] if s.get('upstreamId')]
for r in rows:
 if r['no']=='0000000023':r['hours']='TEST RUNTIME HOURS'
rows.append({'no':'0000000050','name':'TEST ONLY NEW SOURCE RECORD','address':'TEST ONLY ADDRESS','hours':'TEST ONLY'})
tmp,site,server,base=start_site();mode={'good':True};calls={'n':0}
with sync_playwright() as p:
 b=launch_browser(p);c=b.new_context();page=c.new_page()
 def respond(route):
  calls['n']+=1
  if mode['good']:route.fulfill(json=rows,headers={'Access-Control-Allow-Origin':'*'})
  else:route.fulfill(json=[{'no':'INVALID','name':'BAD'}],headers={'Access-Control-Allow-Origin':'*'})
 page.route('https://script.google.com/**',respond);page.goto(base);expect(page.locator('#food-sync-info')).to_contain_text('共通データ 38件');expect(page.locator('.card')).to_have_count(len(base_data['spots'])+1)
 page.locator('[data-spot-id="hiwasaya"] .open').click();page.wait_for_selector('dialog[open]');assert 'TEST RUNTIME HOURS' in page.locator('#detail-fields').inner_text();page.locator('#close-detail').click();page.wait_for_timeout(100)
 before=calls['n'];page.reload();expect(page.locator('#food-sync-info')).to_contain_text('共通データ 38件');assert calls['n']==before
 mode['good']=False;page.locator('a[data-page="help"]').click();page.locator('#refresh').evaluate('(b)=>b.click()');expect(page.locator('#food-sync-info')).to_contain_text('直近正常データ');page.locator('a[data-page="explore"]').click();expect(page.locator('.card')).to_have_count(len(base_data['spots'])+1)
 page.evaluate('navigator.serviceWorker.ready');c.set_offline(True);page.reload();expect(page.locator('#food-sync-info')).to_contain_text('オフライン');expect(page.locator('.card')).to_have_count(len(base_data['spots'])+1)
 c.set_offline(False);b.close();server.shutdown();tmp.cleanup();print('PASS: runtime source updates, stable IDs, 10-minute reuse, malformed refresh keeps latest successful 38 food records, offline keeps latest successful merged data')
