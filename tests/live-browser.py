"""Verify the actual public test URL from GitHub's runner network, with a fresh browser."""
import os,shutil,time,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
url='https://minamigoen.github.io/test-MinamiGo/'
output=Path('live-evidence');output.mkdir(exist_ok=True)
with sync_playwright() as p:
 chrome=shutil.which('google-chrome') or shutil.which('chromium')
 b=p.chromium.launch(headless=True,**({'executable_path':chrome} if chrome else {}))
 expected=json.loads(Path('data/spots.json').read_text());c=b.new_context(viewport={'width':390,'height':844});page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for attempt in range(6):
  try:
   response=page.goto(url,wait_until='domcontentloaded',timeout=30000)
   assert response and response.status==200
   page.wait_for_selector('.card',timeout=12000)
   assert '美波まちのふしぎ帖' in page.locator('.brand').inner_text()
   expect(page.locator('.card')).to_have_count(len(expected['spots']))
   assert page.locator('.spot-media').count()>=len(expected['spots'])
   break
  except Exception:
   if attempt==5:raise
   time.sleep(10)
 expect(page.locator('.card')).to_have_count(len(expected['spots']))
 page.screenshot(path=str(output/'live-mobile.png'))
 manifest=page.request.get(url+'manifest.json').json();assert manifest['scope']=='./';assert manifest['start_url']=='./#explore'
 snapshot=page.request.get(url+'data/spots.json').json();assert len(snapshot['spots'])==len(expected['spots'])
 text=json.dumps(snapshot)
 for field in ['privateNotes','imageRights','currentStatusVerifiedAt','spreadsheetId','publicApproved','locationVerified','photoApproved']:assert '"'+field+'"' not in text
 page.locator('.open').nth(2).click();page.wait_for_selector('dialog[open]');expect(page.locator('#detail-actions a')).to_have_count(4)
 links=page.locator('#detail-actions a').evaluate_all('(nodes)=>nodes.map(n=>n.href)')
 assert any('/maps/dir/?' in link and 'travelmode=walking' in link for link in links)
 assert any('/maps/@?' in link and 'map_action=pano' in link for link in links)
 assert page.locator('#detail-link-list a').count()>=1
 page.screenshot(path=str(output/'live-mobile-detail.png'))
 page.locator('#close-detail').click();page.wait_for_timeout(100)
 page.locator('#categories button').filter(has_text='食べる').click();foods=[s for s in snapshot['spots'] if s['category']=='food'];expect(page.locator('.card')).to_have_count(len(foods));assert page.locator('#locate').is_disabled();page.locator('#food-type').select_option('カフェ');expect(page.locator('.card')).to_have_count(sum('カフェ' in s.get('foodType','').split('・') for s in foods));page.screenshot(path=str(output/'live-mobile-food.png'));page.locator('#reset').click();page.wait_for_timeout(100)
 page.locator('.save').first.click();page.locator('a[data-page="saved"]').click();expect(page.locator('.card')).to_have_count(1)
 page.evaluate('navigator.serviceWorker.ready');page.reload();page.wait_for_selector('.card');expect(page.locator('.card')).to_have_count(1)
 scope=page.evaluate('navigator.serviceWorker.getRegistration().then(r=>r.scope)');assert scope==url
 c.set_offline(True);page.reload();page.wait_for_selector('.card');expect(page.locator('#notice')).to_contain_text('オフライン');expect(page.locator('.card')).to_have_count(1);c.set_offline(False)
 desktop=b.new_context(viewport={'width':1440,'height':1000});dp=desktop.new_page();dp.goto(url,wait_until='domcontentloaded');dp.wait_for_selector('.card');assert dp.evaluate('document.documentElement.scrollWidth<=innerWidth');dp.screenshot(path=str(output/'live-desktop.png'))
 assert not errors,errors
 b.close()
(output/'result.json').write_text(json.dumps({'url':url,'status':200,'public_spots':len(snapshot['spots']),'food_spots':len(foods),'public_photos':sum(bool(s.get('photoUrl')) for s in snapshot['spots']),'mobile':[390,844],'desktop':[1440,1000],'manifest_scope':'./','worker_scope':scope,'maps_links':links,'offline_reload':'passed','favorites_reload':'passed','private_fields':'excluded','javascript_errors':errors},ensure_ascii=False,indent=2))
print('PASS: actual HTTPS test URL, reviewed cards, Maps/Street View links, scoped Service Worker, favorites persistence, offline reload, mobile/desktop screenshots; no private fields or JavaScript errors')
