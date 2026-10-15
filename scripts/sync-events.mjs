import {readFile,writeFile,rename} from 'node:fs/promises';import {eventsFromSheet} from '../src/event-sheet.js';
try{
 const input=JSON.parse(await readFile(process.argv[2],'utf8'));const data=eventsFromSheet(Array.isArray(input)?input:input.values,new Date().toISOString());
 await writeFile('data/events.json.tmp',JSON.stringify(data,null,2)+'\n');await rename('data/events.json.tmp','data/events.json');console.log('Reviewed native Sheet → public event JSON: '+data.records.length+' records; '+data.yearNotes.length+' year notices');
}catch(e){console.error('Event import stopped; previous public data retained: '+e.message);process.exitCode=1;}
