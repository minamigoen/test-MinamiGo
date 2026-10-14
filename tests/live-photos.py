"""Real facility images on the public HTTPS test site; no fixture replacement."""
import json,os,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('MINAMIGO_PHOTO_TEST_URL','https://minamigoen.github.io/test-MinamiGo/')
OUT=Path('live-evidence');OUT.mkdir(exist_ok=True)
expected=json.loads(Path('data/spots.json').read_text(encoding='utf-8'))
with sync_playwright() as p:
 chrome=os.environ.get('MINAMIGO_CHROMIUM') or shutil.which('google-chrome') or shutil.which('chromium')
 b=p.chromium.launch(headless=True,**({'executable_path':chrome} if chrome else {}));runs=[]
 for width in [390,1440]:
  c=b.new_context(viewport={'width':width,'height':900},service_workers='block');page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(URL,wait_until='domcontentloaded');page.wait_for_selector('.card');page.wait_for_function('()=>/共通データ 37件|取得できません/.test(document.getElementById("food-sync-info").textContent)',timeout=20000);result={'width':width,'categories':{}}
  for category,label,total in [('food','食べる',37),('stay','泊まる',27)]:
   page.get_by_role('button',name=label,exact=True).click();expect(page.locator('.card')).to_have_count(total)
   records=[s for s in expected['spots'] if s['category']==category];success=[];unavailable=[]
   for spot in records:
    card=page.locator('#cards [data-spot-id="'+spot['id']+'"]');card.scroll_into_view_if_needed()
    if spot.get('photoUrl'):
     image=card.locator('img');expect(image).to_be_visible();page.wait_for_function('(id)=>{const img=document.querySelector(`#cards [data-spot-id="${id}"] img`);return img&&img.complete&&img.naturalWidth>0&&img.naturalHeight>0;}',arg=spot['id'],timeout=20000)
     dims=image.evaluate('(i)=>({width:i.naturalWidth,height:i.naturalHeight})');success.append({'id':spot['id'],'name':spot['name'],**dims});expect(card.locator('figure')).to_have_attribute('data-state','loaded')
    else:
     assert card.locator('img').count()==0;expect(card.locator('.photo-fallback-label')).to_contain_text('取得できません');unavailable.append({'id':spot['id'],'name':spot['name'],'state':card.locator('figure').get_attribute('data-state')})
   result['categories'][category]={'records':total,'loaded':len(success),'unavailable':unavailable,'dimensions':success}
   assert len(success)==(37 if category=='food' else 24)
   print(f'PASS: {width}px {category} {len(success)}/{total} real images, natural dimensions>0',flush=True)
   page.locator('.card').first.scroll_into_view_if_needed();page.screenshot(path=str(OUT/f'photos-{category}-{width}.png'))
   # A real marker click opens detail immediately. Close to inspect the pin's popup photo.
   page.locator('#map-view').click();page.locator('#map-list button').first.click();expect(page.locator('dialog')).to_be_visible();page.wait_for_function('()=>{const i=document.querySelector("#detail-media img");return i&&i.complete&&i.naturalWidth>0;}',timeout=20000)
   page.screenshot(path=str(OUT/f'photo-detail-{category}-{width}.png'));page.locator('#close-detail').click();expect(page.locator('dialog')).not_to_be_visible();page.locator('#map').scroll_into_view_if_needed();page.locator('.map-pin').first.click();expect(page.locator('dialog')).to_be_visible();page.locator('#close-detail').click();expect(page.locator('dialog')).not_to_be_visible();expect(page.locator('.leaflet-popup')).to_be_visible();page.wait_for_function('()=>{const i=document.querySelector(".leaflet-popup img");return i&&i.complete&&i.naturalWidth>0&&i.naturalHeight>0;}',timeout=20000);page.screenshot(path=str(OUT/f'photo-pin-{category}-{width}.png'))
   page.wait_for_timeout(400);bounds=page.locator('.leaflet-popup img').bounding_box();map_bounds=page.locator('#map').bounding_box();assert bounds and map_bounds;assert bounds['y']>=map_bounds['y']-1 and bounds['y']+bounds['height']<=map_bounds['y']+map_bounds['height']+1,'pin photo must fit inside map'
   page.screenshot(path=str(OUT/f'photo-pin-{category}-{width}.png'));result['categories'][category]['detail_and_pin_photo']='loaded and inside visible map';page.locator('#cards-view').click()
  # Abort one approved image to test honest local fallback; no unrelated stock photo.
  image=next(s['photoUrl'] for s in expected['spots'] if s['category']=='food');page.route(image,lambda r:r.abort());page.reload(wait_until='domcontentloaded');page.wait_for_selector('.card');page.wait_for_function('()=>/共通データ 37件|取得できません/.test(document.getElementById("food-sync-info").textContent)',timeout=20000);page.get_by_role('button',name='食べる',exact=True).click();expect(page.locator('.card')).to_have_count(37);first=page.locator('.card').first;first.scroll_into_view_if_needed();expect(first.locator('figure')).to_have_attribute('data-state','fallback');expect(first.locator('.photo-fallback-label')).to_contain_text('写真を表示できません');assert not first.locator('img').is_visible()
  assert not errors,errors;result['forced_failure']='honest fallback';result['javascript_errors']=errors;runs.append(result);c.close()
 b.close()
(OUT/'photos-result.json').write_text(json.dumps({'url':URL,'runs':runs,'facility_photo_permission':'food/stay only','heritage_photo_permission_expanded':False},ensure_ascii=False,indent=2),encoding='utf-8')
print('PASS: actual facility images, food37/37 + stay24/27 at 390/1440px, natural dimensions>0, cards/detail/pin photos, three unavailable-folder fallbacks, forced image failure; no JS errors')
