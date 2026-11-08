// Ensina: conteúdo também tem bugs. Um portal para um mapa que não existe ou um NPC dentro
// de uma parede quebram o jogo tanto quanto um erro de código, só que o compilador não vê.
// Por isso o editor confere os dados a cada mudança e lista os problemas.

import { INICIO, MAPAS } from '../dados/mapas';
import { TILES } from '../dados/tiles';
import type { MapaDef } from '../tipos';
import { dentro } from './operacoes';

export interface Aviso { x: number; y: number; texto: string }

const solido = (m: MapaDef, x: number, y: number) => TILES[m.linhas[y]?.[x]]?.solido ?? true;

export function avisos(m: MapaDef): Aviso[] {
  const lista: Aviso[] = [];
  const avisar = (x: number, y: number, texto: string) => lista.push({ x, y, texto });

  // Ocupação: quem está em cada tile.
  const ocupacao = new Map<string, string[]>();
  const ocupar = (x: number, y: number, quem: string) => {
    const k = `${x},${y}`;
    ocupacao.set(k, [...(ocupacao.get(k) ?? []), quem]);
  };
  m.npcs.forEach((n) => ocupar(n.x, n.y, `NPC ${n.nome}`));
  m.baus.forEach((b) => ocupar(b.x, b.y, `baú ${b.id}`));
  m.placas.forEach((p) => ocupar(p.x, p.y, 'placa'));
  m.portais.forEach((p) => ocupar(p.x, p.y, `portal para ${p.paraMapa}`));
  for (const [k, quem] of ocupacao) {
    const [x, y] = k.split(',').map(Number);
    if (!dentro(m, x, y)) avisar(x, y, `Fora do mapa: ${quem.join(', ')}.`);
    else if (quem.length > 1) avisar(x, y, `Dois objetos no mesmo tile: ${quem.join(' e ')}.`);
  }

  for (const n of m.npcs) {
    if (dentro(m, n.x, n.y) && solido(m, n.x, n.y)) avisar(n.x, n.y, `${n.nome} está num tile sólido.`);
  }
  const ids = m.npcs.map((n) => n.id);
  for (const n of m.npcs) if (ids.indexOf(n.id) !== ids.lastIndexOf(n.id)) avisar(n.x, n.y, `Dois NPCs com o id "${n.id}".`);

  // Id de baú vira a flag "bau:<id>", que é GLOBAL: repetir em outro mapa faz os dois baús abrirem juntos.
  for (const b of m.baus) {
    const repetidos = Object.values(MAPAS).flatMap((o) => o.baus.filter((x) => x.id === b.id && x !== b));
    if (repetidos.length) avisar(b.x, b.y, `Outro baú já usa o id "${b.id}" (a flag bau:${b.id} é a mesma).`);
  }

  for (const p of m.placas) {
    if (dentro(m, p.x, p.y) && !solido(m, p.x, p.y)) avisar(p.x, p.y, 'Placa num tile que não é sólido: o herói anda por cima dela (use o tile placa).');
  }

  for (const p of m.portais) {
    if (dentro(m, p.x, p.y) && solido(m, p.x, p.y)) avisar(p.x, p.y, 'Portal num tile sólido: o herói nunca pisa nele.');
    const destino = MAPAS[p.paraMapa];
    if (!destino) { avisar(p.x, p.y, `Portal para "${p.paraMapa}", que não existe.`); continue; }
    if (!dentro(destino, p.paraX, p.paraY)) avisar(p.x, p.y, `O destino (${p.paraX}, ${p.paraY}) fica fora de ${p.paraMapa}.`);
    else if (solido(destino, p.paraX, p.paraY)) avisar(p.x, p.y, `O destino (${p.paraX}, ${p.paraY}) em ${p.paraMapa} é sólido: o herói chega preso.`);
    else if (destino.portais.some((v) => v.x === p.paraX && v.y === p.paraY)) avisar(p.x, p.y, `O destino cai em cima de outro portal: o herói fica indo e voltando.`);
    if (!destino.portais.some((v) => v.paraMapa === m.id)) avisar(p.x, p.y, `${p.paraMapa} não tem portal de volta para cá.`);
  }

  if (INICIO.mapa === m.id && (!dentro(m, INICIO.x, INICIO.y) || solido(m, INICIO.x, INICIO.y))) {
    avisar(INICIO.x, INICIO.y, `O início do jogo (${INICIO.x}, ${INICIO.y}) ficou fora do mapa ou num tile sólido.`);
  }
  return lista;
}
