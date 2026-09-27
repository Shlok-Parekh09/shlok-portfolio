import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const resumeSource = path.resolve(root, '../../resume.pdf');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css; charset=utf-8', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.basis': 'application/octet-stream', '.mp4': 'video/mp4', '.ogg': 'audio/ogg', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.pdf': 'application/pdf', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

export function parseRange(header, length) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, length - Number(match[2]));
  const end = match[1] ? Math.min(match[2] ? Number(match[2]) : length - 1, length - 1) : length - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= length) return null;
  return { start, end };
}

export function createServer() {
  return http.createServer(async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
    try {
      const url = new URL(req.url, 'http://localhost');
      const decoded = decodeURIComponent(url.pathname);
      if (decoded === '/portfolio-status.json') {
        const available = await stat(resumeSource).then(s => s.isFile(), () => false);
        const deployed = await stat(path.join(root, 'resume.pdf')).then(s => s.isFile(), () => false);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ resume: available || deployed })); return;
      }
      let target = path.resolve(root, '.' + (decoded === '/' ? '/index.html' : decoded));
      if (!target.startsWith(root + path.sep) || decoded.includes('\0')) { res.writeHead(403); res.end(); return; }
      // Serve only this explicit user-requested parent file, never the folder.
      if (decoded === '/resume.pdf' && await stat(resumeSource).then(s => s.isFile(), () => false)) target = resumeSource;
      const info = await stat(target);
      types['.mp3'] = 'audio/mpeg';
      if (!info.isFile()) throw Object.assign(new Error('Not a file'), { code: 'ENOENT' });
      const headers = { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' };
      let range;
      if (req.headers.range) {
        range = parseRange(req.headers.range, info.size);
        if (!range) { res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); res.end(); return; }
        headers['Content-Range'] = `bytes ${range.start}-${range.end}/${info.size}`;
      }
      headers['Content-Length'] = range ? range.end - range.start + 1 : info.size;
      res.writeHead(range ? 206 : 200, headers);
      if (req.method === 'HEAD') { res.end(); return; }
      const stream = createReadStream(target, range);
      stream.on('error', () => res.destroy());
      res.on('close', () => stream.destroy());
      stream.pipe(res);
    } catch (error) {
      const status = error instanceof URIError ? 400 : error.code === 'ENOENT' ? 404 : 500;
      console.error(`${status} ${req.url}`);
      res.writeHead(status, { 'Content-Type': 'text/plain' });
      res.end(status === 404 ? 'Not found' : 'Unable to serve asset');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf('--port');
  const port = Number(index >= 0 ? process.argv[index + 1] : process.env.PORT || 3000);
  const server = createServer();
  server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`SHLOK portfolio: http://127.0.0.1:${port}/`));
}
