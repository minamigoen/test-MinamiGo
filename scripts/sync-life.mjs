import {readFile,writeFile} from 'node:fs/promises';import {reviewedLife,mergeLifeReferences} from '../src/life-source.js';import {validateData} from '../src/data.js';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
try{
 const raw=await read(process.argv[2]),review=await read('data/life-review.json'),local=await read('data/local-content.json'),snapshot=await read('data/spots.json');const result=reviewedLife(Array.isArray(raw)?raw:raw.values,review);
 const keep=s=>!s.id.startsWith('life-');const data=validateData({...snapshot,updatedAt:review.updatedAt,spots:mergeLifeReferences([...snapshot.spots.filter(keep),...result.data.spots],result.patches)});
 const foodPatches=result.patches.filter(p=>snapshot.spots.some(s=>s.id===p.id&&s.category==='food'));const foodExtras=[...local.foodExtras];for(const patch of foodPatches){const {expectedName,...fields}=patch;const i=foodExtras.findIndex(s=>s.id===patch.id);if(i<0)foodExtras.push(fields);else foodExtras[i]={...foodExtras[i],...fields};}
 const walk=mergeLifeReferences([...local.walk.filter(keep),...result.data.spots],result.patches.filter(p=>local.walk.some(s=>s.id===p.id)));
 validateData({schemaVersion:1,updatedAt:review.updatedAt,spots:walk});
 await writeFile('data/life.json',JSON.stringify(result.data,null,2)+'\n');await writeFile('data/local-content.json',JSON.stringify({...local,updatedAt:review.updatedAt,walk,foodExtras},null,2)+'\n');await writeFile('data/spots.json',JSON.stringify(data,null,2)+'\n');console.log('Reviewed life facilities: '+review.records.length+'; added '+result.data.spots.length+'; existing ID patches '+result.patches.length);
}catch(e){console.error('Life import stopped; review required: '+e.message);process.exitCode=1;}
