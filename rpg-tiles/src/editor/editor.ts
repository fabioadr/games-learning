// Ensina: um editor de mapas é só uma outra VIEW dos mesmos dados.
// Ele não tem cópia do mapa: pinta direto em MAPAS[id], o mesmo objeto que o Mundo lê para
// desenhar e decidir colisão. Por isso o jogo "já reflete" cada mudança, sem importar nada.
// Este arquivo é a "cola": eventos de ponteiro, ferramentas e o desenho do canvas. As regras
// moram ao lado: operacoes.ts (pintar, balde, redimensionar), objetos.ts (camada de objetos),
// validacao.ts (avisos), historico.ts (desfazer), exportar.ts e armazenamento.ts.

import { TILE } from '../config';
import { INICIO, MAPAS } from '../dados/mapas';
import { TILES } from '../dados/tiles';
import type { Jogo } from '../jogo/jogo';
import { desenharTile } from '../motor/desenhoTiles';
import type { Dir } from '../tipos';
import { ehOriginal, foiEditado, restaurarOriginal, salvarTudo } from './armazenamento';
import { codigoDoMapa } from './exportar';
import { Historico } from './historico';
import { criarObjeto, descrever, montarFormulario, objetoDe, objetoEm, removerObjeto, type Selecao, type TipoObjeto } from './objetos';
import { altura, balde, dentro, largura, lerLinhas, novoMapa, poeTile, redimensionar, retangulo, TAMANHO_MAX, TAMANHO_MIN } from './operacoes';
import { avisos, type Aviso } from './validacao';

type Ferramenta = 'pincel' | 'balde' | 'retangulo' | 'contagotas' | 'objetos' | 'heroi' | 'mao';
type Arrasto =
  | { tipo: 'pintar' }
  | { tipo: 'retangulo'; x0: number; y0: number }
  | { tipo: 'objeto'; sel: Selecao }
  | { tipo: 'mao'; cx: number; cy: number; sl: number; st: number };

const ESC = 3;                         // pixels reais por pixel lógico no canvas do editor
const ZOOMS = [1, 1.5, 2, 3, 4];       // largura do canvas em relação à moldura

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const pixel = (n: number) => n * TILE;

export class Editor {
  private mapaId = '';
  private pincel = '.';
  private ferramenta: Ferramenta = 'pincel';
  private historico = new Historico();
  private arrasto: Arrasto | null = null;
  private hover: { x: number; y: number } | null = null;
  private selecao: Selecao | null = null;
  private tileEscolhido: { x: number; y: number } | null = null;   // onde "+ NPC" etc. vão criar
  private destaque: { x: number; y: number; ate: number } | null = null;
  private zoom = 0;
  private avisosAtuais: Aviso[] = [];
  private assinaturaDoJogo = '';

  private canvas = $<HTMLCanvasElement>('ed-tela');
  private ctx = this.canvas.getContext('2d')!;

  constructor(private jogo: Jogo, private aoTestar: () => void) {
    this.montarPaleta();
    this.ligarBotoes();
    this.ligarPonteiro();
    this.ligarTeclado();
  }

  private get mapa() { return MAPAS[this.mapaId]; }

  // ================================================================== ligação com o jogo
  /** Chamado ao abrir a aba: o editor começa no mapa em que o herói está. */
  mostrar() {
    this.assinaturaDoJogo = this.assinatura();
    this.trocarMapa(this.jogo.mundo.mapa.id);
  }

  /**
   * Chamado ao voltar para a aba Jogo. Tiles não precisam de nada (o jogo lê o mesmo array).
   * Mas os NPCs vivos foram criados a partir dos dados quando o mapa carregou: se objetos ou
   * o tamanho mudaram, o mapa é recarregado para que o jogo os recrie.
   */
  sincronizarJogo() {
    const { mundo } = this.jogo;
    const m = MAPAS[mundo.mapa.id];
    if (!m) return this.jogo.teleportar(INICIO.mapa, INICIO.x, INICIO.y);   // o mapa foi apagado
    if (this.assinatura() === this.assinaturaDoJogo) return;
    const h = mundo.heroi;
    const x = Math.max(0, Math.min(largura(m) - 1, h.x));
    const y = Math.max(0, Math.min(altura(m) - 1, h.y));
    this.jogo.teleportar(m.id, x, y, h.olhando);
  }

