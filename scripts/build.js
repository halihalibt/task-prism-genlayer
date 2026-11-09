import fs from 'node:fs';
import {build} from 'esbuild';
import {styles} from '../i18n_and_styles.js';
fs.mkdirSync('assets',{recursive:true});
fs.writeFileSync('assets/app.css',styles);
await build({entryPoints:['app.js'],bundle:true,minify:true,format:'esm',target:['es2022'],outfile:'assets/app.bundle.js',legalComments:'external'});
fs.mkdirSync('dist',{recursive:true});
for(const name of ['index.html','assets','KNOWN_LIMITATIONS.md','config.js'])fs.cpSync(name,`dist/${name}`,{recursive:true});
console.log('Built static Pages assets.');
