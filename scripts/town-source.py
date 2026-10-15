"""Read the municipal tourism page only; stage candidates, never publish or geocode."""
import argparse,hashlib,json,re,sys,urllib.request
from datetime import datetime,timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
PAGE='https://www.town.minami.lg.jp/foreign_country/jp/sightseeing.html'
class Node:
 def __init__(self,tag='',attrs=None):self.tag=tag;self.attrs=dict(attrs or []);self.children=[]
 def text(self):return ' '.join(' '.join(c.text() if isinstance(c,Node) else c for c in self.children).split())
 def all(self,tag):return [c for c in self.children if isinstance(c,Node) and c.tag==tag]+[n for c in self.children if isinstance(c,Node) for n in c.all(tag)]
class Parser(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.root=Node();self.stack=[self.root]
 def handle_starttag(self,tag,attrs):
  n=Node(tag,attrs);self.stack[-1].children.append(n)
  if tag not in ['img','input','br','hr','meta','link','source','wbr','area','base','embed']:self.stack.append(n)
 def handle_endtag(self,tag):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==tag:self.stack=self.stack[:i];break
 def handle_data(self,data):self.stack[-1].children.append(data)
def parse_page(html):
 parser=Parser();parser.feed(html);records=[];seen=set()
 for modal in parser.root.all('div'):
  key=modal.attrs.get('id','').removeprefix('inline-wrap_')
  if not re.fullmatch(r'(watch|fes|exsur)\d+',key):continue
  if key in seen:raise ValueError('duplicate_source_key')
  seen.add(key);titles=modal.all('h3');images=modal.all('img')
  if not titles or not images:raise ValueError('source_structure_changed')
  fields={}
  for tr in modal.all('tr'):
   h,v=tr.all('th'),tr.all('td')
   if h and v:fields[h[0].text()]=v[0].text()
  urls=[a.attrs.get('href','') for a in modal.all('a')]
  official=[u for u in urls if u.startswith('https://') and not any(h in u for h in ['goo.gl','google.com/maps','instagram.com'])]
  records.append({'key':key,'name':titles[0].text(),'hours':fields.get('営業時間',''),'closed':fields.get('休日',''),'tel':fields.get('TEL',fields.get('TEL/FAX','')),'url':official[0] if official else PAGE+'#inline-wrap_'+key,'image':urljoin(PAGE,images[0].attrs.get('src','')),'eventPeriod':fields.get('開催日','')})
 return {'sourceUrl':PAGE,'checkedAt':datetime.now(timezone.utc).isoformat(),'htmlSha256':hashlib.sha256(html.encode()).hexdigest(),'records':records}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--html');ap.add_argument('--baseline',default='maintenance/town-source-baseline.json');ap.add_argument('--policy',default='maintenance/town-source-policy.json');ap.add_argument('--output',default='staging/town-candidates.json');args=ap.parse_args();dest=Path(args.output);dest.parent.mkdir(parents=True,exist_ok=True)
 try:
  html=Path(args.html).read_text(encoding='utf8') if args.html else urllib.request.urlopen(urllib.request.Request(PAGE,headers={'User-Agent':'MinamiGo-source-review/1.0'}),timeout=25).read().decode('utf8')
  fetched=parse_page(html)
 except Exception as e:
  dest.write_text(json.dumps({'status':'blocked','reason':'fetch_or_structure_failed','sourceUrl':PAGE},ensure_ascii=False,indent=2),encoding='utf8');print('Blocked: municipal source unavailable or changed; published data untouched');return 2
 if not Path(args.baseline).exists():
  dest.write_text(json.dumps(fetched,ensure_ascii=False,indent=2),encoding='utf8');print('Source snapshot only; no public data changed');return 0
 # Node implements the same tested approval/protection checks as the operator command.
 import subprocess,tempfile
 with tempfile.TemporaryDirectory(prefix='minamigo-town-review-') as tmp:
  source=Path(tmp)/'fetched.json';source.write_text(json.dumps(fetched,ensure_ascii=False),encoding='utf8')
  result=subprocess.run(['node','scripts/plan-town-updates.mjs',args.baseline,str(source),args.policy,str(dest)],check=False)
 return result.returncode
if __name__=='__main__':sys.exit(main())
