"""Map selection, layer preservation, source-photo boundary and fallback checks."""
from playwright.sync_api import sync_playwright,expect
from browser_env import start_site,launch_browser,PROJECT
import json
tmp,site,server,base=start_site()
with sync_playwright() as p:
 b=launch_browser(p);c=b.new_context(service_workers='block',viewport={'width':390,'height':844});page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('https://script.google.com/**',lambda r:r.abort());page.route('https://tile.openstreetmap.org/**',lambda r:r.fulfill(content_type='image/png',path=str(PROJECT/'icon-192.png')))
 page.route('https://www.town.minami.lg.jp/**',lambda r:r.fulfill(content_type='image/png',path=str(PROJECT/'icon-192.png')));page.route('https://lh3.googleusercontent.com/**',lambda r:r.fulfill(content_type='image/png',path=str(PROJECT/'icon-192.png')));page.route('https://upload.wikimedia.org/**',lambda r:r.fulfill(content_type='image/png',path=str(PROJECT/'icon-192.png')))
 page.route('https://cyberjapandata.gsi.go.jp/**',lambda r:r.fulfill(content_type='image/png',path=str(PROJECT/'icon-192.png')))
 private_requests=[];page.on('request',lambda r:private_requests.append(r.url) if 'drive.google.com' in r.url else None)
 page.goto(base);page.wait_for_selector('.card');page.locator('#categories button').filter(has_text='泊まる').click();page.locator('#map-view').click()
 expect(page.locator('.reference-pin')).to_have_count(24);expect(page.locator('#map-list button')).to_have_count(27)
 # Point click matches the original map: recenter/zoom and open the detail immediately.
 page.locator('#map-list button').first.click();expect(page.locator('dialog')).to_be_visible();page.locator('#close-detail').click();expect(page.locator('dialog')).not_to_be_visible();page.locator('#map').scroll_into_view_if_needed();page.locator('.reference-pin').first.click();expect(page.locator('dialog')).to_be_visible();expect(page.locator('#detail-fields')).to_contain_text('参考座標');expect(page.locator('#detail-media')).to_contain_text('写真の出典');expect(page.locator('#detail-media img')).to_be_visible();assert page.locator('#detail-media img').evaluate('(i)=>i.naturalWidth>0')
 page.locator('#close-detail').click();expect(page.locator('.leaflet-popup')).to_be_visible();page.wait_for_timeout(400)
 viewport='import(new URL("./src/map-view.js",document.baseURI)).then(m=>m.mapViewport())';before=page.evaluate(viewport);assert before['zoom']>=16
 page.locator('#base-aerial').click();expect(page.locator('.leaflet-control-attribution')).to_contain_text('国土地理院');assert page.evaluate(viewport)==before;expect(page.locator('.leaflet-popup')).to_be_visible()
 page.locator('#base-map').click();expect(page.locator('.leaflet-control-attribution')).to_contain_text('OpenStreetMap');assert page.evaluate(viewport)==before
 # Filtering must replace pins, while dialog close/layer switch must preserve the view.
 page.locator('#search').fill('ホテル白い燈台');page.locator('#search-form').evaluate('(f)=>f.requestSubmit()');expect(page.locator('.reference-pin')).to_have_count(1)
 page.locator('#reset').click();page.locator('#categories button').filter(has_text='泊まる').click();expect(page.locator('.reference-pin')).to_have_count(24)
 for w in [320,390,768,1440]:
  page.set_viewport_size({'width':w,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.unroute('https://cyberjapandata.gsi.go.jp/**');page.route('https://cyberjapandata.gsi.go.jp/**',lambda r:r.abort());page.locator('#base-aerial').click();expect(page.locator('#map-tile-status')).to_contain_text('背景を読み込めません');expect(page.locator('#map-list button')).to_have_count(27)
 page.locator('#cards-view').click();page.unroute('https://upload.wikimedia.org/**');page.route('https://www.town.minami.lg.jp/**',lambda r:r.fulfill(content_type='image/png',path=str(PROJECT/'icon-192.png')));page.route('https://lh3.googleusercontent.com/**',lambda r:r.fulfill(content_type='image/png',path=str(PROJECT/'icon-192.png')));page.route('https://upload.wikimedia.org/**',lambda r:r.abort());page.reload();expect(page.locator('#town-photo .photo-fallback-label')).to_contain_text('写真を表示できません');expect(page.locator('.card')).to_have_count(27)
 assert not private_requests,private_requests;assert not errors,errors
 b.close();server.shutdown();tmp.cleanup()
print('PASS: 24 stay reference pins, 27 accessible list entries, immediate marker detail, preserved view/popup on layer switch, filter replacement, aerial/image failure fallback, 320/390/768/1440px, no private image requests or JS errors')
