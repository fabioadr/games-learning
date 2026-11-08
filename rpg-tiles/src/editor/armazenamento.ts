// Ensina: persistir edições SEM tocar nos dados originais. O jogo guarda só a diferença
// (o mapa editado) no localStorage e a reaplica por cima dos mapas do código ao abrir.
//
// Cada edição leva junto uma "base": o mapa original como estava quando foi editado.
// Se alguém mudar o mapa em dados/mapas.ts depois, a base não bate mais e a edição velha
// é descartada, em vez de esmagar a mudança nova sem aviso.

import { MAPAS } from '../dados/mapas';
import { TILES } from '../dados/tiles';

const CHAVE = 'rpg-tiles:mapas-editados:v1';

interface Edicao { base: string; linhas: string[] }

const ORIGINAIS: Record<string, string[]> = {};

function ler(): Record<string, Edicao> {
  try { return JSON.parse(localStorage.getItem(CHAVE) ?? '{}'); } catch { return {}; }
}

function gravar(tudo: Record<string, Edicao>) {
  // localStorage pode estar bloqueado (aba privada, preview): o editor funciona igual, só não persiste.
  try { localStorage.setItem(CHAVE, JSON.stringify(tudo)); } catch { /* sem persistência */ }
}

/** Mesma forma do original (nº de linhas e colunas) e só tiles que existem na legenda. */
function valida(linhas: unknown, original: string[]): linhas is string[] {
  return Array.isArray(linhas)
    && linhas.length === original.length
    && linhas.every((l, i) => typeof l === 'string' && l.length === original[i].length
      && [...l].every((c) => c in TILES));
}

/** Chame UMA vez, antes de criar o Jogo: guarda os originais e reaplica as edições salvas. */
export function carregarEdicoes() {
  for (const [id, mapa] of Object.entries(MAPAS)) ORIGINAIS[id] = [...mapa.linhas];
  const tudo = ler();
  for (const [id, ed] of Object.entries(tudo)) {
    const original = ORIGINAIS[id];
    if (original && ed.base === original.join('\n') && valida(ed.linhas, original)) {
      MAPAS[id].linhas = [...ed.linhas];
    }
  }
}

export function linhasOriginais(id: string): string[] {
  return [...ORIGINAIS[id]];
}

export function foiEditado(id: string): boolean {
  return MAPAS[id].linhas.join('\n') !== ORIGINAIS[id].join('\n');
}

/** Grava (ou apaga, se voltou a ser igual ao original) a edição de um mapa. */
export function salvarEdicao(id: string) {
  const tudo = ler();
  if (foiEditado(id)) tudo[id] = { base: ORIGINAIS[id].join('\n'), linhas: [...MAPAS[id].linhas] };
  else delete tudo[id];
  gravar(tudo);
}
