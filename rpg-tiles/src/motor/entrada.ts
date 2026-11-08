import type { Dir } from '../tipos';

// Entrada unificada: teclado e botões de toque alimentam o MESMO estado.
// O resto do jogo nunca sabe de onde veio o comando, só pergunta "qual direção?"
// e "apertou ação?". Isso é o que permite trocar de controle sem mexer na lógica.

const MAPA_TECLAS: Record<string, Dir | 'acao'> = {
  ArrowUp: 'cima', ArrowDown: 'baixo', ArrowLeft: 'esquerda', ArrowRight: 'direita',
  KeyW: 'cima', KeyS: 'baixo', KeyA: 'esquerda', KeyD: 'direita',
  Space: 'acao', Enter: 'acao', KeyZ: 'acao',
};

/** Botões e campos têm o teclado deles (Enter/Espaço/setas): o jogo não pode engolir essas teclas. */
function campoDeFormulario(alvo: EventTarget | null): boolean {
  return alvo instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(alvo.tagName);
}

export class Entrada {
  // Pilha de direções seguradas: a última apertada vence (sensação de SNES).
  private seguradas: Dir[] = [];
  private acaoPendente = false;
  /** Falso quando o jogo não está na tela (ex.: aba do editor): o teclado fica livre para a página. */
  ativa = true;

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (!this.ativa || campoDeFormulario(e.target)) return;
      const cmd = MAPA_TECLAS[e.code];
      if (!cmd) return;
      e.preventDefault();
      if (e.repeat) return;
      if (cmd === 'acao') this.acaoPendente = true;
      else this.apertar(cmd);
    });
    window.addEventListener('keyup', (e) => {
      const cmd = MAPA_TECLAS[e.code];
      if (cmd && cmd !== 'acao') this.soltar(cmd);
    });
    window.addEventListener('blur', () => { this.seguradas = []; });
  }

  apertar(d: Dir) {
    this.soltar(d);
    this.seguradas.push(d);
  }

  soltar(d: Dir) {
    this.seguradas = this.seguradas.filter((x) => x !== d);
  }

  acao() { this.acaoPendente = true; }

  /** Direção que o jogador está segurando agora (ou null). */
  direcao(): Dir | null {
    return this.seguradas[this.seguradas.length - 1] ?? null;
  }

  /** Lê E consome o aperto de ação: ele só vale uma vez. */
  consumirAcao(): boolean {
    const a = this.acaoPendente;
    this.acaoPendente = false;
    return a;
  }

  limparAcao() { this.acaoPendente = false; }

  /** Esquece teclas seguradas e ação pendente (ao voltar de outra aba, por exemplo). */
  soltarTudo() { this.seguradas = []; this.acaoPendente = false; }
}
