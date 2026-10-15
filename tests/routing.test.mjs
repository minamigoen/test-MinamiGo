import test from 'node:test';import assert from 'node:assert/strict';import {parseRoute,routeURL} from '../src/routing.js';import {publicShareUrl} from '../src/app-utilities.js';
const base='https://minamigoen.github.io/test-MinamiGo/';
test('public category aliases and explicit URL values override legacy fragments; no arguments means all map',()=>{
 assert.equal(parseRoute(base).view,'map');assert.equal(parseRoute(base).category,'');assert.equal(parseRoute(base+'?category=eat&view=list#explore?category=stay').category,'food');assert.equal(parseRoute(base+'#explore?category=food&view=cards').view,'cards');assert.equal(parseRoute(base+'?category=UNKNOWN&view=<script>').category,'');assert.equal(parseRoute(base+'?view=UNKNOWN').view,'map');assert.equal(parseRoute(base+'?id=../bad').id,'');
});
test('canonical sharing preserves approved conditions and selected ID while dropping GPS, unrelated params and favorite state',()=>{
 const url=publicShareUrl(base+'?token=SECRET&lat=33.7#saved','minamistay-0000000001',{category:'stay',q:'海 <img onerror=alert(1)>',view:'map'}),p=new URL(url);assert.equal(p.searchParams.get('category'),'stay');assert.equal(p.searchParams.get('q'),'海 <img onerror=alert(1)>');assert.equal(p.searchParams.get('id'),'minamistay-0000000001');assert.equal(p.hash,'#explore');assert.ok(!url.includes('SECRET'));assert.ok(!p.searchParams.has('lat'));assert.deepEqual(parseRoute(routeURL(base,{category:'food',foodType:'カフェ',view:'cards'})).foodType,'カフェ');
});
