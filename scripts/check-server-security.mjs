import assert from 'node:assert/strict';
import {createServer} from './server.mjs';

const server=createServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
try {
 for(const resource of ['/', '/portfolio.js', '/2509662.json']) {
  const response=await fetch(base+resource);
  assert.equal(response.status,200,resource);
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.equal(response.headers.get('x-frame-options'),'DENY');
  await response.arrayBuffer();
 }
 for(const resource of ['/.env','/.git/config','/asset.blend','/backup.zip','/portfolio.js.map','/file.txt','/a%5cb.js','/portfolio.js%3asecret']) {
  const response=await fetch(base+resource);
  assert.equal(response.status,403,resource);
  await response.arrayBuffer();
 }
 const range=await fetch(base+'/portfolio.js',{headers:{Range:'bytes=0-15'}});
 assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,16);
 const post=await fetch(base+'/',{method:'POST'});
 assert.equal(post.status,405);await post.arrayBuffer();
 console.log('Server checks passed: assets, security headers, private paths, ranges and methods.');
} finally {
 server.closeAllConnections();
 await new Promise(resolve=>server.close(resolve));
}
