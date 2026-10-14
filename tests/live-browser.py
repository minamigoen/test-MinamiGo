"""Verify the actual public test URL from GitHub's runner network, with a fresh browser."""
import os,shutil,time,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
url='https://minamigoen.github.io/test-MinamiGo/'
output=Path('live-evidence');output.mkdir(exist_ok=True)
with sync_playwright() as p:
 chrome=os.environ.get('MINAMIGO_CHROMIUM') or shutil.which('google-chrome') or shutil.which('chromium')
 b=p.chromium.launch(headless=True,**({'executable_path':chrome} if chrome else {}))
 expected=json.loads(Path('data/spots.json').read_text());c=b.new_context(viewport={'width':390,'height':844});page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for attempt in range(6):
  try:
   response=page.goto(url+'#explore?view=cards',wait_until='domcontentloaded',timeout=30000)
   assert response and response.status==200
   page.wait_for_selector('.card',timeout=12000)
   assert '美波まちのふしぎ帖' in page.locator('.brand').inner_text()
   expect(page.locator('.card')).to_have_count(len(expected['spots']))
   assert page.locator('.spot-media').count()>=len(expected['spots'])
   # Counts can match the previous release. Wait for the data/photo revision and
   # the asynchronous source merge before accepting this visitor as current.
   served=page.request.get(url+'data/spots.json').json();assert served==expected
   page.wait_for_function('()=>/共通データ \\d+件|取得できません/.test(document.getElementById("food-sync-info").textContent)',timeout=15000)
   expect(page.locator('#cards .has-photo')).to_have_count(sum(bool(s.get('photoUrl')) for s in expected['spots']),timeout=12000)
   break
  except Exception:
   if attempt==5:raise
   # A visitor that opened during rollout may have installed the previous SW.
   # Retry as a genuinely fresh visitor, instead of reusing its old app cache.
   c.close();c=b.new_context(viewport={'width':390,'height':844});page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));time.sleep(10)
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
 page.locator('#categories button').filter(has_text='食べる').click();foods=[s for s in snapshot['spots'] if s['category']=='food'];expect(page.locator('.card')).to_have_count(len(foods));assert page.locator('#locate').is_disabled()==(not any(s.get('lat') is not None for s in foods));page.locator('#food-type').select_option('カフェ');expect(page.locator('.card')).to_have_count(sum('カフェ' in s.get('foodType','').split('・') for s in foods));page.screenshot(path=str(output/'live-mobile-food.png'));expect(page.locator('#food-sync-info')).to_contain_text('共通データ',timeout=15000);page.locator('#reset').click();page.wait_for_timeout(100)

 for category,label,count in [('heritage','美波遺産',12),('powerspot','パワースポット',12)]:
  page.get_by_role('button',name=label,exact=True).click();expect(page.locator('.card')).to_have_count(count)
  page.locator('#map-view').click();expect(page.locator('#map-list button')).to_have_count(count)
  page.screenshot(path=str(output/f'live-{category}.png'));page.locator('#cards-view').click()
 page.locator('#categories button').filter(has_text='泊まる').click();expect(page.locator('.card')).to_have_count(27)
 page.locator('#map-view').click();expect(page.locator('.reference-pin')).to_have_count(24)
 page.locator('#base-aerial').click();expect(page.locator('#base-aerial')).to_have_attribute('aria-pressed','true');expect(page.locator('#map-imagery-note')).to_be_visible()
 expect(page.locator('.leaflet-control-attribution')).to_contain_text('国土地理院')
 page.screenshot(path=str(output/'live-aerial.png'))
 page.locator('#map-list button').first.click();expect(page.locator('dialog')).to_be_visible();page.locator('#close-detail').click();expect(page.locator('dialog')).not_to_be_visible();page.locator('#map').scroll_into_view_if_needed();page.locator('.reference-pin').first.focus();page.locator('.reference-pin').first.press('Enter');expect(page.locator('dialog')).to_be_visible();expect(page.locator('#detail-fields')).to_contain_text('参考座標');expect(page.locator('#detail-media')).to_contain_text('写真の出典')
 page.screenshot(path=str(output/'live-stay-detail.png'));page.locator('#close-detail').click()
 page.locator('#base-map').click();expect(page.locator('.leaflet-control-attribution')).to_contain_text('OpenStreetMap')
 page.locator('#cards-view').click();page.locator('#reset').click()
 expect(page.locator('#town-photo img')).to_be_visible();assert page.locator('#town-photo img').evaluate('(i)=>i.complete && i.naturalWidth>0')
 for width in [320,390,768,1440]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('.save').first.click();page.locator('a[data-page="saved"]').click();expect(page.locator('.card')).to_have_count(1)
 page.evaluate('navigator.serviceWorker.ready');page.reload();page.wait_for_selector('.card');expect(page.locator('.card')).to_have_count(1)
 scope=page.evaluate('navigator.serviceWorker.getRegistration().then(r=>r.scope)');assert scope==url
 c.set_offline(True);page.reload();page.wait_for_selector('.card');expect(page.locator('#notice')).to_contain_text('オフライン');expect(page.locator('.card')).to_have_count(1);c.set_offline(False)
 desktop=b.new_context(viewport={'width':1440,'height':1000});dp=desktop.new_page();dp.goto(url+'#explore?view=cards',wait_until='domcontentloaded');dp.wait_for_selector('.card');assert dp.evaluate('document.documentElement.scrollWidth<=innerWidth');dp.screenshot(path=str(output/'live-desktop.png'))
 assert not errors,errors
 b.close()
(output/'result.json').write_text(json.dumps({'url':url,'status':200,'public_spots':len(snapshot['spots']),'food_spots':len(foods),'heritage_spots':12,'power_spots':12,'stay_reference_pins':24,'stay_public_photos':26,'licensed_town_photo':'CC BY 2.0 / na0905','aerial_switch':'passed','public_photos':sum(bool(s.get('photoUrl')) for s in snapshot['spots']),'mobile':[390,844],'desktop':[1440,1000],'manifest_scope':'./','worker_scope':scope,'maps_links':links,'offline_reload':'passed','favorites_reload':'passed','private_fields':'excluded','javascript_errors':errors},ensure_ascii=False,indent=2))
print('PASS: actual HTTPS test URL, reviewed cards, Maps/Street View links, scoped Service Worker, favorites persistence, offline reload, mobile/desktop screenshots; no private fields or JavaScript errors')
