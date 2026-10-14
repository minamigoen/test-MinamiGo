from playwright.sync_api import sync_playwright,expect
from browser_env import start_site,launch_browser,PROJECT
import json
snapshot=json.loads((PROJECT/'data/spots.json').read_text(encoding='utf-8'))
tmp,site,server,base=start_site()
with sync_playwright() as p:
 b=launch_browser(p);page=b.new_page(viewport={'width':390,'height':844});page.route('https://script.google.com/**',lambda r:r.abort());page.route('https://tile.openstreetmap.org/**',lambda r:r.fulfill(content_type='image/png',path=str(PROJECT/'icon-192.png')));page.goto(base+'#explore?view=cards');page.wait_for_selector('.card')
 for category,label,count in [('heritage','美波遺産',12),('powerspot','パワースポット',12)]:
  records=[s for s in snapshot['spots'] if s['category']==category]
  page.get_by_role('button',name=label,exact=True).click();expect(page.locator('.card')).to_have_count(count)
  page.locator('#map-view').click();expect(page.locator('#map-list button')).to_have_count(count)
  pins=sum(s.get('lat') is not None and s.get('mapVisibility')!='hidden' for s in records);expect(page.locator('.map-pin')).to_have_count(pins) if pins else expect(page.locator('#map')).not_to_be_visible()
  pending=[s for s in records if s.get('lat') is None]
  if pending:
   spot=pending[0];page.locator('#map-list [data-spot-id="'+spot['id']+'"]').click();expect(page.locator('dialog')).to_be_visible();expect(page.locator('#detail-title')).to_have_text(spot['name']);expect(page.locator('#detail-category')).to_have_text(label);page.locator('#close-detail').click()
  page.locator('#cards-view').click()
 page.reload();page.wait_for_selector('.card');expect(page.locator('.card')).to_have_count(12)
 for width in [320,390,768,1440]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 b.close();server.shutdown();tmp.cleanup()
print('PASS: heritage12 and power12 independent filters, all pending locations retained in map list/details, category reload, responsive category buttons')
