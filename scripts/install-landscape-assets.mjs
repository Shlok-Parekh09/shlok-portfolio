// One-off asset packaging. Generated originals stay outside the shipped public folder.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(process.argv[2]);
const generated='C:/Users/Shlok Parekh/.codex/generated_images/01a0871d-1d87-7423-ac3d-0a4df8e8e828/';
await fs.mkdir('public/portfolio/environment',{recursive:true});
for(const [source,target] of [
 ['exec-82442b74-f65d-4342-b717-92018e763f09.png','public/portfolio/ending/blackhole-refined.webp'],
 ['exec-56d79857-b8b3-4b24-bbff-dfd0ac226027.png','public/portfolio/environment/himalayan-terrain.webp'],
 ['exec-be032869-c0ed-4f6d-8dad-a466b52271da.png','public/portfolio/environment/himalayan-window.webp']
]){
 await sharp(generated+source).webp({quality:90,effort:6}).toFile(target);
 const {width,height}=await sharp(target).metadata();console.log(target,width,height,(await fs.stat(target)).size);
}
const file='public/config.json',config=JSON.parse(await fs.readFile(file,'utf8'));
const asset=config.assets['298350544'];
asset.file={filename:'himalayan-terrain.webp',url:'portfolio/environment/himalayan-terrain.webp',size:(await fs.stat('public/portfolio/environment/himalayan-terrain.webp')).size,variants:{}};
asset.name='Himalayan alpine terrain';
await fs.writeFile(file,JSON.stringify(config));
