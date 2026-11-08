# Vila de Pedravento — motor de RPG 16-bit para estudo

Um RPG no estilo dos Final Fantasy de SNES, em TypeScript puro + Canvas 2D, sem engine.
O objetivo é ler o código e entender como esses jogos funcionam por dentro.

```bash
npm install
npm run dev      # abre em http://localhost:5173
npm run check    # só checa os tipos
```

Controles: setas/WASD andam, Espaço/Enter/Z interagem.

A página tem duas abas: **Jogo** e **Editor de mapa**. Pinte um tile no editor e volte ao jogo: a mudança já está lá. Veja [`docs/EDITOR.md`](docs/EDITOR.md).

Para jogar no celular, o build está publicado como Artefato Claude: veja [`docs/ARTEFATO.md`](docs/ARTEFATO.md) (`npm run artefato` gera o arquivo único).

## Ordem sugerida de leitura

| # | Arquivo | O que ensina |
|---|---------|--------------|
| 1 | `src/main.ts` | O **game loop**: ler input → atualizar → desenhar, ~60x/s, usando `dt` |
| 2 | `src/tipos.ts` | Como o mundo é descrito como **dados** (mapas, NPCs, portais, baús) |
| 3 | `src/dados/tiles.ts` e `src/dados/mapas.ts` | O mapa é uma grade de caracteres + uma legenda de atributos. A `loja` mostra que um mapa novo é só dado: portais de ida e volta, NPC, tile novo |
| 4 | `src/motor/ator.ts` | Movimento **tile a tile**: posição lógica inteira, posição visual interpolada |
| 5 | `src/jogo/mundo.ts` | Estado vivo do jogo e a função `livre(x, y)`, que é toda a colisão |
| 6 | `src/jogo/jogo.ts` | A **máquina de estados** (explorando / diálogo / transição) e os eventos |
| 7 | `src/jogo/npcIA.ts` | Comportamentos de NPC como um `switch` sobre dados |
| 8 | `src/motor/render.ts` | Câmera, ordem de desenho por Y, janelas azuis e efeito máquina de escrever |
| 9 | `src/motor/entrada.ts` | Teclado e toque alimentando a mesma interface |
| 10 | `src/motor/desenhoTiles.ts` | A aparência de cada tile, num módulo só, usado pelo jogo e pelo editor |
| 11 | `src/editor/` | Um **editor de mapas** é só outra *view* dos mesmos dados (`editor.ts` escreve em `MAPAS`, que o jogo lê). Ao lado: `operacoes.ts` (flood fill, redimensionar e a origem da grade), `objetos.ts` (camada de objetos), `validacao.ts` (conteúdo também tem bug), `historico.ts` (desfazer com fotos), `exportar.ts` e `armazenamento.ts` |

## Ideias que valem prestar atenção

- **Lógica e aparência separadas.** `tiles.ts` diz *o que* o tile é (sólido ou não); `render.ts` diz *como* ele aparece. Trocar os retângulos por um tileset PNG não mexe em nenhuma regra.
- **Posição lógica vs. visual.** No começo de um passo, `ator.x/y` já vira o destino. Isso reserva o tile e evita que dois personagens entrem no mesmo lugar. A animação é só uma interpolação.
- **Composição.** Herói e NPC não herdam de uma classe base. O NPC *tem* um `Ator` dentro dele, mais os dados de comportamento.
- **Flags.** `mundo.flags` é a memória do jogo. Abrir o baú liga `bau:pocao`, e as falas do Ancião e da Mãe mudam por causa disso. Missões inteiras de RPG são cadeias de flags.
- **Dados editáveis.** O editor não tem cópia do mapa: ele altera o mesmo `linhas` que o `Mundo` lê. Por isso cada pincelada vale no jogo na hora. Essa é a vantagem de descrever o mundo como dados (princípio 1): qualquer ferramenta consegue mexer neles.
- **Estados.** Durante o diálogo, o mundo para porque só o estado `explorando` atualiza os NPCs. Batalha, menu e loja seriam mais um `case` no `switch`.

## Evolução do projeto

Exercícios, propostas e o que já entrou ficam em [`docs/`](docs/README.md):

- [`docs/ROADMAP.md`](docs/ROADMAP.md): o que está em andamento, o próximo passo e o backlog de exercícios.
- [`docs/propostas/`](docs/propostas/): uma proposta por trabalho maior, dividida em etapas (ex.: o editor de mapas).
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md): histórico do que mudou no jogo.
