import {approvedFacilityPhoto} from './photo-source.js';
import {validateData,safeURL} from './data.js';
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/[\s・_]/g,'');
export function reviewedStays(values,review){
 if(!Array.isArray(values)||values[0]?.[0]!=='NO'||values[0]?.[1]!=='営業所名称'||!Array.isArray(review?.records))throw new Error('宿泊元表・確認記録の形式が不正です');
 const source=new Map();for(const r of values.slice(1)){if(!r.some(v=>v!==''&&v!=null))continue;const no=String(r[0]).padStart(10,'0');if(!/^\d{10}$/.test(no)||source.has(no)||typeof r[1]!=='string')throw new Error('宿泊NO・名称・重複を確認してください');source.set(no,r[1]);}
 const spots=review.records.map(r=>{if(!source.has(r.no)||normalize(source.get(r.no))!==normalize(r.sourceName))throw new Error('宿泊元NO・名称が確認記録と異なります。再確認が必要です');if(!safeURL(r.evidence))throw new Error('公開出典URLが必要です');const spot={id:'minamistay-'+r.no,name:r.publicName,category:'stay',address:r.publicAddress,description:r.publicDescription||'公開施設案内に掲載されている宿泊施設です。営業・予約・チェックイン・料金は施設へご確認ください。',source:r.evidence.startsWith('https://awasun.com/')?'南阿波サンラインモビレージ公式（宿泊元表のNOと照合）':'美波町・美波町観光協会の公開施設案内（宿泊元表のNOと照合）',verifiedAt:r.checkedAt,officialCheckedAt:r.checkedAt,mapScope:'name-address',locationLabel:'公開施設案内の名称・住所検索。入口・経路・営業状況は未検証。',mapQuery:r.publicName+' '+r.publicAddress,directionsMode:'walking',url:r.evidence,relatedLinks:r.relatedLinks||[],accessNote:'元表の座標・電話・営業時間・備考・画像は取り込んでいません。住所に表記差がある場合は公開施設案内を使用します。予約前に現地の最新案内をご確認ください。'};
 if(r.mapLat!==undefined&&r.mapCheckedAt){spot.lat=r.mapLat;spot.lng=r.mapLng;spot.mapScope='sheet-reference';spot.locationLabel='宿泊元表の参考座標（'+r.mapCheckedAt+'読取）。現地・入口・経路は未検証。';spot.accessNote='宿泊元表の座標は参考地点です。入口・現況は未確認。電話・営業時間は取り込んでいません。予約前に施設の最新案内を確認してください。';}
 if(r.mapSource){spot.mapScope='surroundings';spot.locationLabel=r.mapLocationLabel;spot.accessNote=r.mapAccessNote;spot.relatedLinks=[...(spot.relatedLinks||[]),{label:'町公式：代表地点の根拠',url:r.mapSource}];}
 for(const k of ['lifeTypes','serviceHours','serviceStatus'])if(r[k])spot[k]=r[k];
 if(r.publicPhotoUrl&&r.photoIdentityName&&normalize(r.photoIdentityName)!==normalize(r.sourceName))throw new Error('宿泊写真の施設名が確認記録と一致しません');
 Object.assign(spot,approvedFacilityPhoto({category:'stay',name:spot.name,image:r.publicPhotoUrl,approval:review.photoApproval,source:r.publicPhotoSource}));
 if(!r.mapSource&&['0000000009','0000000021'].includes(r.no))spot.locationLabel='住所検索のみ。元表で同施設の座標に差があるためピンは保留。';if(!r.mapSource&&r.no==='0000000016')spot.locationLabel='住所検索のみ。元表の緯度が欠けているためピンは保留。';
 if(r.publicPhotoLink&&!spot.photoUrl)spot.photoLink=r.publicPhotoLink;if(r.photoStatus)spot.photoStatus=r.photoStatus;return spot;});
 return validateData({schemaVersion:1,updatedAt:new Date().toISOString(),spots});
}
