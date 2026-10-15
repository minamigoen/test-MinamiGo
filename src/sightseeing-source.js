import {municipalPhoto} from './municipal-photo.js';
import {validateData,safeURL,PHOTO_FIELDS} from './data.js';

const text=(v,max=2000)=>{if(v==null||v==='')return '';if(typeof v!=='string'||v.length>max)throw new Error('Invalid sightseeing text');return v.trim();};
const normalize=v=>v.normalize('NFKC').replace(/[\s「」『』（）()]/g,'');
/** Consume the same 12-column export as eat, with an independent reviewed publication gate. */
export function importSightseeing(rows,review){
 if(!Array.isArray(rows)||!rows.length||rows.length>2000||review?.schemaVersion!==1||!Array.isArray(review.records))throw new Error('Invalid sightseeing source');
 const approved=new Map(review.records.map(r=>[r.no,r]));if(approved.size!==review.records.length)throw new Error('Duplicate review NO');
 const seen=new Set(),identities=new Set(),spots=[],existingPatches=[];
 for(const row of rows){
  if(row.task==='削除')continue;
  const no=String(row.no??'').padStart(10,'0'),r=approved.get(no);if(!/^\d{10}$/.test(no)||seen.has(no)||!r)throw new Error('Unknown or duplicate sightseeing NO');seen.add(no);
  const name=text(row.name,120),address=text(row.address,400);if(name!==r.expectedName)throw new Error('Sightseeing identity changed; review required');
  const identity=normalize(name)+'|'+normalize(address);if(identities.has(identity))throw new Error('Duplicate sightseeing establishment');identities.add(identity);
  const hasLat=row.lat!==''&&row.lat!=null,hasLng=row.lng!==''&&row.lng!=null;
  if(hasLat!==hasLng)throw new Error('Incomplete sightseeing coordinates');
  if(hasLat&&(!Number.isFinite(row.lat)||!Number.isFinite(row.lng)||row.lat<33.5||row.lat>34||row.lng<134.3||row.lng>134.8))throw new Error('Invalid sightseeing coordinates');
  if(JSON.stringify(hasLat?[row.lat,row.lng]:null)!==JSON.stringify(r.coordinate))throw new Error('Coordinates changed; review required');
  const approvedMunicipal=municipalPhoto(row,r,review.townPhotoApproval);
  if(r.action==='merge-existing'){
   existingPatches.push({id:r.id,expectedName:r.expectedExistingName,referenceName:name,photo:approvedMunicipal,relatedLinks:r.sourceUrls.map(url=>({label:'町の体験・観光案内',url}))});continue;
  }
  if(r.action!=='add'||!r.id.startsWith('town-'))throw new Error('Unsupported sightseeing action');
  const s={id:r.id,name,category:r.category,address,description:text(row.description),source:r.source,verifiedAt:r.checkedAt,locationLabel:r.locationLabel,accessNote:r.accessNote,photoStatus:'写真の利用条件を確認中',relatedLinks:r.sourceUrls.map((url,i)=>({label:'町の観光案内・出典 '+(i+1),url}))};
  if(hasLat){s.lat=row.lat;s.lng=row.lng;s.mapScope='surroundings';s.mapQuery=row.lat+','+row.lng;}
  for(const k of ['hours','closed']){const v=text(row[k]);if(v)s[k]=v;}
  const tel=text(row.tel,40);if(tel){if(!/^[0-9+() -]{5,30}$/.test(tel))throw new Error('Invalid sightseeing telephone');s.tel=tel;}
  const url=text(row.url,2048);if(url){if(!safeURL(url))throw new Error('Invalid sightseeing URL');s.url=url;}
  if(r.coordinateSource&&safeURL(r.coordinateSource)&&!s.relatedLinks.some(l=>l.url===r.coordinateSource))s.relatedLinks.push({label:'参考座標の根拠',url:r.coordinateSource});
  // A public image URL or the food/stay permission never authorizes new tourism photos.
  if(r.photoPolicy==='reviewed-cc'){
   if(row.image!==r.photoUrl||r.photoLicense!=='CC BY 2.0'||r.photoSource!=='https://commons.wikimedia.org/wiki/File:%C5%8Chama_Beach_01.jpg')throw new Error('Photo changed; license/identity review required');
   for(const k of PHOTO_FIELDS)s[k]=r[k];delete s.photoStatus;
  }
  if(Object.keys(approvedMunicipal).length){Object.assign(s,approvedMunicipal);delete s.photoStatus;}
  spots.push(s);
 }
 const data=validateData({schemaVersion:1,updatedAt:review.updatedAt,spots});return {data,existingPatches,sourceCount:seen.size};
}

export function mergeSightseeingReference(spots,patches){
 if(patches.some(p=>!spots.some(s=>s.id===p.id&&s.name===p.expectedName&&s.category==='heritage')))throw new Error('Existing sightseeing correspondence changed');
 return spots.map(s=>{
  const p=patches.find(p=>p.id===s.id);if(!p)return s;
  if(s.name!==p.expectedName||s.category!=='heritage')throw new Error('Existing sightseeing correspondence changed');
  const links=[...(s.relatedLinks||[])];for(const link of p.relatedLinks)if(!links.some(l=>l.url===link.url))links.push(link);
  const note='現店舗の観光・体験案内：'+p.referenceName+'。内容・実施条件は関連案内をご確認ください。';
  return {...s,...(p.photo||{}),description:s.description.includes(note)?s.description:s.description+'\n'+note,relatedLinks:links};
 });
}
