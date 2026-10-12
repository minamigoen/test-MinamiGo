import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const f of ['index.html','offline.html','styles.css','src','data','config.json','manifest.json','sw.js','icon-192.png','icon-512.png','assets'])await cp(f,'dist/'+f,{recursive:true});
console.log('Static site built in dist/');
