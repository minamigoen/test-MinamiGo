import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {validateData,filterSpots,CATEGORIES} from '../src/data.js';import {mergeFoodSource} from '../src/food-source.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
test('official heritage and PDF power spots are independently filterable and survive shared food refresh',()=>{
 const snapshot=validateData(read('data/spots.json')),local=read('data/local-content.json'),config=read('data/food-source.json');
 const rows=snapshot.spots.filter(s=>s.category==='food').map(s=>({no:s.upstreamId,name:s.name,address:s.address,lat:s.lat,lng:s.lng,tel:s.tel,hours:s.hours,closed:s.closed,url:s.url}));
 const merged=mergeFoodSource(rows,local,config).data;
 for(const [file,category,expected] of [['data/heritage.json','heritage',12],['data/power-spots.json','powerspot',12]]){
  const source=validateData(read(file));assert.equal(source.spots.length,expected);assert.deepEqual(filterSpots(snapshot.spots,{category}),source.spots);assert.deepEqual(filterSpots(merged.spots,{category}),source.spots);
  for(const s of source.spots.filter(s=>s.lat===undefined))assert.ok(merged.spots.some(r=>r.id===s.id),'pending positions remain in list');
 }
 assert.notEqual(CATEGORIES.heritage,CATEGORIES.powerspot);assert.equal(merged.spots.filter(s=>s.category==='stay').length,26);assert.equal(merged.spots.filter(s=>s.category==='food').length,37);
});

test('heritage pins match audited official facility points once per existing certification ID',()=>{
 const data=validateData(read('data/heritage.json')).spots,evidence=read('data/heritage-coordinate-evidence.json').heritage;
 assert.equal(data.length,12);assert.equal(new Set(data.map(s=>s.id)).size,12);
 for(const s of data){const r=evidence.find(r=>r.id===s.id);assert.ok(r);assert.equal(s.name,r.name);assert.equal(s.lat,r.lat);assert.equal(s.lng,r.lng);assert.equal(r.entranceVerified,false);assert.equal(r.streetViewReviewed,s.id==='heritage-373009');assert.match(s.locationLabel,/施設代表点/);assert.ok(s.relatedLinks.some(l=>l.url===r.primaryCoordinateSourceUrl));if(s.id==='heritage-373003')assert.equal(s.photoLicense,'美波町協定に基づく利用許諾');else assert.equal(s.photoUrl,undefined);}
});

test('power pins and navigation follow audited display flags, retaining historical and pending records',()=>{
 const data=validateData(read('data/power-spots.json')).spots,evidence=read('data/power-coordinate-evidence.json').power;
 assert.equal(data.length,12);assert.equal(data.filter(s=>s.lat!==undefined).length,10);assert.equal(data.filter(s=>s.lat!==undefined&&s.mapVisibility!=='hidden').length,9);
 for(const s of data){const r=evidence.find(r=>r.id===s.id);assert.equal(s.name,r.name);assert.equal(s.lat??null,r.lat);assert.equal(s.lng??null,r.lng);assert.equal(s.mapVisibility==='reference',r.recommendedMapVisibility);assert.equal(Boolean(s.directionsMode),r.recommendedNavigation);assert.equal(s.photoUrl,undefined);if(!r.recommendedNavigation)assert.equal(s.directionsMode,undefined);}
 const old=data.find(s=>s.id==='pdf5-office-stone');assert.equal(old.mapQuery,undefined);assert.match(old.description,/閉業/);
 for(const id of ['hebi-stone','pdf5-fudo'])assert.match(data.find(s=>s.id===id).locationLabel,/2025年2月Street Viewで対象物/);
});
