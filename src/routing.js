import {CATEGORIES,LIFE_TYPES} from './data.js';
const keys=['q','category','foodType','lifeType','view','id','year'];
export function parseRoute(value){
 const url=new URL(value),[hashPage,query='']=url.hash.slice(1).split('?');const p=keys.some(k=>url.searchParams.has(k))?url.searchParams:new URLSearchParams(query);const category=p.get('category')==='eat'?'food':p.get('category');
 return {page:['explore','saved','help','events'].includes(hashPage)?hashPage:'explore',q:(p.get('q')||'').slice(0,100),category:Object.hasOwn(CATEGORIES,category)?category:'',foodType:(p.get('foodType')||'').slice(0,80),lifeType:LIFE_TYPES.includes(p.get('lifeType'))?p.get('lifeType'):'',view:['map','list','cards'].includes(p.get('view'))?p.get('view'):'map',id:/^[a-z0-9-]{1,80}$/.test(p.get('id')||'')?p.get('id'):'',year:/^(?:19|20)\d{2}$/.test(p.get('year')||'')?p.get('year'):''};
}
export function routeURL(base,route={}){
 const url=new URL('./',base),p=new URLSearchParams(),r={page:'explore',view:'map',...route};
 if(r.category&&Object.hasOwn(CATEGORIES,r.category))p.set('category',r.category==='food'?'eat':r.category);
 if(r.q)p.set('q',String(r.q).slice(0,100));if(r.foodType&&r.category==='food')p.set('foodType',String(r.foodType).slice(0,80));if(r.lifeType&&r.category==='life'&&LIFE_TYPES.includes(r.lifeType))p.set('lifeType',r.lifeType);
 if(['list','cards'].includes(r.view)||p.size)p.set('view',['map','list','cards'].includes(r.view)?r.view:'map');if(/^[a-z0-9-]{1,80}$/.test(r.id||''))p.set('id',r.id);if(r.page==='events'&&/^(?:19|20)\d{2}$/.test(r.year||''))p.set('year',r.year);
 url.search=p.toString();url.hash=['explore','saved','help','events'].includes(r.page)?r.page:'explore';return url.href;
}
