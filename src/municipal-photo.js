import {PHOTO_FIELDS,validDate} from './data.js';
const PAGE='https://www.town.minami.lg.jp/foreign_country/jp/sightseeing.html';
export function municipalPhoto(row,r,approval){
 if(r.photoPolicy!=='municipal-agreement')return {};
 if(!approval?.approved||!validDate(approval.approvedAt)||approval.sourcePage!==PAGE||!r.approvedSourceCaption||!validDate(r.photoSourceCheckedAt))throw new Error('Municipal photo approval or source check missing');
 const url=new URL(r.photoUrl);if(url.origin!=='https://www.town.minami.lg.jp'||!/^\/foreign_country\/assets\/images\/sightseeing\/(?:watch|festival|excursion)_img\d+\.jpg$/.test(url.pathname)||url.search||url.hash)throw new Error('Photo outside municipal tourism scope');
 if(row.image!==r.photoUrl||r.photoSource!==PAGE+'#inline-wrap_'+r.photoSourceKey||!r.photoSourceKey.match(/^(?:watch|fes|exsur)\d+$/)||r.photoLicense!=='美波町協定に基づく利用許諾')throw new Error('Photo/source identity changed; review required');
 return Object.fromEntries(PHOTO_FIELDS.map(k=>[k,r[k]]));
}
