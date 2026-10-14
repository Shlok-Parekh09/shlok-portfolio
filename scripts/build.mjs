import { cp, mkdir, stat, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import './build-room.mjs';
import {buildSolves} from './build-solves.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await buildSolves();
// Packaging only. Run `npm run verify` separately when verification is wanted.
await mkdir(path.join(root, 'dist'), { recursive: true });
// Keep original source media in public for recovery, but do not ship replaced assets.
const retired=new Set([
  'star-tunnel.js',
  'htb-solves.js',
  'htb-solves.css',
  'portfolio/music/sunflower.mp3',
  'portfolio/music/circles.mp3',
  'portfolio/music/blinding-lights.mp3',
  'wormhole-journey.js',
  'clock-journey.js',
  'frame-sequence.js',
  'himalayan-birds.js',
  'skills-scene.js',
  'htb.js',
  'portfolio/ending/132251-752803360_medium.mp4',
  'portfolio/ending/147290-791334083_medium.mp4',
  'portfolio/ending/travel-poster.jpg',
  'portfolio/models/diamond-satellite.glb',
  'portfolio/music/Stronger.mp3',
]);
await cp(path.join(root, 'public'), path.join(root, 'dist'), {
  recursive: true,
  filter: source=>!retired.has(path.relative(path.join(root,'public'),source).split(path.sep).join('/')),
});
// Remove only these known generated copies from previous exports, never source files.
for(const file of retired){
  const target=path.resolve(root,'dist',file);
  if(!target.startsWith(path.resolve(root,'dist')+path.sep))throw new Error('Unsafe output path');
  await rm(target,{force:true});
}
const resume=path.resolve(root,'../resume.pdf');
const available=await stat(resume).then(s=>s.isFile(),()=>false);
if(available)await cp(resume,path.join(root,'dist/resume.pdf'));
await writeFile(path.join(root,'dist/portfolio-status.json'),JSON.stringify({resume:available}));
console.log('SHLOK static export ready in dist/ (packaging only; no tests run).');
