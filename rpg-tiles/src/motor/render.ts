import { ESCALA, TILE, VIEW_H, VIEW_W } from '../config';
import type { Dir } from '../tipos';
import { posicaoVisual, type Ator } from './ator';
import { desenharTile, ret } from './desenhoTiles';
import type { Jogo } from '../jogo/jogo';

// O RENDERIZADOR só LÊ o estado e desenha. Ele nunca altera nada do jogo.
// O desenho de cada tile mora em desenhoTiles.ts, compartilhado com o editor de mapas.

const LARG = VIEW_W * TILE;
const ALT = VIEW_H * TILE;

// ------------------------------------------------------------------- personagens
function desenharPersonagem(
  ctx: CanvasRenderingContext2D, ator: Ator, cx: number, cy: number,
  roupa: string, cabelo: string,
) {
  const { px, py } = posicaoVisual(ator);
  const x = Math.round(px - cx), y = Math.round(py - cy);
  const dir: Dir = ator.olhando;
  // Durante o passo, alterna o pé (frame A/B) e dá um "pulinho" no meio.
  const meioDoPasso = ator.movendo && ator.progresso > 0.25 && ator.progresso < 0.75;
  const pe = ator.passos % 2;
  const pulo = meioDoPasso ? -1 : 0;

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x + 8, y + 15, 5, 2, 0, 0, Math.PI * 2); ctx.fill();

  // pés
  const peE = meioDoPasso && pe === 0 ? -1 : 0;
  const peD = meioDoPasso && pe === 1 ? -1 : 0;
  ret(ctx, '#3a2a1e', x + 4, y + 13 + peE, 3, 2);
  ret(ctx, '#3a2a1e', x + 9, y + 13 + peD, 3, 2);
  // corpo
  ret(ctx, roupa, x + 3, y + 7 + pulo, 10, 7);
  // cabeça
  ret(ctx, '#f1c29a', x + 4, y + 1 + pulo, 8, 7);
  ret(ctx, cabelo, x + 4, y + pulo, 8, 3);
  if (dir === 'cima') ret(ctx, cabelo, x + 4, y + 1 + pulo, 8, 6);
  if (dir === 'esquerda') ret(ctx, cabelo, x + 9, y + 1 + pulo, 3, 5);
  if (dir === 'direita') ret(ctx, cabelo, x + 4, y + 1 + pulo, 3, 5);
  // olhos
  const olho = '#1a1a2e';
  if (dir === 'baixo') { ret(ctx, olho, x + 5, y + 4 + pulo, 2, 2); ret(ctx, olho, x + 9, y + 4 + pulo, 2, 2); }
  if (dir === 'esquerda') ret(ctx, olho, x + 5, y + 4 + pulo, 2, 2);
  if (dir === 'direita') ret(ctx, olho, x + 9, y + 4 + pulo, 2, 2);
}

function desenharBau(ctx: CanvasRenderingContext2D, x: number, y: number, aberto: boolean) {
  ret(ctx, 'rgba(0,0,0,0.25)', x + 2, y + 14, 12, 2);
  ret(ctx, '#7a4a1e', x + 2, y + 6, 12, 9);
  ret(ctx, aberto ? '#2a1a0e' : '#9c6228', x + 2, y + 3, 12, aberto ? 4 : 5);
  ret(ctx, '#e8c547', x + 2, y + 8, 12, 1);
  if (!aberto) ret(ctx, '#e8c547', x + 7, y + 7, 2, 3);
}

// ------------------------------------------------------------------- interface
function caixaFF(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // A janela azul com borda branca, marca registrada dos FF de SNES.
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#3048b8');
  g.addColorStop(1, '#0c1660');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#e8e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
}

