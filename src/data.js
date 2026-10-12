export const CATEGORIES = {nature:'海・自然',culture:'文化・歴史',food:'食べる',shop:'買う',experience:'体験',stay:'泊まる',other:'その他'};
export const PUBLIC_FIELDS = ['id','name','category','description','address','lat','lng','hours','closed','price','tel','url','source','verifiedAt','accessNote','imageryDate','streetViewUrl','mapQuery','mapPlaceId','locationLabel','mapScope','directionsMode'];
export function safeURL(value) { try { const u=new URL(value); return u.protocol==='https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; } }
export function validateData(input) {
  if (!input || input.schemaVersion!==1 || !Array.isArray(input.spots) || input.spots.length>2000) throw new Error('データ形式が正しくありません');
  const ids=new Set();
  const spots=input.spots.map((row,i)=>{
    if (!row || typeof row!=='object' || Array.isArray(row)) throw new Error(`行 ${i+1}: 形式`);
    const spot={};
    for(const key of PUBLIC_FIELDS) if(row[key]!==undefined && row[key]!==null) {
      if(key==='lat'||key==='lng') { if(typeof row[key]!=='number'||!Number.isFinite(row[key])) throw new Error(`行 ${i+1}: 座標`); spot[key]=row[key]; }
      else { if(typeof row[key]!=='string'||row[key].length>2000) throw new Error(`行 ${i+1}: ${key}`); spot[key]=row[key].trim(); }
    }
    if(!/^[a-z0-9-]{1,80}$/.test(spot.id||'') || ids.has(spot.id)) throw new Error(`行 ${i+1}: ID`);
    ids.add(spot.id);
    if(!spot.name || spot.name.length>120 || !CATEGORIES[spot.category] || !spot.source || !/^\d{4}-\d{2}-\d{2}$/.test(spot.verifiedAt||'')) throw new Error(`行 ${i+1}: 名称・カテゴリ・出典・確認日が必要です`);
    if((spot.lat===undefined)!==(spot.lng===undefined) || Math.abs(spot.lat??0)>90 || Math.abs(spot.lng??0)>180) throw new Error(`行 ${i+1}: 座標範囲`);
    if(spot.url && !safeURL(spot.url)) throw new Error(`行 ${i+1}: HTTPS URLのみ`);
    if(spot.streetViewUrl){const u=new URL(spot.streetViewUrl);if(u.username||u.password||u.origin!=='https://www.google.com'||u.pathname!=='/maps/@'||u.searchParams.get('map_action')!=='pano')throw new Error(`行 ${i+1}: Street View URL`);}
    if(spot.mapScope==='surroundings'&&!spot.locationLabel)throw new Error('周辺地点の説明が必要です');
    if(spot.directionsMode&&!spot.mapQuery)throw new Error('経路検索先が必要です');
    if(spot.mapScope&&spot.mapScope!=='surroundings')throw new Error('地図範囲');
    if(spot.directionsMode&&spot.directionsMode!=='walking')throw new Error('経路モード');
    if(spot.tel && !/^[0-9+() -]{5,30}$/.test(spot.tel)) throw new Error(`行 ${i+1}: 電話番号`);
    return spot;
  });
  if(typeof input.updatedAt!=='string'||!Number.isFinite(Date.parse(input.updatedAt))) throw new Error('更新日が必要です');
  return {schemaVersion:1,updatedAt:input.updatedAt,spots};
}
export function filterSpots(spots,{q='',category='',saved=false},favorites=[]) {
  const term=q.normalize('NFKC').toLocaleLowerCase('ja').trim();
  return spots.filter(s=>(!category||s.category===category)&&(!saved||favorites.includes(s.id))&&(!term||[s.name,s.address,s.description,CATEGORIES[s.category]].join(' ').normalize('NFKC').toLocaleLowerCase('ja').includes(term)));
}
export function distanceKm(a,b) { const rad=x=>x*Math.PI/180; const dlat=rad(b.lat-a.lat),dlng=rad(b.lng-a.lng); const n=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlng/2)**2; return 6371*2*Math.atan2(Math.sqrt(n),Math.sqrt(1-n)); }
