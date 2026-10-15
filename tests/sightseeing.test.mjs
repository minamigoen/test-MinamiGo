import {applyWebSupplements} from '../src/web-supplements.js';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {importSightseeing,mergeSightseeingReference} from '../src/sightseeing-source.js';
import {mergeFoodSource} from '../src/food-source.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const review=read('data/sightseeing-review.json'),snapshot=read('data/spots.json');
const rows=()=>review.records.map(r=>{const s=snapshot.spots.find(s=>s.id===r.id);return {no:r.no,name:r.expectedName,address:s.address,lat:r.coordinate?.[0]??'',lng:r.coordinate?.[1]??'',tel:s.tel||'',description:s.description,hours:s.hours||'',closed:s.closed||'',url:s.url||'',image:r.expectedImage};});
test('reviewed sightseeing imports 20 additions, patches one existing heritage, and preserves 94 existing records',()=>{
 const result=importSightseeing(rows(),review);assert.equal(result.data.spots.length,20);assert.equal(result.existingPatches.length,1);assert.equal(result.data.spots.filter(s=>s.lat!==undefined).length,19);assert.equal(result.data.spots.filter(s=>s.lat===undefined&&!s.mapPoints).length,0);assert.equal(result.data.spots.find(s=>s.mapPoints).mapPoints.length,7);assert.equal(result.data.spots.filter(s=>s.category==='festival').length,6);
 assert.deepEqual(applyWebSupplements(result.data.spots,read('data/web-supplements.json'),read('data/osm-locations.json'),{scope:'tourism'}),read('data/sightseeing.json').spots);assert.equal(snapshot.spots.filter(s=>!s.id.startsWith('town-')).length,97);assert.equal(new Set(snapshot.spots.map(s=>s.id)).size,117);
 const heritage=read('data/heritage.json').spots;const merged=mergeSightseeingReference(heritage,result.existingPatches);assert.throws(()=>mergeSightseeingReference([],result.existingPatches),/correspondence/);assert.equal(merged.length,12);assert.equal(merged.filter(s=>s.id==='heritage-373003').length,1);
 const local=read('data/local-content.json'),food=snapshot.spots.filter(s=>s.category==='food').map(s=>({no:s.upstreamId,name:s.name,address:s.address,lat:s.lat,lng:s.lng}));assert.equal(mergeFoodSource(food,local,read('data/food-source.json')).data.spots.filter(s=>s.id.startsWith('town-')).length,20);
});
test('eat-compatible deletion and review gates prevent identity, position, and photo permission drift',()=>{
 const deleted=rows();deleted[0].task='削除';assert.equal(importSightseeing(deleted,review).data.spots.length,19);
 const unknown=rows();unknown[0].no='9999999999';assert.throws(()=>importSightseeing(unknown,review),/NO/);
 const renamed=rows();renamed[0].name='別の施設';assert.throws(()=>importSightseeing(renamed,review),/identity/);
 const moved=rows();moved[0].lat+=.001;assert.throws(()=>importSightseeing(moved,review),/Coordinates changed/);
 assert.throws(()=>importSightseeing([...rows(),rows()[0]],review),/duplicate/);
 const unapproved=rows();unapproved[0].image='https://example.com/new-photo.jpg';assert.throws(()=>importSightseeing(unapproved,review),/photo|Photo/);
 const cc=rows();cc[1].image='https://example.com/replaced-photo.jpg';assert.throws(()=>importSightseeing(cc,review),/Photo changed/);
 const photos=importSightseeing(rows(),review).data.spots.filter(s=>s.photoUrl);assert.equal(photos.length,20);assert.equal(photos.filter(s=>s.photoLicense==='CC BY 2.0').length,1);assert.equal(photos.filter(s=>s.photoLicense==='美波町協定に基づく利用許諾').length,19);
 const denied=structuredClone(review);denied.townPhotoApproval.approved=false;assert.throws(()=>importSightseeing(rows(),denied),/photo|Photo/);
});
