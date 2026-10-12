from playwright.sync_api import sync_playwright, expect
import json
from pathlib import Path
base='http://127.0.0.1:4173/minamigo-test/'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844},service_workers='allow')
 page=context.new_page();page.route('https://tile.openstreetmap.org/**',lambda r:r.fulfill(status=200,content_type='image/png',path='/workspace/minamigo-test/icon-192.png'));errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base);page.wait_for_selector('.card');expect(page.locator('.card')).to_have_count(7)
 assert not page.locator('#locate').is_disabled()
 page.locator('.save').first.click();page.locator('a[data-page="saved"]').click();expect(page.locator('.card')).to_have_count(1)
 page.reload();page.wait_for_selector('.card');expect(page.locator('.card')).to_have_count(1)
 page.locator('a[data-page="explore"]').click();page.locator('#search').fill('弘法寺');page.locator('#search-form').evaluate('(form)=>form.requestSubmit()');page.wait_for_timeout(100);expect(page.locator('.card')).to_have_count(1)
 page.locator('.open').click();page.wait_for_selector('dialog[open]');assert '弘法寺' in page.locator('#detail-title').inner_text();page.go_back();page.wait_for_timeout(150);assert not page.locator('dialog').is_visible();page.go_forward();page.wait_for_selector('dialog[open]');page.keyboard.press('Escape');page.wait_for_timeout(100)
 page.locator('#search').fill('存在しない場所');page.locator('#search-form').evaluate('(form)=>form.requestSubmit()');page.wait_for_timeout(100);assert page.locator('#empty').is_visible()
 page.locator('#reset').click();page.wait_for_timeout(100);expect(page.locator('.card')).to_have_count(7)
 page.locator('#map-view').click();page.wait_for_timeout(100);assert '施設周辺' in page.locator('#map-status').inner_text();assert page.locator('#map').is_visible()
 page.locator('#list-view').click();page.wait_for_timeout(100)
 for w in [320,390,768,1440]:
  page.set_viewport_size({'width':w,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'overflow {w}'
  page.evaluate('window.scrollTo(0,0)');page.screenshot(path=f'/workspace/minamigo-preview-{w}.png',full_page=True)
 page.evaluate('navigator.serviceWorker.ready');page.reload();page.wait_for_selector('.card');context.set_offline(True);page.reload();page.wait_for_selector('.card');expect(page.locator('.card')).to_have_count(7);expect(page.locator('#notice')).to_contain_text('オフライン');context.set_offline(False)
 assert not errors,errors
 # Empty/error/loading states use route overrides, no fake records published.
 no_sw=browser.new_context(service_workers='block',viewport={'width':390,'height':844});ep=no_sw.new_page();ep.route('**/data/spots.json',lambda r:r.fulfill(json={'schemaVersion':1,'updatedAt':'2026-10-12T00:00:00Z','spots':[]}));ep.goto(base);ep.wait_for_selector('#empty');assert '準備' in ep.locator('#empty').inner_text()
 fail=browser.new_context(service_workers='block');fp=fail.new_page();fp.route('**/data/spots.json',lambda r:r.fulfill(status=500,body='failure'));fp.goto(base);fp.wait_for_selector('#empty');assert '取得できません' in fp.locator('#empty').inner_text()
 # Coordinate fixture only in test browser checks denied geolocation; not shipped.
 geo=browser.new_context(service_workers='block');gp=geo.new_page();gp.add_init_script('navigator.geolocation.getCurrentPosition=(ok,fail)=>fail({code:1})');gp.route('**/data/spots.json',lambda r:r.fulfill(json={'schemaVersion':1,'updatedAt':'2026-10-12T00:00:00Z','spots':[{'id':'fixture','name':'TEST ONLY','category':'culture','source':'TEST ONLY','verifiedAt':'2026-10-12','lat':33,'lng':134}]}));gp.goto(base);gp.wait_for_selector('.card');gp.locator('#locate').click();assert '許可されていません' in gp.locator('#location-status').inner_text()
 browser.close();print('PASS: mobile/desktop overflow, favorites persistence, search/filter, details history, no unverified map pins, offline reload, empty/error states, denied geolocation; no JS errors')
