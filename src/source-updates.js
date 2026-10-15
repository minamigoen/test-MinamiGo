import {safeURL} from './data.js';
const fields=['name','hours','closed','tel','url','image','eventPeriod'];
export function planTownUpdates(baseline,fetched,policy){
 const old=baseline?.records||[],rows=fetched?.records||[];const groups=rows.map(r=>r.key.replace(/\d+$/,''));
 if(!old.length||!rows.length||rows.length<old.length*.75||['watch','fes','exsur'].some(g=>!groups.includes(g))||new Set(rows.map(r=>r.key)).size!==rows.length)return {status:'blocked',reason:'empty_drop_or_structure_change',changes:[],retained:true};
 const before=new Map(old.map(r=>[r.key,r])),after=new Map(rows.map(r=>[r.key,r])),changes=[],missing=[];
 for(const rule of policy.records){
  const prior=before.get(rule.sourceKey),next=after.get(rule.sourceKey);if(!next){missing.push({id:rule.id,sourceKey:rule.sourceKey,status:'source-missing-retain'});continue;}
  if(!prior){changes.push({id:rule.id,sourceKey:rule.sourceKey,kind:'identity-review',protected:true});continue;}
  for(const field of fields){if((prior[field]||'')===(next[field]||''))continue;const changedName=prior.name!==next.name;
   changes.push({changeId:(rule.changePrefix||rule.id)+':'+field,id:rule.id,sourceKey:rule.sourceKey,field,before:prior[field]||'',after:next[field]||'',current:rule.current[field]||'',protected:changedName||field==='image'||rule.protectedFields.includes(field),kind:changedName?'identity-review':field==='image'?'photo-review':'candidate',sourceUrl:fetched.sourceUrl+'#inline-wrap_'+rule.sourceKey,checkedAt:fetched.checkedAt});
  }
 }
 return {status:'review',sourceUrl:fetched.sourceUrl,checkedAt:fetched.checkedAt,sourceHash:fetched.htmlSha256,changes,missing,unmapped:rows.filter(r=>!before.has(r.key)).map(r=>r.key),retained:true};
}
export function approveTownUpdates(current,plan,approvedIds){
 if(plan.status!=='review'||!Array.isArray(approvedIds))throw new Error('Unusable source plan');
 const result=structuredClone(current),seen=new Set();
 for(const key of approvedIds){if(seen.has(key))throw new Error('Duplicate approval');seen.add(key);const c=plan.changes.find(c=>c.changeId===key);
  if(!c||c.protected||c.kind!=='candidate'||!['hours','closed','tel','url'].includes(c.field))throw new Error('Protected or unsupported source change');
  const row=result.find(r=>r.id===c.id);if(!row||(row[c.field]||'')!==c.current)throw new Error('Manual/current value changed; re-read Sheet');
  if(c.field==='url'&&c.after&&!safeURL(c.after))throw new Error('Unsafe source URL');
  if(c.field==='tel'&&c.after&&!/^[0-9+() -]{5,30}$/.test(c.after))throw new Error('Review telephone format');row[c.field]=c.after;
 }
 return result;
}
