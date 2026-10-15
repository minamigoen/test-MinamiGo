"""Inventory every non-food/stay record; fetch bounded primary references, never copy page bodies."""
import json,hashlib,re,urllib.request,sys
from pathlib import Path
from datetime import datetime,timezone
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse,urldefrag
FIELDS=['address','hours','closed','price','tel','url']
def check(url):
 try:
  r=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'MinamiGo-source-review/1.0'}),timeout=15);raw=r.read(1500001)
  if len(raw)>1500000:return url,{'status':'too-large','http':r.status}
  return url,{'status':'fetched','http':r.status,'sha256':hashlib.sha256(raw).hexdigest(),'checkedAt':datetime.now(timezone.utc).isoformat()}
 except Exception as e:return url,{'status':'unavailable-retain','reason':type(e).__name__,'http':getattr(e,'code',None)}
def main():
 spots=json.loads(Path('data/spots.json').read_text(encoding='utf8'))['spots'];spots=[s for s in spots if s['category']not in ['food','stay']];refs={}
 for s in spots:
  urls=[s.get('url','')]+[l['url']for l in s.get('relatedLinks',[])];refs[s['id']]=next((urldefrag(u)[0]for u in urls if u and urlparse(u).hostname not in ['www.google.com','goo.gl','mapfan.com','moshicom.com','hotokami.jp']),None)
 if '--reuse-checks'in sys.argv:
  cached=json.loads(Path('maintenance/non-sheet-audit.json').read_text(encoding='utf8'))['sourceChecks'];checks={u:cached[u]if u in cached else check(u)[1]for u in sorted(set(u for u in refs.values()if u))}
 else:
  with ThreadPoolExecutor(max_workers=3)as pool:checks=dict(pool.map(check,sorted(set(u for u in refs.values()if u))))
 records=[]
 for s in spots:
  missing=[f for f in FIELDS if not s.get(f)];position='missing'if 'lat'not in s and not s.get('mapPoints')else'hidden-historical'if s.get('mapVisibility')=='hidden'else'reference'
  if position=='missing':missing.append('coordinates')
  if not s.get('photoUrl'):missing.append('permittedPhoto')
  reason='営業時間・料金・連絡先は歴史対象／自然・道路に一律適用せず、公開・立入条件は別途確認。'if s['category']in ['powerspot','heritage','nature']else'催しの年別日程はevents.jsonで管理。'if s['category']=='festival'else'空欄は未確認。画像は許諾未確認なら補完しない。'
  if s['id']=='guide-hiwasa-shrine':reason+='公式番号は宮司宅の表記。ガイド申込みはガイド会へ誘導し、施設電話欄への転記は見送り。'
  if s['id']=='guide-ebisu-cave':reason+='町記事の番号は産業振興課の問合せ先。施設直通番号として登録しない。'
  records.append({'id':s['id'],'name':s['name'],'category':s['category'],'missingFields':missing,'position':position,'sourceUrl':refs[s['id']],'sourceCheck':checks.get(refs[s['id']],{'status':'no-independent-web-source'}),'note':reason,'factCheck':'HTTP到達は事実の最新性の保証ではない。補完はweb-supplements.jsonの個別承認記録のみ。'})
 report={'checkedAt':datetime.now(timezone.utc).isoformat(),'scope':'Original food/stay Sheet rows excluded; all web/history/heritage/tourism/life records included even when mirrored to a management Sheet. Event22 separately reviewed.','records':records,'sourceChecks':checks,'recordCount':len(records),'positionMissing':[r['id']for r in records if r['position']=='missing'],'historicalHidden':[r['id']for r in records if r['position']=='hidden-historical']}
 Path('maintenance/non-sheet-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 lines=['# シート以外を原典とする施設の全件欠損点検','',report['checkedAt'],'','元の飲食・宿泊Sheet行を除き、管理Sheetへのミラー有無にかかわらず全件を対象とする。HTTP到達確認と内容の個別照合を区別。未許諾画像、歴史対象の営業時間、施設入口を推測して埋めない。','', '|ID・名称|空欄／保留|位置|根拠・取得状況|','|---|---|---|---|']
 for r in records:lines.append('|'+r['id']+' '+r['name']+'|'+', '.join(r['missingFields'])+'|'+r['position']+'|'+('['+r['sourceCheck']['status']+']('+r['sourceUrl']+')'if r['sourceUrl']else'独立したWeb原典なし')+'|')
 lines+=['','住所・時間・休日・料金・電話・URLの空欄を列挙。自然地・歴史対象では空欄が営業施設と同じ意味にはならない。祭りの開催日は年別カレンダーで確認する。位置missingと、歴史情報の意図的な非表示は区別する。','', '今回の補完根拠は data/web-supplements.json。OSM座標だけをdata/osm-locations.jsonにODbLとして分離し、写真・レビューは転載しない。']
 Path('docs/NON-SHEET-AUDIT.md').write_text('\n'.join(lines)+'\n',encoding='utf8');print(json.dumps({'records':len(records),'sources':len(checks),'fetched':sum(c['status']=='fetched'for c in checks.values()),'positionMissing':report['positionMissing'],'historicalHidden':report['historicalHidden']},ensure_ascii=False))
if __name__=='__main__':main()
