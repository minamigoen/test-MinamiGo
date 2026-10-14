export const CATEGORIES = {nature:'海・自然',culture:'文化・歴史',heritage:'美波遺産',powerspot:'パワースポット',food:'食べる',shop:'買う',experience:'体験',stay:'泊まる',other:'その他'};
export const PHOTO_FIELDS=['photoUrl','photoAlt','photoSource','photoLicense','photoCredit'];
export const PHOTO_LICENSES={'CC BY 2.0':'https://creativecommons.org/licenses/by/2.0/','CC BY 4.0':'https://creativecommons.org/licenses/by/4.0/','CC BY-SA 4.0':'https://creativecommons.org/licenses/by-sa/4.0/','CC0 1.0':'https://creativecommons.org/publicdomain/zero/1.0/','掲載許諾確認済み':'','管理者撮影（掲載権利確認済み）':''};
export const PUBLIC_FIELDS = ['id','name','category','description','address','lat','lng','hours','closed','price','tel','url','source','verifiedAt','accessNote','imageryDate','streetViewUrl','mapQuery','mapPlaceId','locationLabel','mapScope','mapVisibility','navigationPolicy','directionsMode','photoLink','photoStatus',...PHOTO_FIELDS,'relatedLinks','foodType','officialCheckedAt','upstreamId'];
export function safeURL(value) {
 if(typeof value!=='string'||value.length>2048)return '';
 try {const u=new URL(value),host=u.hostname.toLowerCase();if([...u.searchParams.keys()].some(k=>/^(?:access_token|token|api_key|apikey|key|signature|sig|password|secret|authorization|auth)$/i.test(k)))return '';return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&host.includes('.')&&!/^\d+(?:\.\d+){3}$/.test(host)&&!host.includes(':')&&!/(?:^|\.)(?:localhost|local|lan|internal)$/.test(host)?u.href:'';}catch{return '';}
}
export function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function validateData(input) {
 if(!input||input.schemaVersion!==1||!Array.isArray(input.spots)||input.spots.length>2000)throw new Error('データ形式が正しくありません');
 const ids=new Set();
 const spots=input.spots.map((row,i)=>{
  if(!row||typeof row!=='object'||Array.isArray(row))throw new Error(`行 ${i+1}: 形式`);
  const spot={};
  for(const key of PUBLIC_FIELDS)if(row[key]!==undefined&&row[key]!==null){
   if(key==='relatedLinks'){
    if(!Array.isArray(row[key])||row[key].length>8)throw new Error(`行 ${i+1}: 関連リンクは8件以内`);
    const urls=new Set();spot[key]=row[key].map(link=>{if(!link||typeof link.label!=='string'||!link.label.trim()||link.label.length>100||!safeURL(link.url))throw new Error(`行 ${i+1}: 関連リンクの名称・HTTPS URL`);const url=safeURL(link.url);if(urls.has(url))throw new Error(`行 ${i+1}: 関連リンク重複`);urls.add(url);return {label:link.label.trim(),url};});
   }else if(key==='lat'||key==='lng'){if(typeof row[key]!=='number'||!Number.isFinite(row[key]))throw new Error(`行 ${i+1}: 座標`);spot[key]=row[key];}
   else{if(typeof row[key]!=='string'||row[key].length>2000)throw new Error(`行 ${i+1}: ${key}`);spot[key]=row[key].trim();}
  }
  if(!/^[a-z0-9-]{1,80}$/.test(spot.id||'')||ids.has(spot.id))throw new Error(`行 ${i+1}: ID`);ids.add(spot.id);
  if(!spot.name||spot.name.length>120||!Object.hasOwn(CATEGORIES,spot.category)||!spot.source||!validDate(spot.verifiedAt))throw new Error(`行 ${i+1}: 名称・カテゴリ・出典・確認日が必要です`);
  if((spot.lat===undefined)!==(spot.lng===undefined)||Math.abs(spot.lat??0)>90||Math.abs(spot.lng??0)>180)throw new Error(`行 ${i+1}: 座標範囲`);
  if(spot.url&&!safeURL(spot.url))throw new Error(`行 ${i+1}: 公開HTTPS URLのみ`);
  if(spot.streetViewUrl){if(!safeURL(spot.streetViewUrl))throw new Error('Street View URL');const u=new URL(spot.streetViewUrl);if(u.origin!=='https://www.google.com'||u.pathname!=='/maps/@'||u.searchParams.get('map_action')!=='pano')throw new Error(`行 ${i+1}: Street View URL`);}
  if(spot.mapVisibility&&!['reference','hidden'].includes(spot.mapVisibility))throw new Error('地図表示区分');
  if(spot.navigationPolicy&&!['reference','disabled'].includes(spot.navigationPolicy))throw new Error('案内区分');
  if(spot.navigationPolicy==='disabled'&&spot.directionsMode)throw new Error('保留・旧位置・山上地点の経路案内は無効');
  if(spot.mapVisibility==='hidden'&&(spot.mapQuery||spot.directionsMode))throw new Error('非表示地点への通常案内は無効');
  if(spot.mapScope&&!spot.locationLabel)throw new Error('周辺地点の説明が必要です');
  if(spot.directionsMode&&!spot.mapQuery)throw new Error('経路検索先が必要です');
  if(spot.mapScope&&!['surroundings','name-address','sheet-reference'].includes(spot.mapScope))throw new Error('地図範囲');
  if(spot.mapScope==='name-address'&&(!spot.address||!spot.mapQuery||spot.lat!==undefined))throw new Error('名称・住所検索には住所と検索名が必要で、未検証の座標は使用できません');
  if(spot.mapScope==='sheet-reference'&&(spot.category!=='stay'||spot.lat===undefined||spot.lat<33.5||spot.lat>34||spot.lng<134.3||spot.lng>134.8))throw new Error('宿泊参考座標範囲');
  if(spot.photoLink){const u=new URL(safeURL(spot.photoLink)||'https://invalid.example');if(u.origin!=='https://www.town.minami.lg.jp'||!/^\/foreign_country\/assets\/images\/sightseeing\/stay_(?:img|thumb)\d+\.jpg$/.test(u.pathname))throw new Error('公開写真リンクは確認済み町画像のみ');}
  if(spot.directionsMode&&spot.directionsMode!=='walking')throw new Error('経路モード');
  if(spot.tel&&!/^[0-9+() -]{5,30}$/.test(spot.tel))throw new Error(`行 ${i+1}: 電話番号`);
  if(spot.upstreamId&&!/^\d{10}$/.test(spot.upstreamId))throw new Error('元データNO');
  if(spot.officialCheckedAt&&!validDate(spot.officialCheckedAt))throw new Error(`行 ${i+1}: 公式情報の確認日`);
  if(spot.foodType&&(spot.category!=='food'||spot.foodType.length>80))throw new Error(`行 ${i+1}: 飲食店の種類`);
  if(spot.photoUrl){
   if(!safeURL(spot.photoUrl)||!safeURL(spot.photoSource)||!spot.photoAlt||spot.photoAlt.length>200||!spot.photoCredit||spot.photoCredit.length>200||!Object.hasOwn(PHOTO_LICENSES,spot.photoLicense))throw new Error(`行 ${i+1}: 写真の公開URL・代替テキスト・出典・クレジット・確認済み利用条件が必要です`);
  }else if(PHOTO_FIELDS.some(k=>spot[k]))throw new Error(`行 ${i+1}: 写真URLがない写真メタデータ`);
  return spot;
 });
 if(typeof input.updatedAt!=='string'||!Number.isFinite(Date.parse(input.updatedAt)))throw new Error('更新日が必要です');
 return {schemaVersion:1,updatedAt:input.updatedAt,spots};
}
export function filterSpots(spots,{q='',category='',saved=false,foodType=''},favorites=[]){
 const term=q.normalize('NFKC').toLocaleLowerCase('ja').trim();
 return spots.filter(s=>(!category||s.category===category)&&(!foodType||s.foodType===foodType||(s.foodType||'').split('・').map(t=>t.trim()).includes(foodType))&&(!saved||favorites.includes(s.id))&&(!term||[s.name,s.address,s.description,s.foodType,CATEGORIES[s.category]].join(' ').normalize('NFKC').toLocaleLowerCase('ja').includes(term)));
}
export function distanceKm(a,b){const rad=x=>x*Math.PI/180,dlat=rad(b.lat-a.lat),dlng=rad(b.lng-a.lng),n=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlng/2)**2;return 6371*2*Math.atan2(Math.sqrt(n),Math.sqrt(1-n));}

export const isVisibleMapSpot=s=>s.lat!==undefined&&s.mapVisibility!=='hidden';
