"""Rasterize the repo-native SVG layout for social previews; no remote images or user browser."""
import os,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright()as p:
 chrome=os.environ.get('MINAMIGO_CHROMIUM')or shutil.which('google-chrome')or shutil.which('chromium');b=p.chromium.launch(headless=True,**({'executable_path':chrome}if chrome else {}));page=b.new_page(viewport={'width':1200,'height':630},device_scale_factor=1);page.goto((root/'assets/share-card.svg').as_uri());page.evaluate('document.fonts.ready');page.screenshot(path=str(root/'assets/share-card.png'));b.close()
print('Created 1200×630 OGP PNG from local SVG and existing wave icon; no third-party photo')
