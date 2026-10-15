"""Local QR, safe sharing, install feature detection and small screen dialogs."""
import json,os,sys,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from browser_env import start_site,launch_browser,PROJECT
server=None
if '--local' in sys.argv:tmp,site,server,base=start_site()
else:base=os.environ.get('MINAMIGO_UTILITIES_TEST_URL','https://minamigoen.github.io/test-MinamiGo/')
out=Path('live-evidence');out.mkdir(exist_ok=True);runs=[]
with sync_playwright() as p:
 chrome=os.environ.get('MINAMIGO_CHROMIUM') or shutil.which('google-chrome') or shutil.which('chromium');b=p.chromium.launch(headless=True,**({'executable_path':chrome} if chrome else {}))
 for width in [320,390,1440]:
  c=b.new_context(viewport={'width':width,'height':900},service_workers='block');page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base,wait_until='domcontentloaded');page.wait_for_selector('.map-pin');page.locator('#map-list button').first.click();spot=page.locator('#map-list button').first.get_attribute('data-spot-id');page.locator('#map-share').click();expect(page.locator('#share-dialog')).to_be_visible();expect(page.locator('#share-current')).to_be_checked();assert page.locator('#share-link').input_value()==base+'?id='+spot+'#explore'
  page.locator('#share-current').uncheck();expect(page.locator('#share-link')).to_have_value(base+'#explore');expect(page.locator('#share-qr svg')).to_be_visible();assert page.locator('#share-qr svg').get_attribute('aria-label')
  path=out/f'qr-{width}.png';page.locator('#share-qr svg').screenshot(path=str(path));page.screenshot(path=str(out/f'share-{width}.png'))
  if os.environ.get('MINAMIGO_DECODE_QR')=='1':
   import zxingcpp
   from PIL import Image
   decoded=zxingcpp.read_barcode(Image.open(path));assert decoded and decoded.text==base+'#explore'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.locator('#share-install').click();expect(page.locator('#install-dialog')).to_be_visible();expect(page.locator('#install-dialog')).to_contain_text('Safari');expect(page.locator('#install-dialog')).to_contain_text('Android');page.screenshot(path=str(out/f'install-{width}.png'));page.keyboard.press('Escape');expect(page.locator('#share-dialog')).to_be_visible();page.keyboard.press('Escape');expect(page.locator('#share-dialog')).not_to_be_visible();expect(page.locator('#detail')).to_be_visible();expect(page.locator('#detail-title')).not_to_be_empty();expect(page.locator('#map-share')).to_be_focused()
  # A real install event is a feature-detected user action; no event means instructions.
  page.evaluate('''()=>{const e=new Event('beforeinstallprompt');e.prompt=async()=>{window.installPromptCalled=true};e.userChoice=Promise.resolve({outcome:'dismissed'});window.dispatchEvent(e)}''');page.locator('#open-share').click();page.locator('#share-install').click();expect(page.locator('#install')).to_be_visible();page.locator('#install').click();expect(page.locator('#install-status')).to_contain_text('キャンセル');assert page.evaluate('window.installPromptCalled');assert not errors,errors;runs.append({'width':width,'qr':'rendered and decoded' if os.environ.get('MINAMIGO_DECODE_QR')=='1' else 'rendered','sharing':'stable selected ID or app URL only','install':'instructions, feature detection and dismissed prompt','focus_restored':True,'javascript_errors':errors});c.close();print(f'PASS utilities {width}px',flush=True)
 b.close()
(out/'utilities-result.json').write_text(json.dumps({'url':base,'runs':runs},ensure_ascii=False,indent=2),encoding='utf8')
if server:server.shutdown();tmp.cleanup()
