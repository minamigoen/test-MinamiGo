import {readFile,writeFile} from 'node:fs/promises';import {approveTownUpdates} from '../src/source-updates.js';
import {resolve,relative,isAbsolute} from 'node:path';
const [current,plan,approvals,output]=process.argv.slice(2);const destination=output&&relative(resolve('staging'),resolve(output));if(!destination||destination.startsWith('..')||isAbsolute(destination))throw new Error('Write only an operator draft inside staging/');const read=async p=>JSON.parse(await readFile(p,'utf8'));
const draft=approveTownUpdates(await read(current),await read(plan),await read(approvals));await writeFile(output,JSON.stringify(draft,null,2)+'\n');console.log('Approved draft created; write approved cells to Sheets, read back, then import. Public data unchanged.');
