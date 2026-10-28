import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const port = Number(process.env.MARKETGO_E2E_PORT ?? 4173);
const root = resolve(process.env.MARKETGO_WEB_DIR ?? 'dist-e2e');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
createServer(async (request, response) => {
  try {
    const path = resolve(
      root,
      `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`,
    );
    if (path !== root && !path.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    let file = path;
    try {
      if (!(await stat(file)).isFile()) file = resolve(root, 'index.html');
    } catch {
      file = resolve(root, 'index.html');
    }
    response.writeHead(200, {
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(500).end('Falha ao servir a exportação web.');
  }
}).listen(port, '127.0.0.1', () => console.log(`MarketGo: http://127.0.0.1:${port}`));
