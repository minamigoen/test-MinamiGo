import {validateEvents} from './events.js';
const str=v=>v==null?'':String(v);
const integer=v=>str(v)===''?null:Number(v);
export function eventsFromSheet(rows,updatedAt){
 if(!Array.isArray(rows)||rows[0]?.[0]!=='NO'||rows[0]?.[12]!=='固定ID'||rows.length<2)throw Error('Unexpected event Sheet header/empty input');
 const numbers=new Set(),yearNotes=[];
 const records=rows.slice(1).filter(r=>str(r[0])).map(r=>{
  const no=str(r[0]);if(!/^\d{10}$/.test(no)||numbers.has(no))throw Error('Invalid/duplicate event NO');numbers.add(no);
  const sources=JSON.parse(str(r[22]));if(!Array.isArray(sources)||sources.length<1||sources.length>3||[9,20,21].some((col,i)=>(sources[i]?.url||'')!==str(r[col])))throw Error('Event source columns disagree');
  const notes=JSON.parse(str(r[27])||'[]');if(!Array.isArray(notes)||notes.length>10)throw Error('Invalid year notes');yearNotes.push(...notes);
  const conflict=str(r[25]).toLowerCase();if(!['true','false',''].includes(conflict))throw Error('Invalid source conflict flag');
  return {id:str(r[12]),name:str(r[1]),month:integer(r[13]),year:integer(r[14]),status:str(r[15]),start:str(r[16]),end:str(r[17]),typical:str(r[18]),checkedAt:str(r[19]),sources,typicalSource:str(r[23]),spotId:str(r[24]),sourceConflict:conflict==='true',calendarUid:str(r[26]),note:str(r[6]),time:str(r[7])};
 });
 if(records.length!==22)throw Error('Reviewed event count changed; review additions/removals first');
 if(new Set(yearNotes.map(n=>n.id)).size!==yearNotes.length)throw Error('Duplicate year notice');
 return validateEvents({schemaVersion:1,updatedAt,records,yearNotes});
}
