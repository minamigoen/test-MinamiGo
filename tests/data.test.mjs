import test from 'node:test';import assert from 'node:assert/strict';import {validateData,filterSpots,safeURL,distanceKm} from '../src/data.js';
const spot={id:'approved',name:'確認された場所',category:'culture',source:'提供資料 p.3',verifiedAt:'2026-10-12'};const wrap=spots=>({schemaVersion:1,updatedAt:'2026-10-12T00:00:00Z',spots});
test('private fields are never exported',()=>{const d=validateData(wrap([{...spot,privateNotes:'secret',photo:'unlicensed',sheetId:'private'}]));assert.deepEqual(d.spots[0],spot);});
test('malformed URL, duplicate IDs, missing source and unmatched coordinates fail closed',()=>{for(const spots of [[{...spot,url:'javascript:alert(1)'}],[spot,spot],[{...spot,source:''}],[{...spot,lat:33}]])assert.throws(()=>validateData(wrap(spots)));});
test('empty approved snapshot is valid',()=>assert.equal(validateData(wrap([])).spots.length,0));
test('Unicode search and favorites compose',()=>{const spots=[{...spot,name:'ＣＡＦＥ',address:'美波町'}, {...spot,id:'b',name:'別の場所'}];assert.equal(filterSpots(spots,{q:'cafe',saved:true},['approved']).length,1);assert.equal(filterSpots(spots,{category:'nature'}).length,0);});
test('URLs require HTTPS and distance is zero at same location',()=>{assert.equal(safeURL('http://example.com'),'');assert.equal(safeURL('https://user:pass@example.com'),'');assert.equal(distanceKm({lat:33,lng:134},{lat:33,lng:134}),0);});
