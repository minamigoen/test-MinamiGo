"""Optional browser checks: pip install playwright; use installed Chromium or playwright's browser."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import tempfile,threading,shutil,os
PROJECT=Path(__file__).resolve().parents[1]
class QuietHandler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass

def start_site():
 temp=tempfile.TemporaryDirectory(prefix='minamigo-browser-');site=Path(temp.name)/'test-MinamiGo';shutil.copytree(PROJECT/'dist',site)
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=temp.name));threading.Thread(target=server.serve_forever,daemon=True).start()
 return temp,site,server,f'http://127.0.0.1:{server.server_port}/test-MinamiGo/'

def launch_browser(p):
 path=os.environ.get('MINAMIGO_CHROMIUM') or shutil.which('chromium') or shutil.which('google-chrome')
 return p.chromium.launch(headless=True,**({'executable_path':path} if path else {}))
