import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {PUBLIC_FIELDS,validateData} from '../src/data.js';
/** Accept a bounded UNFORMATTED_VALUE range response. This does not authenticate,
 * publish a Sheet, or store the private response. Print public JSON only. */
export function publicSnapshotFromRange(response,updatedAt=new Date().toISOString()) {
 const grid=response?.structuredContent?.values??response?.values;
 if(!Array.isArray(grid)||!Array.isArray(grid[0])||grid.length>2001)throw new Error('Expected bounded Sheets values with a header row');
 const headers=grid[0];
 if(headers.some(h=>typeof h!=='string')||new Set(headers).size!==headers.length)throw new Error('Headers must be unique strings');
 for(const required of ['id','name','category','publicApproved','locationVerified','source','verifiedAt'])if(!headers.includes(required))throw new Error('Missing header: '+required);
 const index=h=>headers.indexOf(h),spots=[];
 for(const cells of grid.slice(1)) {
  if(!Array.isArray(cells))throw new Error('Row must be an array');
  if(cells[index('publicApproved')]!==true)continue;
  const verified=cells[index('locationVerified')]===true,row={};
  for(const key of PUBLIC_FIELDS) {
   if(!verified&&['lat','lng','directionsMode'].includes(key))continue;
   const i=index(key);if(i<0)continue;const v=cells[i];
   if(v!==''&&v!==undefined&&v!==null)row[key]=v;
  }
  spots.push(row);
 }
 return validateData({schemaVersion:1,updatedAt,spots});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 try {const text=await readFile(process.argv[2]||'/dev/stdin','utf8');const out=publicSnapshotFromRange(JSON.parse(text));process.stdout.write(JSON.stringify(out,null,2)+'\n');process.stderr.write(`Exported ${out.spots.length} approved public rows\n`);}
 catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}
}
