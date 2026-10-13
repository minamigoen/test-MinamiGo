import {readFile,writeFile,rename} from 'node:fs/promises';import {mergeFoodSource} from '../src/food-source.js';
const file=process.argv[2];
try{
 const config=JSON.parse(await readFile('data/food-source.json','utf8')),local=JSON.parse(await readFile('data/local-content.json','utf8'));
 let rows;if(file)rows=JSON.parse(await readFile(file,'utf8'));else{const res=await fetch(config.url,{signal:AbortSignal.timeout(15000),credentials:'omit',headers:{Accept:'application/json'}});if(!res.ok)throw new Error('Upstream HTTP '+res.status);const raw=await res.text();if(raw.length>1024*1024)throw new Error('Upstream response too large');rows=JSON.parse(raw);}
 const result=mergeFoodSource(rows,local,config);await writeFile('data/spots.json.tmp',JSON.stringify(result.data,null,2)+'\n');await rename('data/spots.json.tmp','data/spots.json');console.log(JSON.stringify({foodCount:result.foodCount,total:result.data.spots.length,fetchedAt:result.fetchedAt,omittedOptionalFields:result.warnings.length}));
}catch(e){console.error('Food import failed; previous valid snapshot retained: '+e.message);process.exitCode=1;}
