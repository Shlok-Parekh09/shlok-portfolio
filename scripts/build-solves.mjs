// Only allow-listed solve metadata is public. Obsidian notes are never read.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(import.meta.dirname,'..');
export function sanitizeSolves(data){
 const machines=(data.machines||[]).filter(m=>m.systemOwned===true).map(m=>({
  title:String(m.title||'').slice(0,100),os:['Linux','Windows','Other'].includes(m.os)?m.os:'Other',
  difficulty:['Easy','Medium','Hard','Insane'].includes(m.difficulty)?m.difficulty:'Unknown',
  userOwned:m.userOwned===true,systemOwned:true,
  rating:Number.isFinite(m.rating)?m.rating:null,ratingCount:Number.isInteger(m.ratingCount)?m.ratingCount:null,
  releasedOn:/^\d{4}-\d{2}-\d{2}$/.test(m.releasedOn||'')?m.releasedOn:''
 }));
 return {machines,sync:{connected:data.sync?.connected===true,lastUpdated:data.sync?.lastUpdated||null,message:String(data.sync?.message||'Automatic sync is not connected yet.')}};
}
export async function buildSolves(){
 const data=sanitizeSolves(JSON.parse(await fs.readFile(path.join(root,'content/htb-solves.json'),'utf8')));
 await fs.mkdir(path.join(root,'public/portfolio/htb'),{recursive:true});
 await fs.writeFile(path.join(root,'public/portfolio/htb/index.json'),JSON.stringify(data));return data;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildSolves();