  /** Tudo do mapa atual do jogo, menos o desenho dos tiles (que o jogo já lê ao vivo). */
  private assinatura(): string {
    const m = MAPAS[this.jogo.mundo.mapa.id];
    if (!m) return '';
    const { linhas, ...resto } = m;
    return `${linhas.length}x${linhas[0].length}:${JSON.stringify(resto)}`;
  }

  // ================================================================== montagem da UI
  private montarPaleta() {
    const paleta = $('ed-paleta');
    for (const [ch, def] of Object.entries(TILES)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ed-tile';
      btn.dataset.tile = ch;
      btn.title = `${def.nome} ('${ch}')${def.solido ? ', sólido' : ''}`;
      const mini = document.createElement('canvas');
      mini.width = mini.height = TILE;
      desenharTile(mini.getContext('2d')!, ch, 0, 0, 0, 0, 0);
      const nome = document.createElement('span');
      nome.textContent = def.nome;
      btn.append(mini, nome);
      if (def.solido) btn.insertAdjacentHTML('beforeend', '<i aria-label="sólido">▪</i>');
      btn.addEventListener('click', () => this.escolherTile(ch));
      paleta.append(btn);
    }
    this.marcarBotoes();
  }

  private escolherTile(ch: string) {
    this.pincel = ch;
    if (!['pincel', 'balde', 'retangulo'].includes(this.ferramenta)) this.escolherFerramenta('pincel');
    this.marcarBotoes();
  }

  private escolherFerramenta(f: Ferramenta) {
    this.ferramenta = f;
    if (f !== 'objetos') { this.selecao = null; this.tileEscolhido = null; }
    this.marcarBotoes();
    this.atualizarPainelObjeto();
    const dicas: Record<Ferramenta, string> = {
      pincel: 'Pincel: clique ou arraste para pintar.',
      balde: 'Balde: preenche a região contígua do mesmo tile.',
      retangulo: 'Retângulo: arraste de um canto ao outro.',
      contagotas: 'Conta-gotas: toque num tile para pegar ele como pincel.',
      objetos: 'Objetos: toque num objeto para editar, arraste para mover. Num tile vazio, crie um objeto.',
      heroi: 'Colocar herói: toque num tile livre.',
      mao: 'Mão: arraste para mover a vista (útil com zoom no celular).',
    };
    this.dizer(dicas[f]);
  }

