import test from 'node:test';import assert from 'node:assert/strict';import {planTownUpdates,approveTownUpdates} from '../src/source-updates.js';
const baseline={records:['watch1','fes1','exsur1','watch2'].map(key=>({key,name:key,hours:'old'}))};
const policy={records:[{id:'town-watch-1',sourceKey:'watch1',protectedFields:['name','image'],current:{hours:'manual'}}]};
const next=()=>({...structuredClone(baseline),sourceUrl:'https://www.town.minami.lg.jp/foreign_country/jp/sightseeing.html',checkedAt:'2026-10-15'});
test('upstream changes are candidates; explicit approval preserves unselected and manual values',()=>{
 const fetched=next();fetched.records[0].hours='new';const plan=planTownUpdates(baseline,fetched,policy),current=[{id:'town-watch-1',hours:'manual',notes:'private'}];
 assert.equal(plan.changes[0].current,'manual');assert.deepEqual(approveTownUpdates(current,plan,[]),current);assert.equal(approveTownUpdates(current,plan,['town-watch-1:hours'])[0].hours,'new');assert.equal(current[0].hours,'manual');
 assert.throws(()=>approveTownUpdates([{id:'town-watch-1',hours:'changed'}],plan,['town-watch-1:hours']),/Manual/);
});
test('empty, steep drop and missing groups block application; disappearance alone never deletes a record',()=>{
 for(const records of [[],baseline.records.slice(0,2),[baseline.records[0],baseline.records[0],baseline.records[1]]])assert.equal(planTownUpdates(baseline,{records},policy).status,'blocked');
 const fetched=next();fetched.records=fetched.records.filter(r=>r.key!=='watch1');const plan=planTownUpdates(baseline,fetched,policy);assert.equal(plan.status,'review');assert.equal(plan.missing[0].status,'source-missing-retain');assert.deepEqual(approveTownUpdates([{id:'town-watch-1',hours:'manual'}],plan,[]),[{id:'town-watch-1',hours:'manual'}]);
});
test('renaming, photos, protected fields, invalid URLs and duplicate approvals require review',()=>{
 const fetched=next();fetched.records[0].name='different';fetched.records[0].hours='new';let plan=planTownUpdates(baseline,fetched,policy);assert.ok(plan.changes.every(c=>c.protected));assert.throws(()=>approveTownUpdates([],plan,['town-watch-1:hours']),/Protected/);
 fetched.records[0].name='watch1';fetched.records[0].url='javascript:alert(1)';plan=planTownUpdates(baseline,fetched,policy);assert.throws(()=>approveTownUpdates([{id:'town-watch-1',hours:'manual'}],plan,['town-watch-1:url']),/Unsafe/);assert.throws(()=>approveTownUpdates([{id:'town-watch-1',hours:'manual'}],plan,['town-watch-1:hours','town-watch-1:hours']),/Duplicate/);
});
