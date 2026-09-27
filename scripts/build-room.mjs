import { build } from 'esbuild';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
await build({entryPoints:[path.join(root,'src/room.js')],outfile:path.join(root,'public/room.js'),bundle:true,format:'esm',minify:true,target:'es2022',legalComments:'eof'});
console.log('Reference room bundled.');
