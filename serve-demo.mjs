import http from 'node:http';
import fs from 'node:fs';
const page = fs.readFileSync(new URL('./chime-in-demo.html', import.meta.url));
const server = http.createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (!['/', '/chime-in', '/chime-in/', '/index.html'].includes(path)) {
    response.writeHead(404); response.end('Not found'); return;
  }
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
  }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': page.length, 'Cache-Control': 'no-cache' });
  response.end(request.method === 'HEAD' ? undefined : page);
});
server.listen(8043, '127.0.0.1', () => console.log('Chime In demo: http://127.0.0.1:8043'));
