// Ensina: as operações do editor como funções puras sobre um MapaDef (sem tela, sem eventos).
// - balde: flood fill com uma pilha de vizinhos;
// - redimensionar: por que coordenadas de objetos DEPENDEM da origem da grade. Somar uma
//   linha em cima empurra tudo uma linha para baixo, inclusive os portais de OUTROS mapas
//   que apontam para cá.

import { MAPAS } from '../dados/mapas';
import { TILES } from '../dados/tiles';
import type { Dir, MapaDef } from '../tipos';

export const largura = (m: MapaDef) => m.linhas[0].length;
export const altura = (m: MapaDef) => m.linhas.length;
export const dentro = (m: MapaDef, x: number, y: number) => x >= 0 && y >= 0 && x < largura(m) && y < altura(m);

export function poeTile(m: MapaDef, x: number, y: number, ch: string) {
  if (!dentro(m, x, y)) return;
  const l = m.linhas[y];
  m.linhas[y] = l.slice(0, x) + ch + l.slice(x + 1);   // strings são imutáveis: remonta a linha
}

/** Balde: troca toda a região contígua (4 direções) que tem o mesmo tile do ponto clicado. */
export function balde(m: MapaDef, x: number, y: number, ch: string) {
  const alvo = m.linhas[y]?.[x];
  if (alvo === undefined || alvo === ch) return;
  const pilha = [[x, y]];
  while (pilha.length) {
    const [cx, cy] = pilha.pop()!;
    if (m.linhas[cy]?.[cx] !== alvo) continue;
    poeTile(m, cx, cy, ch);
    pilha.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
}

export function retangulo(m: MapaDef, x0: number, y0: number, x1: number, y1: number, ch: string) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) poeTile(m, x, y, ch);
  }
}

export const TAMANHO_MIN = 3;
export const TAMANHO_MAX = 64;

/**
 * Soma (+1) ou tira (-1) uma linha/coluna na borda indicada. Devolve o deslocamento aplicado
 * aos objetos (dx, dy) e quantos objetos caíram fora e foram removidos.
 */
export function redimensionar(m: MapaDef, borda: Dir, delta: 1 | -1, preencher: string) {
  const vertical = borda === 'cima' || borda === 'baixo';
  const tam = vertical ? altura(m) : largura(m);
  if (tam + delta < TAMANHO_MIN || tam + delta > TAMANHO_MAX) return null;

  const faixa = preencher.repeat(largura(m));
  switch (borda) {
    case 'cima':     if (delta > 0) m.linhas.unshift(faixa); else m.linhas.shift(); break;
    case 'baixo':    if (delta > 0) m.linhas.push(faixa); else m.linhas.pop(); break;
    case 'esquerda': m.linhas = m.linhas.map((l) => (delta > 0 ? preencher + l : l.slice(1))); break;
    case 'direita':  m.linhas = m.linhas.map((l) => (delta > 0 ? l + preencher : l.slice(0, -1))); break;
  }

  // Só crescer/encolher em cima ou à esquerda muda a ORIGEM (0,0) da grade.
  const dx = borda === 'esquerda' ? delta : 0;
  const dy = borda === 'cima' ? delta : 0;
  let removidos = 0;
  for (const chave of ['npcs', 'baus', 'placas', 'portais'] as const) {
    const lista = m[chave] as { x: number; y: number }[];
    for (const o of lista) { o.x += dx; o.y += dy; }
    const dentroDoMapa = lista.filter((o) => dentro(m, o.x, o.y));
    removidos += lista.length - dentroDoMapa.length;
    (m as unknown as Record<string, unknown>)[chave] = dentroDoMapa;
  }
  // Portais de qualquer mapa que chegam AQUI também precisam acompanhar a nova origem.
  for (const outro of Object.values(MAPAS)) {
    for (const p of outro.portais) if (p.paraMapa === m.id) { p.paraX += dx; p.paraY += dy; }
  }
  return { dx, dy, removidos };
}

export function novoMapa(id: string, nome: string, w: number, h: number, preencher: string): MapaDef {
  return { id, nome, linhas: Array.from({ length: h }, () => preencher.repeat(w)), portais: [], npcs: [], baus: [], placas: [] };
}

/**
 * Lê linhas coladas: aceita o trecho `linhas: [ '...', ... ]`, um array JSON ou texto puro
 * (uma linha do mapa por linha). Devolve as linhas ou uma mensagem de erro.
 */
export function lerLinhas(texto: string): string[] | string {
  const citadas = [...texto.matchAll(/'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"/g)]
    .map((m) => (m[1] ?? m[2]).replace(/\\(.)/g, '$1'))
    .filter((l) => l !== 'linhas');
  const linhas = citadas.length ? citadas : texto.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!linhas.length) return 'Nenhuma linha encontrada.';
  for (const [y, l] of linhas.entries()) {
    if (l.length !== linhas[0].length) return `A linha ${y} tem ${l.length} tiles, mas a primeira tem ${linhas[0].length}. Todas precisam ter a mesma largura.`;
    const x = [...l].findIndex((c) => !(c in TILES));
    if (x >= 0) return `Caractere desconhecido '${l[x]}' na linha ${y}, coluna ${x}. Veja a legenda em dados/tiles.ts.`;
  }
  if (linhas.length < TAMANHO_MIN || linhas[0].length < TAMANHO_MIN) return `O mapa precisa ter pelo menos ${TAMANHO_MIN}x${TAMANHO_MIN}.`;
  return linhas;
}
