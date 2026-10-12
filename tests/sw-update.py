from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import shutil
root=Path('/workspace/minamigo-sw-check');shutil.rmtree(root,ignore_errors=True);shutil.copytree('/workspace/minamigo-test/dist',root)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context();page=c.new_page();page.goto('http://127.0.0.1:4173/minamigo-sw-check/');page.wait_for_selector('.card');page.evaluate('navigator.serviceWorker.ready');page.reload();page.wait_for_selector('.card');page.locator('.save').first.click()
 sw=root/'sw.js';sw.write_text(sw.read_text().replace('20261012-1','20261012-2'))
 html=root/'index.html';html.write_text(html.read_text().replace('<title>MinamiGo | 美波をめぐる</title>','<title>UPDATED TEST VERSION</title>'))
 page.evaluate('navigator.serviceWorker.getRegistration().then(r=>r.update())');page.wait_for_selector('#update-notice',timeout=15000);assert page.title()!='UPDATED TEST VERSION'
 page.locator('#update').click();page.wait_for_function('document.title==="UPDATED TEST VERSION"');page.wait_for_selector('.card');page.locator('a[data-page="saved"]').click();expect(page.locator('.card')).to_have_count(1)
 # A never-connected visitor cannot load an app shell that has never been installed.
 fresh=b.new_context();fresh.set_offline(True);fp=fresh.new_page()
 try:fp.goto('http://127.0.0.1:4173/minamigo-sw-check/')
 except Exception as e:assert 'ERR_INTERNET_DISCONNECTED' in str(e)
 else:raise AssertionError('fresh offline should require initial connection')
 b.close();shutil.rmtree(root);print('PASS: SW new version waits, user update activates/reloads, favorites survive, first never-connected load requires connection')
