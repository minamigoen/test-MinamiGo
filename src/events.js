import {safeURL,validDate} from './data.js';import {routeURL} from './routing.js';
const text=(v,max=2000)=>{if(typeof v!=='string'||v.length>max)throw Error('Invalid event text');return v;};
export function validateEvents(input){
 if(input?.schemaVersion!==1||!Array.isArray(input.records)||input.records.length>500||!Number.isFinite(Date.parse(input.updatedAt)))throw Error('Invalid event dataset');const ids=new Set();
 const records=input.records.map(r=>{
  if(!/^[a-z0-9-]{1,80}$/.test(r.id||'')||ids.has(r.id)||!r.name||!validDate(r.checkedAt)||!['published','planned','cancelled','undated','typical'].includes(r.status))throw Error('Invalid event identity/status');ids.add(r.id);
  if(r.status==='typical'){if(r.year!==null||r.start||r.end||!r.typical)throw Error('Typical dates cannot be confirmed year dates');}else if(!Number.isInteger(r.year)||r.year<2000||r.year>2099)throw Error('Invalid event year');
  if(r.status==='undated'){if(r.start||r.end||r.month!==null)throw Error('Undated event has no assigned month');}else if(!Number.isInteger(r.month)||r.month<1||r.month>12)throw Error('Invalid event month');
  if(!['typical','undated'].includes(r.status)&&(!validDate(r.start)||!validDate(r.end)||r.end<r.start||Number(r.start.slice(0,4))!==r.year||Number(r.start.slice(5,7))!==r.month))throw Error('Invalid event dates/year');
  if(!Array.isArray(r.sources)||!r.sources.length||r.sources.length>6)throw Error('Missing event evidence');const sources=r.sources.map(s=>{if(!safeURL(s.url)||(s.updatedAt&&!Number.isFinite(Date.parse(s.updatedAt))))throw Error('Invalid event evidence');return {url:safeURL(s.url),updatedAt:text(s.updatedAt||'',40),dateKind:text(s.dateKind||'更新日時未掲載',60)};});
  if(r.typicalSource&&!safeURL(r.typicalSource))throw Error('Invalid typical source');if(r.spotId&&!/^[a-z0-9-]{1,80}$/.test(r.spotId))throw Error('Invalid event spot');
  return {id:r.id,name:text(r.name,120),month:r.month,year:r.year,status:r.status,start:text(r.start||'',10),end:text(r.end||'',10),typical:text(r.typical||'',300),typicalSource:r.typicalSource||'',time:text(r.time||'',200),note:text(r.note||''),spotId:r.spotId||'',checkedAt:r.checkedAt,sources,sourceConflict:r.sourceConflict===true,calendarUid:text(r.calendarUid||'',500)};
 });
 const yearNotes=(input.yearNotes||[]).map(n=>{if(!Number.isInteger(n.year)||n.year<2000||n.year>2099||!Number.isInteger(n.month)||n.month<1||n.month>12||n.status!=='not-held'||!safeURL(n.source)||!validDate(n.checkedAt))throw Error('Invalid year-specific notice');return {id:text(n.id,80),year:n.year,month:n.month,status:n.status,text:text(n.text),source:safeURL(n.source),checkedAt:n.checkedAt};});return {schemaVersion:1,updatedAt:input.updatedAt,records,yearNotes};
}
export function japanToday(now=new Date()){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));return parts.year+'-'+parts.month+'-'+parts.day;}
const dateLabel=s=>{const [y,m,d]=s.split('-').map(Number);return y+'年'+m+'月'+d+'日';};
export function eventDateText(r,year){if(r.status==='typical')return r.typical+'／'+year+'年の確定日程ではありません';if(r.year!==year)return r.year+'年の記録（対象年の予定ではありません）';if(r.status==='undated')return year+'年：日付未定';return dateLabel(r.start)+(r.end!==r.start?'～'+dateLabel(r.end):'');}
const el=(tag,t,cls)=>{const n=document.createElement(tag);if(t)n.textContent=t;if(cls)n.className=cls;return n;};
const link=(url,label)=>{const a=el('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
function article(r,year){
 const box=el('article',undefined,'calendar-event');box.dataset.eventId=r.id;box.append(el('span',({published:'対象年の公表日程',planned:'開催予定の公表',cancelled:'中止と公表',undated:'日付未定',typical:'例年の目安'})[r.status],'pill event-status-'+r.status),el('h3',r.name),el('p',eventDateText(r,year),'event-date'));
 if(r.typical&&r.status!=='typical'){box.append(el('p','例年の索引：'+r.typical+'（今年の日程とは別）','muted'));if(r.typicalSource)box.append(link(r.typicalSource,'例年索引の出典（古い資料を含む）'));}
 if(r.time)box.append(el('p',r.time));else if(r.status!=='typical')box.append(el('p','時刻：未確認','muted'));if(r.note)box.append(el('p',r.note));const sources=el('div',undefined,'event-sources');r.sources.forEach((s,i)=>{const line=el('p');line.append(link(s.url,'公式出典 '+(i+1)),el('span',' ／ '+s.dateKind+(s.updatedAt?'：'+s.updatedAt:'')));sources.append(line);});sources.append(el('p','確認日：'+r.checkedAt,'muted'));box.append(sources);if(r.spotId){const a=el('a','関連する場所を地図で見る');a.href=routeURL(document.baseURI,{id:r.spotId});box.append(a);}return box;
}
export function renderAnnualCalendar(container,data,{year,today=japanToday()}={}){
 container.replaceChildren();if(!data){container.append(el('p','確認済みの日程情報を読み込めませんでした。通信が戻ったら再読み込みしてください。'));return;}
 const records=data.records.filter(r=>r.year===year||r.status==='typical');
 for(let month=1;month<=12;month++){
  const section=el('section',undefined,'calendar-month');section.dataset.month=month;section.append(el('h2',month+'月'));const entries=records.filter(r=>r.month===month),past=entries.filter(r=>r.end&&r.end<today),current=entries.filter(r=>!past.includes(r));for(const r of current)section.append(article(r,year));
  if(past.length){const details=el('details',undefined,'past-events');details.append(el('summary',year+'年の過去の公表日程 '+past.length+'件'));details.append(el('p','公表された日程の記録です。開催済みの実績を一律に示すものではありません。','muted'));for(const r of past)details.append(article(r,year));section.append(details);}
  for(const note of data.yearNotes.filter(n=>n.year===year&&n.month===month)){const n=el('article',undefined,'year-notice');n.append(el('h3','対象年の公式案内'),el('p',note.text),link(note.source,'公式根拠'),el('p','確認日：'+note.checkedAt,'muted'));section.append(n);}
  if(!entries.length)section.append(el('p','日程情報は準備中','muted'));container.append(section);
 }
 const undated=records.filter(r=>r.month===null);if(undated.length){const section=el('section',undefined,'calendar-undated');section.append(el('h2','月・日付が未定の催し'));for(const r of undated)section.append(article(r,year));container.append(section);}
}
export function renderSpotEvents(container,data,spotId,{year=Number(japanToday().slice(0,4)),today=japanToday()}={}){
 container.replaceChildren();const all=data?.records.filter(r=>r.spotId===spotId)||[];container.hidden=!all.length;if(!all.length)return;container.append(el('h3','開催時期・対象年の公表日程'));const current=all.filter(r=>r.year===year||r.status==='typical');if(!current.length){container.append(el('p',year+'年の確定日程は未確認です。過去年の日程を自動で繰り越していません。'));return;}
 const past=current.filter(r=>r.end&&r.end<today);for(const r of current.filter(r=>!past.includes(r)))container.append(article(r,year));if(past.length){const details=el('details',undefined,'past-events');details.append(el('summary',year+'年の過去の公表日程 '+past.length+'件'));for(const r of past)details.append(article(r,year));container.append(details);}
}
