from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import shutil,re
from browser_env import start_site,launch_browser
temp,root,server,base=start_site()
with sync_playwright() as p:
 b=launch_browser(p);c=b.new_context();page=c.new_page();page.goto(base);page.wait_for_selector('.card');page.evaluate('navigator.serviceWorker.ready');page.reload();page.wait_for_selector('.card');page.locator('.save').first.click()
 sw=root/'sw.js';sw.write_text(re.sub(r"PREFIX\+'[^']+'", "PREFIX+'browser-test-next'", sw.read_text()))
 html=root/'index.html';html.write_text(html.read_text().replace('<title>MinamiGo | 美波をめぐる</title>','<title>UPDATED TEST VERSION</title>'))
 page.evaluate('navigator.serviceWorker.getRegistration().then(r=>r.update())');page.wait_for_selector('#update-notice',timeout=15000);assert page.title()!='UPDATED TEST VERSION'
 page.locator('#update').click();page.wait_for_function('document.title==="UPDATED TEST VERSION"',timeout=10000);page.wait_for_selector('.card');page.locator('a[data-page="saved"]').click();expect(page.locator('.card')).to_have_count(1)
 # A never-connected visitor cannot load an app shell that has never been installed.
 fresh=b.new_context();fresh.set_offline(True);fp=fresh.new_page()
 try:fp.goto(base)
 except Exception as e:assert 'ERR_INTERNET_DISCONNECTED' in str(e)
 else:raise AssertionError('fresh offline should require initial connection')
 b.close();server.shutdown();temp.cleanup();print('PASS: SW new version waits, user update activates/reloads, favorites survive, first never-connected load requires connection')