function quebrarLinhas(ctx: CanvasRenderingContext2D, texto: string, largura: number): string[] {
  const linhas: string[] = [];
  let atual = '';
  for (const palavra of texto.split(' ')) {
    const teste = atual ? atual + ' ' + palavra : palavra;
    if (ctx.measureText(teste).width > largura && atual) { linhas.push(atual); atual = palavra; }
    else atual = teste;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

// ------------------------------------------------------------------- frame
export function desenhar(ctx: CanvasRenderingContext2D, jogo: Jogo, tempo: number) {
  const { mundo } = jogo;
  ctx.setTransform(ESCALA, 0, 0, ESCALA, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ret(ctx, '#000', 0, 0, LARG, ALT);

  // CÂMERA: centraliza no herói, mas não mostra além das bordas do mapa.
  // Se o mapa é menor que a tela (interiores), ele fica centralizado.
  const mapaW = mundo.largura * TILE, mapaH = mundo.altura * TILE;
  const { px: hx, py: hy } = posicaoVisual(mundo.heroi);
  const cx = mapaW <= LARG ? (mapaW - LARG) / 2 : Math.max(0, Math.min(mapaW - LARG, hx + TILE / 2 - LARG / 2));
  const cy = mapaH <= ALT ? (mapaH - ALT) / 2 : Math.max(0, Math.min(mapaH - ALT, hy + TILE / 2 - ALT / 2));
  const camX = Math.round(cx), camY = Math.round(cy);

  // 1) Camada do chão: só os tiles visíveis.
  const tx0 = Math.max(0, Math.floor(camX / TILE)), ty0 = Math.max(0, Math.floor(camY / TILE));
  const tx1 = Math.min(mundo.largura - 1, Math.floor((camX + LARG) / TILE));
  const ty1 = Math.min(mundo.altura - 1, Math.floor((camY + ALT) / TILE));
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      desenharTile(ctx, mundo.mapa.linhas[ty][tx], tx, ty, tx * TILE - camX, ty * TILE - camY, tempo);
    }
  }

  // 2) Objetos e personagens, ordenados por Y: quem está mais "abaixo" é desenhado por cima.
  type Desenhavel = { y: number; desenhar: () => void };
  const lista: Desenhavel[] = [];
  for (const b of mundo.mapa.baus) {
    lista.push({ y: b.y * TILE, desenhar: () => desenharBau(ctx, b.x * TILE - camX, b.y * TILE - camY, mundo.flags.has(`bau:${b.id}`)) });
  }
  for (const n of mundo.npcs) {
    lista.push({ y: posicaoVisual(n.ator).py, desenhar: () => desenharPersonagem(ctx, n.ator, camX, camY, n.def.cores.roupa, n.def.cores.cabelo) });
  }
  lista.push({ y: hy, desenhar: () => desenharPersonagem(ctx, mundo.heroi, camX, camY, '#2f5fc4', '#3a2a1e') });
  lista.sort((a, b) => a.y - b.y).forEach((d) => d.desenhar());

  // 3) Interface (HUD) por cima de tudo.
  ctx.textBaseline = 'top';
  ctx.font = '7px monospace';
  if (mundo.inventario.length) {
    const txt = `Itens: ${mundo.inventario.join(', ')}`;
    const w = ctx.measureText(txt).width + 10;
    caixaFF(ctx, LARG - w - 3, 3, w, 14);
    ctx.fillStyle = '#fff';
    ctx.fillText(txt, LARG - w + 2, 7);
  }

  if (jogo.banner.tempo > 0) {
    ctx.globalAlpha = Math.min(1, jogo.banner.tempo * 2);
    ctx.font = '8px monospace';
    const w = ctx.measureText(jogo.banner.texto).width + 16;
    caixaFF(ctx, (LARG - w) / 2, 20, w, 18);
    ctx.fillStyle = '#fff';
    ctx.fillText(jogo.banner.texto, (LARG - w) / 2 + 8, 25);
    ctx.globalAlpha = 1;
  }

  const e = jogo.estado;
  if (e.tipo === 'dialogo') {
    const bx = 4, bh = 50, by = ALT - bh - 4, bw = LARG - 8;
    caixaFF(ctx, bx, by, bw, bh);
    ctx.font = '7.5px monospace';
    let ty = by + 6;
    if (e.quem) {
      ctx.fillStyle = '#f2d36b';
      ctx.fillText(e.quem, bx + 7, ty);
      ty += 10;
    }
    ctx.fillStyle = '#fff';
    const fala = e.falas[e.indice];
    const visivel = fala.slice(0, Math.floor(e.letras));
    // Quebra a fala COMPLETA para as palavras não "pularem" de linha enquanto digitam.
    let resto = visivel.length;
    for (const linha of quebrarLinhas(ctx, fala, bw - 14)) {
      if (resto <= 0) break;
      ctx.fillText(linha.slice(0, resto), bx + 7, ty);
      resto -= linha.length + 1;
      ty += 10;
    }
    if (e.letras >= fala.length && Math.floor(tempo * 3) % 2 === 0) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(bx + bw - 12, by + bh - 10); ctx.lineTo(bx + bw - 6, by + bh - 10); ctx.lineTo(bx + bw - 9, by + bh - 6);
      ctx.fill();
    }
  }

  // 4) Fade da transição entre mapas.
  if (jogo.escuridao > 0) {
    ctx.fillStyle = `rgba(0,0,0,${jogo.escuridao})`;
    ctx.fillRect(0, 0, LARG, ALT);
  }
}

export const TAMANHO_TELA = { largura: LARG * ESCALA, altura: ALT * ESCALA };
