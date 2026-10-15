import {CATEGORIES,isVisibleMapSpot,mapPointsForSpot} from './data.js';

export const AERIAL_URL='https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg';
const aerialCredit='出典：<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a> / Landsat8 (GSI, TSIC, GEO Grid/AIST; USGS), GEBCO / 一部施設座標 © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> (ODbL)';
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
 const points=items.filter(isVisibleMapSpot).flatMap(s=>mapPointsForSpot(s).map(p=>({...s,lat:p.lat,lng:p.lng,pointName:p.name})));let created=false;
 canvas.hidden=!points.length||!navigator.onLine||offline;canvas.closest('.map-stage').hidden=canvas.hidden;canvas.closest('.map-workspace').classList.toggle('without-map',canvas.hidden);if(!points.length&&markers){markers.clearLayers();signature='';}
 if(!points.length)status.textContent='座標のない場所は下の一覧から詳細・住所検索を利用できます。';
 else if(!navigator.onLine||offline)status.textContent='オフラインのため地図を表示できません。下の一覧から詳細を確認できます。';
 else{
  if(!map){
   created=true;map=L.map(canvas,{center:[33.73,134.53],zoom:12,scrollWheelZoom:false,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false});
   bases={map:L.tileLayer(tileUrl,{maxZoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}),aerial:L.tileLayer(AERIAL_URL,{maxZoom:18,attribution:aerialCredit})};
   for(const layer of Object.values(bases))layer.on('tileerror',()=>{if(map.hasLayer(layer))document.getElementById('map-tile-status').textContent='背景を読み込めません。地図／空中写真を切り替えるか、下の一覧をご利用ください。';});
   markers=L.layerGroup().addTo(map);setMapBase(base);
  }
  const next=JSON.stringify(points.map(s=>[s.id,s.lat,s.lng,s.name,s.photoUrl,s.photoLink,s.pointName]));
  if(next!==signature){
   signature=next;markers.clearLayers();
   for(const s of points){
    const marker=L.marker([s.lat,s.lng],{autoPanOnFocus:false,icon:L.divIcon({className:'map-pin category-'+s.category+(s.mapScope==='sheet-reference'?' reference-pin':''),html:'<span aria-hidden="true"></span>',iconSize:[44,44],iconAnchor:[22,22]}),title:s.pointName+'（参考地点）',alt:s.pointName+'の詳細を開く'}).addTo(markers);
    marker.spotId=s.id;
    marker.on('click',()=>onSelect(s));
    marker.getElement().addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();onSelect(s);}});
   }
   map.fitBounds(points.map(s=>[s.lat,s.lng]),{maxZoom:15,padding:[30,30],animate:false});if(created&&points.length>40)map.setView([33.73,134.53],12,{animate:false});
  }
  const refs=points.filter(s=>s.mapScope==='sheet-reference').length;
  status.textContent=`${points.length}件の参考地点（道路区間・複数会場を含む）${refs?'（宿泊元表の参考座標 '+refs+'件）':''}。入口・経路・現況は未確認です。座標のない場所も一覧から選べます。`;
  const size=map.getSize();if(size.x!==canvas.clientWidth||size.y!==canvas.clientHeight)map.invalidateSize();
 }
 for(const s of items){
  const b=el('button',null,'map-list-item');b.dataset.spotId=s.id;b.setAttribute('aria-controls','detail');
  b.append(el('span',CATEGORIES[s.category],'pill'),el('strong',s.name),el('span',s.address||s.locationLabel||'位置確認待ち','muted'));
  if(s.lifeTypes)b.append(el('span',s.lifeTypes,'life-types'));if(s.serviceStatus)b.append(el('span',s.serviceStatus,'service-status'));
  b.onclick=()=>{selectMapSpot(s.id,true);onSelect(s);};list.append(b);
 }
}
export function selectMapSpot(id,pan=false){
 if(map){map.closePopup();const selectedMarkers=[];markers.eachLayer(m=>{const selected=m.spotId===id;const e=m.getElement();if(e){e.classList.toggle('selected',selected);e.setAttribute('aria-pressed',selected);e.setAttribute('role','button');e.dataset.spotId=m.spotId;}if(selected)selectedMarkers.push(m);});if(pan&&selectedMarkers.length){map.stop();if(selectedMarkers.length===1)map.panTo(selectedMarkers[0].getLatLng(),{animate:false});else map.fitBounds(selectedMarkers.map(m=>m.getLatLng()),{padding:[30,30],maxZoom:13,animate:false});}}
 for(const b of document.querySelectorAll('#map-list button')){
  const selected=b.dataset.spotId===id;b.setAttribute('aria-pressed',selected);
  if(selected&&matchMedia('(min-width:761px)').matches){const sidebar=document.querySelector('.map-sidebar'),r=b.getBoundingClientRect(),v=sidebar.getBoundingClientRect();if(r.bottom>v.bottom)sidebar.scrollTop+=r.bottom-v.bottom+12;else if(r.top<v.top+60)sidebar.scrollTop+=r.top-v.top-60;}
 }
}
