import {validateData,safeURL} from './data.js';
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/[\s・_]/g,'');
export function reviewedStays(values,review){
 if(!Array.isArray(values)||values[0]?.[0]!=='NO'||values[0]?.[1]!=='営業所名称'||!Array.isArray(review?.records))throw new Error('宿泊元表・確認記録の形式が不正です');
 const source=new Map();for(const r of values.slice(1)){if(!r.some(v=>v!==''&&v!=null))continue;const no=String(r[0]).padStart(10,'0');if(!/^\d{10}$/.test(no)||source.has(no)||typeof r[1]!=='string')throw new Error('宿泊NO・名称・重複を確認してください');source.set(no,r[1]);}
 const spots=review.records.map(r=>{if(!source.has(r.no)||normalize(source.get(r.no))!==normalize(r.sourceName))throw new Error('宿泊元NO・名称が確認記録と異なります。再確認が必要です');if(!safeURL(r.evidence))throw new Error('公開出典URLが必要です');return {id:'minamistay-'+r.no,name:r.publicName,category:'stay',address:r.publicAddress,description:'公開施設案内に掲載されている宿泊施設です。営業・予約・チェックイン・料金は施設へご確認ください。',source:'美波町・美波町観光協会の公開施設案内（宿泊元表のNOと照合）',verifiedAt:r.checkedAt,officialCheckedAt:r.checkedAt,mapScope:'name-address',locationLabel:'公開施設案内の名称・住所検索。入口・経路・営業状況は未検証。',mapQuery:r.publicName+' '+r.publicAddress,directionsMode:'walking',url:r.evidence,relatedLinks:[],accessNote:'元表の座標・電話・営業時間・備考・画像は取り込んでいません。住所に表記差がある場合は公開施設案内を使用します。予約前に現地の最新案内をご確認ください。'};});
 return validateData({schemaVersion:1,updatedAt:new Date().toISOString(),spots});
}
