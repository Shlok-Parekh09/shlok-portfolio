import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(import.meta.dirname,'..');
export const vaultRoot=path.join(root,'content','Hack The Box Vault');
export function parseNote(source){
 const match=/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source),meta={};
 let key='';
 if(match)for(const line of match[1].split(/\r?\n/)){
  const m=/^(\w+):\s*(.*?)\s*$/.exec(line);
  if(m){key=m[1];meta[key]=m[2].replace(/^(["'])(.*)\1$/,'$2');}
  else if(key==='tags'&&/^\s+-\s+/.test(line))meta.tags+=(meta.tags?',':'')+line.replace(/^\s+-\s+/,'').replace(/^(["'])(.*)\1$/,'$2');
 }
 if(meta.tags?.startsWith('['))meta.tags=meta.tags.slice(1,-1).split(',').map(s=>s.trim().replace(/^(["'])(.*)\1$/,'$2')).join(',');
 return {meta,body:match?source.slice(match[0].length):source};
}
export function noteRecord(source,file){
 const {meta:m,body}=parseNote(source);if(m.listed!=='true')return null;
 const slug=m.slug||path.basename(file,'.md');
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw new Error('Invalid slug in '+file);
 if(!m.title||!['Linux','Windows','Other'].includes(m.os)||!['Easy','Medium','Hard','Insane'].includes(m.difficulty)||!['Active','Retired'].includes(m.status))throw new Error('Check metadata in '+file);
 if(m.published==='true'&&m.status!=='Retired')throw new Error('Do not publish active-machine writeups: '+file);
 return {slug,title:m.title,os:m.os,difficulty:m.difficulty,status:m.status,userOwned:m.userOwned==='true',systemOwned:m.systemOwned==='true',solvedOn:/^\d{4}-\d{2}-\d{2}$/.test(m.solvedOn||'')?m.solvedOn:'',tags:(m.tags||'').split(',').map(s=>s.trim()).filter(Boolean),published:m.published==='true',body:m.published==='true'?body:''};
}
export async function buildWriteups(vault=vaultRoot,out=path.join(root,'public','portfolio','htb')){
 const dir=path.join(vault,'Machines');await fs.mkdir(dir,{recursive:true});
 const machines=[],assets={},slugs=new Set();
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  if(!entry.isFile()||!entry.name.endsWith('.md'))continue;
  const record=noteRecord(await fs.readFile(path.join(dir,entry.name),'utf8'),entry.name);if(!record)continue;
  if(slugs.has(record.slug))throw new Error('Duplicate slug: '+record.slug);slugs.add(record.slug);
  // Only referenced images from published notes are exported, not the vault.
  const imagePattern=/!\[\[(Attachments\/[^\]|]+)(?:\|[^\]]*)?\]\]|!\[[^\]]*\]\((Attachments\/[^)]+)\)/g;
  for(const match of record.body.matchAll(imagePattern)){
   const relative=match[1]||match[2],filename=path.resolve(vault,relative),base=path.resolve(vault,'Attachments');
   if(!filename.startsWith(base+path.sep)||!['.png','.jpg','.jpeg','.webp','.gif'].includes(path.extname(filename).toLowerCase()))throw new Error('Invalid attachment: '+relative);
   const real=await fs.realpath(filename);if(!real.startsWith(base+path.sep))throw new Error('Attachment escapes vault');
   const info=await fs.stat(real);if(info.size>3*1024*1024)throw new Error('Compress attachment below 3 MB: '+relative);
   const mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'}[path.extname(real).toLowerCase()];
   assets[relative]='data:'+mime+';base64,'+(await fs.readFile(real)).toString('base64');
  }
  machines.push(record);
 }
 machines.sort((a,b)=>b.solvedOn.localeCompare(a.solvedOn)||a.title.localeCompare(b.title));
 const result={machines,assets};await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'index.json'),JSON.stringify(result));return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildWriteups();
