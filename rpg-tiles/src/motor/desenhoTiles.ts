// Ensina: como cada tile APARECE. Separado do render.ts para que o jogo e o editor de mapas
// usem exatamente o mesmo desenho (um só lugar para mudar, impossível os dois divergirem).
// Num jogo real os tiles viriam recortados de uma imagem (tileset):
//   ctx.drawImage(tileset, sx, sy, 16, 16, px, py, 16, 16)
// Aqui desenhamos com retângulos para o projeto não depender de arquivos de imagem.

import { TILE } from '../config';
import { TILES } from '../dados/tiles';

/** Ruído determinístico por posição: a grama tem "manchinhas" sempre no mesmo lugar. */
function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function ret(ctx: CanvasRenderingContext2D, cor: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = cor;
  ctx.fillRect(x, y, w, h);
}

// ------------------------------------------------------------------- tiles
export function desenharTile(ctx: CanvasRenderingContext2D, ch: string, tx: number, ty: number, x: number, y: number, tempo: number) {
  const nome = TILES[ch]?.nome ?? 'vazio';
  const r = hash(tx, ty);

  const grama = () => {
    ret(ctx, '#5fa843', x, y, TILE, TILE);
    ret(ctx, '#4e9437', x + Math.floor(r * 12), y + Math.floor(hash(ty, tx) * 12), 2, 2);
    ret(ctx, '#72bd52', x + Math.floor(hash(tx + 7, ty) * 12), y + Math.floor(hash(tx, ty + 3) * 12), 2, 1);
  };

  switch (nome) {
    case 'grama': grama(); break;
    case 'flor':
      grama();
      ret(ctx, r > 0.5 ? '#f2e35c' : '#f27ca8', x + 4, y + 5, 2, 2);
      ret(ctx, '#ffffff', x + 10, y + 9, 2, 2);
      break;
    case 'caminho':
      ret(ctx, '#d6b77a', x, y, TILE, TILE);
      ret(ctx, '#c4a466', x + Math.floor(r * 13), y + Math.floor(hash(ty, tx) * 13), 3, 2);
      break;
    case 'arvore':
      grama();
      ret(ctx, '#6b4423', x + 6, y + 10, 4, 6);
      ctx.fillStyle = '#2f6e2a';
      ctx.beginPath(); ctx.arc(x + 8, y + 7, 7, 0, Math.PI * 2); ctx.fill();
      ret(ctx, '#3f8a35', x + 4, y + 3, 4, 3);
      break;
    case 'agua': {
      ret(ctx, '#2f6fc4', x, y, TILE, TILE);
      const onda = Math.floor((tempo * 4 + tx * 2 + ty) % 16);
      ret(ctx, '#5b95de', x + onda % 12, y + 4, 4, 1);
      ret(ctx, '#5b95de', x + (onda + 7) % 12, y + 11, 4, 1);
      break;
    }
    case 'telhado':
      ret(ctx, '#a83a32', x, y, TILE, TILE);
      for (let i = 0; i < TILE; i += 4) ret(ctx, '#8a2a24', x, y + i + 3, TILE, 1);
      break;
    case 'parede':
      ret(ctx, '#c9b79c', x, y, TILE, TILE);
      ret(ctx, '#a8977c', x, y + 7, TILE, 1);
      ret(ctx, '#a8977c', x + (ty % 2 ? 4 : 11), y, 1, 7);
      ret(ctx, '#a8977c', x + (ty % 2 ? 11 : 4), y + 8, 1, 8);
      break;
    case 'porta':
      ret(ctx, '#c9b79c', x, y, TILE, TILE);
      ret(ctx, '#5a3a1e', x + 3, y + 2, 10, 14);
      ret(ctx, '#e8c547', x + 10, y + 9, 2, 2);
      break;
    case 'placa':
      grama();
      ret(ctx, '#6b4423', x + 7, y + 8, 2, 8);
      ret(ctx, '#a8763e', x + 2, y + 3, 12, 7);
      ret(ctx, '#7a5228', x + 4, y + 5, 8, 1);
      ret(ctx, '#7a5228', x + 4, y + 7, 6, 1);
      break;
    case 'piso':
      ret(ctx, '#b58a5a', x, y, TILE, TILE);
      ret(ctx, '#9c7448', x, y + 7, TILE, 1);
      ret(ctx, '#9c7448', x, y + 15, TILE, 1);
      ret(ctx, '#9c7448', x + (tx % 2 ? 5 : 12), y, 1, 7);
      break;
    case 'tapete':
      ret(ctx, '#8a2f4a', x, y, TILE, TILE);
      ret(ctx, '#c9a23f', x + 2, y + 2, 12, 1);
      ret(ctx, '#c9a23f', x + 2, y + 13, 12, 1);
      break;
    case 'muro':
      ret(ctx, '#4a3b2e', x, y, TILE, TILE);
      ret(ctx, '#3a2d22', x, y + 12, TILE, 4);
      break;
    case 'mesa':
      ret(ctx, '#b58a5a', x, y, TILE, TILE);
      ret(ctx, '#7a5228', x + 1, y + 1, 14, 14);
      ret(ctx, '#8f6334', x + 2, y + 2, 12, 2);
      break;
    case 'cama':
      ret(ctx, '#b58a5a', x, y, TILE, TILE);
      ret(ctx, '#6b4423', x + 1, y + 1, 14, 15);
      ret(ctx, '#3e6fb0', x + 2, y + 6, 12, 9);
      ret(ctx, '#f0f0f0', x + 3, y + 2, 10, 4);
      break;
    case 'prateleira':
      ret(ctx, '#b58a5a', x, y, TILE, TILE);
      ret(ctx, '#6b4423', x, y + 1, TILE, 14);
      ret(ctx, '#4a2f17', x + 1, y + 2, 14, 5);   // vão da prateleira de cima
      ret(ctx, '#4a2f17', x + 1, y + 9, 14, 5);   // vão da prateleira de baixo
      ret(ctx, '#c23b3b', x + 3, y + 4, 2, 3);    // frascos (cor varia por tile para não repetir)
      ret(ctx, tx % 2 ? '#3e8fd1' : '#e8c547', x + 8, y + 3, 2, 4);
      ret(ctx, '#5fa843', x + 11, y + 11, 2, 3);
      ret(ctx, tx % 2 ? '#e8c547' : '#c23b3b', x + 4, y + 10, 3, 4);
      break;
    case 'saida':
      ret(ctx, '#b58a5a', x, y, TILE, TILE);
      ret(ctx, '#3a2d22', x + 2, y + 10, 12, 6);
      break;
    default:
      ret(ctx, '#000', x, y, TILE, TILE);
  }
}
