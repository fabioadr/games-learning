import type { TileDef } from '../tipos';

// A "legenda" do mapa. Cada caractere das linhas do mapa vira um destes.
// Num jogo de SNES isso seria uma tabela de atributos por índice do tileset:
// o tile 37 é "água", é sólido, faz barulho de splash, etc.

export const TILES: Record<string, TileDef> = {
  '.': { nome: 'grama',   solido: false },
  ',': { nome: 'flor',    solido: false },
  '=': { nome: 'caminho', solido: false },
  'T': { nome: 'arvore',  solido: true  },
  '~': { nome: 'agua',    solido: true  },
  'H': { nome: 'telhado', solido: true  },
  '#': { nome: 'parede',  solido: true  },
  'D': { nome: 'porta',   solido: false },
  'P': { nome: 'placa',   solido: true  },
  // interiores
  'f': { nome: 'piso',    solido: false },
  'w': { nome: 'muro',    solido: true  },
  'm': { nome: 'mesa',    solido: true  },
  'c': { nome: 'cama',    solido: true  },
  '_': { nome: 'tapete',  solido: false },
  'p': { nome: 'prateleira', solido: true },
  'X': { nome: 'saida',   solido: false },
};