  private marcarBotoes() {
    document.querySelectorAll<HTMLElement>('.ed-tile').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.tile === this.pincel));
    });
    document.querySelectorAll<HTMLElement>('[data-ferramenta]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.ferramenta === this.ferramenta));
    });
    this.canvas.dataset.ferramenta = this.ferramenta;
  }

  private ligarBotoes() {
    const clique = (id: string, f: () => void) => $(id).addEventListener('click', f);
    const sel = $<HTMLSelectElement>('ed-mapa');
    sel.addEventListener('change', () => this.trocarMapa(sel.value));

    document.querySelectorAll<HTMLElement>('[data-ferramenta]').forEach((b) => {
      b.addEventListener('click', () => this.escolherFerramenta(b.dataset.ferramenta as Ferramenta));
    });
    clique('ed-desfazer', () => this.desfazerOuRefazer('desfazer'));
    clique('ed-refazer', () => this.desfazerOuRefazer('refazer'));
    clique('ed-testar', () => this.aoTestar());
    clique('ed-copiar', () => this.copiarCodigo());
    clique('ed-zoom-mais', () => this.mudarZoom(+1));
    clique('ed-zoom-menos', () => this.mudarZoom(-1));
    $('ed-codigo-detalhes').addEventListener('toggle', () => this.atualizarCodigo());

    // Tamanho: cada botão tem a borda e +1/-1.
    document.querySelectorAll<HTMLElement>('[data-borda]').forEach((b) => {
      b.addEventListener('click', () => this.redimensionar(b.dataset.borda as Dir, Number(b.dataset.delta) as 1 | -1));
    });
    $<HTMLInputElement>('ed-nome').addEventListener('change', (e) => {
      const v = (e.target as HTMLInputElement).value.trim();
      if (v) this.mudar(() => { this.mapa.nome = v; });
    });
    clique('ed-importar-btn', () => this.importar());
    clique('ed-novo-criar', () => this.criarMapa());
    confirmarComSegundoToque($('ed-restaurar'), () => this.restaurarOuApagar());

    // Camada de objetos
    document.querySelectorAll<HTMLElement>('[data-novo]').forEach((b) => {
      b.addEventListener('click', () => this.novoObjeto(b.dataset.novo as TipoObjeto));
    });
    clique('ed-objeto-remover', () => this.removerSelecionado());
  }

  // ================================================================== ponteiro
  /** Posição do ponteiro (px da tela) -> tile. É a conta inversa da câmera. */
  private tileSob(e: PointerEvent): { x: number; y: number } | null {
    const r = this.canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * largura(this.mapa));
    const y = Math.floor(((e.clientY - r.top) / r.height) * altura(this.mapa));
    return dentro(this.mapa, x, y) ? { x, y } : null;
  }

  private ligarPonteiro() {
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      c.setPointerCapture(e.pointerId);
      if (this.ferramenta === 'mao') {
        const moldura = $('ed-moldura');
        this.arrasto = { tipo: 'mao', cx: e.clientX, cy: e.clientY, sl: moldura.scrollLeft, st: moldura.scrollTop };
        return;
      }
      const t = this.tileSob(e);
      if (t) this.comecar(t.x, t.y);
    });
    c.addEventListener('pointermove', (e) => {
      const a = this.arrasto;
      if (a?.tipo === 'mao') {
        const moldura = $('ed-moldura');
        moldura.scrollLeft = a.sl - (e.clientX - a.cx);
        moldura.scrollTop = a.st - (e.clientY - a.cy);
        return;
      }
      this.hover = this.tileSob(e);
      const t = this.hover;
      if (!a || !t) return;
      if (a.tipo === 'pintar' && this.mapa.linhas[t.y][t.x] !== this.pincel) poeTile(this.mapa, t.x, t.y, this.pincel);
      if (a.tipo === 'objeto') {
        const o = objetoDe(this.mapa, a.sel);
        if (o) { o.x = t.x; o.y = t.y; this.tileEscolhido = t; }
      }
    });
    const soltar = () => this.terminar();
    c.addEventListener('pointerup', soltar);
    c.addEventListener('pointercancel', soltar);
    c.addEventListener('pointerleave', () => { if (!this.arrasto) this.hover = null; });
  }

  private comecar(x: number, y: number) {
    const m = this.mapa;
    switch (this.ferramenta) {
      case 'pincel':
        this.historico.iniciar();               // a foto vale para o traço inteiro
        poeTile(m, x, y, this.pincel);
        this.arrasto = { tipo: 'pintar' };
        break;
      case 'balde':
        this.mudar(() => balde(m, x, y, this.pincel));
        break;
      case 'retangulo':
        this.arrasto = { tipo: 'retangulo', x0: x, y0: y };
        break;
      case 'contagotas':
        this.escolherTile(m.linhas[y][x]);
        this.dizer(`Pincel: ${TILES[this.pincel]?.nome}.`);
        break;
      case 'heroi':
        this.colocarHeroi(x, y);
        break;
      case 'objetos':
        this.tileEscolhido = { x, y };
        this.selecao = objetoEm(m, x, y);
        if (this.selecao) {
          this.historico.iniciar();
          this.arrasto = { tipo: 'objeto', sel: this.selecao };
        }
        this.atualizarPainelObjeto();
        break;
    }
  }

  private terminar() {
    const a = this.arrasto;
    this.arrasto = null;
    if (!a) return;
    if (a.tipo === 'pintar' || a.tipo === 'objeto') {
      if (this.historico.concluir()) this.depoisDeMudar();
    }
    if (a.tipo === 'retangulo' && this.hover) {
      const { x, y } = this.hover;
      this.mudar(() => retangulo(this.mapa, a.x0, a.y0, x, y, this.pincel));
    }
  }

  private ligarTeclado() {
    window.addEventListener('keydown', (e) => {
      if ($('painel-editor').hidden) return;
      const alvo = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === 'z') { e.preventDefault(); this.desfazerOuRefazer(e.shiftKey ? 'refazer' : 'desfazer'); }
      else if (ctrl && e.key.toLowerCase() === 'y') { e.preventDefault(); this.desfazerOuRefazer('refazer'); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && this.selecao) { e.preventDefault(); this.removerSelecionado(); }
      else if (e.key === 'Escape') { this.selecao = null; this.tileEscolhido = null; this.atualizarPainelObjeto(); }
    });
  }

  // ================================================================== ações
  /** Toda mudança passa por aqui: foto para o desfazer, aplica e, se mudou, salva e atualiza. */
  private mudar(fazer: () => void, reconstruirFormulario = true) {
    if (this.historico.acao(fazer)) this.depoisDeMudar(reconstruirFormulario);
  }

  private depoisDeMudar(reconstruirFormulario = true) {
    salvarTudo();
    this.ajustarCanvas();
    this.atualizarTudo(reconstruirFormulario);
  }

  private desfazerOuRefazer(qual: 'desfazer' | 'refazer') {
    const ok = qual === 'desfazer' ? this.historico.desfazer() : this.historico.refazer();
    if (!ok) return;
    this.selecao = null;
    if (!this.mapa) this.mapaId = Object.keys(MAPAS)[0];   // desfez a criação do mapa aberto
    this.depoisDeMudar();
  }

  private trocarMapa(id: string) {
    this.mapaId = id;
    this.selecao = null;
    this.tileEscolhido = null;
    this.hover = null;
    this.ajustarCanvas();
    this.atualizarTudo();
  }

  private irPara(id: string, x: number, y: number) {
    if (!MAPAS[id]) return this.dizer(`O mapa "${id}" não existe.`);
    this.trocarMapa(id);
    this.destaque = { x, y, ate: performance.now() + 2500 };
    this.dizer(`Destino do portal: (${x}, ${y}) em ${MAPAS[id].nome}.`);
  }

  private colocarHeroi(x: number, y: number) {
    const m = this.mapa;
    const t = m.linhas[y][x];
    if (TILES[t]?.solido ?? true) return this.dizer(`Não dá: ${TILES[t]?.nome ?? 'tile'} é sólido.`);
    if (m.npcs.some((n) => n.x === x && n.y === y) || m.baus.some((b) => b.x === x && b.y === y)) {
      return this.dizer('Não dá: tem um NPC ou baú nesse tile.');
    }
    this.jogo.teleportar(this.mapaId, x, y);
    this.assinaturaDoJogo = this.assinatura();
    this.dizer(`Herói em (${x}, ${y}). Abra a aba Jogo para andar a partir daqui.`);
  }

  private redimensionar(borda: Dir, delta: 1 | -1) {
    let r: ReturnType<typeof redimensionar> = null;
    this.mudar(() => {
      r = redimensionar(this.mapa, borda, delta, this.pincel);
      // O herói também é um objeto com (x, y): se está neste mapa, acompanha a nova origem.
      const h = this.jogo.mundo.heroi;
      if (r && this.jogo.mundo.mapa.id === this.mapaId) { h.x += r.dx; h.y += r.dy; h.deX += r.dx; h.deY += r.dy; }
    });
    if (!r) return this.dizer(`O mapa fica entre ${TAMANHO_MIN} e ${TAMANHO_MAX} tiles em cada lado.`);
    const { removidos } = r as { removidos: number };
    this.dizer(`Mapa agora com ${largura(this.mapa)}x${altura(this.mapa)}.` + (removidos ? ` ${removidos} objeto(s) caíram fora e foram removidos (Desfazer traz de volta).` : ''));
  }

  private importar() {
    const r = lerLinhas($<HTMLTextAreaElement>('ed-importar').value);
    if (typeof r === 'string') return this.dizer(r);
    this.mudar(() => { this.mapa.linhas = r; });
    this.dizer(`Linhas carregadas: ${r[0].length}x${r.length}. Confira os avisos se o tamanho mudou.`);
  }

  private criarMapa() {
    const id = $<HTMLInputElement>('ed-novo-id').value.trim();
    const nome = $<HTMLInputElement>('ed-novo-nome').value.trim() || id;
    const w = Math.round(Number($<HTMLInputElement>('ed-novo-l').value));
    const h = Math.round(Number($<HTMLInputElement>('ed-novo-a').value));
    if (!/^[a-z][a-z0-9_]*$/.test(id)) return this.dizer('Id do mapa: letras minúsculas, números e _ (ex.: caverna_1).');
    if (MAPAS[id]) return this.dizer(`Já existe um mapa "${id}".`);
    if (![w, h].every((n) => n >= TAMANHO_MIN && n <= TAMANHO_MAX)) return this.dizer(`Largura e altura entre ${TAMANHO_MIN} e ${TAMANHO_MAX}.`);
    this.mudar(() => { MAPAS[id] = novoMapa(id, nome, w, h, this.pincel); });
    this.trocarMapa(id);
    ($('ed-novo-detalhes') as HTMLDetailsElement).open = false;
    this.dizer(`Mapa "${nome}" criado com ${TILES[this.pincel]?.nome}. Ligue-o a outro mapa com um portal (ferramenta Objetos).`);
  }

  private restaurarOuApagar() {
    const id = this.mapaId;
    if (ehOriginal(id)) {
      this.mudar(() => restaurarOriginal(id));
      this.dizer('Mapa restaurado ao que está em dados/mapas.ts. Desfazer traz as edições de volta.');
    } else {
      this.mapaId = Object.keys(MAPAS).find((k) => k !== id)!;
      this.mudar(() => { delete MAPAS[id]; });
      this.trocarMapa(this.mapaId);
      this.dizer(`Mapa "${id}" apagado. Desfazer traz de volta.`);
    }
  }

  private novoObjeto(tipo: TipoObjeto) {
    const t = this.tileEscolhido;
    if (!t || objetoEm(this.mapa, t.x, t.y)) return;
    let sel: Selecao | null = null;
    this.mudar(() => {
      sel = criarObjeto(this.mapa, tipo, t.x, t.y);
      // Placa precisa de um tile sólido para o herói não andar por cima: pinta o tile placa.
      if (tipo === 'placa') poeTile(this.mapa, t.x, t.y, 'P');
    });
    this.selecao = sel;
    this.atualizarPainelObjeto();
  }

  private removerSelecionado() {
    const s = this.selecao;
    if (!s) return;
    this.selecao = null;
    this.mudar(() => removerObjeto(this.mapa, s));
  }

  private mudarZoom(passo: number) {
    this.zoom = Math.max(0, Math.min(ZOOMS.length - 1, this.zoom + passo));
    this.ajustarCanvas();
  }

  // ================================================================== atualizar a UI
  private ajustarCanvas() {
    const w = pixel(largura(this.mapa)) * ESC, h = pixel(altura(this.mapa)) * ESC;
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    // Mapa pequeno não estica além de 48px por tile (no zoom 1x); mapa grande cabe na moldura.
    const z = ZOOMS[this.zoom];
    this.canvas.style.width = `min(${z * 100}%, ${w * z}px)`;
    $('ed-zoom-valor').textContent = `${ZOOMS[this.zoom]}x`;
  }

  private atualizarTudo(reconstruirFormulario = true) {
    const sel = $<HTMLSelectElement>('ed-mapa');
    sel.replaceChildren(...Object.values(MAPAS).map((m) => new Option(`${m.nome}${foiEditado(m.id) ? ' •' : ''}`, m.id)));
    sel.value = this.mapaId;

    ($('ed-desfazer') as HTMLButtonElement).disabled = !this.historico.podeDesfazer;
    ($('ed-refazer') as HTMLButtonElement).disabled = !this.historico.podeRefazer;
    const editado = foiEditado(this.mapaId);
    $('ed-editado').hidden = !editado;
    $('ed-editado').textContent = ehOriginal(this.mapaId) ? 'editado' : 'novo';
    const rest = $<HTMLButtonElement>('ed-restaurar');
    rest.textContent = ehOriginal(this.mapaId) ? 'Restaurar original' : 'Apagar mapa';
    rest.dataset.texto = rest.textContent;
    rest.disabled = !editado;

    const nome = $<HTMLInputElement>('ed-nome');
    if (document.activeElement !== nome) nome.value = this.mapa.nome;
    $('ed-tamanho').textContent = `${largura(this.mapa)} x ${altura(this.mapa)} tiles`;

    this.atualizarAvisos();
    this.atualizarCodigo();
    if (reconstruirFormulario) this.atualizarPainelObjeto();
  }

  private atualizarAvisos() {
    this.avisosAtuais = avisos(this.mapa);
    const ul = $('ed-avisos');
    $('ed-avisos-titulo').textContent = this.avisosAtuais.length ? `Avisos (${this.avisosAtuais.length})` : 'Avisos: nenhum';
    ul.replaceChildren(...this.avisosAtuais.map((a) => {
      const li = document.createElement('li');
      const b = Object.assign(document.createElement('button'), { type: 'button', textContent: `(${a.x}, ${a.y}) ${a.texto}` });
      b.addEventListener('click', () => { this.destaque = { x: a.x, y: a.y, ate: performance.now() + 2000 }; });
      li.append(b);
      return li;
    }));
  }

  private atualizarPainelObjeto() {
    const painel = $('ed-objeto');
    painel.hidden = this.ferramenta !== 'objetos';
    if (painel.hidden) return;
    const t = this.tileEscolhido, s = this.selecao, m = this.mapa;
    const titulo = $('ed-objeto-titulo');
    const vazio = !!t && !objetoEm(m, t.x, t.y);
    $('ed-objeto-novos').hidden = !vazio;
    $('ed-objeto-remover').hidden = !s;
    if (s && objetoDe(m, s)) {
      const o = objetoDe(m, s)!;
      titulo.textContent = `${descrever(m, s)} em (${o.x}, ${o.y})`;
      montarFormulario($('ed-objeto-form'), m, s, (f, r) => this.mudar(f, r), (id, x, y) => this.irPara(id, x, y));
    } else {
      titulo.textContent = t ? `Tile (${t.x}, ${t.y}) vazio: criar` : 'Toque num objeto ou num tile vazio.';
      $('ed-objeto-form').replaceChildren();
    }
  }

  private atualizarCodigo() {
    if (($('ed-codigo-detalhes') as HTMLDetailsElement).open) $<HTMLTextAreaElement>('ed-codigo').value = codigoDoMapa(this.mapa);
  }

  private async copiarCodigo() {
    const area = $<HTMLTextAreaElement>('ed-codigo');
    ($('ed-codigo-detalhes') as HTMLDetailsElement).open = true;
    area.value = codigoDoMapa(this.mapa);
    try {
      await navigator.clipboard.writeText(area.value);
      this.dizer(`Código de "${this.mapaId}" copiado. Substitua a entrada dele em MAPAS (dados/mapas.ts), ou cole como nova.`);
    } catch {
      area.select();   // sem permissão de clipboard (iframe do artefato, por ex.): o texto fica selecionado
      this.dizer('Não consegui copiar sozinho. O texto está selecionado: copie manualmente.');
    }
  }

  private dizer(texto: string) {
    $('ed-status').textContent = texto;
  }

  // ================================================================== desenho
  desenhar(tempo: number) {
    const { ctx, mapa } = this;
    const W = largura(mapa), H = altura(mapa);
    const verColisao = $<HTMLInputElement>('ed-ver-colisao').checked;
    const verObjetos = $<HTMLInputElement>('ed-ver-objetos').checked || this.ferramenta === 'objetos';
    const verGrade = $<HTMLInputElement>('ed-ver-grade').checked;

    ctx.setTransform(ESC, 0, 0, ESC, 0, 0);
    ctx.imageSmoothingEnabled = false;

    // 1) Chão, com o MESMO desenho do jogo.
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ch = mapa.linhas[y][x];
        desenharTile(ctx, ch, x, y, pixel(x), pixel(y), tempo);
        if (verColisao && (TILES[ch]?.solido ?? true)) {
          ctx.fillStyle = 'rgba(230,40,60,0.45)';   // mesma regra do mundo.livre(): sólido bloqueia
          ctx.fillRect(pixel(x), pixel(y), TILE, TILE);
        }
      }
    }
    if (verGrade) {
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1 / ESC;
      ctx.beginPath();
      for (let x = 1; x < W; x++) { ctx.moveTo(pixel(x), 0); ctx.lineTo(pixel(x), pixel(H)); }
      for (let y = 1; y < H; y++) { ctx.moveTo(0, pixel(y)); ctx.lineTo(pixel(W), pixel(y)); }
      ctx.stroke();
    }

    // 2) Camada de objetos (marcadores).
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = 'bold 9px monospace';
    const marca = (x: number, y: number, letra: string, cor: string) => {
      ctx.fillStyle = cor;
      ctx.globalAlpha = 0.88;
      ctx.fillRect(pixel(x) + 2, pixel(y) + 2, TILE - 4, TILE - 4);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.fillText(letra, pixel(x) + TILE / 2, pixel(y) + TILE / 2 + 1);
    };
    if (verObjetos) {
      for (const p of mapa.portais) marca(p.x, p.y, '↪', '#8a3fd1');
      for (const b of mapa.baus) marca(b.x, b.y, '◆', '#b8860b');
      for (const p of mapa.placas) marca(p.x, p.y, 'i', '#2a7a8a');
      for (const n of mapa.npcs) marca(n.x, n.y, n.nome[0] ?? '?', '#c23b6a');
    }

    const contorno = (x: number, y: number, cor: string, espessura = 1, tracejado = false) => {
      ctx.strokeStyle = cor;
      ctx.lineWidth = espessura;
      ctx.setLineDash(tracejado ? [2, 2] : []);
      ctx.strokeRect(pixel(x) + espessura / 2, pixel(y) + espessura / 2, TILE - espessura, TILE - espessura);
      ctx.setLineDash([]);
    };

    // 3) Avisos, herói, seleção, retângulo em andamento, hover e destaque.
    for (const a of this.avisosAtuais) contorno(a.x, a.y, '#ff9f1a', 1.5);

    const h = this.jogo.mundo.heroi;
    if (this.jogo.mundo.mapa.id === this.mapaId) {
      contorno(h.x, h.y, '#f2d36b', 1.5);
      ctx.fillStyle = '#f2d36b';
      ctx.fillText('H', pixel(h.x) + TILE / 2, pixel(h.y) + TILE / 2 + 1);
    }

    const o = this.selecao && objetoDe(mapa, this.selecao);
    if (o) contorno(o.x, o.y, '#ffffff', 2);
    else if (this.tileEscolhido && this.ferramenta === 'objetos') contorno(this.tileEscolhido.x, this.tileEscolhido.y, '#ffffff', 1, true);

    const a = this.arrasto;
    if (a?.tipo === 'retangulo' && this.hover) {
      const x0 = Math.min(a.x0, this.hover.x), y0 = Math.min(a.y0, this.hover.y);
      const x1 = Math.max(a.x0, this.hover.x), y1 = Math.max(a.y0, this.hover.y);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(pixel(x0) + 0.5, pixel(y0) + 0.5, pixel(x1 - x0 + 1) - 1, pixel(y1 - y0 + 1) - 1);
      ctx.setLineDash([]);
    }

    if (this.hover) {
      contorno(this.hover.x, this.hover.y, 'rgba(255,255,255,0.8)');
      const ch = mapa.linhas[this.hover.y][this.hover.x];
      const quem = objetoEm(mapa, this.hover.x, this.hover.y);
      $('ed-posicao').textContent = `(${this.hover.x}, ${this.hover.y}) '${ch}' ${TILES[ch]?.nome ?? '?'}${TILES[ch]?.solido ? ', sólido' : ''}${quem ? ` · ${descrever(mapa, quem)}` : ''}`;
    }

    const d = this.destaque;
    if (d && performance.now() < d.ate) {
      if (Math.floor(tempo * 6) % 2 === 0) contorno(d.x, d.y, '#5bf0ff', 2);
    } else this.destaque = null;
  }
}

/** Ação perigosa sem confirm() (bloqueado no iframe do artefato): o 1º toque arma, o 2º confirma. */
function confirmarComSegundoToque(btn: HTMLElement, acao: () => void) {
  let armado = 0;
  btn.addEventListener('click', () => {
    if (performance.now() < armado) {
      armado = 0;
      btn.textContent = btn.dataset.texto ?? btn.textContent;
      acao();
      return;
    }
    armado = performance.now() + 3000;
    btn.dataset.texto = btn.textContent ?? '';
    btn.textContent = 'Toque de novo para confirmar';
    setTimeout(() => { if (armado && performance.now() >= armado) btn.textContent = btn.dataset.texto ?? ''; }, 3100);
  });
}
