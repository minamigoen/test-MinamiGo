import {safeURL} from './data.js';
/** Only an explicit facility-photo approval enables these existing public sources.
 * A Drive folder is never treated as an image; file mappings must be reviewed. */
export function publicFacilityImage(value){
 const safe=safeURL(value);if(!safe)return '';
 const url=new URL(safe);
 if(url.hostname==='www.town.minami.lg.jp'&&/^\/foreign_country\/assets\/images\/sightseeing\/(?:eat|stay)_(?:img|thumb)\d+\.jpg$/.test(url.pathname))return safe;
 if(url.hostname==='lh3.googleusercontent.com'&&/^\/d\/[A-Za-z0-9_-]+$/.test(url.pathname)&&!url.search)return safe;
 if(url.hostname==='drive.google.com'){
  const match=url.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]+)\/(?:view|preview)$/);
  if(match)return 'https://lh3.googleusercontent.com/d/'+match[1];
 }
 return '';
}
export function approvedFacilityPhoto({category,name,image,approval,source}){
 if(!['food','stay'].includes(category)||approval?.approved!==true||!approval.categories?.includes(category))return {};
 const url=publicFacilityImage(image);if(!url)return {};
 return {photoUrl:url,photoAlt:name+'の掲載写真',photoSource:safeURL(source)||url,photoLicense:'掲載許諾確認済み',photoCredit:new URL(url).hostname==='www.town.minami.lg.jp'?'掲載元：美波町公開案内':category==='food'?'掲載元：美波飯（公開Drive画像）':'掲載元：宿泊元表（公開Drive画像）'};
}
