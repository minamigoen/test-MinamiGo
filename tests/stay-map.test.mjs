import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {validateData} from '../src/data.js';import {reviewedStays} from '../src/stay-source.js';
const snapshot=JSON.parse(readFileSync(new URL('../data/spots.json',import.meta.url)));
test('stay references preserve missing/conflicting coordinate and private photo boundaries',()=>{
 const stays=validateData(snapshot).spots.filter(s=>s.category==='stay');assert.equal(stays.length,26);assert.equal(stays.filter(s=>s.mapScope==='sheet-reference').length,23);assert.equal(stays.filter(s=>s.photoUrl).length,26);
 for(const s of stays){if(s.photoUrl){assert.equal(s.photoLicense,'掲載許諾確認済み');assert.ok(s.photoSource);}if(s.mapScope==='sheet-reference')assert.match(s.locationLabel,/未検証/);}
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
 const result=reviewedStays(input,review);assert.equal(result.spots.filter(s=>s.mapScope==='sheet-reference').length,23);assert.equal(result.spots.filter(s=>s.photoUrl).length,26);
});
test('lodging photos use verified facility identities and never the displaced Koyoso URL',()=>{
 const review=JSON.parse(readFileSync(new URL('../data/stay-review.json',import.meta.url)));
 assert.equal(review.records.filter(s=>s.publicPhotoUrl&&s.photoIdentityEvidence).length,26);
 assert.equal(review.records.find(s=>s.no==='0000000006'),undefined);assert.equal(review.excludedRecords[0].no,'0000000006');
 const source=[['NO','営業所名称'],...review.records.map(s=>[s.no,s.sourceName])];
 const d=reviewedStays(source,review);assert.match(d.spots.find(s=>s.id==='minamistay-0000000023').photoUrl,/stay_img22\.jpg$/);
 const bad=structuredClone(review);bad.records.find(s=>s.publicPhotoUrl).photoIdentityName='ANOTHER FACILITY';assert.throws(()=>reviewedStays(source,bad));
});
