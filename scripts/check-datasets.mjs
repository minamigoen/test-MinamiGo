import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {validateData} from '../src/data.js';
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const snapshot=validateData(await read('data/spots.json')),local=await read('data/local-content.json');
for(const [path,category] of [['data/power-spots.json','powerspot'],['data/heritage.json','heritage']]){
 const source=validateData(await read(path));
 assert.equal(source.spots.every(s=>s.category===category),true);
 assert.deepEqual(snapshot.spots.filter(s=>s.category===category),source.spots,'snapshot must preserve all source records and coordinates');
 assert.deepEqual(local.walk.filter(s=>s.category===category),source.spots,'runtime shared-food refresh must preserve every local record');
 console.log(`${category}: ${source.spots.length} records, ${source.spots.filter(s=>s.lat!==undefined).length} reference coordinates, ${source.spots.filter(s=>s.lat===undefined).length} pending positions`);
}
assert.equal(snapshot.spots.filter(s=>s.category==='food').length,37);assert.equal(snapshot.spots.filter(s=>s.category==='stay').length,27);

const power=validateData(await read('data/power-spots.json'));assert.equal(power.spots.length,12);assert.equal(power.spots.filter(s=>s.name.includes('名称確認待ち')).length,5);
