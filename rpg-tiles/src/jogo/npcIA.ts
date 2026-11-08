import type { Dir } from '../tipos';
import { atualizarAtor, DELTA, tentarAndar } from '../motor/ator';
import type { Mundo, Npc } from './mundo';

// A "inteligência" dos NPCs: um switch sobre o tipo de comportamento definido nos dados.
// Para criar um comportamento novo (seguir o herói, fugir, etc.), você adiciona um tipo
// em tipos.ts e um "case" aqui. Nenhum outro arquivo precisa mudar.

const DIRECOES: Dir[] = ['cima', 'baixo', 'esquerda', 'direita'];

export function atualizarNpc(npc: Npc, mundo: Mundo, dt: number) {
  atualizarAtor(npc.ator, dt);
  if (npc.ator.movendo) return;

  npc.espera -= dt;
  if (npc.espera > 0) return;

  const comp = npc.def.comportamento;
  const livre = (x: number, y: number) => mundo.livreParaNpc(x, y);

  switch (comp.tipo) {
    case 'parado':
      npc.espera = Infinity;
      break;

    case 'vagando': {
      const dir = DIRECOES[Math.floor(Math.random() * 4)];
      const [dx, dy] = DELTA[dir];
      // Só anda se continuar dentro do raio em torno da posição original.
      const dentroDoRaio =
        Math.abs(npc.ator.x + dx - npc.def.x) <= comp.raio &&
        Math.abs(npc.ator.y + dy - npc.def.y) <= comp.raio;
      if (dentroDoRaio) tentarAndar(npc.ator, dir, livre);
      else npc.ator.olhando = dir;
      npc.espera = 0.8 + Math.random() * 2;
      break;
    }

    case 'rota': {
      const dir = comp.passos[npc.indiceRota];
      if (tentarAndar(npc.ator, dir, livre)) {
        npc.indiceRota = (npc.indiceRota + 1) % comp.passos.length;
        npc.espera = 0.15;
      } else {
        npc.espera = 0.5; // bloqueado: espera e tenta de novo
      }
      break;
    }
  }
}
