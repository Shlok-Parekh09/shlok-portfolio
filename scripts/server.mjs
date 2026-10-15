/**
 * Simple static file server for local development.
 * Serves the `public/` directory on http://127.0.0.1:3000
 * Usage: node scripts/server.mjs [--port <number>]
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', 'public');

// Parse --port flag
const portArgIndex = process.argv.indexOf('--port');
const PORT = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.mp4':  'video/mp4',
  '.mp3':  'audio/mpeg',
  '.ogg':  'audio/ogg',
  '.wav':  'audio/wav',
  '.glb':  'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin':  'application/octet-stream',
  '.drc':  'application/octet-stream',
};

export function createServer() {
  return http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405); return res.end('Method Not Allowed');
    }

    if (req.url.includes('%00') || req.url.includes('\0')) {
      res.writeHead(400); return res.end('Bad Request');
    }

    let urlPath = req.url.split('?')[0];
    try { urlPath = decodeURIComponent(urlPath); } catch (_) {}
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

    const filePath = path.join(ROOT, urlPath);
    const extCheck = path.extname(urlPath).toLowerCase();

    // Block path traversal and restricted paths/extensions
    if (!filePath.startsWith(ROOT) || urlPath.includes('/.') || urlPath.includes('\\') || urlPath.includes(':') || (extCheck !== '' && !MIME[extCheck])) {
      res.writeHead(403); return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        const index = path.join(ROOT, 'index.html');
        fs.readFile(index, (err2, data) => {
          if (err2) { res.writeHead(404); return res.end('Not found'); }
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp',
            'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY'
          });
          res.end(data);
        });
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME[ext] || 'application/octet-stream';
      const range = req.headers.range;

      const headers = {
        'Content-Type': contentType,
        'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp',
        'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY'
      };

      if (range) {
        try {
          const parts = range.replace(/bytes=/, '').split('-');
          let start = parseInt(parts[0], 10);
          let end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

          if (isNaN(start) && !isNaN(end)) { start = stat.size - end; end = stat.size - 1; }
          else if (isNaN(end)) { end = stat.size - 1; }

          if (isNaN(start) || isNaN(end) || start >= stat.size || end >= stat.size || start < 0 || start > end) {
              res.writeHead(416, {'Content-Range': `bytes */${stat.size}`}); return res.end();
          }

          headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
          headers['Accept-Ranges'] = 'bytes';
          headers['Content-Length'] = end - start + 1;
          res.writeHead(206, headers);
          fs.createReadStream(filePath, {start, end}).pipe(res);
        } catch (error) {
          res.writeHead(400); return res.end('Bad Request');
        }
      } else {
        headers['Content-Length'] = stat.size;
        res.writeHead(200, headers);
        fs.createReadStream(filePath).pipe(res);
      }
    });
  });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const server = createServer();
  server.listen(PORT, '127.0.0.1', () => console.log(`\n  🚀  Portfolio running at http://127.0.0.1:${PORT}/\n`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') console.error(`\n  ❌  Port ${PORT} is already in use. Try: npm run dev -- --port 3001\n`);
    else console.error(err);
    process.exit(1);
  });
}
