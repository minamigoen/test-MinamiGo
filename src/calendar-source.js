import {safeURL,validDate} from './data.js';
const unescape=v=>v.replace(/\\([nN,;\\])/g,(_,c)=>/[nN]/.test(c)?'\n':c);
function day(value,params=''){
 if(/^\d{8}$/.test(value)){const d=value.slice(0,4)+'-'+value.slice(4,6)+'-'+value.slice(6);if(!validDate(d))throw Error('invalid_date');return d;}
 if(!/^\d{8}T\d{6}Z?$/.test(value)||(/TZID=/i.test(params)&&!/(?:^|;)TZID=Asia\/Tokyo(?:;|$)/i.test(params)))throw Error('unsupported_date_zone');
 const date=value.slice(0,4)+'-'+value.slice(4,6)+'-'+value.slice(6,8),time=value.slice(9,11)+':'+value.slice(11,13)+':'+value.slice(13,15);if(!validDate(date)||Number(value.slice(9,11))>23||Number(value.slice(11,13))>59||Number(value.slice(13,15))>59)throw Error('invalid_time');
 const dt=new Date(date+'T'+time+(value.endsWith('Z')?'Z':'+09:00'));const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(dt).map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day;
}
const prior=d=>new Date(Date.parse(d+'T00:00:00Z')-86400000).toISOString().slice(0,10);
export function parseCalendarICS(raw,{from,to}={}){
 if(typeof raw!=='string'||raw.length>1500000||!raw.includes('BEGIN:VCALENDAR')||!raw.includes('END:VCALENDAR')||!validDate(from)||!validDate(to)||from>to)throw Error('Invalid calendar or period');
 const normalized=raw.replace(/\r/g,'').replace(/\n[ \t]/g,''),events=new Map(),issues=[];
 for(const [index,block]of normalized.split('BEGIN:VEVENT').slice(1).entries()){
  try{
   if(!block.includes('END:VEVENT'))throw Error('unterminated_event');const props=new Map();for(const line of block.split('END:VEVENT')[0].split('\n')){const colon=line.indexOf(':');if(colon<0)continue;const [name,...params]=line.slice(0,colon).split(';'),entry={value:unescape(line.slice(colon+1)),params:params.join(';')};props.set(name.toUpperCase(),[...(props.get(name.toUpperCase())||[]),entry]);}
   const get=k=>props.get(k)?.[0],uid=get('UID')?.value;if(!uid||uid.length>500||!get('DTSTART'))throw Error('missing_uid_or_start');const start=day(get('DTSTART').value,get('DTSTART').params);let end=get('DTEND')?day(get('DTEND').value,get('DTEND').params):start;if(get('DTEND')&&/^\d{8}$/.test(get('DTEND').value))end=prior(end);if(end<start)throw Error('end_before_start');if(start<from||start>to)continue;
   const url=safeURL(get('URL')?.value||'');if(!url)throw Error('unsafe_event_url');const modified=get('LAST-MODIFIED')?.value||'',sequence=Number(get('SEQUENCE')?.value||0);if(!Number.isSafeInteger(sequence)||sequence<0||sequence>100000)throw Error('invalid_sequence');const occurrence=get('RECURRENCE-ID')?.value||'',key=uid+'|'+occurrence;
   const event={uid,occurrence,summary:(get('SUMMARY')?.value||'').slice(0,300),start,end,url,categories:(props.get('CATEGORIES')||[]).flatMap(x=>x.value.split(',')),modified,sequence,cancelled:get('STATUS')?.value==='CANCELLED',recurrenceRule:get('RRULE')?.value||'',recurrenceReview:Boolean(get('RRULE')||get('EXDATE')||get('RECURRENCE-ID'))};
   const old=events.get(key);if(old&&old.sequence===sequence&&old.modified===modified&&(old.start!==start||old.end!==end))throw Error('ambiguous_duplicate_uid');if(!old||sequence>old.sequence||(sequence===old.sequence&&modified>old.modified))events.set(key,event);
  }catch(e){issues.push({eventIndex:index,reason:e.message});}
 }
 return {events:[...events.values()].sort((a,b)=>a.start.localeCompare(b.start)||a.uid.localeCompare(b.uid)),issues};
}
export function planCalendarDates(parsed,review,{checkedAt,sourceUrl,year}){
 if(!validDate(checkedAt)||!/^https:\/\/www\.town\.minami\.lg\.jp\/calendar\/\d{6}\/list\.ics$/.test(sourceUrl)||Number(sourceUrl.match(/calendar\/(\d{4})/)[1])!==year)throw Error('Invalid calendar source/year');
 if(parsed.issues.length||!parsed.events.length)return {status:'blocked',reason:parsed.issues.length?'source-issues':'no-events-in-period',checkedAt,year,sourceUrl,publishedDataChanged:false,issues:parsed.issues,candidates:[],retained:true};
 return {status:'review',checkedAt,year,sourceUrl,publishedDataChanged:false,issues:parsed.issues,candidates:review.records.filter(r=>r.year===year&&r.status!=='typical').map(r=>{const matches=parsed.events.filter(e=>r.sources.some(s=>s.url===e.url));if(!matches.length)return {id:r.id,status:'not-in-calendar-retain-article',delete:false};if(matches.length!==1)return {id:r.id,status:'multiple-occurrences-review',delete:false};const e=matches[0];return {id:r.id,status:e.cancelled?'cancellation-review':e.recurrenceReview?'recurrence-review':e.start===r.start&&e.end===r.end?'dates-agree':'date-change-review',uid:e.uid,start:e.start,end:e.end,sourceModified:e.modified,articleBodyConflict:Boolean(r.sourceConflict),timePolicy:r.sourceConflict?'do-not-copy-old-article-time':'review-current-year-source',delete:false};})};
}
