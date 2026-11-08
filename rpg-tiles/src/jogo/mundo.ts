import type { BauDef, Dir, MapaDef, NpcDef, PlacaDef, Portal } from '../tipos';
import { MAPAS } from '../dados/mapas';
import { TILES } from '../dados/tiles';
import { criarAtor, type Ator } from '../motor/ator';
import { VEL_HEROI, VEL_NPC } from '../config';

// O Mundo guarda o ESTADO VIVO: qual mapa está carregado, onde cada um está,
// o que o jogador já fez (flags) e o que carrega (inventário).
// Os MapaDef são o "molde"; o Mundo é a "instância" em jogo.

export interface Npc {
  def: NpcDef;
  ator: Ator;
  espera: number;       // segundos até a próxima decisão da IA
  indiceRota: number;
}

export class Mundo {
  mapa!: MapaDef;
  npcs: Npc[] = [];
  heroi = criarAtor(0, 0, 'baixo', VEL_HEROI);
  flags = new Set<string>();      // persiste entre mapas: memória do mundo
  inventario: string[] = [];

  carregarMapa(id: string, x: number, y: number, olhando: Dir) {
    this.mapa = MAPAS[id];
    // Recria os NPCs a partir dos dados: ao voltar a um mapa, eles voltam à posição original
    // (igual aos RPGs de SNES).
    this.npcs = this.mapa.npcs.map((def) => ({
      def,
      ator: criarAtor(def.x, def.y, def.olhando, VEL_NPC),
      espera: 1 + Math.random() * 2,
      indiceRota: 0,
    }));
    this.heroi = criarAtor(x, y, olhando, VEL_HEROI);
  }

  get largura() { return this.mapa.linhas[0].length; }
  get altura() { return this.mapa.linhas.length; }

  tileEm(x: number, y: number): string | null {
    if (y < 0 || y >= this.altura || x < 0 || x >= this.largura) return null;
    return this.mapa.linhas[y][x];
  }

  npcEm(x: number, y: number): Npc | undefined {
    // Um ator em movimento ocupa os DOIS tiles (origem e destino) até terminar o passo.
    return this.npcs.find((n) =>
      (n.ator.x === x && n.ator.y === y) ||
      (n.ator.movendo && n.ator.deX === x && n.ator.deY === y));
  }

  bauEm(x: number, y: number): BauDef | undefined {
    return this.mapa.baus.find((b) => b.x === x && b.y === y);
  }

  placaEm(x: number, y: number): PlacaDef | undefined {
    return this.mapa.placas.find((p) => p.x === x && p.y === y);
  }

  portalEm(x: number, y: number): Portal | undefined {
    return this.mapa.portais.find((p) => p.x === x && p.y === y);
  }

  heroiEm(x: number, y: number): boolean {
    const h = this.heroi;
    return (h.x === x && h.y === y) || (h.movendo && h.deX === x && h.deY === y);
  }

  /** A pergunta central da colisão: dá para entrar neste tile? */
  livre(x: number, y: number): boolean {
    const t = this.tileEm(x, y);
    if (t === null) return false;               // fora do mapa
    if (TILES[t]?.solido ?? true) return false; // tile sólido (ou desconhecido)
    if (this.npcEm(x, y)) return false;
    if (this.bauEm(x, y)) return false;
    return true;
  }

  /** Versão para NPCs: além do normal, não pisam no herói nem em portas. */
  livreParaNpc(x: number, y: number): boolean {
    return this.livre(x, y) && !this.heroiEm(x, y) && !this.portalEm(x, y);
  }
}
