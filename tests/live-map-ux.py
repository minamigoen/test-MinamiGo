"""Continuous selection, nonmodal details, keyboard and actual photos on mobile/desktop."""
import json,os,shutil,sys
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from browser_env import start_site
server=None
if '--local' in sys.argv:
 tmp,site,server,URL=start_site()
else: URL=os.environ.get('MINAMIGO_UX_TEST_URL','https://minamigoen.github.io/test-MinamiGo/')
OUT=Path('live-evidence');OUT.mkdir(exist_ok=True)
spots={s['id']:s for s in json.loads(Path('data/spots.json').read_text(encoding='utf8'))['spots']}
vp='import(new URL("./src/map-view.js",document.baseURI)).then(m=>m.mapViewport())'
results=[]
with sync_playwright() as p:
 chrome=os.environ.get('MINAMIGO_CHROMIUM') or shutil.which('google-chrome') or shutil.which('chromium')
 b=p.chromium.launch(headless=True,**({'executable_path':chrome} if chrome else {}))
 for width in [390,1440]:
  c=b.new_context(viewport={'width':width,'height':900},service_workers='block');page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(URL+'#explore?view=cards',wait_until='domcontentloaded');page.wait_for_selector('.card');page.wait_for_function('()=>/共通データ 37件|取得できません/.test(document.getElementById("food-sync-info").textContent)',timeout=20000)
  page.get_by_role('button',name='食べる',exact=True).click();page.locator('#map-view').click();page.locator('#map-section').scroll_into_view_if_needed();expect(page.locator('.map-pin')).to_have_count(37)
  selected=[]
  # Only click visible, unobscured real markers. No JS dispatch or programmatic selection.
  for _ in range(3):
   candidates=page.locator('.map-pin').evaluate_all('(es)=>es.filter(e=>{const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return y>0&&y<innerHeight-85&&x>0&&x<innerWidth&&e.contains(document.elementFromPoint(x,y))&&!e.classList.contains("selected");}).map(e=>e.dataset.spotId)')
   candidates=[sid for sid in candidates if sid not in selected];assert candidates,'another visible marker must remain selectable'
   sid=candidates[0];pin=page.locator('.map-pin[data-spot-id="'+sid+'"]');before=page.evaluate(vp);pin.click();expect(page.locator('#detail-title')).to_have_text(spots[sid]['name']);expect(page.locator('#map-list [data-spot-id="'+sid+'"]')).to_have_attribute('aria-pressed','true');assert page.evaluate(vp)==before,('pin selection must preserve map viewport',before,page.evaluate(vp));assert not page.locator('#detail').evaluate('(d)=>d.matches(":modal")')
   page.wait_for_function('()=>{const i=document.querySelector("#detail-media img");return i&&i.complete&&i.naturalWidth>0&&i.naturalHeight>0;}',timeout=20000);page.locator('#detail-media img').evaluate('(i)=>i.decode()');selected.append(sid)
  stage=page.locator('.map-stage').bounding_box();panel=page.locator('#detail').bounding_box();assert panel['height']<stage['height']*.56
  page.locator('#map-section').evaluate('(e)=>e.scrollIntoView({block:"start"})');page.screenshot(path=str(OUT/f'map-panel-{width}.png'))
  page.locator('#toggle-detail').click();expect(page.locator('#detail-body')).not_to_be_visible();assert page.evaluate(vp)==before;page.locator('#toggle-detail').click();expect(page.locator('#detail-body')).to_be_visible()
  before=page.evaluate(vp);scroll=page.evaluate('scrollY');page.locator('#close-detail').click();expect(page.locator('#detail')).not_to_be_visible();assert page.evaluate(vp)==before;assert page.evaluate('scrollY')==scroll
  # List selection pans without zoom, then selected pin is usable with Enter/Escape.
  row=page.locator('#map-list button').nth(1);sid=row.get_attribute('data-spot-id');row.focus();row.press('Enter');expect(page.locator('#detail-title')).to_have_text(spots[sid]['name']);expect(page.locator('.map-pin.selected')).to_have_attribute('data-spot-id',sid);assert page.evaluate(vp)['zoom']==before['zoom'];page.locator('#close-detail').click()
  page.locator('#map').scroll_into_view_if_needed();pin=page.locator('.map-pin[data-spot-id="'+sid+'"]');pin.focus();pin.press('Enter');expect(page.locator('#detail')).to_be_visible();expect(page.locator('#detail-title')).to_have_text(spots[sid]['name']);page.keyboard.press('Escape');expect(page.locator('#detail')).not_to_be_visible();assert page.locator('.map-pin:focus').get_attribute('data-spot-id')==sid
  page.locator('#base-aerial').click();assert page.evaluate(vp)['zoom']==before['zoom'];page.locator('#base-map').click()
  if width==1440:
   lb=page.locator('.map-sidebar').bounding_box();mb=page.locator('#map').bounding_box();assert lb['x']+lb['width']<mb['x'] and abs(lb['y']-mb['y'])<2
  # Stay photos also survive the new map panel.
  page.get_by_role('button',name='泊まる',exact=True).click();page.locator('#map-list button').first.click();expect(page.locator('#detail-title')).to_have_text('ホテル白い燈台');page.wait_for_function('()=>{const i=document.querySelector("#detail-media img");return i&&i.complete&&i.naturalWidth>0&&i.naturalHeight>0;}',timeout=20000)
  page.locator('#detail-media img').evaluate('(i)=>i.decode()');page.locator('#map-section').evaluate('(e)=>e.scrollIntoView({block:"start"})');page.screenshot(path=str(OUT/f'map-stay-panel-{width}.png'));page.locator('#close-detail').click()
  page.get_by_role('button',name='美波遺産',exact=True).click();expect(page.locator('.map-pin')).to_have_count(12);expect(page.locator('#map-list button')).to_have_count(12)
  for spot in [s for s in spots.values() if s['category']=='heritage']:
   page.locator('#map-list [data-spot-id="'+spot['id']+'"]').click();expect(page.locator('#detail-title')).to_have_text(spot['name']);expect(page.locator('#detail-fields')).to_contain_text('施設代表点');expect(page.locator('.map-pin.selected')).to_have_attribute('data-spot-id',spot['id']);assert page.locator('#detail-media img').count()==int(bool(spot.get('photoUrl')));page.locator('#close-detail').click()
  page.get_by_role('button',name='パワースポット',exact=True).click();expect(page.locator('.map-pin')).to_have_count(9);expect(page.locator('#map-list button')).to_have_count(12)
  for spot in [s for s in spots.values() if s['category']=='powerspot']:
   page.locator('#map-list [data-spot-id="'+spot['id']+'"]').click();expect(page.locator('#detail-title')).to_have_text(spot['name']);assert not page.locator('#detail-media img').count()
   if spot.get('mapVisibility')=='hidden':expect(page.locator('.map-pin.selected')).to_have_count(0)
   else:expect(page.locator('.map-pin.selected')).to_have_attribute('data-spot-id',spot['id'])
   if spot.get('navigationPolicy')=='disabled':assert page.locator('#detail-actions a[href*="/maps/dir/"]').count()==0
   if spot['id']=='pdf5-office-stone':expect(page.locator('#detail-description')).to_contain_text('閉業');assert page.locator('#detail-actions a[href*="/maps/"]').count()==0
   if spot['id'] in ['hebi-stone','pdf5-fudo']:expect(page.locator('#detail-fields')).to_contain_text('2025年2月Street Viewで対象物')
   page.locator('#close-detail').click()
  page.locator('#map-section').evaluate('(e)=>e.scrollIntoView({block:"start"})');page.screenshot(path=str(OUT/f'map-power-{width}.png'))
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors,errors
  results.append({'width':width,'continuous_real_pin_selections':selected,'panel':'nonmodal, collapse/expand/close','viewport_preserved':True,'keyboard':'list Enter, marker Enter, Escape restores marker focus','real_food_and_stay_photos':True,'heritage_pins':12,'power_visible_pins':9,'power_records_retained':12,'historical_and_mountain_navigation':'disabled','desktop_side_by_side':width==1440,'javascript_errors':errors});print(f'PASS map UX {width}px',flush=True);c.close()
 b.close()
(OUT/'map-ux-result.json').write_text(json.dumps({'url':URL,'runs':results},ensure_ascii=False,indent=2),encoding='utf8')
if server: server.shutdown();tmp.cleanup()
