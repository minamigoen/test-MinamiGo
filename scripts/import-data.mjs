import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {localContentFromSnapshot} from '../src/food-source.js';
import {validateData,PHOTO_FIELDS} from '../src/data.js';
const args=process.argv.slice(2);const check=args[0]==='--check';const path=args[check?1:0];
if(!path){console.error('Usage: node scripts/import-data.mjs [--check] INPUT.json');process.exit(1);}
try { const input=JSON.parse(await readFile(path,'utf8'));
 // Admin exports may contain private rows. Explicitly approved rows only; strip unknown columns.
 const exported=input.spots?input:{schemaVersion:1,updatedAt:new Date().toISOString(),spots:(input.rows||[]).filter(r=>r.publicApproved===true).map(r=>{const clean={...r};if(r.photoApproved!==true)for(const key of PHOTO_FIELDS)delete clean[key];if(typeof clean.relatedLinks==='string')clean.relatedLinks=JSON.parse(clean.relatedLinks);if(r.locationVerified!==true){delete clean.lat;delete clean.lng;if(clean.mapScope!=='name-address')delete clean.directionsMode;}return clean;})};
 const output=validateData(exported);
 if(!check){let shared=false;try{shared=JSON.parse(await readFile('data/food-source.json','utf8')).enabled===true;}catch{}if(shared){const local=localContentFromSnapshot(output);await writeFile('data/local-content.json.tmp',JSON.stringify(local,null,2)+'\n');await rename('data/local-content.json.tmp','data/local-content.json');console.log('Local walk/food annotations updated; canonical food fields stay in the original source. Run sync-food.mjs to rebuild the static fallback.');}else{await mkdir('data',{recursive:true});await writeFile('data/spots.json.tmp',JSON.stringify(output,null,2)+'\n');await rename('data/spots.json.tmp','data/spots.json');}}
 console.log(`${check?'Validated':'Imported'} ${output.spots.length} public spots`);
} catch(e){console.error(e.message);process.exit(1);}
