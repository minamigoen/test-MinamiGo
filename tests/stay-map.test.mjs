import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {validateData} from '../src/data.js';import {reviewedStays} from '../src/stay-source.js';
const snapshot=JSON.parse(readFileSync(new URL('../data/spots.json',import.meta.url)));
test('stay references preserve missing/conflicting coordinate and private photo boundaries',()=>{
 const stays=validateData(snapshot).spots.filter(s=>s.category==='stay');assert.equal(stays.length,27);assert.equal(stays.filter(s=>s.mapScope==='sheet-reference').length,24);assert.equal(stays.filter(s=>s.photoLink).length,20);
 for(const s of stays){assert.ok(!s.photoUrl);assert.ok(!JSON.stringify(s).includes('drive.google'));if(s.mapScope==='sheet-reference')assert.match(s.locationLabel,/未検証/);}
 for(const no of ['0000000009','0000000021','0000000016'])assert.equal(stays.find(s=>s.id==='minamistay-'+no).lat,undefined);
});
test('malicious photo reference and out-of-area sheet coordinates fail closed',()=>{
 const s=snapshot.spots.find(s=>s.mapScope==='sheet-reference');
 assert.throws(()=>validateData({...snapshot,spots:[{...s,photoLink:'https://drive.google.com/file/d/private/view'}]}));
 assert.throws(()=>validateData({...snapshot,spots:[{...s,lat:0}]}));
});
test('reviewed stays retain audited references on future imports',()=>{
 const review=JSON.parse(readFileSync(new URL('../data/stay-review.json',import.meta.url)));
 const input=[['NO','営業所名称'],...review.records.map(s=>[s.no,s.sourceName])];
 const result=reviewedStays(input,review);assert.equal(result.spots.filter(s=>s.mapScope==='sheet-reference').length,24);assert.equal(result.spots.filter(s=>s.photoLink).length,20);
});
