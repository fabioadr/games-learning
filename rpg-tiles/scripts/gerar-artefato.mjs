// Gera o build do jogo como UM ÚNICO arquivo HTML, pronto para publicar como Artefato Claude.
// Uso: npm run artefato   (roda o build do Vite e depois este script)
//
// O Artefato não aceita arquivos JS externos do mesmo site, então o JavaScript do build
// é embutido numa tag <script type="module"> e os wrappers <html>/<head>/<body> são
// removidos (a plataforma coloca o seu próprio esqueleto na hora de publicar).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(raiz, 'dist');
const saida = join(raiz, 'artefato', 'vila-de-pedravento.html');

let html = readFileSync(join(dist, 'index.html'), 'utf8');

const tag = html.match(/<script type="module"[^>]*src="\/?(assets\/[^"]+\.js)"[^>]*><\/script>\s*/);
if (!tag) throw new Error('Não achei o <script> do bundle em dist/index.html. Rodou "npm run build"?');
const js = readFileSync(join(dist, tag[1]), 'utf8');

html = html
  .replace(tag[0], '')
  .replace(/<!doctype html>\s*|<\/?html[^>]*>\s*|<\/?head>\s*|<\/?body>\s*/gi, '')
  .replace(/<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*/gi, '');

html += `<script type="module">\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>\n`;

mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, html);
console.log(`Artefato gerado: ${saida} (${(html.length / 1024).toFixed(1)} KB)`);
