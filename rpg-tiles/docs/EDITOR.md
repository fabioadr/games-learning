# Editor de mapa

A página do jogo tem duas abas: **Jogo** e **Editor de mapa**. É a mesma página (e o mesmo
Artefato Claude): trocar de aba não recarrega nada.

## Como usar

1. Abra a aba **Editor de mapa**. Ele começa no mapa em que o herói está.
2. Escolha um tile na paleta (o marcador vermelho no canto indica tile sólido) e pinte
   clicando ou arrastando (mouse ou dedo).
3. Volte para a aba **Jogo** (ou toque em **▶ Testar no jogo**): a mudança já está valendo.
   Pinte uma parede no caminho e veja o herói bater nela.

| Controle | O que faz |
|----------|-----------|
| Seletor de mapa | Troca o mapa em edição (`casa`, `vila`, `loja`) |
| Pincel | Pinta o tile escolhido, inclusive arrastando |
| Balde | Preenche toda a região contígua do mesmo tile |
| Colocar herói | Clique num tile livre para o herói nascer ali (recarrega o mapa, então os NPCs voltam ao início) |
| Desfazer | Volta a última pincelada ou preenchimento (até 100 passos, zera ao trocar de mapa) |
| Restaurar original | Descarta as edições do mapa e volta ao que está em `dados/mapas.ts` |
| Copiar código | Gera o campo `linhas` do mapa para colar em `dados/mapas.ts` |
| Ver colisão | Pinta de vermelho os tiles sólidos (a regra do `mundo.livre()`) |
| Ver objetos | Marcadores: `↪` portal, `◆` baú, `i` placa, letra inicial = NPC, `H` herói |

## O que o editor edita (e o que não edita)

Só a **grade de tiles** (`linhas`) de cada mapa. O tamanho do mapa é fixo. NPCs, baús, portais
e placas aparecem como marcadores, mas continuam sendo editados em `dados/mapas.ts`.
Tiles novos entram na paleta sozinhos: basta cadastrá-los em `dados/tiles.ts` (e dar um `case`
de desenho em `motor/render.ts`).

Cuidado ao pintar: o editor não impede um tile sólido em cima de NPC, baú ou portal. Ligue
**Ver colisão** e **Ver objetos** juntos para conferir.

## Como o reflexo no jogo funciona

```
 Editor ──pinta──▶ MAPAS[id].linhas ◀──lê── Mundo.livre() / render.ts
```

Não há sincronização, evento nem cópia. O editor escreve no mesmo array que o jogo lê todo
quadro, então o jogo só precisa estar rodando para enxergar. Enquanto a aba do editor está
aberta o loop não atualiza o jogo (ele fica congelado) e o editor desenha com a mesma
`desenharTile` do jogo.

Arquivos:

- `src/editor/editor.ts`: a aba (ferramentas, paleta, desenho, exportação).
- `src/editor/armazenamento.ts`: persistência no `localStorage`.
- `src/main.ts`: as abas e o loop. `Entrada.ativa` desliga o teclado do jogo na aba do editor.
- `Jogo.teleportar()`: usado por "Colocar herói".

## Persistência

Cada edição é salva no `localStorage` do navegador (chave `rpg-tiles:mapas-editados:v1`) e
reaplicada por cima de `MAPAS` quando a página abre. Isso significa:

- **Vale só neste navegador.** No Artefato, cada pessoa/dispositivo tem as suas edições.
  O iPhone não enxerga o que você pintou no desktop.
- Para tornar permanente (para todos, e no git): **Copiar código** e colar no `linhas` do
  mapa em `dados/mapas.ts`. Depois, **Restaurar original** limpa o salvo.
- Cada edição guarda o mapa original da época. Se `dados/mapas.ts` mudar depois, a edição
  antiga é descartada em vez de sobrescrever a mudança nova.
- Se o `localStorage` estiver bloqueado (aba anônima), o editor funciona, mas não persiste.

## Publicar

O editor faz parte do mesmo build: `scripts/gerar-artefato.sh` e a skill `publicar-artefato`
continuam servindo, sem mudanças. Ver [`ARTEFATO.md`](ARTEFATO.md).

## Verificado

Com Playwright (Chromium headless): pintar parede e ver o herói bloqueado no jogo; edição
sobrevivendo a reload; restaurar; balde; colocar herói; copiar código; troca de abas sem erros
no console. Não foi testado em iPhone físico (o toque usa `pointer events`, os mesmos dos botões
do jogo).
