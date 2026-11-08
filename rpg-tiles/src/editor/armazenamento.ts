// Ensina: persistir edições SEM tocar nos dados originais. O jogo guarda só os mapas que
// mudaram (inteiros: tiles, objetos e tamanho) no localStorage e os reaplica por cima de
// MAPAS ao abrir. Mapas criados no editor também moram aqui.
//
// Cada edição leva junto uma "base": o mapa original (em JSON) como estava quando foi editado.
// Se alguém mudar o mapa em dados/mapas.ts depois, a base não bate mais e a edição velha
// é descartada, em vez de esmagar a mudança nova sem aviso.

import { MAPAS } from '../dados/mapas';
import { TILES } from '../dados/tiles';
import type { MapaDef } from '../tipos';

const CHAVE = 'rpg-tiles:mapas-editados:v2';
const CHAVE_V1 = 'rpg-tiles:mapas-editados:v1';   // versão antiga: só guardava as linhas

/** base = JSON do original; null = mapa criado no editor (não existe no código). */
interface Salvo { base: string | null; def: MapaDef }

const ORIGINAIS: Record<string, string> = {};

function ler(chave: string): Record<string, any> {
  try { return JSON.parse(localStorage.getItem(chave) ?? '{}') ?? {}; } catch { return {}; }
}

/** Grade retangular, só tiles conhecidos, e as listas de objetos presentes. */
export function linhasValidas(linhas: unknown): linhas is string[] {
  return Array.isArray(linhas) && linhas.length > 0
    && linhas.every((l) => typeof l === 'string' && l.length > 0 && l.length === linhas[0].length
      && [...l].every((c) => c in TILES));
}

function mapaValido(def: any): def is MapaDef {
  return def && typeof def.id === 'string' && typeof def.nome === 'string' && linhasValidas(def.linhas)
    && ['portais', 'npcs', 'baus', 'placas'].every((k) => Array.isArray(def[k]));
}

/** Chame UMA vez, antes de criar o Jogo: guarda os originais e reaplica as edições salvas. */
export function carregarEdicoes() {
  for (const [id, mapa] of Object.entries(MAPAS)) ORIGINAIS[id] = JSON.stringify(mapa);

  const salvos = ler(CHAVE) as Record<string, Salvo>;
  for (const [id, s] of Object.entries(salvos)) {
    if (!mapaValido(s?.def) || s.def.id !== id) continue;
    if (s.base === null && !(id in MAPAS)) MAPAS[id] = s.def;
    else if (s.base !== null && ORIGINAIS[id] === s.base) Object.assign(MAPAS[id], s.def);
  }

  // Migração da v1 (só linhas): aproveita se a v2 ainda não tem nada para o mapa.
  for (const [id, ed] of Object.entries(ler(CHAVE_V1))) {
    const original = ORIGINAIS[id] && (JSON.parse(ORIGINAIS[id]) as MapaDef);
    if (!original || id in salvos || ed?.base !== original.linhas.join('\n')) continue;
    if (linhasValidas(ed.linhas) && ed.linhas.length === original.linhas.length
      && ed.linhas[0].length === original.linhas[0].length) MAPAS[id].linhas = ed.linhas;
  }
}

/** O mapa existe em dados/mapas.ts (e não só no navegador)? */
export function ehOriginal(id: string): boolean {
  return id in ORIGINAIS;
}

export function foiEditado(id: string): boolean {
  return !ehOriginal(id) || JSON.stringify(MAPAS[id]) !== ORIGINAIS[id];
}

/** Volta o mapa ao que está no código. Object.assign mantém o MESMO objeto (o Mundo aponta para ele). */
export function restaurarOriginal(id: string) {
  Object.assign(MAPAS[id], JSON.parse(ORIGINAIS[id]));
}

/** Grava todos os mapas que diferem do código. Chamado depois de cada edição. */
export function salvarTudo() {
  const tudo: Record<string, Salvo> = {};
  for (const id of Object.keys(MAPAS)) {
    if (foiEditado(id)) tudo[id] = { base: ORIGINAIS[id] ?? null, def: MAPAS[id] };
  }
  // localStorage pode estar bloqueado (aba privada, preview): o editor funciona igual, só não persiste.
  try {
    localStorage.setItem(CHAVE, JSON.stringify(tudo));
    localStorage.removeItem(CHAVE_V1);
  } catch { /* sem persistência */ }
}
