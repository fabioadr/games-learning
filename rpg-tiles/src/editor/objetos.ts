// Ensina: a CAMADA DE OBJETOS, separada da camada de tiles. O chão é uma grade de caracteres;
// NPCs, baús, placas e portais são uma lista de coisas com (x, y). Por isso dá para mover um
// NPC sem repintar nada, e um tile não "sabe" quem está em cima dele.
// Aqui ficam: achar o objeto num tile, criar/remover e o formulário que edita os campos.

import { MAPAS } from '../dados/mapas';
import type { Comportamento, Dir, MapaDef } from '../tipos';

export type TipoObjeto = 'npc' | 'bau' | 'placa' | 'portal';
export interface Selecao { tipo: TipoObjeto; indice: number }
type ComPosicao = { x: number; y: number };

const LISTA = { npc: 'npcs', bau: 'baus', placa: 'placas', portal: 'portais' } as const;
const DIRECOES: Dir[] = ['baixo', 'cima', 'esquerda', 'direita'];

export function listaDe(m: MapaDef, tipo: TipoObjeto): ComPosicao[] {
  return m[LISTA[tipo]];
}

export function objetoDe(m: MapaDef, s: Selecao): ComPosicao | undefined {
  return listaDe(m, s.tipo)[s.indice];
}

/** Quem está no tile? Personagens primeiro: são o que mais se quer pegar. */
export function objetoEm(m: MapaDef, x: number, y: number): Selecao | null {
  for (const tipo of ['npc', 'bau', 'placa', 'portal'] as const) {
    const indice = listaDe(m, tipo).findIndex((o) => o.x === x && o.y === y);
    if (indice >= 0) return { tipo, indice };
  }
  return null;
}

export function descrever(m: MapaDef, s: Selecao): string {
  switch (s.tipo) {
    case 'npc': return `NPC ${m.npcs[s.indice].nome}`;
    case 'bau': return `Baú ${m.baus[s.indice].id}`;
    case 'placa': return 'Placa';
    case 'portal': return `Portal para ${m.portais[s.indice].paraMapa}`;
  }
}

function idLivre(prefixo: string, usados: string[]): string {
  let n = 1;
  while (usados.includes(`${prefixo}${n}`)) n++;
  return `${prefixo}${n}`;
}

/** Cria um objeto com valores padrão no tile (x, y) e devolve a seleção dele. */
export function criarObjeto(m: MapaDef, tipo: TipoObjeto, x: number, y: number): Selecao {
  switch (tipo) {
    case 'npc':
      m.npcs.push({
        id: idLivre('npc', m.npcs.map((n) => n.id)), nome: 'Aldeão', x, y, olhando: 'baixo',
        cores: { roupa: '#3d6fb0', cabelo: '#4a2f17' }, comportamento: { tipo: 'parado' },
        falas: ['Olá, viajante!'],
      });
      break;
    case 'bau':
      m.baus.push({ id: idLivre('bau', Object.values(MAPAS).flatMap((o) => o.baus.map((b) => b.id))), x, y, item: 'Erva' });
      break;
    case 'placa':
      m.placas.push({ x, y, texto: ['"Escreva aqui o texto da placa."'] });
      break;
    case 'portal': {
      const outro = Object.keys(MAPAS).find((id) => id !== m.id) ?? m.id;
      m.portais.push({ x, y, paraMapa: outro, paraX: 1, paraY: 1, olhando: 'baixo' });
      break;
    }
  }
  return { tipo, indice: listaDe(m, tipo).length - 1 };
}

export function removerObjeto(m: MapaDef, s: Selecao) {
  listaDe(m, s.tipo).splice(s.indice, 1);
}

// ------------------------------------------------------------------ formulário
/**
 * Monta o formulário do objeto selecionado. Cada campo chama `mudar(fazer, reconstruir)`:
 * o editor tira a foto do desfazer, aplica, salva e atualiza a tela. Os campos usam o evento
 * "change" (ao sair do campo), então cada campo editado vira UM passo de desfazer, não um
 * por letra digitada.
 */
