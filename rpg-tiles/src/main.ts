import { Entrada } from './motor/entrada';
import { desenhar, TAMANHO_TELA } from './motor/render';
import { Jogo } from './jogo/jogo';
import type { Dir } from './tipos';
import { carregarEdicoes } from './editor/armazenamento';
import { Editor } from './editor/editor';

// Ponto de entrada: monta as peças e roda o GAME LOOP.

const canvas = document.querySelector<HTMLCanvasElement>('#tela')!;
canvas.width = TAMANHO_TELA.largura;
canvas.height = TAMANHO_TELA.altura;
const ctx = canvas.getContext('2d')!;

carregarEdicoes();   // reaplica por cima de MAPAS o que foi pintado no editor (antes de criar o Jogo)
const entrada = new Entrada();
const jogo = new Jogo(entrada);

// ==================== ABAS: Jogo | Editor de mapa ====================
// As duas telas compartilham o MESMO `jogo` (e portanto os mesmos MAPAS). Só uma é desenhada
// por vez; na outra o loop não atualiza nada, então o jogo fica congelado enquanto você edita.
type Aba = 'jogo' | 'editor';
let aba: Aba = 'jogo';
const editor = new Editor(jogo, () => abrirAba('jogo'));

function abrirAba(nova: Aba) {
  if (aba === 'editor' && nova === 'jogo') editor.sincronizarJogo();   // NPCs/tamanho mudaram? recarrega
  aba = nova;
  for (const id of ['jogo', 'editor'] as const) {
    document.getElementById(`aba-${id}`)!.setAttribute('aria-selected', String(id === nova));
    document.getElementById(`painel-${id}`)!.hidden = id !== nova;
  }
  entrada.ativa = nova === 'jogo';   // no editor, o teclado volta a ser da página
  entrada.soltarTudo();
  (document.activeElement as HTMLElement | null)?.blur();   // senão o botão da aba segura o teclado
  if (nova === 'editor') editor.mostrar();
}
document.getElementById('aba-jogo')!.addEventListener('click', () => abrirAba('jogo'));
document.getElementById('aba-editor')!.addEventListener('click', () => abrirAba('editor'));

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

  if (aba === 'jogo') {
    jogo.atualizar(dt);
    desenhar(ctx, jogo, agora / 1000);
  } else {
    editor.desenhar(agora / 1000);
  }

  requestAnimationFrame(quadro);
}
requestAnimationFrame(quadro);
