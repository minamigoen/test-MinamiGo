"""Export only manually reviewed OSM public walkway classes; never create connecting lines."""
import json,sys
from pathlib import Path
from xml.etree import ElementTree as E
APPROVED={559284524:'ohama',27210371:'ebisu',27210372:'ebisu',27210373:'ebisu',27210374:'ebisu',27210375:'ebisu',27210378:'ebisu',27210380:'ebisu'}
x=E.parse(sys.argv[1]).getroot();nodes={n.get('id'):[float(n.get('lat')),float(n.get('lon'))]for n in x.findall('node')};segments=[]
for w in x.findall('way'):
 wid=int(w.get('id'))
 if wid not in APPROVED:continue
 tags={t.get('k'):t.get('v')for t in w.findall('tag')}
 if tags.get('highway')not in ['footway','steps']or tags.get('access')in ['private','no']or tags.get('foot')in ['private','no']:raise ValueError('Reviewed path access changed')
 segments.append({'course':APPROVED[wid],'way':wid,'name':tags.get('name','歩道・階段の参考区間'),'highway':tags['highway'],'access':tags.get('access','not explicitly tagged'),'foot':tags.get('foot','not explicitly tagged'),'points':[nodes[n.get('ref')]for n in w.findall('nd')],'source':'https://www.openstreetmap.org/way/'+str(wid),'sourceUpdatedAt':w.get('timestamp')})
if set(s['way']for s in segments)!=set(APPROVED):raise ValueError('Missing reviewed path; retain previous geometry')
Path('data/guide-lines.json').write_text(json.dumps({'schemaVersion':1,'checkedAt':'2026-10-15','license':'ODbL-1.0','licenseUrl':'https://opendatacommons.org/licenses/odbl/1-0/','attribution':'© OpenStreetMap contributors','classification':'App reference segments, not official fixed guide routes or current access guarantees','segments':segments},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Reviewed walkway segments:',len(segments),'No invented connectors; no route distance/time calculation')
