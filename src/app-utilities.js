import {routeURL} from './routing.js';
import qrcode from '../assets/vendor/qrcode.mjs';
export function publicShareUrl(base,spotId='',filters={}){return routeURL(base,{...filters,page:filters.page==='events'?'events':'explore',id:spotId});}
export function initAppUtilities(selectedSpot,currentRoute=()=>({})){
 const $=id=>document.getElementById(id);let installEvent=null,downloadURL='',shareOpener=null,installOpener=null,termsOpener=null;
 const close=(id,opener)=>{$(id).close();opener?.focus({preventScroll:true});};
 const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 function installState(){const installed=standalone();$('install').hidden=!installEvent||installed;$('install-status').textContent=installed?'ホーム画面からアプリとして開いています。':installEvent?'このブラウザでは下のボタンから追加できます。':'このブラウザのメニューから追加できます。下の手順をご確認ください。';}
 function openInstall(){installOpener=document.activeElement;installState();$('install-dialog').showModal();}
 function updateShare(){
  const spot=selectedSpot(),id=$('share-current').checked?spot?.id:'';const url=publicShareUrl(document.baseURI,id,$('share-filters').checked?currentRoute():{});$('share-link').value=url;$('share-status').textContent='';
  const qr=qrcode(0,'M');qr.addData(url);qr.make();$('share-qr').innerHTML=qr.createSvgTag({cellSize:5,margin:20,scalable:true});
  const svg=$('share-qr').querySelector('svg');svg.setAttribute('role','img');svg.setAttribute('aria-label','MinamiGoを開くQRコード');
  if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));$('download-qr').href=downloadURL;
 }
 function openShare(){shareOpener=document.activeElement;const spot=selectedSpot();$('share-spot-choice').hidden=!spot;$('share-current').checked=Boolean(spot);$('share-filters').checked=true;updateShare();$('native-share').hidden=typeof navigator.share!=='function';$('share-dialog').showModal();}
 for(const id of ['open-share','map-share'])$(id).onclick=openShare;
 for(const id of ['open-install','share-install'])$(id).onclick=openInstall;
 $('open-terms').onclick=()=>{termsOpener=document.activeElement;$('terms-dialog').showModal();};$('close-terms').onclick=()=>close('terms-dialog',termsOpener);$('terms-dialog').addEventListener('cancel',e=>{e.preventDefault();close('terms-dialog',termsOpener);});
 $('close-share').onclick=()=>close('share-dialog',shareOpener);$('share-dialog').addEventListener('cancel',e=>{e.preventDefault();close('share-dialog',shareOpener);});
 $('close-install').onclick=()=>close('install-dialog',installOpener);$('install-dialog').addEventListener('cancel',e=>{e.preventDefault();close('install-dialog',installOpener);});
 $('share-current').onchange=updateShare;$('share-filters').onchange=updateShare;
 $('copy-share').onclick=async()=>{try{await navigator.clipboard.writeText($('share-link').value);$('share-status').textContent='リンクをコピーしました。';}catch{$('share-link').focus();$('share-link').select();$('share-status').textContent='リンクを選択しました。長押し、またはコピー操作で保存してください。';}};
 $('native-share').onclick=async()=>{try{await navigator.share({title:'MinamiGo｜美波をめぐる',url:$('share-link').value});$('share-status').textContent='共有しました。';}catch(e){$('share-status').textContent=e.name==='AbortError'?'共有をキャンセルしました。':'共有できませんでした。リンクのコピーかQRをご利用ください。';}};
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;installState();});
 $('install').onclick=async()=>{if(!installEvent)return;const event=installEvent;installEvent=null;await event.prompt();const result=await event.userChoice;installState();$('install-status').textContent=result.outcome==='accepted'?'追加操作を受け付けました。ホーム画面をご確認ください。':'追加をキャンセルしました。メニューから後で追加できます。';};
 window.addEventListener('appinstalled',()=>{installEvent=null;$('install').hidden=true;$('install-status').textContent='アプリの追加が完了しました。';});installState();
}
