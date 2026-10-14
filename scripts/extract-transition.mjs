import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

// Run only against a user-supplied local clip. Never fetch YouTube media.
// node scripts/extract-transition.mjs computer "C:/clips/first.mp4" 53
// node scripts/extract-transition.mjs certificates "C:/clips/second.mp4" 0
const [id,input,start='0']=process.argv.slice(2);
if(!['computer','certificates'].includes(id)||!input||!Number.isFinite(+start)||+start<0)throw new Error('Usage: node scripts/extract-transition.mjs computer|certificates LOCAL_CLIP START_SECONDS');
const root=path.resolve(import.meta.dirname,'..'),source=path.resolve(input);
if(!(await fs.stat(source)).isFile())throw new Error('A local video file is required.');
const executable=process.env.PORTFOLIO_FFMPEG||'ffmpeg';
const probe=spawnSync(executable,['-version'],{encoding:'utf8'});if(probe.error||probe.status!==0)throw new Error('FFmpeg is required. Install it or set PORTFOLIO_FFMPEG to its executable.');
const parent=path.join(root,'public/portfolio/transitions');await fs.mkdir(parent,{recursive:true});
// Every run gets a fresh directory; failed conversions cannot replace a working sequence.
const output=await fs.mkdtemp(path.join(parent,id+'-'));
const args=['-v','error','-ss',start,'-i',source,'-t','2','-an','-vf','scale=1280:-2:flags=lanczos,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir,tpad=stop_mode=clone:stop_duration=1','-frames:v','120','-c:v','libwebp','-quality','78','-compression_level','5',path.join(output,'frame-%04d.webp')];
const result=spawnSync(executable,args,{stdio:'inherit'});if(result.error||result.status!==0)throw new Error('Frame extraction failed; existing manifest left untouched.');
const frames=(await fs.readdir(output)).filter(f=>/^frame-\d{4}\.webp$/.test(f));if(frames.length!==120)throw new Error(`Expected 120 frames, got ${frames.length}; existing manifest left untouched.`);
const manifestPath=path.join(parent,'sequences.json'),manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
Object.assign(manifest.find(e=>e.id===id),{count:120,base:'/portfolio/transitions/'+path.basename(output),ready:true});
await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(`Prepared ${id}: 120 WebP frames. Review interpolation artifacts before publishing.`);
