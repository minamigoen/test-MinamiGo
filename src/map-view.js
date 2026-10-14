import {CATEGORIES} from './data.js';
import {photoFigure,externalLink} from './media.js';

export const AERIAL_URL='https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg';
const aerialCredit='出典：<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a> / Landsat8 (GSI, TSIC, GEO Grid/AIST; USGS), GEBCO';
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
let map,markers,bases,base='map',signature='';
export function mapViewport(){if(!map)return null;const p=map.getCenter();return {lat:p.lat,lng:p.lng,zoom:map.getZoom()};}
export function setMapBase(value){
 base=value==='aerial'?'aerial':'map';
 for(const id of ['map','aerial'])document.getElementById('base-'+id).setAttribute('aria-pressed',id===base);
 document.getElementById('map-imagery-note').hidden=base!=='aerial';
 document.getElementById('map-tile-status').textContent='';
 if(map){for(const layer of Object.values(bases))if(map.hasLayer(layer))map.removeLayer(layer);bases[base].addTo(map);}
}
export function renderSpotMap(items,{tileUrl,onSelect,offline=false}){
 const canvas=document.getElementById('map'),status=document.getElementById('map-status'),list=document.getElementById('map-list');
 const points=items.filter(s=>s.lat!==undefined);
 canvas.hidden=!points.length||!navigator.onLine||offline;
 if(!points.length)status.textContent='座標のない場所は下の一覧から詳細・住所検索を利用できます。';
 else if(!navigator.onLine||offline)status.textContent='オフラインのため地図を表示できません。下の一覧から詳細を確認できます。';
 else{
  if(!map){
   map=L.map(canvas,{center:[33.73,134.53],zoom:12,scrollWheelZoom:false,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false});
   bases={map:L.tileLayer(tileUrl,{maxZoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}),aerial:L.tileLayer(AERIAL_URL,{maxZoom:18,attribution:aerialCredit})};
   for(const layer of Object.values(bases))layer.on('tileerror',()=>{if(map.hasLayer(layer))document.getElementById('map-tile-status').textContent='背景を読み込めません。地図／空中写真を切り替えるか、下の一覧をご利用ください。';});
   markers=L.layerGroup().addTo(map);setMapBase(base);
  }
  const next=JSON.stringify(points.map(s=>[s.id,s.lat,s.lng,s.name,s.photoUrl,s.photoLink]));
  if(next!==signature){
   signature=next;markers.clearLayers();
   for(const s of points){
    const content=el('section',null,'map-popup');content.append(el('span',CATEGORIES[s.category],'pill'),el('h3',s.name));
    if(s.photoUrl)content.append(photoFigure(s));
    content.append(el('p',s.address||s.locationLabel));
    if(s.hours)content.append(el('p','営業：'+s.hours));
    content.append(el('p',s.locationLabel||'施設周辺の参考地点。入口は未確認。','muted'));
    const controls=el('div',null,'popup-actions'),open=el('button','詳しく見る');open.onclick=()=>onSelect(s);controls.append(open);
    if(s.mapQuery)controls.append(externalLink('https://www.google.com/maps/search/?'+new URLSearchParams({api:'1',query:s.mapQuery}),'場所を確認'));
    content.append(controls);
    const marker=L.marker([s.lat,s.lng],{icon:L.divIcon({className:'map-pin category-'+s.category+(s.mapScope==='sheet-reference'?' reference-pin':''),html:'<span aria-hidden="true"></span>',iconSize:[44,44],iconAnchor:[22,22]}),title:s.name+'（参考地点）',alt:s.name+'の詳細を開く'}).bindPopup(content,{maxWidth:280,minWidth:180,maxHeight:280,autoPan:true,autoPanPadding:[20,20]}).addTo(markers);
    marker.on('click',()=>{map.stop();map.setView([s.lat,s.lng],Math.max(map.getZoom(),16),{animate:false});marker.openPopup();onSelect(s);});
   }
   map.fitBounds(points.map(s=>[s.lat,s.lng]),{maxZoom:15,padding:[30,30]});
  }
  const refs=points.filter(s=>s.mapScope==='sheet-reference').length;
  status.textContent=`${points.length}件の施設周辺の参考地点${refs?'（宿泊元表の参考座標 '+refs+'件）':''}。入口・経路・現況は未確認です。座標のない場所も一覧から選べます。`;
  setTimeout(()=>map.invalidateSize(),0);
 }
 for(const s of items){const b=el('button',s.name);b.dataset.spotId=s.id;b.onclick=()=>{if(map&&!canvas.hidden&&s.lat!==undefined){map.stop();map.setView([s.lat,s.lng],Math.max(map.getZoom(),16),{animate:false});markers.eachLayer(m=>{if(m.options.title===s.name+'（参考地点）')m.openPopup();});}onSelect(s);};list.append(b);}
}
