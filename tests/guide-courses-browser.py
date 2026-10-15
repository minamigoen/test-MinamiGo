"""Official course facts, numbered reference points, partial road geometry and course QR restoration."""
import os,sys,json,shutil
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright,expect
from browser_env import start_site
local='--local'in sys.argv
if local:tmp,site,server,base=start_site()
else:base='https://minamigoen.github.io/test-MinamiGo/'
out=Path('live-evidence');out.mkdir(exist_ok=True);runs=[]
with sync_playwright()as p:
 chrome=os.environ.get('MINAMIGO_CHROMIUM')or shutil.which('google-chrome')or shutil.which('chromium');b=p.chromium.launch(headless=True,**({'executable_path':chrome}if chrome else {}))
 for width in [320,390,1440]:
  c=b.new_context(viewport={'width':width,'height':900},service_workers='block');page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.route('https://script.google.com/**',lambda r:r.abort());page.emulate_media(reduced_motion='reduce');page.add_init_script("Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:(ok)=>ok({coords:{latitude:33.73,longitude:134.53}})}})")
  page.goto(base+'?course=ohama&view=map',wait_until='domcontentloaded');page.wait_for_selector('.course-pin');expect(page.locator('#course-select')).to_have_value('ohama');expect(page.locator('#map-list button')).to_have_count(2);expect(page.locator('.course-reference-line')).to_have_count(1);assert page.locator('.course-pin span').all_text_contents()==['1','2'];expect(page.locator('#course-map-note')).to_contain_text('公式の確定経路ではありません');expect(page.locator('#course-duration')).to_contain_text('約40分');page.locator('.course-pin[data-spot-id="guide-hiwasa-shrine"]').click();expect(page.locator('#detail-title')).to_have_text('日和佐八幡神社');expect(page.locator('#detail-source')).to_contain_text('CODH');expect(page.locator('#detail-actions')).not_to_contain_text('徒歩経路');page.locator('#close-detail').click();expect(page.locator('#locate')).to_have_text('現在地からの距離');page.locator('#locate').click();expect(page.locator('#location-status')).to_contain_text('コースの立寄順を維持');assert page.locator('.course-pin span').all_text_contents()==['1','2'];page.locator('#map').scroll_into_view_if_needed();page.screenshot(path=str(out/f'guide-ohama-{width}.png'));page.reload(wait_until='domcontentloaded');expect(page.locator('.course-reference-line')).to_have_count(1)
  for key,pins,segments,steps in [('yakuouji',1,0,10),('awae',2,0,4),('caretta',1,0,1),('ebisu',1,7,2)]:
   page.locator('#course-select').select_option(key);expect(page.locator('.course-pin')).to_have_count(pins);expect(page.locator('.course-reference-line')).to_have_count(segments);expect(page.locator('#course-step-list li')).to_have_count(steps);expect(page.locator('#course-select')).to_have_value(key);assert parse_qs(urlparse(page.url).query)['course']==[key]
   if key=='caretta':expect(page.locator('#course-note')).to_contain_text('入館料');assert '1.5'not in page.locator('#course-duration').inner_text()
   if key=='awae':assert page.locator('.course-pin span').all_text_contents()==['A','B'];expect(page.locator('#course-note')).to_contain_text('相談制')
   if key=='ebisu':expect(page.locator('#course-note')).to_contain_text('小さな子ども');page.locator('#map').scroll_into_view_if_needed();page.screenshot(path=str(out/f'guide-ebisu-{width}.png'))
  page.go_back();expect(page.locator('#course-select')).to_have_value('caretta');page.go_forward();expect(page.locator('#course-select')).to_have_value('ebisu');page.locator('#map-share').click();link=page.locator('#share-link').input_value();assert parse_qs(urlparse(link).query)['course']==['ebisu'];page.locator('#share-qr svg').screenshot(path=str(out/f'guide-qr-{width}.png'))
  if os.environ.get('MINAMIGO_DECODE_QR')=='1':
   import zxingcpp
   from PIL import Image
   decoded=zxingcpp.read_barcode(Image.open(out/f'guide-qr-{width}.png'));assert decoded and decoded.text==link
  second=c.new_page();second.route('https://script.google.com/**',lambda r:r.abort());second.goto(link,wait_until='domcontentloaded');expect(second.locator('#course-select')).to_have_value('ebisu');expect(second.locator('.course-reference-line')).to_have_count(7);second.close();page.keyboard.press('Escape');page.get_by_role('button',name='食べる',exact=True).click();expect(page.locator('#map-list button')).to_have_count(37);expect(page.locator('.course-reference-line')).to_have_count(0);expect(page.locator('#course-select')).to_have_value('');page.locator('#reset').click();expect(page.locator('#map-list button')).to_have_count(117);expect(page.locator('.map-pin')).to_have_count(119);assert page.locator('#open-privacy').count()==0;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors,errors;runs.append({'width':width,'courses':5,'partial_reference_ways':8,'invented_connections':0,'unverified_indoor_and_negotiated_lines':0,'course_qr':'decoded'if os.environ.get('MINAMIGO_DECODE_QR')=='1'else'rendered','history_reload':'passed','javascript_errors':errors});print(f'PASS guide courses {width}px',flush=True);c.close()
 b.close()
(out/'guide-courses-result.json').write_text(json.dumps({'url':base,'runs':runs},ensure_ascii=False,indent=2),encoding='utf8')
if local:server.shutdown();tmp.cleanup()
