// Restore only the missing authored Earth video registration, not the scene.
import fs from 'node:fs';
const target = 'public/config.json';
const config = JSON.parse(fs.readFileSync(target, 'utf8'));
const original = JSON.parse(fs.readFileSync('original-export/config.json', 'utf8'));
const id = '297340642';
const asset = original.assets[id];
if (!asset || !fs.existsSync(`public/${asset.file.url}`)) throw new Error('Original Earth video is unavailable');
config.assets[id] = {...asset, preload: false};
fs.writeFileSync(target, JSON.stringify(config));
console.log('Restored original Earth video asset; no terrain or animation changes.');
