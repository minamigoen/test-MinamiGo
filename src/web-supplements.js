import {validateData,safeURL,validDate} from './data.js';
const allowed=['tel','price','url','closed','hours','serviceHours','serviceStatus','officialCheckedAt'];
export function applyWebSupplements(spots,review,osm,{scope='all'}={}){
 if(review?.schemaVersion!==1||!validDate(review.checkedAt)||!Array.isArray(review.patches)||!Array.isArray(review.additions)||osm?.license!=='ODbL-1.0')throw Error('Invalid web supplement review');
 const result=structuredClone(spots),seen=new Set();
 for(const patch of review.patches){
  if(seen.has(patch.id))throw Error('Duplicate web patch');seen.add(patch.id);const row=result.find(s=>s.id===patch.id);
  if(!row){if(scope==='all')throw Error('Web patch target missing');continue;}if(row.name!==patch.expectedName||!safeURL(patch.sourceUrl))throw Error('Web identity/evidence changed');
  for(const [k,v]of Object.entries(patch.fields)){if(!allowed.includes(k))throw Error('Protected web field');row[k]=v;}
  row.officialCheckedAt=review.checkedAt;
  if(patch.osmNode){const point=osm.records.find(p=>p.node===patch.osmNode&&p.id===row.id);if(!point||point.officialPhone!==row.tel||point.officialName!==row.name||!safeURL(point.sourceUrl)||point.lat<33.5||point.lat>34||point.lng<134.3||point.lng>134.8)throw Error('OSM correspondence changed');
   row.lat=point.lat;row.lng=point.lng;row.locationLabel='OSM店舗代表点。公式の名称・電話・店舗案内と照合。入口・現況は未実測。';row.mapScope='surroundings';row.mapVisibility='reference';row.navigationPolicy='disabled';delete row.directionsMode;
   row.accessNote='座標：© OpenStreetMap contributors（ODbL）。店舗ノードを使用し、隣の駐車場ノードは使用していません。公式地図指定点と約2m差。入口・立入り・現在の営業は未実測です。';row.source+='。座標：© OpenStreetMap contributors（ODbL）';row.source=row.source.replace(/(?:。座標：© OpenStreetMap contributors（ODbL）){2,}/g,'。座標：© OpenStreetMap contributors（ODbL）');
   row.relatedLinks=(row.relatedLinks||[]).filter(l=>!l.url.includes('openstreetmap.org')&&!l.url.includes('opendatacommons.org'));row.relatedLinks.push({label:'店舗座標の出典：OpenStreetMap',url:point.sourceUrl},{label:'座標データの利用条件：ODbL',url:'https://opendatacommons.org/licenses/odbl/1-0/'});
  }
 }
 for(const row of review.additions){if(scope!=='all'&&row.category!==scope)continue;const i=result.findIndex(s=>s.id===row.id);if(i>=0){if(result[i].name!==row.name)throw Error('Web addition identity changed');result[i]=structuredClone(row);}else result.push(structuredClone(row));}
 return validateData({schemaVersion:1,updatedAt:review.checkedAt,spots:result}).spots;
}
