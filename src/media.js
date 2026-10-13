import {PHOTO_LICENSES} from './data.js';
const element=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const drawings={culture:'<path d="M8 35V18l16-9 16 9v17M5 35h38M17 35V22h14v13M7 17h34M24 9V4"/>',food:'<path d="M8 6v12m5-12v12m5-12v12M8 13h10v5q0 6-5 6v18M34 6v36M34 6q-9 6-9 20h9"/>',other:'<path d="m7 12 11-5 12 5 11-5v29l-11 5-12-5-11 5ZM18 7v29m12-24v29"/>'};
export function externalLink(href,label,className){const a=element('a',label,className);a.href=href;a.target='_blank';a.rel='noopener noreferrer';return a;}
/** Photo URLs reach this renderer only after public-data validation and publication approval.
 * External photos are never fetched by the service worker or prefetched for offline use. */
export function photoFigure(spot,{detail=false}={}){
 const figure=element('figure',undefined,'spot-media'+(spot.photoUrl?' has-photo':''));const frame=element('div',undefined,'photo-frame');const fallback=element('div',undefined,'photo-fallback');
 const icon=element('span',undefined,'photo-symbol');icon.innerHTML='<svg viewBox="0 0 48 48" aria-hidden="true">'+(drawings[spot.category]||drawings.other)+'</svg>';
 const label=element('span',spot.photoUrl?'写真を読み込んでいます':'写真は準備中','photo-fallback-label');fallback.append(icon,label);frame.append(fallback);figure.append(frame);
 if(spot.photoUrl){
  const img=element('img');img.alt=spot.photoAlt;img.width=640;img.height=400;img.loading=detail?'eager':'lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.setAttribute('fetchpriority','low');
  const failed=()=>{img.hidden=true;fallback.hidden=false;label.textContent=navigator.onLine?'写真を表示できません':'写真はオンラインで表示します';figure.dataset.state='fallback';};
  img.addEventListener('load',()=>{fallback.hidden=true;figure.dataset.state='loaded';},{once:true});img.addEventListener('error',failed,{once:true});frame.append(img);img.src=spot.photoUrl;
  const credit=element('figcaption',undefined,'photo-credit');credit.append(element('span',spot.photoCredit+' / '));credit.append(externalLink(spot.photoSource,'写真の出典'));credit.append(element('span',' / '));const terms=PHOTO_LICENSES[spot.photoLicense];credit.append(terms?externalLink(terms,spot.photoLicense):element('span',spot.photoLicense));figure.append(credit);
 }
 return figure;
}
