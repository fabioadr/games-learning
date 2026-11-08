// Ensina: um editor de mapas é só uma outra VIEW dos mesmos dados.
// Ele não tem cópia do mapa: pinta direto em MAPAS[id].linhas, o mesmo array que o Mundo
// lê para desenhar e para decidir colisão. Por isso o jogo "já reflete" cada pincelada,
// sem importar/exportar nada. Também reaproveita o desenharTile do jogo: o que você vê
// aqui é exatamente o que o jogo vai mostrar.

import { TILE } from '../config';
import { MAPAS } from '../dados/mapas';
import { TILES } from '../dados/tiles';
import type { Jogo } from '../jogo/jogo';
import { desenharTile } from '../motor/render';
import { foiEditado, linhasOriginais, salvarEdicao } from './armazenamento';

type Ferramenta = 'pincel' | 'balde' | 'heroi';

const ESC = 2;                 // pixels reais por pixel lógico no canvas do editor
const MAX_DESFAZER = 100;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export class Editor {
  private mapaId = '';
  private pincel = '.';
  private ferramenta: Ferramenta = 'pincel';
  private historico: string[][] = [];        // cada item é uma foto das linhas ANTES de uma pincelada
  private pintando = false;
  private mudouNoTraco = false;
  private hover: { x: number; y: number } | null = null;

  private canvas = $<HTMLCanvasElement>('ed-tela');
  private ctx = this.canvas.getContext('2d')!;
  private status = $('ed-status');

  constructor(private jogo: Jogo, private aoTestar: () => void) {
    this.montarSeletorDeMapa();
    this.montarPaleta();
    this.ligarEventos();
  }

  /** Chamado ao abrir a aba: o editor começa no mapa em que o herói está. */
  mostrar() {
    this.trocarMapa(this.jogo.mundo.mapa.id);
  }

  // ------------------------------------------------------------------ montagem da UI
  private montarSeletorDeMapa() {
    const sel = $<HTMLSelectElement>('ed-mapa');
    for (const m of Object.values(MAPAS)) sel.add(new Option(m.nome, m.id));
    sel.addEventListener('change', () => this.trocarMapa(sel.value));
  }

  private montarPaleta() {
    const paleta = $('ed-paleta');
    for (const [ch, def] of Object.entries(TILES)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ed-tile';
      btn.dataset.tile = ch;
      btn.title = `${def.nome}${def.solido ? ' (sólido)' : ''}`;

      const mini = document.createElement('canvas');
      mini.width = mini.height = TILE;
      desenharTile(mini.getContext('2d')!, ch, 0, 0, 0, 0, 0);

      const nome = document.createElement('span');
      nome.textContent = def.nome;
      btn.append(mini, nome);
      if (def.solido) btn.insertAdjacentHTML('beforeend', '<i aria-label="sólido">▪</i>');

      btn.addEventListener('click', () => {
        this.pincel = ch;
        if (this.ferramenta === 'heroi') this.escolherFerramenta('pincel');
        this.marcarPaleta();
      });
      paleta.append(btn);
    }
    this.marcarPaleta();
  }

  private marcarPaleta() {
    document.querySelectorAll<HTMLElement>('.ed-tile').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.tile === this.pincel && this.ferramenta !== 'heroi'));
    });
  }

  private escolherFerramenta(f: Ferramenta) {
    this.ferramenta = f;
    document.querySelectorAll<HTMLElement>('[data-ferramenta]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.ferramenta === f));
    });
    this.marcarPaleta();
  }

  private ligarEventos() {
    document.querySelectorAll<HTMLElement>('[data-ferramenta]').forEach((b) => {
      b.addEventListener('click', () => this.escolherFerramenta(b.dataset.ferramenta as Ferramenta));
    });
    $('ed-desfazer').addEventListener('click', () => this.desfazer());
    $('ed-restaurar').addEventListener('click', () => this.restaurar());
    $('ed-testar').addEventListener('click', () => this.aoTestar());
    $('ed-copiar').addEventListener('click', () => this.copiarCodigo());
    $('ed-codigo-detalhes').addEventListener('toggle', () => this.atualizarCodigo());

    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      c.setPointerCapture(e.pointerId);
      const t = this.tileSob(e);
      if (!t) return;
      this.pintando = true;
      this.mudouNoTraco = false;
      this.historico.push([...this.mapa.linhas]);   // foto para o "desfazer"
      this.aplicar(t.x, t.y);
    });
    c.addEventListener('pointermove', (e) => {
      this.hover = this.tileSob(e);
      if (this.pintando && this.hover && this.ferramenta === 'pincel') this.aplicar(this.hover.x, this.hover.y);
    });
    const soltar = () => {
      if (!this.pintando) return;
      this.pintando = false;
      if (!this.mudouNoTraco) this.historico.pop();   // clique que não mudou nada não vira passo de desfazer
      if (this.historico.length > MAX_DESFAZER) this.historico.shift();
      this.atualizarBotoes();
    };
    c.addEventListener('pointerup', soltar);
    c.addEventListener('pointercancel', soltar);
    c.addEventListener('pointerleave', () => { if (!this.pintando) this.hover = null; });
  }

  // ------------------------------------------------------------------ dados
  private get mapa() { return MAPAS[this.mapaId]; }

  private trocarMapa(id: string) {
    this.mapaId = id;
    this.historico = [];
    this.hover = null;
    $<HTMLSelectElement>('ed-mapa').value = id;
    this.canvas.width = this.mapa.linhas[0].length * TILE * ESC;
    this.canvas.height = this.mapa.linhas.length * TILE * ESC;
    this.atualizarBotoes();
    this.atualizarCodigo();
    this.dizer('Pinte com o mouse ou o dedo. Toda mudança já vale no jogo.');
  }

  /** Converte a posição do ponteiro (px da tela) em coordenadas de tile. */
  private tileSob(e: PointerEvent): { x: number; y: number } | null {
    const r = this.canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * this.mapa.linhas[0].length);
    const y = Math.floor(((e.clientY - r.top) / r.height) * this.mapa.linhas.length);
    if (x < 0 || y < 0 || y >= this.mapa.linhas.length || x >= this.mapa.linhas[0].length) return null;
    return { x, y };
  }

  private poe(x: number, y: number, ch: string) {
    const l = this.mapa.linhas[y];
    this.mapa.linhas[y] = l.slice(0, x) + ch + l.slice(x + 1);   // strings são imutáveis: remonta a linha
  }

  private aplicar(x: number, y: number) {
    const { linhas } = this.mapa;
    if (this.ferramenta === 'heroi') return this.colocarHeroi(x, y);

    const atual = linhas[y][x];
    if (atual === this.pincel) return;
    if (this.ferramenta === 'pincel') {
      this.poe(x, y, this.pincel);
    } else {
      // Balde: inunda os vizinhos (4 direções) que têm o mesmo tile do ponto clicado.
      const fila = [[x, y]];
      while (fila.length) {
        const [cx, cy] = fila.pop()!;
        if (linhas[cy]?.[cx] !== atual) continue;
        this.poe(cx, cy, this.pincel);
        fila.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
      }
    }
    this.mudouNoTraco = true;
    salvarEdicao(this.mapaId);
    this.atualizarBotoes();
    this.atualizarCodigo();
  }

  private colocarHeroi(x: number, y: number) {
    const m = this.mapa;
    const t = m.linhas[y][x];
    const ocupado = m.npcs.some((n) => n.x === x && n.y === y) || m.baus.some((b) => b.x === x && b.y === y);
    if (TILES[t]?.solido ?? true) return this.dizer(`Não dá: ${TILES[t]?.nome ?? 'tile'} é sólido.`);
    if (ocupado) return this.dizer('Não dá: tem um NPC ou baú nesse tile.');
    this.jogo.teleportar(this.mapaId, x, y);
    this.dizer(`Herói em (${x}, ${y}). Abra a aba Jogo para andar a partir daqui.`);
  }

  private desfazer() {
    const antes = this.historico.pop();
    if (!antes) return;
    this.mapa.linhas = antes;
    salvarEdicao(this.mapaId);
    this.atualizarBotoes();
    this.atualizarCodigo();
  }

  private restaurar() {
    if (!foiEditado(this.mapaId)) return;
    if (!confirm(`Voltar "${this.mapa.nome}" ao mapa original do código? As edições dele serão perdidas.`)) return;
    this.historico.push([...this.mapa.linhas]);
    this.mapa.linhas = linhasOriginais(this.mapaId);
    salvarEdicao(this.mapaId);
    this.atualizarBotoes();
    this.atualizarCodigo();
  }

  // ------------------------------------------------------------------ exportar
  /** O trecho pronto para colar em dados/mapas.ts: é assim que a edição vira parte do código. */
  private codigo(): string {
    const itens = this.mapa.linhas.map((l) => `      '${l.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',`);
    return `    linhas: [\n${itens.join('\n')}\n    ],`;
  }

  private atualizarCodigo() {
    const aberto = ($('ed-codigo-detalhes') as HTMLDetailsElement).open;
    if (aberto) $<HTMLTextAreaElement>('ed-codigo').value = this.codigo();
  }

  private async copiarCodigo() {
    const area = $<HTMLTextAreaElement>('ed-codigo');
    ($('ed-codigo-detalhes') as HTMLDetailsElement).open = true;
    area.value = this.codigo();
    try {
      await navigator.clipboard.writeText(area.value);
      this.dizer(`Código do mapa "${this.mapaId}" copiado. Cole no campo linhas de dados/mapas.ts.`);
    } catch {
      area.select();   // sem permissão de clipboard (iframe do artefato, por ex.): o texto fica selecionado
      this.dizer('Não consegui copiar sozinho. O texto está selecionado: copie manualmente.');
    }
  }

  private atualizarBotoes() {
    ($('ed-desfazer') as HTMLButtonElement).disabled = this.historico.length === 0;
    ($('ed-restaurar') as HTMLButtonElement).disabled = !foiEditado(this.mapaId);
    $('ed-editado').hidden = !foiEditado(this.mapaId);
  }

  private dizer(texto: string) {
    this.status.textContent = texto;
  }

  // ------------------------------------------------------------------ desenho
  desenhar(tempo: number) {
    const { ctx, mapa } = this;
    const verColisao = $<HTMLInputElement>('ed-ver-colisao').checked;
    const verObjetos = $<HTMLInputElement>('ed-ver-objetos').checked;

    ctx.setTransform(ESC, 0, 0, ESC, 0, 0);
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < mapa.linhas.length; y++) {
      for (let x = 0; x < mapa.linhas[y].length; x++) {
        const ch = mapa.linhas[y][x];
        desenharTile(ctx, ch, x, y, x * TILE, y * TILE, tempo);
        if (verColisao && (TILES[ch]?.solido ?? true)) {
          ctx.fillStyle = 'rgba(230,40,60,0.45)';   // mesma regra do mundo.livre(): sólido bloqueia
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
      }
    }

    if (verObjetos) {
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.font = 'bold 9px monospace';
      const marca = (x: number, y: number, letra: string, cor: string) => {
        ctx.fillStyle = cor;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.fillText(letra, x * TILE + TILE / 2, y * TILE + TILE / 2 + 1);
      };
      for (const p of mapa.portais) marca(p.x, p.y, '↪', '#8a3fd1');
      for (const b of mapa.baus) marca(b.x, b.y, '◆', '#b8860b');
      for (const p of mapa.placas) marca(p.x, p.y, 'i', '#2a7a8a');
      for (const n of mapa.npcs) marca(n.x, n.y, n.nome[0], '#c23b6a');
    }

    const h = this.jogo.mundo.heroi;
    if (this.jogo.mundo.mapa.id === this.mapaId) {
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.font = 'bold 9px monospace';
      ctx.strokeStyle = '#f2d36b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(h.x * TILE + 1, h.y * TILE + 1, TILE - 2, TILE - 2);
      ctx.fillStyle = '#f2d36b';
      ctx.fillText('H', h.x * TILE + TILE / 2, h.y * TILE + TILE / 2 + 1);
    }

    if (this.hover) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.hover.x * TILE + 0.5, this.hover.y * TILE + 0.5, TILE - 1, TILE - 1);
      const ch = mapa.linhas[this.hover.y][this.hover.x];
      $('ed-posicao').textContent = `(${this.hover.x}, ${this.hover.y}) ${TILES[ch]?.nome ?? '?'}`;
    }
  }
}
