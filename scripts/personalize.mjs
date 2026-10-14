// Deterministic adaptation of the preserved original export, not a runtime DOM rewrite.
import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');
const backup = path.join(root, 'original-export');
await mkdir(backup, { recursive: true });
const exists = file => access(file).then(() => true, () => false);
const files = ['2509662.json', 'config.json', '__game-scripts.js', '__loading__.js', '__settings__.js'];
for (const name of files) if (!(await exists(path.join(backup, name)))) await copyFile(path.join(pub, name), path.join(backup, name));
const context = { window: {} };
vm.runInNewContext(await readFile(path.join(pub, 'portfolio-content.js'), 'utf8'), context);
const content = context.window.PORTFOLIO_CONTENT;
const scene = JSON.parse(await readFile(path.join(backup, '2509662.json'), 'utf8'));
const config = JSON.parse(await readFile(path.join(backup, 'config.json'), 'utf8'));
let game = await readFile(path.join(backup, '__game-scripts.js'), 'utf8');
let loading = await readFile(path.join(backup, '__loading__.js'), 'utf8');
let settings = await readFile(path.join(backup, '__settings__.js'), 'utf8');
const entries = Object.values(scene.entities);
const byName = name => entries.find(e => e.name === name);
const withScript = name => entries.filter(e => e.components?.script?.scripts?.[name]);
const attrs = (entity, name) => entity.components.script.scripts[name].attributes;
const disableScript = (entity, name) => { if (entity?.components?.script?.scripts?.[name]) entity.components.script.scripts[name].enabled = false; };

// All authored logo geometry is replaced, including the intro and replay variants.
game = game.replace(/OverlayManager\.LOGO_SVG=\[[\s\S]*?\]\.join\(""\)/, 'OverlayManager.LOGO_SVG=window.SHLOK_LOGO_SVG');
game = game.replace(/EndingCredits\.INTRO_LOGO_SVG=\[[\s\S]*?\]\.join\(""\)/, 'EndingCredits.INTRO_LOGO_SVG=window.SHLOK_LOGO_SVG');
// The former studio end card is not part of the portfolio. Keep the empty script type
// registered so the export's script registry remains compatible.
game = game.replace(/var EndingCredits=pc\.createScript\("endingCredits"\);[\s\S]*?(?=var \w+=pc\.createScript\("imgcarflare"\))/, 'var EndingCredits=pc.createScript("endingCredits");');
loading = loading.replace(/logo\.innerHTML = \[[\s\S]*?\]\.join\(''\);/, 'logo.innerHTML = window.SHLOK_LOGO_SVG;');
loading = loading.replace(/title\.textContent = '[^']*';/, 'title.textContent = window.PORTFOLIO_CONTENT.intro.title;');
loading = loading.replace(/subtitle\.textContent = '[^']*';/, 'subtitle.textContent = window.PORTFOLIO_CONTENT.intro.subtitle;');
loading = loading.replaceAll('INITIATE SYSTEM', content.intro.button);
game = game.replaceAll('EDOLUS', 'SHLOK').replaceAll('Edolus', 'Shlok').replaceAll('edolus', 'shlok');
const managers = byName('Managers');
attrs(managers, 'overlayManager').animateO = false;
const scroll = attrs(managers, 'scrollManager');
scroll.snapPoints = [0.06, 0.215, 0.315, 0.395, 0.435, 0.475, 0.515, 0.545, 0.635, 0.75, 1];
scroll.stretchBands = scroll.stretchBands.filter(b => b.name !== 'Chip quantum');
scroll.stretchBands.push({ name: 'Room screen archive', start: 0.385, end: 0.55, factor: 3 });
scroll.stretchBands.push({ name: 'Circular departure', start: 0.704, end: 0.726, factor: 2 });
for (const entity of withScript('textSatellite')) Object.assign(attrs(entity, 'textSatellite'), { text: content.intro.orbitalTitle.replaceAll('\n', '\\n'), subtitle: content.intro.orbitalSubtitle });
for (const entity of withScript('sceneText')) disableScript(entity, 'sceneText');
for (const entity of withScript('diamondLabel')) Object.assign(attrs(entity, 'diamondLabel'), { titleText: 'SHLOK\\nPAREKH', bodyText: content.intro.about, bodyUppercase: false, bodyMaxWidth: 365, bodyMaxWidthMobile: 275, bodyFontSize: 15, titleSize: 58 });
for (const entity of withScript('mapHud')) Object.assign(attrs(entity, 'mapHud'), { endProgress: 0.268, bgOpacity: 0.08, lineColor: [1, 1, 1] });
for (const entity of withScript('textdatacenter')) Object.assign(attrs(entity, 'textdatacenter'), { titleText: '// COMPUTE_CORE', bodyText: 'Learning, backed by practice. Explore my credentials in cybersecurity, threat operations, AI, and quantum error correction. Scroll to open the archive.', endProgress: 0.38 });
Object.assign(attrs(byName('TitleRack'), 'worldText'), { text: 'FOUNDATIONS', subtitle: 'Curiosity. Practice. Progress.', titleSize: 0.20 });
Object.assign(attrs(byName('Racktxt'), 'hudText'), { text: 'Cybersecurity & Threat Operations\\nArtificial Intelligence\\nQuantum Error Correction\\nScroll to explore my certifications' });
// The original extraction, dissolve, nebula, data streams and electrical transition
// remain enabled. Only obsolete product specifications are replaced by credentials.
for (const name of ['TitleChip', 'Chiptxt', 'AutonomousDeployment']) { const e = byName(name); if (e) e.enabled = false; }
for (const entity of withScript('satelliteLabel')) disableScript(entity, 'satelliteLabel');
for (const name of ['AICHIP-anchor']) { for (const e of entries.filter(x => x.name === name)) e.enabled = false; }
const endingRoot = byName('sceneEnding');
for (const id of endingRoot.children) scene.entities[id].enabled = false;
for (const entity of withScript('endingCredits')) disableScript(entity, 'endingCredits');
for (const entity of withScript('textCenterFade')) Object.assign(attrs(entity, 'textCenterFade'), { msg1Text: 'From an idea\\nto something you can use.', msg2Text: 'Exploring. Learning. Building what comes next.' });
for (const entity of withScript('intelligenceLayer')) Object.assign(attrs(entity, 'intelligenceLayer'), { text1: 'MY', text2: 'CERTIFICATES' });
// Keep transition effects, not the old hardware scenes. Children stay disabled
// even when SceneManager activates their parent interval during warmup or scrolling.
for (const name of ['sceneDatacenter', 'sceneCar']) for (const id of byName(name).children) scene.entities[id].enabled = false;
for (const name of ['chipDots', 'matrix']) for (const entity of withScript(name)) {
  if (entity.parent === byName('sceneChip').resource_id) entity.enabled = false;
}
// Update residual authored product labels, not just the page/overlay brand.
function brandStrings(value) {
  if (typeof value === 'string') return value.replace(/edolus/gi, 'SHLOK').replaceAll('EDL-72', 'SHLOK-01').replaceAll('NVX-72', 'SKILL-LAB');
  if (Array.isArray(value)) return value.map(brandStrings);
  if (value && typeof value === 'object') for (const key of Object.keys(value)) value[key] = brandStrings(value[key]);
  return value;
}
brandStrings(scene);

