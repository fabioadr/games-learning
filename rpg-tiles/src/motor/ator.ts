import type { Dir } from '../tipos';
import { TILE } from '../config';

// Um "ator" é qualquer coisa que anda pela grade: herói ou NPC.
// Note que é só um objeto de dados + funções soltas que operam nele
// (estilo mais procedural/funcional do que OO). Herói e NPC não herdam
// de nada: o NPC simplesmente TEM um ator dentro dele (composição).

export interface Ator {
  // Posição LÓGICA (em tiles). Durante um passo, já aponta para o destino,
  // assim ninguém mais tenta entrar no mesmo tile.
  x: number; y: number;
  // De onde o passo começou (para animar a transição suave).
  deX: number; deY: number;
  progresso: number;     // 0 → 1 durante o passo
  movendo: boolean;
  olhando: Dir;
  velocidade: number;    // tiles por segundo
  passos: number;        // contador para alternar o pé na animação
}

export const DELTA: Record<Dir, [number, number]> = {
  cima: [0, -1], baixo: [0, 1], esquerda: [-1, 0], direita: [1, 0],
};

export const OPOSTA: Record<Dir, Dir> = {
  cima: 'baixo', baixo: 'cima', esquerda: 'direita', direita: 'esquerda',
};

export function criarAtor(x: number, y: number, olhando: Dir, velocidade: number): Ator {
  return { x, y, deX: x, deY: y, progresso: 1, movendo: false, olhando, velocidade, passos: 0 };
}

/** O tile bem na frente do ator. */
export function frente(a: Ator): [number, number] {
  const [dx, dy] = DELTA[a.olhando];
  return [a.x + dx, a.y + dy];
}

/**
 * Tenta começar um passo. Sempre vira para a direção pedida;
 * só anda se `livre(x, y)` disser que o tile de destino está desocupado.
 */
export function tentarAndar(a: Ator, dir: Dir, livre: (x: number, y: number) => boolean): boolean {
  if (a.movendo) return false;
  a.olhando = dir;
  const [dx, dy] = DELTA[dir];
  const nx = a.x + dx, ny = a.y + dy;
  if (!livre(nx, ny)) return false;
  a.deX = a.x; a.deY = a.y;
  a.x = nx; a.y = ny;
  a.progresso = 0;
  a.movendo = true;
  a.passos++;
  return true;
}

/** Avança a animação do passo. Retorna true no frame em que o passo termina. */
export function atualizarAtor(a: Ator, dt: number): boolean {
  if (!a.movendo) return false;
  a.progresso += dt * a.velocidade;
  if (a.progresso >= 1) {
    a.progresso = 1;
    a.movendo = false;
    return true;
  }
  return false;
}

/** Posição em PIXELS para desenhar: interpola entre o tile de origem e o de destino. */
export function posicaoVisual(a: Ator): { px: number; py: number } {
  const t = a.progresso;
  return {
    px: (a.deX + (a.x - a.deX) * t) * TILE,
    py: (a.deY + (a.y - a.deY) * t) * TILE,
  };
}
