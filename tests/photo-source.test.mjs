import test from 'node:test';import assert from 'node:assert/strict';import {publicFacilityImage,approvedFacilityPhoto} from '../src/photo-source.js';
import {mergeFoodSource} from '../src/food-source.js';import {readFileSync} from 'node:fs';
const approval={approved:true,categories:['food','stay']},image='https://www.town.minami.lg.jp/foreign_country/assets/images/sightseeing/eat_img2.jpg';
test('permission is explicit and restricted to food/stay, never heritage/power',()=>{
 assert.deepEqual(approvedFacilityPhoto({category:'food',name:'TEST',image}),{});
 assert.deepEqual(approvedFacilityPhoto({category:'heritage',name:'TEST',image,approval}),{});
 assert.equal(approvedFacilityPhoto({category:'food',name:'TEST',image,approval}).photoUrl,image);
});
test('public Drive file routes normalize; folders, credentials and arbitrary image hosts are excluded',()=>{
 assert.equal(publicFacilityImage('https://drive.google.com/file/d/TEST_ONLY/view?usp=drive_link'),'https://lh3.googleusercontent.com/d/TEST_ONLY');
 for(const u of ['https://drive.google.com/drive/folders/TEST_ONLY','https://example.org/photo.jpg',image+'?token=secret'])assert.equal(publicFacilityImage(u),'');
});
test('runtime food photos survive cache remerge and disappear honestly if source photo is absent',()=>{
 const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url))),snapshot=read('data/spots.json'),local=read('data/local-content.json'),config=read('data/food-source.json');
 const rows=snapshot.spots.filter(s=>s.category==='food').map(s=>({no:s.upstreamId,name:s.name,address:s.address,lat:s.lat,lng:s.lng,image:s.photoUrl}));
 const first=mergeFoodSource(rows,local,config);assert.equal(first.data.spots.filter(s=>s.category==='food'&&s.photoUrl).length,37);
 assert.equal(mergeFoodSource(first.sourceRows,local,config).data.spots.filter(s=>s.category==='food'&&s.photoUrl).length,37);
 rows[0].image='';const absent=mergeFoodSource(rows,local,config).data.spots.find(s=>s.upstreamId===rows[0].no);assert.equal(absent.photoUrl,undefined);assert.equal(absent.photoStatus,'写真未登録');
 assert.equal(snapshot.spots.some(s=>['heritage','powerspot'].includes(s.category)&&s.photoUrl),false);
});
