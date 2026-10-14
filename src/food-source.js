import {approvedFacilityPhoto} from './photo-source.js';
import {validateData,safeURL,PHOTO_FIELDS} from './data.js';
export const FOOD_EXTRA_FIELDS=['id','foodType','description','accessNote','relatedLinks','officialCheckedAt',...PHOTO_FIELDS];
const normalize=s=>s.normalize('NFKC').toLocaleLowerCase('ja').replace(/[\s・･]/g,'');
function text(v,key,max=2000){if(v===''||v==null)return '';if(typeof v!=='string'||v.length>max)throw new Error('Invalid upstream '+key);return v.trim();}
export function localContentFromSnapshot(snapshot){const d=validateData(snapshot);return {schemaVersion:1,updatedAt:d.updatedAt,walk:d.spots.filter(s=>s.category!=='food'),foodExtras:d.spots.filter(s=>s.category==='food').map(s=>Object.fromEntries(FOOD_EXTRA_FIELDS.filter(k=>s[k]!==undefined).map(k=>[k,s[k]])))};}
export function mergeFoodSource(rows,local,config,fetchedAt=new Date().toISOString()){
 if(!Array.isArray(rows)||!rows.length||rows.length>2000)throw new Error('Food source must be a nonempty public array');
 if(!local||local.schemaVersion!==1||!Array.isArray(local.walk)||!Array.isArray(local.foodExtras))throw new Error('Invalid local content');
 if(config.url!=='https://script.google.com/macros/s/AKfycbwUu-Xl9mpPWdnZGacuebLcC8mHy-eZv86EnQqxaUG9djOkA7lf2fByRYmj8ZDC4E_2/exec')throw new Error('Unexpected food endpoint');
 if(local.walk.some(s=>s.category==='food'))throw new Error('Food basic records must come only from the shared source');
 const extra=new Map(local.foodExtras.map(s=>[s.id,s]));if(extra.size!==local.foodExtras.length)throw new Error('Duplicate food annotation ID');
 const seenNo=new Set(),seenPlace=new Set(),warnings=[],sourceRows=[];
 const food=rows.map(row=>{
  if(!row||typeof row!=='object'||Array.isArray(row))throw new Error('Invalid upstream row');
  const rawNo=String(row.no??'');if(!/^\d{1,10}$/.test(rawNo))throw new Error('Missing/invalid upstream NO');const no=rawNo.padStart(10,'0');
  if(seenNo.has(no))throw new Error('Duplicate upstream NO');seenNo.add(no);
  const name=text(row.name,'name',120),address=text(row.address,'address',400);if(!name||!address)throw new Error('Missing upstream name/address');
  const identity=normalize(name)+'|'+normalize(address);if(seenPlace.has(identity))throw new Error('Duplicate upstream establishment');seenPlace.add(identity);
  const mapping=config.idMap?.[no];
  if(mapping&&!mapping.names.some(n=>normalize(n)===normalize(name)))throw new Error('Mapped establishment name changed; review ID correspondence');
  for(const [expectedNo,m]of Object.entries(config.idMap||{}))if(expectedNo!==no&&m.names.some(n=>normalize(n)===normalize(name)))throw new Error('Known establishment NO changed; review mapping');
  const id=mapping?.id||'minamimeshi-'+no,annotation=extra.get(id)||{};
  const s={id,name,category:'food',address,source:'美波飯の共通公開データ（元情報の更新日・現在の営業状況は未確認）',verifiedAt:fetchedAt.slice(0,10),upstreamId:no,foodType:'種類未確認',description:'美波飯の元公開データに掲載されている施設です。現在の営業・提供内容は来店前にご確認ください。'};
  for(const key of FOOD_EXTRA_FIELDS)if(key!=='id'&&annotation[key]!==undefined)s[key]=annotation[key];
  if(config.photoApproval?.approved){for(const key of PHOTO_FIELDS)delete s[key];Object.assign(s,approvedFacilityPhoto({category:'food',name,image:row.image,approval:config.photoApproval}));if(!s.photoUrl)s.photoStatus=row.image?'写真リンクを確認中':'写真未登録';}
  for(const key of ['hours','closed','tel']){const v=text(row[key],key);if(v)s[key]=v;}
  if(s.tel&&!/^[0-9+() -]{5,30}$/.test(s.tel)){delete s.tel;warnings.push({no,field:'tel',reason:'unsupported format'});}
  const rawUrl=text(row.url,'url'),rawSns=text(row.sns,'sns');const url=safeURL(rawUrl),sns=safeURL(rawSns);if(url)s.url=url;else if(rawUrl)warnings.push({no,field:'url',reason:'unsafe/non-HTTPS URL omitted'});
  const links=[...(s.relatedLinks||[])];if(sns&&sns!==url&&!links.some(l=>l.url===sns))links.push({label:'元データ掲載のSNS',url:sns});if(rawSns&&!sns)warnings.push({no,field:'sns',reason:'unsafe/non-HTTPS URL omitted'});s.relatedLinks=links.slice(0,8);
  const lat=row.lat,lng=row.lng,hasLat=lat!==''&&lat!=null,hasLng=lng!==''&&lng!=null;
  if(hasLat!==hasLng)throw new Error('Incomplete upstream coordinates');
  if(hasLat){if(typeof lat!=='number'||typeof lng!=='number'||!Number.isFinite(lat)||!Number.isFinite(lng)||lat<33||lat>35||lng<133||lng>136)throw new Error('Invalid upstream coordinates');s.lat=lat;s.lng=lng;s.mapScope='surroundings';s.locationLabel='元公開データの掲載地点（入口・現況・経路は未検証）';}
  else{s.mapScope='name-address';s.locationLabel='名称・住所からの検索（地点・入口・経路は未検証）';}
  s.mapQuery=name+' '+address;s.directionsMode='walking';s.accessNote='名称・住所・電話・営業時間・定休日は美波飯と同じ元公開データです。元情報の更新日は不明で、現在の営業・入口・経路を保証しません。来店前に店舗の最新案内をご確認ください。'+(annotation.accessNote?' 補足：'+annotation.accessNote:'');
  sourceRows.push(Object.fromEntries(Object.entries({no,name,address,lat:s.lat,lng:s.lng,tel:s.tel,hours:s.hours,closed:s.closed,url,sns,image:config.photoApproval?.approved?publicImage(s):undefined}).filter(([,v])=>v!==undefined&&v!=='')));
  // Comments and unknown/private columns remain excluded. Only approved image URLs survive.
  return s;
 });
 const data=validateData({schemaVersion:1,updatedAt:Date.parse(local.updatedAt)>Date.parse(fetchedAt)?local.updatedAt:fetchedAt,spots:[...local.walk,...food]});return {data,warnings,foodCount:food.length,fetchedAt,sourceRows};
}

function publicImage(s){return s.photoUrl||undefined;}
