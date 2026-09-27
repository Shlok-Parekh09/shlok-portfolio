import { cp, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Packaging only. Run `npm run verify` separately when verification is wanted.
await mkdir(path.join(root, 'dist'), { recursive: true });
await cp(path.join(root, 'public'), path.join(root, 'dist'), { recursive: true });
const resume=path.resolve(root,'../resume.pdf');
const available=await stat(resume).then(s=>s.isFile(),()=>false);
if(available)await cp(resume,path.join(root,'dist/resume.pdf'));
await writeFile(path.join(root,'dist/portfolio-status.json'),JSON.stringify({resume:available}));
console.log('SHLOK static export ready in dist/ (packaging only; no tests run).');
