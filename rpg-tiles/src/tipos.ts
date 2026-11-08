// Tipos que descrevem o MUNDO como dados.
// Repare que nada aqui tem lógica: são só formatos. O motor lê esses dados e age.

export type Dir = 'cima' | 'baixo' | 'esquerda' | 'direita';

/** Como um tipo de tile se comporta. A aparência fica no renderizador. */
export interface TileDef {
  nome: string;
  solido: boolean;   // bloqueia passagem?
}

/** Um ponto do mapa que leva a outro mapa (porta, escada, saída). */
export interface Portal {
  x: number; y: number;
  paraMapa: string;
  paraX: number; paraY: number;
  olhando: Dir;      // para onde o herói fica virado ao chegar
}

/** Comportamentos possíveis de um NPC (união discriminada pelo campo "tipo"). */
export type Comportamento =
  | { tipo: 'parado' }
  | { tipo: 'vagando'; raio: number }
  | { tipo: 'rota'; passos: Dir[] };

/** Falas que só valem se uma flag do mundo estiver ligada. */
export interface FalaCondicional {
  seFlag: string;
  falas: string[];
}

export interface NpcDef {
  id: string;
  nome: string;
  x: number; y: number;
  olhando: Dir;
  cores: { roupa: string; cabelo: string };
  comportamento: Comportamento;
  falas: string[];
  falasCondicionais?: FalaCondicional[];  // a primeira que bater ganha
}

export interface BauDef {
  id: string;           // também vira a flag "bau:<id>" quando aberto
  x: number; y: number;
  item: string;
}

export interface PlacaDef {
  x: number; y: number;
  texto: string[];
}

export interface MapaDef {
  id: string;
  nome: string;
  linhas: string[];     // cada caractere é um tile (veja dados/tiles.ts)
  portais: Portal[];
  npcs: NpcDef[];
  baus: BauDef[];
  placas: PlacaDef[];
}
