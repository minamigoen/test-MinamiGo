import {readFile,writeFile} from 'node:fs/promises';
import {importSightseeing,mergeSightseeingReference} from '../src/sightseeing-source.js';
import {validateData,isVisibleMapSpot,mapPointsForSpot} from '../src/data.js';
const input=process.argv[2];if(!input)throw new Error('Usage: node scripts/sync-sightseeing.mjs <connector-readback.json>');
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const result=importSightseeing(await read(input),await read('data/sightseeing-review.json'));
const heritage=await read('data/heritage.json');const updated=validateData({...heritage,spots:mergeSightseeingReference(heritage.spots,result.existingPatches)});
await writeFile('data/sightseeing.json',JSON.stringify(result.data,null,2)+'\n');await writeFile('data/heritage.json',JSON.stringify(updated,null,2)+'\n');
console.log(JSON.stringify({sourceRows:result.sourceCount,newSpots:result.data.spots.length,existingMerged:result.existingPatches.length,positionedRecords:result.data.spots.filter(isVisibleMapSpot).length,pins:result.data.spots.flatMap(mapPointsForSpot).length,pending:result.data.spots.filter(s=>!isVisibleMapSpot(s)).length}));
