import test from 'node:test';import assert from 'node:assert/strict';import {publicShareUrl} from '../src/app-utilities.js';import qrcode from '../assets/vendor/qrcode.mjs';
test('share links carry only selected stable IDs; QR creation needs no remote endpoint',()=>{
 assert.equal(publicShareUrl('https://minamigoen.github.io/test-MinamiGo/?q=secret#explore?near=33,134'),'https://minamigoen.github.io/test-MinamiGo/#explore');
 assert.equal(publicShareUrl('https://minamigoen.github.io/test-MinamiGo/','town-watch-1'),'https://minamigoen.github.io/test-MinamiGo/#explore?id=town-watch-1');
 assert.ok(!publicShareUrl('https://example.com/app/','../private').includes('private'));const qr=qrcode(0,'M');qr.addData(publicShareUrl('https://minamigoen.github.io/test-MinamiGo/'));qr.make();assert.match(qr.createSvgTag({cellSize:5,margin:20}),/^<svg/);
});
