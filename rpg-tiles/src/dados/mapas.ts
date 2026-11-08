import type { MapaDef } from '../tipos';

// Os mapas são DADOS, não código. Desenhe com caracteres (legenda em tiles.ts).
// Num projeto maior você exportaria isso de um editor como o Tiled (JSON).

export const MAPAS: Record<string, MapaDef> = {
  casa: {
    id: 'casa',
    nome: 'Casa do Herói',
    linhas: [
      'wwwwwwwwwwww',
      'wffffffffffw',
      'wfccfffmmffw',
      'wffffffmmffw',
      'wff____ffffw',
      'wff____ffffw',
      'wffffffffffw',
      'wwwwwXwwwwww',
    ],
    portais: [
      { x: 5, y: 7, paraMapa: 'vila', paraX: 6, paraY: 6, olhando: 'baixo' },
    ],
    npcs: [
      {
        id: 'mae', nome: 'Mãe', x: 9, y: 5, olhando: 'esquerda',
        cores: { roupa: '#b04a7a', cabelo: '#6b3a1e' },
        comportamento: { tipo: 'parado' },
        falas: [
          'Bom dia, filho! Dormiu bem?',
          'O Ancião estava te procurando. Ele fica perto da placa do lago.',
        ],
        falasCondicionais: [
          { seFlag: 'bau:pocao', falas: ['Uma poção? Guarde bem, nunca se sabe quando vai precisar.'] },
        ],
      },
    ],
    baus: [],
    placas: [],
  },

  vila: {
    id: 'vila',
    nome: 'Vila de Pedravento',
    linhas: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T........................T',
      'T..HHHHHHH......~~~~.....T',
      'T..HHHHHHH.....~~~~~~....T',
      'T..#######.....~~~~~~~...T',
      'T..###D###......~~~~~....T',
      'T.....=..........~~......T',
      'T..,..=.......P..,.......T',
      'T.....========...........T',
      'T....,.......=......,....T',
      'T............=...........T',
      'T....T.......=.....T.....T',
      'T............=...........T',
      'T..,.........=.......,...T',
      'T............=...........T',
      'T...........,=...........T',
      'T............=...........T',
      'TTTTTTTTTTTTT=TTTTTTTTTTTT',
    ],
    portais: [
      { x: 6, y: 5, paraMapa: 'casa', paraX: 5, paraY: 6, olhando: 'cima' },
    ],
    npcs: [
      {
        id: 'anciao', nome: 'Ancião', x: 10, y: 7, olhando: 'baixo',
        cores: { roupa: '#5a4a8a', cabelo: '#e8e8e8' },
        comportamento: { tipo: 'parado' },
        falas: [
          'Ah, finalmente acordou.',
          'Dizem que há um baú escondido no canto nordeste da vila, depois do lago.',
          'Vá até lá. Fique de frente para ele e aperte o botão de ação.',
        ],
        falasCondicionais: [
          { seFlag: 'bau:pocao', falas: ['Achou o baú! Viu como o mundo lembra do que você fez?', 'Isso é uma "flag". Todo RPG é cheio delas.'] },
        ],
      },
      {
        id: 'garota', nome: 'Lia', x: 19, y: 10, olhando: 'baixo',
        cores: { roupa: '#d9822b', cabelo: '#c23b22' },
        comportamento: { tipo: 'vagando', raio: 3 },
        falas: ['Eu não consigo ficar parada!', 'Meu comportamento é "vagando": a cada poucos segundos escolho uma direção aleatória.'],
      },
      {
        id: 'lenhador', nome: 'Bruno', x: 16, y: 13, olhando: 'direita',
        cores: { roupa: '#3d7a3d', cabelo: '#2b1a0e' },
        comportamento: { tipo: 'rota', passos: ['direita', 'direita', 'direita', 'direita', 'esquerda', 'esquerda', 'esquerda', 'esquerda'] },
        falas: ['Eu sigo sempre a mesma rota, igual guarda de castelo.', 'Se você ficar no meu caminho, eu espero você sair.'],
      },
      {
        id: 'guarda', nome: 'Guarda', x: 13, y: 17, olhando: 'cima',
        cores: { roupa: '#7a7a8a', cabelo: '#3a3a3a' },
        comportamento: { tipo: 'parado' },
        falas: ['Alto lá! A estrada para o sul está fechada até o festival.', '(Este é o clássico NPC que bloqueia o caminho até você cumprir algo.)'],
      },
    ],
    baus: [
      { id: 'pocao', x: 23, y: 1, item: 'Poção' },
    ],
    placas: [
      { x: 14, y: 7, texto: ['"Lago de Pedravento. Proibido nadar."'] },
    ],
  },
};

export const INICIO = { mapa: 'casa', x: 5, y: 5, olhando: 'baixo' as const };
