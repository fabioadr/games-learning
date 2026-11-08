# Vila de Pedravento — motor de RPG 16-bit para estudo

Um RPG no estilo dos Final Fantasy de SNES, em TypeScript puro + Canvas 2D, sem engine.
O objetivo é ler o código e entender como esses jogos funcionam por dentro.

```bash
npm install
npm run dev      # abre em http://localhost:5173
npm run check    # só checa os tipos
```

Controles: setas/WASD andam, Espaço/Enter/Z interagem.

## Ordem sugerida de leitura

| # | Arquivo | O que ensina |
|---|---------|--------------|
| 1 | `src/main.ts` | O **game loop**: ler input → atualizar → desenhar, ~60x/s, usando `dt` |
| 2 | `src/tipos.ts` | Como o mundo é descrito como **dados** (mapas, NPCs, portais, baús) |
| 3 | `src/dados/tiles.ts` e `src/dados/mapas.ts` | O mapa é uma grade de caracteres + uma legenda de atributos |
| 4 | `src/motor/ator.ts` | Movimento **tile a tile**: posição lógica inteira, posição visual interpolada |
| 5 | `src/jogo/mundo.ts` | Estado vivo do jogo e a função `livre(x, y)`, que é toda a colisão |
| 6 | `src/jogo/jogo.ts` | A **máquina de estados** (explorando / diálogo / transição) e os eventos |
| 7 | `src/jogo/npcIA.ts` | Comportamentos de NPC como um `switch` sobre dados |
| 8 | `src/motor/render.ts` | Câmera, ordem de desenho por Y, janelas azuis e efeito máquina de escrever |
| 9 | `src/motor/entrada.ts` | Teclado e toque alimentando a mesma interface |

## Ideias que valem prestar atenção

- **Lógica e aparência separadas.** `tiles.ts` diz *o que* o tile é (sólido ou não); `render.ts` diz *como* ele aparece. Trocar os retângulos por um tileset PNG não mexe em nenhuma regra.
- **Posição lógica vs. visual.** No começo de um passo, `ator.x/y` já vira o destino. Isso reserva o tile e evita que dois personagens entrem no mesmo lugar. A animação é só uma interpolação.
- **Composição.** Herói e NPC não herdam de uma classe base. O NPC *tem* um `Ator` dentro dele, mais os dados de comportamento.
- **Flags.** `mundo.flags` é a memória do jogo. Abrir o baú liga `bau:pocao`, e as falas do Ancião e da Mãe mudam por causa disso. Missões inteiras de RPG são cadeias de flags.
- **Estados.** Durante o diálogo, o mundo para porque só o estado `explorando` atualiza os NPCs. Batalha, menu e loja seriam mais um `case` no `switch`.

## Exercícios, em ordem de dificuldade

1. Crie um terceiro mapa (uma loja) com uma porta nova na vila.
2. Faça o Guarda sair do caminho quando a flag `bau:pocao` estiver ligada.
3. Adicione o estado `menu` (tecla Esc) que lista o inventário numa janela azul.
4. Troque os retângulos por um tileset de imagem (`drawImage` recortando 16x16).
5. Adicione encontros aleatórios na grama: a cada passo, 1 chance em 20 de entrar no estado `batalha`.
6. Implemente a batalha ATB: cada combatente tem uma barra que enche com a velocidade; cheia, ele age.
7. Exporte os mapas do editor [Tiled](https://www.mapeditor.org/) em JSON em vez de escrever as linhas à mão.
