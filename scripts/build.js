import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {styles} from '../i18n_and_styles.js';
fs.mkdirSync('assets',{recursive:true});
fs.writeFileSync('assets/app.css',styles);
await build({entryPoints:['app.js'],bundle:true,minify:true,format:'esm',target:['es2022'],outfile:'assets/app.bundle.js',legalComments:'external'});
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist',{recursive:true});
for(const name of ['index.html','assets','KNOWN_LIMITATIONS.md','config.js'])fs.cpSync(name,`dist/${name}`,{recursive:true});
let html=fs.readFileSync('dist/index.html','utf8');
for(const [old,ext]of [['app.bundle.js','js'],['app.css','css']]){const data=fs.readFileSync(`dist/assets/${old}`),digest=createHash('sha256').update(data).digest('hex').slice(0,12),next=`app-${digest}.${ext}`;fs.writeFileSync(`dist/assets/${next}`,data);fs.unlinkSync(`dist/assets/${old}`);html=html.replace(`./assets/${old}`,`./assets/${next}`);}
fs.writeFileSync('dist/index.html',html);
console.log('Built static Pages assets with content-hashed cache paths.');