export function montarFormulario(
  el: HTMLElement, m: MapaDef, s: Selecao,
  mudar: (fazer: () => void, reconstruir?: boolean) => void,
  irPara: (mapa: string, x: number, y: number) => void,
) {
  el.replaceChildren();
  const o = objetoDe(m, s);
  if (!o) return;

  const campo = (rotulo: string, input: HTMLElement) => {
    const label = document.createElement('label');
    label.className = 'ed-campo';
    label.append(rotulo, input);
    el.append(label);
    return input;
  };
  const texto = (rotulo: string, valor: string, aplicar: (v: string) => void) => {
    const i = Object.assign(document.createElement('input'), { type: 'text', value: valor, spellcheck: false });
    i.addEventListener('change', () => mudar(() => aplicar(i.value.trim() || valor)));
    return campo(rotulo, i);
  };
  const numero = (rotulo: string, valor: number, aplicar: (v: number) => void) => {
    const i = Object.assign(document.createElement('input'), { type: 'number', value: String(valor), step: '1' });
    i.addEventListener('change', () => { const v = Math.round(Number(i.value)); if (Number.isFinite(v)) mudar(() => aplicar(v)); });
    return campo(rotulo, i);
  };
  const cor = (rotulo: string, valor: string, aplicar: (v: string) => void) => {
    const i = Object.assign(document.createElement('input'), { type: 'color', value: valor });
    i.addEventListener('change', () => mudar(() => aplicar(i.value)));
    return campo(rotulo, i);
  };
  const escolha = (rotulo: string, opcoes: string[], valor: string, aplicar: (v: string) => void, reconstruir = false) => {
    const sel = document.createElement('select');
    for (const op of opcoes) sel.add(new Option(op, op, false, op === valor));
    sel.addEventListener('change', () => mudar(() => aplicar(sel.value), reconstruir));
    return campo(rotulo, sel);
  };
  /** Uma fala (ou linha de texto) por linha do campo. */
  const linhas = (rotulo: string, valor: string[], aplicar: (v: string[]) => void) => {
    const t = Object.assign(document.createElement('textarea'), { value: valor.join('\n'), rows: Math.max(2, valor.length + 1) });
    t.addEventListener('change', () => {
      const v = t.value.split('\n').map((l) => l.trim()).filter(Boolean);
      if (v.length) mudar(() => aplicar(v));
    });
    return campo(rotulo, t);
  };

  switch (s.tipo) {
    case 'npc': {
      const n = m.npcs[s.indice];
      texto('Id', n.id, (v) => { n.id = v; });
      texto('Nome', n.nome, (v) => { n.nome = v; });
      escolha('Olhando', DIRECOES, n.olhando, (v) => { n.olhando = v as Dir; });
      cor('Roupa', n.cores.roupa, (v) => { n.cores.roupa = v; });
      cor('Cabelo', n.cores.cabelo, (v) => { n.cores.cabelo = v; });
      escolha('Comportamento', ['parado', 'vagando', 'rota'], n.comportamento.tipo, (v) => {
        const novos: Record<string, Comportamento> = {
          parado: { tipo: 'parado' },
          vagando: { tipo: 'vagando', raio: 2 },
          rota: { tipo: 'rota', passos: ['direita', 'direita', 'esquerda', 'esquerda'] },
        };
        n.comportamento = novos[v];
      }, true);
      const c = n.comportamento;
      if (c.tipo === 'vagando') numero('Raio (tiles)', c.raio, (v) => { c.raio = Math.max(1, v); });
      if (c.tipo === 'rota') {
        texto('Passos (separados por vírgula)', c.passos.join(', '), (v) => {
          const passos = v.split(/[,\s]+/).filter((p): p is Dir => DIRECOES.includes(p as Dir));
          if (passos.length) c.passos = passos;
        });
      }
      linhas('Falas (uma por linha)', n.falas, (v) => { n.falas = v; });
      if (n.falasCondicionais?.length) {
        el.insertAdjacentHTML('beforeend', `<p class="ed-nota">${n.falasCondicionais.length} fala(s) condicional(is) por flag: são preservadas, mas editadas em <code>dados/mapas.ts</code>.</p>`);
      }
      break;
    }
    case 'bau': {
      const b = m.baus[s.indice];
      texto('Id (vira a flag bau:id)', b.id, (v) => { b.id = v; });
      texto('Item', b.item, (v) => { b.item = v; });
      break;
    }
    case 'placa': {
      const p = m.placas[s.indice];
      linhas('Texto (uma janela por linha)', p.texto, (v) => { p.texto = v; });
      break;
    }
    case 'portal': {
      const p = m.portais[s.indice];
      escolha('Leva para o mapa', Object.keys(MAPAS), p.paraMapa, (v) => { p.paraMapa = v; });
      numero('Chega em X', p.paraX, (v) => { p.paraX = v; });
      numero('Chega em Y', p.paraY, (v) => { p.paraY = v; });
      escolha('Chega olhando', DIRECOES, p.olhando, (v) => { p.olhando = v as Dir; });
      const ir = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Ver o destino ↪' });
      ir.addEventListener('click', () => irPara(p.paraMapa, p.paraX, p.paraY));
      el.append(ir);
      break;
    }
  }
}
