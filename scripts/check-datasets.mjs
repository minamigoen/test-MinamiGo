import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {validateData} from '../src/data.js';
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const snapshot=validateData(await read('data/spots.json')),local=await read('data/local-content.json');
for(const [path,category] of [['data/power-spots.json','powerspot'],['data/heritage.json','heritage'],['data/sightseeing.json',null]]){
 const source=validateData(await read(path));
 assert.equal(source.spots.every(s=>(!category||s.category===category)),true);
 assert.deepEqual(snapshot.spots.filter(s=>category?s.category===category:s.id.startsWith('town-')),source.spots,'snapshot must preserve all source records and coordinates');
 assert.deepEqual(local.walk.filter(s=>category?s.category===category:s.id.startsWith('town-')),source.spots,'runtime shared-food refresh must preserve every local record');
 console.log(`${category||"sightseeing"}: ${source.spots.length} records, ${source.spots.filter(s=>s.lat!==undefined).length} reference coordinates, ${source.spots.filter(s=>s.lat===undefined).length} pending positions`);
}
assert.equal(snapshot.spots.filter(s=>s.category==='food').length,37);assert.equal(snapshot.spots.filter(s=>s.category==='stay').length,27);

const power=validateData(await read('data/power-spots.json'));assert.equal(power.spots.length,12);assert.equal(power.spots.filter(s=>s.lat!==undefined).length,10);assert.equal(power.spots.filter(s=>s.lat!==undefined&&s.mapVisibility!=='hidden').length,9);assert.equal(power.spots.filter(s=>s.lat===undefined).length,2);
