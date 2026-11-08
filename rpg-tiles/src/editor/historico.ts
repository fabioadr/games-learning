// Ensina: desfazer/refazer com FOTOS (o padrão Memento). Antes de cada ação o editor tira
// uma foto do catálogo inteiro de mapas; desfazer é voltar para a foto anterior.
//
// A proposta P-001 sugeria o padrão Command (cada ação sabe se desfazer). Para mapas de
// poucos KB, a foto é bem mais simples e não erra: redimensionar mexe em objetos e em portais
// de OUTROS mapas, e escrever o "desfazer" de cada uma dessas ações à mão seria fácil de
// esquecer um detalhe. O custo é memória (100 fotos de ~10 KB) — nada para um navegador.

import { MAPAS } from '../dados/mapas';

const MAX_PASSOS = 100;

function foto(): string {
  return JSON.stringify(MAPAS);
}

/** Volta o catálogo para uma foto, mantendo os MESMOS objetos MapaDef (o Mundo aponta para eles). */
function revelar(json: string) {
  const catalogo = JSON.parse(json);
  for (const id of Object.keys(MAPAS)) if (!(id in catalogo)) delete MAPAS[id];
  for (const [id, def] of Object.entries(catalogo)) {
    if (MAPAS[id]) Object.assign(MAPAS[id], def);
    else MAPAS[id] = def as (typeof MAPAS)[string];
  }
}

export class Historico {
  private passado: string[] = [];
  private futuro: string[] = [];
  private pendente: string | null = null;

  /** Antes de uma ação (ou no começo de um arrasto): tira a foto. */
  iniciar() {
    if (this.pendente === null) this.pendente = foto();
  }

  /** Depois: se algo mudou, a foto vira um passo de desfazer. Devolve true se mudou. */
  concluir(): boolean {
    const antes = this.pendente;
    this.pendente = null;
    if (antes === null || antes === foto()) return false;
    this.passado.push(antes);
    if (this.passado.length > MAX_PASSOS) this.passado.shift();
    this.futuro = [];   // uma ação nova apaga o "refazer"
    return true;
  }

  /** Atalho para ações de um passo só (clique, botão). */
  acao(fazer: () => void): boolean {
    this.iniciar();
    fazer();
    return this.concluir();
  }

  desfazer(): boolean {
    const f = this.passado.pop();
    if (f === undefined) return false;
    this.futuro.push(foto());
    revelar(f);
    return true;
  }

  refazer(): boolean {
    const f = this.futuro.pop();
    if (f === undefined) return false;
    this.passado.push(foto());
    revelar(f);
    return true;
  }

  get podeDesfazer() { return this.passado.length > 0; }
  get podeRefazer() { return this.futuro.length > 0; }
}
