import { readFile, writeFile, mkdir, copyFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'public');
const supplied = path.resolve(root, '../EDOLUS_files');
const origin = 'https://edolus.com/';
const records = [];
const exists = async (file) => access(file).then(() => true, () => false);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

function targetFor(url) {
  const parsed = new URL(url, origin);
  if (parsed.origin !== new URL(origin).origin) throw new Error(`Unexpected asset origin: ${url}`);
  const relative = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
  const target = path.resolve(output, relative);
  if (!target.startsWith(output + path.sep)) throw new Error(`Unsafe destination: ${url}`);
  return target;
}

async function download(url) {
  const allowed = new Set(['edolus.com', 'api.fontshare.com', 'cdn.fontshare.com', 'fonts.googleapis.com', 'fonts.gstatic.com']);
  if (!allowed.has(new URL(url).hostname)) throw new Error(`Unexpected download host: ${url}`);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(45000),
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' },
  });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  if (!allowed.has(new URL(response.url).hostname)) throw new Error('Unexpected redirect');
  return Buffer.from(await response.arrayBuffer());
}

async function install(url, localName) {
  const target = targetFor(url);
  const basename = localName || path.basename(target);
  const candidate = [path.join(supplied, basename), path.join(supplied, `${basename}.download`)];
  const source = (await Promise.all(candidate.map(exists))).findIndex(Boolean);
  await mkdir(path.dirname(target), { recursive: true });
  let provenance;
  if (source !== -1) {
    await copyFile(candidate[source], target);
    provenance = `EDOLUS_files/${path.basename(candidate[source])}`;
  } else if (await exists(target)) {
    provenance = new URL(url, origin).href;
  } else {
    const bytes = await download(new URL(url, origin).href);
    if (!bytes.length) throw new Error(`Empty asset: ${url}`);
    await writeFile(target, bytes);
    provenance = new URL(url, origin).href;
    console.log(`Recovered missing asset: ${path.basename(target)}`);
  }
  const bytes = await readFile(target);
  records.push({ path: path.relative(output, target).replaceAll('\\', '/'), source: provenance, bytes: bytes.length, sha256: digest(bytes) });
}

const config = JSON.parse(await readFile(path.join(output, 'config.json'), 'utf8'));
const urls = new Set();
function collectFile(file) {
  if (!file || typeof file !== 'object') return;
  // The original export publishes BASIS instead of uncompressed source textures.
  if (file.url && !file.variants?.basis) urls.add(file.url);
  for (const variant of Object.values(file.variants || {})) collectFile(variant);
}
for (const asset of Object.values(config.assets)) collectFile(asset.file);
for (const filename of ['playcanvas-stable.min.js', '__settings__.js', '__modules__.js', '__start__.js', '__loading__.js', 'styles.css']) urls.add(filename);
// The saved folder flattened these paths; restore the exported PlayCanvas layout.
const queue = [...urls];
const failures = [];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const url = queue.shift();
    try { await install(url); }
    catch (error) { failures.push({ url, error: error.message }); console.error(error.message); }
  }
}));
await install('vendor/gsap.min.js', 'gsap.min.js');

const fontsDir = path.join(output, 'fonts');
await mkdir(fontsDir, { recursive: true });
const fontRequests = [
  'https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700&display=swap',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700;800&display=swap',
];
let fontCSS = '';
for (const request of fontRequests) {
  const css = (await download(request)).toString('utf8');
  const faces = css.match(/@font-face\s*\{[^}]+\}/g) || [];
  for (let face of faces) {
    const src = face.match(/url\(['"]?([^'"\s)]+\.woff2)['"]?\)/);
    if (!src) throw new Error('No WOFF2 font found');
    const remote = src[1].startsWith('//') ? `https:${src[1]}` : src[1];
    const filename = path.basename(new URL(remote).pathname);
    const target = path.join(fontsDir, filename);
    const userFile = path.join(supplied, filename);
    if (!(await exists(target))) {
      if (await exists(userFile)) await copyFile(userFile, target);
      else await writeFile(target, await download(remote));
    }
    face = face.replace(/src\s*:[^;]+;/, `src: url('/fonts/${filename}') format('woff2');`);
    fontCSS += face + '\n';
    if (!records.some((entry) => entry.path === `fonts/${filename}`)) {
      const bytes = await readFile(target);
      records.push({ path: `fonts/${filename}`, source: (await exists(userFile)) ? `EDOLUS_files/${filename}` : remote, bytes: bytes.length, sha256: digest(bytes) });
    }
  }
}
await writeFile(path.join(fontsDir, 'fonts.css'), fontCSS);

const patches = [];
// Only make the original runtime self-contained. Do not rewrite its visual logic.
for (const name of ['__game-scripts.js', '__loading__.js']) {
  const filename = path.join(output, name);
  let source = await readFile(filename, 'utf8');
  const original = source;
  source = source.replace(/https:\/\/(?:api\.fontshare\.com\/v2\/css|fonts\.googleapis\.com\/css2)\?[^\s"'`<>]+/g, '/fonts/fonts.css');
  source = source.replaceAll('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', '/vendor/gsap.min.js');
  if (source !== original) {
    await writeFile(filename, source);
    patches.push({ path: name, change: 'Use local font CSS and GSAP; no scene or animation changes', originalSha256: digest(original), sha256: digest(source) });
  }
}
await writeFile(path.join(root, 'asset-provenance.json'), JSON.stringify({
  restoredAt: new Date().toISOString(), source: 'User-supplied EDOLUS_files; missing export dependencies recovered from the original public site',
  assetRecords: Object.keys(config.assets).length, files: records.sort((a, b) => a.path.localeCompare(b.path)), patches, failures,
}, null, 2) + '\n');
console.log(`Restored ${records.length} unique files for ${Object.keys(config.assets).length} asset records. Missing: ${failures.length}.`);
if (failures.length) process.exitCode = 1;