// Keep the original number, spacing and animation of the server pods.
function cloneBranch(oldId, parentId) {
  const copy = structuredClone(scene.entities[oldId]);
  const id = randomUUID();
  copy.resource_id = id;
  copy.parent = parentId;
  copy.children = [];
  delete copy.template_id;
  delete copy.template_ent_ids;
  scene.entities[id] = copy;
  for (const child of scene.entities[oldId].children || []) copy.children.push(cloneBranch(child, id));
  return id;
}
// Subtle physical finish, not a replacement car model or altered cabin geometry.
for (const id of [297270870, 298949855]) Object.assign(config.assets[id].data, { clearCoat: 0.48, clearCoatGloss: 0.12, metalness: 0.72, specularityFactor: 0.5, enableGGXSpecular: true });
for (const id of [294120188, 298216506]) if (config.assets[id]) config.assets[id].data.diffuse = [0.32, 0.40, 0.49];
for (const entity of withScript('datalightDiamond')) Object.assign(attrs(entity, 'datalightDiamond'), { glowColorA: [0.3, 0.75, 1], glowColorB: [0.8, 0.64, 1] });

const asset = (id, name, type, url, data = {}) => {
  config.assets[id] = { name, type, id, preload: true, tags: [], data, file: { url: url.replace(/^\//, ''), filename: path.basename(url) } };
};
const textureTemplate = structuredClone(Object.values(config.assets).find(a => a.type === 'texture' && a.name === 'card1-2.webp')?.data || { minfilter: 5, magfilter: 1, addressu: 1, addressv: 1, mipmaps: true });
content.projects.forEach((item, i) => asset(901000 + i, item.id, 'texture', item.image, textureTemplate));
content.certificates.forEach((item, i) => asset(902000 + i, item.id, 'texture', item.image, textureTemplate));
const group = byName('cardsgroup');
// Remove the generic leading card and all surplus cards; keep the original shader/hover design.
byName('card0').enabled = false;
const originalCards = [...group.children];
group.children = [];
content.certificates.forEach((cert, i) => {
  const id = originalCards[i] || cloneBranch(originalCards[0], group.resource_id);
  const card = scene.entities[id];
  card.name = `shlok-certificate-${i}`;
  card.enabled = true;
  group.children.push(id);
  Object.assign(attrs(card, 'CardDesign'), {
    title: '', subtitle: '', bullet1: '',
    bullet2: '', bullet3: '', image: 902000 + i,
    imageScale: 1, imageWidthFrac: 1, imageMarginPx: 0, marginPx: 0,
    titlePx: 38, bulletPx: 14, bulletsGapPx: 65, fillColor: [0.045, 0.072, 0.083],
    fillOpacity: 0.8, borderColor: [0.55, 0.83, 0.8], borderOpacity: 0.38,
    hoverGlowColor: [0.4, 0.9, 0.83], cornerRadius: 0.035,
  });
});
// The PlayCanvas scene parser expects exactly one root. Leaving the surplus
// card parentless makes it replace the real root and silently renders black.
for (const id of originalCards.slice(content.certificates.length)) delete scene.entities[id];
Object.assign(attrs(group, 'cardSystem'), { cardCount: content.certificates.length, widthFracDesktop: 0.44, desktopMaxCss: 740, cardAspect: 1.65 });
Object.assign(attrs(group, 'UIXscrollmove'), { startPitches: 0, startProgress: 0.59, endProgress: 0.705 });
// Removed cover fit override so certificates are not cut out.

asset(900000, 'SHLOK portfolio interactions', 'script', 'portfolio.js', { scripts: { shlokPortfolio: { attributes: {} } } });
config.application_properties.scripts.push(900000);
managers.components.script.order.push('shlokPortfolio');
managers.components.script.scripts.shlokPortfolio = { enabled: true, attributes: {} };
settings = settings.replace(/window\.SCRIPTS = \[([^\]]+)\];/, (_, ids) => `window.SCRIPTS = [${ids}, 900000];`);

for (const dir of ['projects', 'ending', 'contact', 'certificates', 'music']) await mkdir(path.join(pub, 'portfolio', dir), { recursive: true });
for (const project of content.projects) await copyFile(path.join(root, '../projects', path.basename(project.image)), path.join(pub, project.image));
for (const cert of content.certificates) {
  try { await copyFile(path.join(root, '../certificates', path.basename(cert.image)), path.join(pub, cert.image)); } catch(e) {}
}
for (const song of content.songs) {
  try { await copyFile(path.join(root, '../songs', path.basename(song.src)), path.join(pub, song.src)); } catch(e) { console.error(e) }
}
try { for (const video of content.ending.videos) await copyFile(path.join(root, '../../', path.basename(video)), path.join(pub, video)); } catch(e) {}
try { await copyFile(path.join(root, '../../Interstellar Main Theme - Hans Zimmer (1).mp3'), path.join(pub, content.ending.soundtrack)); } catch(e) {}
try { await copyFile(path.join(root, '../WhatsApp Image 2026-09-20 at 23.32.42 (1).jpeg'), path.join(pub, content.ending.photo)); } catch(e) {}
if (await exists(path.join(root, '../resume.pdf'))) await copyFile(path.join(root, '../resume.pdf'), path.join(pub, 'resume.pdf'));
loading = loading.replace('container.appendChild(wrapper);', 'container.appendChild(wrapper);\n        if (window.createPortfolioWarp) window.createPortfolioWarp(wrapper);');
const uiCameraId = byName('UICamera ').resource_id;
const uiCamera = scene.entities[uiCameraId];
if (uiCamera && uiCamera.components.camera) {
  uiCamera.components.camera.clearColorBuffer = false;
  uiCamera.components.camera.priority = 1;
  if (uiCamera.components.script && uiCamera.components.script.scripts && uiCamera.components.script.scripts.screenRenderTarget) {
    delete uiCamera.components.script.scripts.screenRenderTarget;
    uiCamera.components.script.order = uiCamera.components.script.order.filter(s => s !== 'screenRenderTarget');
    if (uiCamera.components.script.order.length === 0) delete uiCamera.components.script;
  }
}
await writeFile(path.join(pub, '2509662.json'), JSON.stringify(scene));

await writeFile(path.join(pub, 'config.json'), JSON.stringify(config));
await writeFile(path.join(pub, '__game-scripts.js'), game);
loading = loading.replaceAll('edolusReplay', 'shlokReplay').replaceAll('Edolus', 'Shlok');
settings = settings.replaceAll('edolus', 'shlok').replaceAll('Edolus', 'Shlok');
await writeFile(path.join(pub, '__loading__.js'), loading);
await writeFile(path.join(pub, '__settings__.js'), settings);
console.log('SHLOK: room replaces servers; PC credentials; full-bleed projects; direct travel/contact ending.');

