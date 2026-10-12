import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {validateData} from '../src/data.js';
const args=process.argv.slice(2);const check=args[0]==='--check';const path=args[check?1:0];
if(!path){console.error('Usage: node scripts/import-data.mjs [--check] INPUT.json');process.exit(1);}
try { const input=JSON.parse(await readFile(path,'utf8'));
 // Admin exports may contain private rows. Explicitly approved rows only; strip unknown columns.
 const exported=input.spots?input:{schemaVersion:1,updatedAt:new Date().toISOString(),spots:(input.rows||[]).filter(r=>r.publicApproved===true).map(r=>{const clean={...r};if(r.locationVerified!==true){delete clean.lat;delete clean.lng;delete clean.directionsMode;}return clean;})};
 const output=validateData(exported);
 if(!check){await mkdir('data',{recursive:true});await writeFile('data/spots.json.tmp',JSON.stringify(output,null,2)+'\n');await rename('data/spots.json.tmp','data/spots.json');}
 console.log(`${check?'Validated':'Imported'} ${output.spots.length} public spots`);
} catch(e){console.error(e.message);process.exit(1);}
