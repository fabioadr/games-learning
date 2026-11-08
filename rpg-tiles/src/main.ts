import { Entrada } from './motor/entrada';
import { desenhar, TAMANHO_TELA } from './motor/render';
import { Jogo } from './jogo/jogo';
import type { Dir } from './tipos';

// Ponto de entrada: monta as peças e roda o GAME LOOP.

const canvas = document.querySelector<HTMLCanvasElement>('#tela')!;
canvas.width = TAMANHO_TELA.largura;
canvas.height = TAMANHO_TELA.altura;
const ctx = canvas.getContext('2d')!;

const entrada = new Entrada();
const jogo = new Jogo(entrada);

// Botões de toque (celular) alimentam a mesma Entrada do teclado.
document.querySelectorAll<HTMLElement>('[data-dir]').forEach((btn) => {
  const dir = btn.dataset.dir as Dir;
  const soltar = () => entrada.soltar(dir);
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); btn.setPointerCapture(e.pointerId); entrada.apertar(dir); });
  btn.addEventListener('pointerup', soltar);
  btn.addEventListener('pointercancel', soltar);
});
document.querySelector<HTMLElement>('[data-acao]')?.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  entrada.acao();
});

// ==================== GAME LOOP ====================
// ~60 vezes por segundo: calcula quanto tempo passou (dt), ATUALIZA o estado, DESENHA.
// Tudo que se move usa dt, então o jogo roda na mesma velocidade em qualquer máquina.
let anterior = performance.now();
function quadro(agora: number) {
  const dt = Math.min(0.05, (agora - anterior) / 1000); // limita dt se a aba ficou em segundo plano
  anterior = agora;

  jogo.atualizar(dt);
  desenhar(ctx, jogo, agora / 1000);

  requestAnimationFrame(quadro);
}
requestAnimationFrame(quadro);
