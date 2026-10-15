import {applyWebSupplements} from '../src/web-supplements.js';
import {readFile,writeFile,rename} from 'node:fs/promises';
import {validateData} from '../src/data.js';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
try{
 const snapshot=validateData(await read('data/spots.json')),local=await read('data/local-content.json');
 const sources=[];for(const [file,category] of [['data/power-spots.json','powerspot'],['data/heritage.json','heritage'],['data/sightseeing.json',null],['data/life.json','life']]){
  const d=validateData(await read(file));if(!d.spots.length||(category&&d.spots.some(s=>s.category!==category)))throw new Error('Incorrect dataset category: '+file);sources.push(...d.spots);
 }
 const enriched=applyWebSupplements(sources,await read('data/web-supplements.json'),await read('data/osm-locations.json'));sources.splice(0,sources.length,...enriched);
 const without=s=>!['heritage','powerspot','life'].includes(s.category)&&!s.id.startsWith('town-');
 const updatedAt=new Date().toISOString(),data=validateData({...snapshot,updatedAt,spots:[...sources,...snapshot.spots.filter(without)]});
 const content={...local,updatedAt,walk:[...sources,...local.walk.filter(without)]};
 validateData({schemaVersion:1,updatedAt,spots:content.walk});
 // Both complete outputs are validated before replacing either public file.
 await writeFile('data/local-content.json.tmp',JSON.stringify(content,null,2)+'\n');await writeFile('data/spots.json.tmp',JSON.stringify(data,null,2)+'\n');
 await rename('data/local-content.json.tmp','data/local-content.json');await rename('data/spots.json.tmp','data/spots.json');
 console.log(JSON.stringify({total:data.spots.length,heritage:sources.filter(s=>s.category==='heritage').length,powerspot:sources.filter(s=>s.category==='powerspot').length}));
}catch(e){console.error('Local dataset import failed: '+e.message);process.exitCode=1;}
