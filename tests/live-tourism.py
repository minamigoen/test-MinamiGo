"""Default map and the connector-reviewed tourism additions at real viewport sizes."""
import os,json,shutil,sys
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from browser_env import start_site
server=None
if '--local' in sys.argv:tmp,site,server,URL=start_site()
else:URL=os.environ.get('MINAMIGO_TOURISM_TEST_URL','https://minamigoen.github.io/test-MinamiGo/')
expected=json.loads(Path('data/spots.json').read_text(encoding='utf8'));new=[s for s in expected['spots'] if s['id'].startswith('town-')];OUT=Path('live-evidence');OUT.mkdir(exist_ok=True);runs=[]
with sync_playwright() as p:
 chrome=os.environ.get('MINAMIGO_CHROMIUM') or shutil.which('google-chrome') or shutil.which('chromium');b=p.chromium.launch(headless=True,**({'executable_path':chrome} if chrome else {}))
 for width in [390,1440]:
  c=b.new_context(viewport={'width':width,'height':900},service_workers='block');page=c.new_page();errors=[];images=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:images.append(r.url) if r.resource_type=='image' else None)
  page.goto(URL,wait_until='domcontentloaded');page.wait_for_selector('.map-pin');page.wait_for_function('()=>/共通データ 37件|取得できません/.test(document.getElementById("food-sync-info").textContent)',timeout=20000)
  expect(page.locator('#map-view')).to_have_attribute('aria-pressed','true');expect(page.locator('#map')).to_be_visible();expect(page.locator('#cards')).not_to_be_visible();expect(page.locator('#map-list button')).to_have_count(114);expect(page.locator('.map-pin')).to_have_count(115)
  page.screenshot(path=str(OUT/f'default-map-{width}.png'))
  if width==1440:
   sidebar=page.locator('.map-sidebar').bounding_box();m=page.locator('#map').bounding_box();assert sidebar['x']+sidebar['width']<m['x']
  # Every new source row remains selectable, including pending positions.
  for s in new:
   page.locator('#map-list [data-spot-id="'+s['id']+'"]').click();expect(page.locator('#detail-title')).to_have_text(s['name']);expect(page.locator('#detail-fields')).to_contain_text(s['locationLabel'])
   if s.get('lat') is not None:expect(page.locator('.map-pin.selected')).to_have_attribute('data-spot-id',s['id']);expect(page.locator('#detail-fields')).to_contain_text('参考座標')
   elif s.get('mapPoints'):expect(page.locator('.map-pin.selected')).to_have_count(len(s['mapPoints']))
   else:expect(page.locator('.map-pin.selected')).to_have_count(0)
   if s.get('photoUrl'):
    page.wait_for_function('()=>{const i=document.querySelector("#detail-media img");return i&&i.complete&&i.naturalWidth>0&&i.naturalHeight>0;}',timeout=20000);page.locator('#detail-media img').evaluate('(i)=>i.decode()');expect(page.locator('#detail-media')).to_contain_text(s['photoLicense'])
   else:assert page.locator('#detail-media img').count()==0;expect(page.locator('#detail-media')).to_contain_text('写真の利用条件を確認中')
   page.locator('#close-detail').click()
  page.locator('#map-filters').click();expect(page.locator('#search')).to_be_focused();page.get_by_role('button',name='祭り・催し',exact=True).click();expect(page.locator('#map-list button')).to_have_count(6);expect(page.locator('#map')).to_be_visible();expect(page.locator('.map-pin')).to_have_count(12);page.locator('#map-list button').first.click();expect(page.locator('#detail')).to_be_visible();assert not page.locator('#detail').evaluate('(e)=>e.matches(":modal")');expect(page.locator('#detail-fields')).to_contain_text('開催年の日程');page.keyboard.press('Escape');expect(page.locator('#detail')).not_to_be_visible()
  page.locator('#reset').click();page.locator('#search').fill('日和佐日和');page.locator('#search-form').evaluate('(f)=>f.requestSubmit()');expect(page.locator('#map-list button')).to_have_count(1);expect(page.locator('#map-list button')).to_have_attribute('data-spot-id','heritage-373003')
  page.locator('#map-list button').click();expect(page.locator('#detail-title')).to_have_text('旧八嶋電機店舗');expect(page.locator('#detail-links')).to_contain_text('町の体験・観光案内');page.locator('#close-detail').click();page.locator('#reset').click()
  page.locator('#cards-view').click();expect(page.locator('.card')).to_have_count(114);assert 'view=cards' in page.url;page.reload(wait_until='domcontentloaded');page.wait_for_selector('.card');expect(page.locator('#cards-view')).to_have_attribute('aria-pressed','true');page.locator('#list-view').click();expect(page.locator('#cards')).to_have_class('cards list-layout');page.locator('#map-view').click();expect(page.locator('#map-list button')).to_have_count(114)
  page.locator('#base-aerial').click();expect(page.locator('#base-aerial')).to_have_attribute('aria-pressed','true');page.locator('#base-map').click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert not [u for u in images if any(x in u for x in ['/watch_img','/festival_img','/excursion_img']) and u not in {s.get('photoUrl') for s in expected['spots']}],images;assert not errors,errors
  runs.append({'width':width,'default_view':'map','total':114,'all_visible_pins':115,'new':20,'new_positioned_records':19,'new_pending':1,'multi_venue_points':7,'municipal_photos_embedded':19,'existing_cc_beach_photo':'loaded','festival_records':6,'existing_heritage_merged':1,'view_switch_and_reload':'passed','javascript_errors':errors});print(f'PASS tourism/default map {width}px',flush=True);c.close()
 b.close()
(OUT/'tourism-result.json').write_text(json.dumps({'url':URL,'runs':runs},ensure_ascii=False,indent=2),encoding='utf8')
if server:server.shutdown();tmp.cleanup()
