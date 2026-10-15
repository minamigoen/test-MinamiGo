"""Intentional desktop wheel, page scrolling and real Chromium touch gestures."""
import os,sys,json,shutil,time
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from browser_env import start_site
local='--local' in sys.argv
if local: tmp,site,server,base=start_site()
else: base='https://minamigoen.github.io/test-MinamiGo/'
out=Path('live-evidence');out.mkdir(exist_ok=True);results=[]
def viewport(page):
 return page.evaluate("async()=> (await import('./src/map-view.js')).mapViewport()")
def wait_input(page): page.wait_for_timeout(400)
def blank_point(page):
 box=page.locator('#map').bounding_box()
 for a,b in [(.63,.55),(.8,.6),(.4,.6),(.6,.75),(.3,.7)]:
  x,y=box['x']+box['width']*a,box['y']+box['height']*b
  if page.evaluate("([x,y])=>{const e=document.elementFromPoint(x,y);return e?.closest('#map')&&!e.closest('.leaflet-marker-icon,.leaflet-control')} ",[x,y]):return x,y
 raise AssertionError('No blank visible map point')
with sync_playwright() as p:
 chrome=os.environ.get('MINAMIGO_CHROMIUM')or shutil.which('chromium')or shutil.which('google-chrome')
 b=p.chromium.launch(headless=True,**({'executable_path':chrome}if chrome else {}))
 for width,touch in [(1440,False),(390,True),(320,True)]:
  c=b.new_context(viewport={'width':width,'height':900},has_touch=touch,is_mobile=touch,service_workers='block');page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('https://script.google.com/**',lambda r:r.abort())
  page.goto(base+'?view=map',wait_until='domcontentloaded');page.wait_for_selector('.map-pin');page.locator('#map').scroll_into_view_if_needed();wait_input(page)
  if not touch:
   expect(page.locator('#map-wheel-help')).to_be_visible();before=viewport(page);scroll=page.evaluate('scrollY');x,y=blank_point(page);page.mouse.move(x,y);page.mouse.wheel(0,180);wait_input(page)
   assert viewport(page)['zoom']==before['zoom'];assert page.evaluate('scrollY')>scroll,'passive map must permit page scrolling'
   page.locator('#map').scroll_into_view_if_needed();x,y=blank_point(page)
   # Do not hit a facility marker when activating the map.
   page.mouse.click(x,y)
   page.mouse.move(x,y);before=viewport(page);scroll=page.evaluate('scrollY');page.mouse.wheel(0,-120);wait_input(page)
   assert viewport(page)['zoom']>before['zoom'];assert abs(page.evaluate('scrollY')-scroll)<2
   page.mouse.move(5,y);page.mouse.move(x,y);before=viewport(page);page.mouse.wheel(0,120);wait_input(page);assert viewport(page)['zoom']==before['zoom'];assert not page.locator('#map').evaluate("e=>e.classList.contains('wheel-active')")
   page.locator('#map').scroll_into_view_if_needed();page.locator('#map').focus();page.keyboard.press('Escape');before=viewport(page);x,y=blank_point(page);page.mouse.move(x,y);page.mouse.wheel(0,-120);wait_input(page);assert viewport(page)['zoom']==before['zoom']
   # Keyboard focus deliberately activates zoom, then Escape releases it.
   page.locator('#map').evaluate('e=>e.blur()');page.keyboard.press('Tab');page.locator('#map').focus();expect(page.locator('#map')).to_have_class(__import__('re').compile('wheel-active'))
   page.locator('#base-aerial').click();page.locator('#map').scroll_into_view_if_needed();x,y=blank_point(page);page.mouse.click(x,y);page.mouse.move(x,y);before=viewport(page);page.mouse.wheel(0,-120);wait_input(page);assert viewport(page)['zoom']>before['zoom'];page.keyboard.press('Escape');assert not page.locator('#map').evaluate("e=>e.classList.contains('wheel-active')")
   results.append({'width':width,'page_scroll_before_activation':'passed','wheel_map_and_aerial':'passed','leave_and_escape':'passed','keyboard_focus':'passed'})
  else:
   expect(page.locator('#map-wheel-help')).not_to_be_visible();session=c.new_cdp_session(page);x,y=blank_point(page);before=viewport(page)
   session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
   for step in range(1,9):session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x-7*step,'y':y}]});page.wait_for_timeout(20)
   session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});wait_input(page);after=viewport(page);assert abs(after['lng']-before['lng'])>.0001,'touch drag did not pan'
   before=viewport(page);points=lambda d:[{'x':x-d,'y':y},{'x':x+d,'y':y}]
   session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':points(25)})
   for d in range(30,96,5):session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':points(d)});page.wait_for_timeout(20)
   session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});wait_input(page);assert viewport(page)['zoom']>before['zoom'],'touch pinch did not zoom'
   # Reset bounds and verify tap details remain available.
   page.locator('#reset').click();page.locator('#map').scroll_into_view_if_needed();marker=page.locator('.map-pin').first;marker.evaluate('e=>e.click()');expect(page.locator('#detail')).to_be_visible();assert not page.locator('#map').evaluate("e=>e.classList.contains('wheel-active')")
   results.append({'width':width,'touch_drag':'passed','touch_pinch':'passed','pin_detail':'passed','desktop_hint_hidden':'passed'})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors,errors;page.screenshot(path=str(out/f'map-wheel-{width}.png'));print(f'PASS map input {width}px',flush=True);c.close()
 b.close()
(out/'map-wheel-result.json').write_text(json.dumps({'url':base,'runs':results},ensure_ascii=False,indent=2),encoding='utf8')
if local:server.shutdown();tmp.cleanup()
