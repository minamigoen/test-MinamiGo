import {validateData} from './data.js';
export function reviewedLife(rows,review){
 if(!Array.isArray(rows)||rows.length!==review?.records?.length||review.schemaVersion!==1)throw new Error('Life source row count changed; review required');
 const seen=new Set(),spots=[],patches=[];
 for(const row of rows){const no=String(row[0]).padStart(10,'0'),r=review.records.find(r=>r.no===no);if(!r||seen.has(no)||row[1]!==r.expectedName||row[12]!==r.id||row[21]!=='掲載')throw new Error('Life identity/publication changed');seen.add(no);
  if(JSON.stringify(row.slice(0,12))!==JSON.stringify(r.expectedValues))throw new Error('Life source facts changed; review required');
  const actual=row[3]===''&&row[4]===''?null:[row[3],row[4]];if(JSON.stringify(actual)!==JSON.stringify(r.coordinate))throw new Error('Life coordinates changed; review required');
  const source=r.spot||r.patch;if(row[14]!==source.lifeTypes||row[15]!==source.serviceHours||row[16]!==source.serviceStatus||row[20]!==r.checkedAt||row[17]!==r.sourceUrl)throw new Error('Life service facts changed; review required');
  if(r.action==='add')spots.push(r.spot);else if(r.action==='merge-existing')patches.push({id:r.id,expectedName:r.expectedName,...r.patch});else throw new Error('Unsupported life action');
 }
 return {data:validateData({schemaVersion:1,updatedAt:review.updatedAt,spots}),patches};
}
export function mergeLifeReferences(spots,patches){
 if(patches.some(p=>!spots.some(s=>s.id===p.id&&s.name===p.expectedName)))throw new Error('Existing life correspondence changed');
 return spots.map(s=>{const p=patches.find(p=>p.id===s.id);if(!p)return s;const {expectedName,id,...fields}=p;return {...s,...fields};});
}
