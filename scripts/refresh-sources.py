"""Daily read-only refresh: municipal page, RSS, ICS. Never mutate published data."""
import argparse,hashlib,json,os,subprocess,sys
from datetime import datetime
from zoneinfo import ZoneInfo
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlparse
from xml.etree import ElementTree as E
from email.utils import parsedate_to_datetime
RSS='https://www.town.minami.lg.jp/oshirase/kanko/rss.xml'
PUBLIC=['data/spots.json','data/local-content.json','data/events.json','data/life.json','data/sightseeing.json']
def hashes():return {p:hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in PUBLIC}
def parse_rss(raw):
 root=E.fromstring(raw)
 if root.tag!='rss':raise ValueError('unexpected_feed_type')
 items=root.findall('./channel/item')
 if not 1<=len(items)<=100:raise ValueError('empty_or_large_feed')
 rows=[];seen=set()
 for item in items:
  link=(item.findtext('link')or'').strip();u=urlparse(link);title=(item.findtext('title')or'').strip();published=item.findtext('pubDate')or''
  if u.scheme!='https' or u.netloc!='www.town.minami.lg.jp' or not title or len(title)>300 or link in seen:raise ValueError('invalid_feed_identity')
  if published:parsedate_to_datetime(published)
  seen.add(link);rows.append({'url':link,'title':title,'publishedAt':published,'dateMeaning':'article-publication-not-event-date'})
 return rows
def rss_plan(rows,baseline):
 old={r['url']:r for r in baseline};new={r['url']:r for r in rows}
 if baseline and len(rows)<len(baseline)*.5:raise ValueError('steep_feed_drop')
 return {'status':'review','new':[r for r in rows if r['url']not in old],'changed':[r for r in rows if r['url']in old and r!=old[r['url']]],'notInLatestFeedRetained':[u for u in old if u not in new],'delete':False,'eventDatesInferred':False}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--fixture-dir');args=ap.parse_args();now=datetime.now(ZoneInfo('Asia/Tokyo'));dest=Path('staging');dest.mkdir(exist_ok=True);before=hashes();results={}
 fixture=Path(args.fixture_dir) if args.fixture_dir else None
 commands={'town':[sys.executable,'scripts/town-source.py']+(['--html',str(fixture/'town.html')]if fixture else []),'calendar':['node','scripts/review-calendar.mjs',str(now.year),str(now.month)]+([str(fixture/'calendar.ics')]if fixture else [])}
 for key,cmd in commands.items():
  target=dest/('town-candidates.json'if key=='town'else'calendar-candidates.json')
  try:
   # Remove only stale staging output; no published files are touched.
   target.unlink(missing_ok=True);run=subprocess.run(cmd,capture_output=True,text=True,encoding='utf8',timeout=70)
   if run.returncode or not target.exists():raise ValueError('fetch_or_validation_failed')
   data=json.loads(target.read_text(encoding='utf8'));results[key]={'status':data['status'],'changes':len(data.get('changes',data.get('candidates',[]))),'retained':True}
  except Exception as e:
   data={'status':'blocked','reason':type(e).__name__,'retained':True,'publishedDataChanged':False};target.write_text(json.dumps(data,indent=2),encoding='utf8');results[key]=data
 try:
  raw=(fixture/'rss.xml').read_bytes()if fixture else urlopen(Request(RSS,headers={'User-Agent':'MinamiGo-source-review/1.0'}),timeout=25).read(1500001)
  if len(raw)>1500000:raise ValueError('large_feed')
  rows=parse_rss(raw);baseline=json.loads(Path('maintenance/rss-baseline.json').read_text(encoding='utf8'))if Path('maintenance/rss-baseline.json').exists()else[]
  data=rss_plan(rows,baseline);data.update({'sourceUrl':RSS,'checkedAt':now.isoformat(),'records':rows});(dest/'rss-candidates.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8');results['rss']={'status':'review','records':len(rows),'new':len(data['new']),'changed':len(data['changed']),'retained':True}
 except Exception as e:
  data={'status':'blocked','reason':type(e).__name__,'sourceUrl':RSS,'retained':True};(dest/'rss-candidates.json').write_text(json.dumps(data,indent=2),encoding='utf8');results['rss']=data
 after=hashes()
 if before!=after:raise RuntimeError('Published files unexpectedly changed')
 summary={'checkedAt':now.isoformat(),'sources':results,'publishedDataChanged':False,'publicHashesUnchanged':True,'autoPublication':'held: existing workflow is contents:read; no permission expansion','schedule':'daily 21:17 UTC / 06:17 Asia/Tokyo; actual execution may be delayed'}
 (dest/'refresh-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(summary,ensure_ascii=False))
 if os.environ.get('GITHUB_STEP_SUMMARY'):
  with open(os.environ['GITHUB_STEP_SUMMARY'],'a',encoding='utf8')as f:f.write('## MinamiGo source refresh\n\n'+now.isoformat()+'\n\n'+'\n'.join('- '+k+': '+v['status']for k,v in results.items())+'\n\nPublished data retained; review artifacts saved. No automatic deletion or publication.\n')
 return 0 if all(r['status']=='review'for r in results.values())else 1
if __name__=='__main__':sys.exit(main())
