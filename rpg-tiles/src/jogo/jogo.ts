import type { Portal } from '../tipos';
import { VEL_TEXTO } from '../config';
import { INICIO } from '../dados/mapas';
import { atualizarAtor, frente, OPOSTA, tentarAndar } from '../motor/ator';
import type { Entrada } from '../motor/entrada';
import { Mundo } from './mundo';
import { atualizarNpc } from './npcIA';

// =====================================================================
//  A MÁQUINA DE ESTADOS — o coração do jogo.
//  Em cada momento o jogo está em UM estado. O estado decide:
//    1) quem recebe o input,  2) o que se mexe,  3) o que é desenhado por cima.
//  Batalha, menu e loja seriam simplesmente mais estados aqui.
// =====================================================================

export type Estado =
  | { tipo: 'explorando' }
  | { tipo: 'dialogo'; quem: string | null; falas: string[]; indice: number; letras: number }
  | { tipo: 'transicao'; fase: 'escurecendo' | 'clareando'; t: number; destino: Portal };

export class Jogo {
  mundo = new Mundo();
  estado: Estado = { tipo: 'explorando' };
  banner = { texto: '', tempo: 0 };   // nome do mapa que aparece ao entrar

  constructor(private entrada: Entrada) {
    this.mundo.carregarMapa(INICIO.mapa, INICIO.x, INICIO.y, INICIO.olhando);
    this.mostrarBanner();
  }

  atualizar(dt: number) {
    this.banner.tempo = Math.max(0, this.banner.tempo - dt);

    switch (this.estado.tipo) {
      case 'explorando': return this.atualizarExplorando(dt);
      case 'dialogo':    return this.atualizarDialogo(dt);
      case 'transicao':  return this.atualizarTransicao(dt);
    }
  }

  /** Usado pelo editor de mapas: recoloca o herói e volta ao estado "explorando". */
  teleportar(mapa: string, x: number, y: number) {
    const outroMapa = this.mundo.mapa.id !== mapa;
    this.mundo.carregarMapa(mapa, x, y, 'baixo');
    this.estado = { tipo: 'explorando' };
    this.entrada.soltarTudo();
    if (outroMapa) this.mostrarBanner();
  }

  // ---------------------------------------------------------------- explorando
  private atualizarExplorando(dt: number) {
    const { mundo, entrada } = this;
    const heroi = mundo.heroi;

    // O mundo só "vive" neste estado: durante diálogos, todos congelam.
    for (const npc of mundo.npcs) atualizarNpc(npc, mundo, dt);

    if (!heroi.movendo) {
      if (entrada.consumirAcao()) {
        this.interagir();
        return;
      }
      const dir = entrada.direcao();
      if (dir) tentarAndar(heroi, dir, (x, y) => mundo.livre(x, y));
    }

    const terminouPasso = atualizarAtor(heroi, dt);
    if (terminouPasso) {
      // Eventos de "pisar em cima": portas, escadas, armadilhas, encontros aleatórios...
      const portal = mundo.portalEm(heroi.x, heroi.y);
      if (portal) this.estado = { tipo: 'transicao', fase: 'escurecendo', t: 0, destino: portal };
    }
  }

  /** Eventos de "apertar ação olhando para algo". */
  private interagir() {
    const { mundo } = this;
    const [fx, fy] = frente(mundo.heroi);

    const npc = mundo.npcEm(fx, fy);
    if (npc && !npc.ator.movendo) {
      npc.ator.olhando = OPOSTA[mundo.heroi.olhando]; // o NPC vira para você
      const cond = npc.def.falasCondicionais?.find((c) => mundo.flags.has(c.seFlag));
      this.abrirDialogo(npc.def.nome, cond ? cond.falas : npc.def.falas);
      return;
    }

    const bau = mundo.bauEm(fx, fy);
    if (bau) {
      const flag = `bau:${bau.id}`;
      if (mundo.flags.has(flag)) {
        this.abrirDialogo(null, ['O baú está vazio.']);
      } else {
        mundo.flags.add(flag);
        mundo.inventario.push(bau.item);
        this.abrirDialogo(null, [`Você encontrou: ${bau.item}!`]);
      }
      return;
    }

    const placa = mundo.placaEm(fx, fy);
    if (placa) this.abrirDialogo(null, placa.texto);
  }

  // ---------------------------------------------------------------- diálogo
  private abrirDialogo(quem: string | null, falas: string[]) {
    this.estado = { tipo: 'dialogo', quem, falas, indice: 0, letras: 0 };
  }

  private atualizarDialogo(dt: number) {
    const e = this.estado;
    if (e.tipo !== 'dialogo') return;
    const fala = e.falas[e.indice];
    e.letras = Math.min(fala.length, e.letras + dt * VEL_TEXTO); // efeito máquina de escrever

    if (this.entrada.consumirAcao()) {
      if (e.letras < fala.length) {
        e.letras = fala.length;                  // 1º aperto: mostra tudo
      } else if (e.indice < e.falas.length - 1) {
        e.indice++; e.letras = 0;                // próxima fala
      } else {
        this.estado = { tipo: 'explorando' };    // fim da conversa
      }
    }
  }

  // ---------------------------------------------------------------- transição
  private atualizarTransicao(dt: number) {
    const e = this.estado;
    if (e.tipo !== 'transicao') return;
    e.t += dt * 3;
    if (e.t < 1) return;

    if (e.fase === 'escurecendo') {
      // Tela totalmente preta: hora de trocar o mapa sem o jogador ver.
      const d = e.destino;
      this.mundo.carregarMapa(d.paraMapa, d.paraX, d.paraY, d.olhando);
      this.mostrarBanner();
      this.estado = { tipo: 'transicao', fase: 'clareando', t: 0, destino: d };
    } else {
      this.entrada.limparAcao();
      this.estado = { tipo: 'explorando' };
    }
  }

  /** 0 = tela normal, 1 = tela preta. */
  get escuridao(): number {
    const e = this.estado;
    if (e.tipo !== 'transicao') return 0;
    const t = Math.min(1, e.t);
    return e.fase === 'escurecendo' ? t : 1 - t;
  }

  private mostrarBanner() {
    this.banner = { texto: this.mundo.mapa.nome, tempo: 2.2 };
  }
}
