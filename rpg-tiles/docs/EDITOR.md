# Editor de mapa

A página do jogo tem duas abas: **Jogo** e **Editor de mapa**. É a mesma página (e o mesmo
Artefato Claude): trocar de aba não recarrega nada. O plano completo do editor, etapa por
etapa, está na proposta [P-001](propostas/P-001-editor-de-mapas.md).

## Como usar

1. Abra a aba **Editor de mapa**. Ele começa no mapa em que o herói está.
2. Escolha um tile na paleta (o marcador vermelho no canto indica tile sólido) e pinte.
3. Volte para a aba **Jogo** (ou toque em **▶ Testar no jogo**): a mudança já está valendo.

### Ferramentas

| Ferramenta | O que faz |
|------------|-----------|
| Pincel | Pinta o tile escolhido, clicando ou arrastando (mouse ou dedo) |
| Balde | Preenche toda a região contígua do mesmo tile |
| Retângulo | Arraste de um canto ao outro para preencher a área |
| Conta-gotas | Toque num tile do mapa para usá-lo como pincel |
| Objetos | Toque num NPC, baú, placa ou portal para editar e arraste para mover. Num tile vazio aparecem os botões **+ NPC**, **+ Baú**, **+ Placa** e **+ Portal** |
| Herói | Toque num tile livre para o herói ir para lá (recarrega o mapa, então os NPCs voltam ao início) |
| Mão | Arraste para mover a vista quando o zoom deixa o mapa maior que a tela (no celular, o dedo no mapa pinta; a Mão é o jeito de rolar) |

### Outros controles

| Controle | O que faz |
|----------|-----------|
| Seletor de mapa | Troca o mapa em edição. `•` = editado |
| Desfazer / Refazer | Até 100 passos, valem para todos os mapas. Atalhos `Ctrl+Z` e `Ctrl+Shift+Z` (ou `Ctrl+Y`) |
| Zoom − / + | 1x a 4x |
| Grade, Colisão, Objetos | Linhas da grade; vermelho nos tiles sólidos (a regra do `mundo.livre()`); marcadores `↪` portal, `◆` baú, `i` placa, inicial do NPC, `H` herói |
| Avisos | Problemas de conteúdo do mapa aberto. Toque num aviso para piscar o tile |
| Mapa: nome e tamanho | Renomear; +/− linha ou coluna em cada borda (preenche com o tile do pincel); **Restaurar original** (mapas do código) ou **Apagar mapa** (mapas criados no editor). Os dois pedem um segundo toque para confirmar |
| Novo mapa | Id, nome, largura e altura (3 a 64), preenchido com o tile do pincel |
| Importar linhas | Cole o trecho `linhas: [...]` de `mapas.ts` (ou uma linha do mapa por linha de texto). Valida largura e caracteres |
| Código do mapa | A entrada inteira do mapa em `MAPAS` (tiles e objetos), pronta para colar em `dados/mapas.ts` |

Com um objeto selecionado, `Delete` remove e `Esc` tira a seleção.

### Campos por objeto

- **NPC:** id, nome, direção, cores da roupa e do cabelo, comportamento (`parado`; `vagando`
  com raio; `rota` com passos separados por vírgula) e falas (uma por linha). As falas
  condicionais por flag são preservadas, mas ainda se editam em `dados/mapas.ts`.
- **Baú:** id (vira a flag `bau:<id>`, que é global) e item.
- **Placa:** texto, uma janela por linha. Criar uma placa pinta o tile `placa` embaixo, para
  o herói não andar por cima dela.
- **Portal:** mapa de destino, X e Y de chegada e a direção. **Ver o destino** abre o outro
  mapa e pisca o tile de chegada.

## Avisos

O editor confere o conteúdo a cada mudança (`src/editor/validacao.ts`):

- objetos fora do mapa ou dois objetos no mesmo tile;
- NPC ou portal em tile sólido; placa em tile que não é sólido;
- portal para mapa que não existe, chegada fora do mapa, em tile sólido ou em cima de outro
  portal (o herói ficaria indo e voltando), destino sem portal de volta;
- NPCs com o mesmo id no mapa; baús com o mesmo id em qualquer mapa (a flag seria a mesma);
- início do jogo (`INICIO`) fora do mapa ou num tile sólido.

Avisos não impedem nada: é possível estar no meio de uma mudança (ex.: criou o portal de ida
e ainda vai criar o de volta).

## Redimensionar e a origem da grade

Somar ou tirar uma linha **em cima** (ou uma coluna **à esquerda**) muda onde fica o (0, 0).
Por isso o editor desloca junto: NPCs, baús, placas e portais do mapa, **os portais de outros
mapas que chegam nele** e o herói, se ele estiver ali. Objetos que caem fora são removidos
(Desfazer traz de volta). Embaixo e à direita nada se desloca. O `INICIO` do jogo não se
desloca, por isso existe o aviso.

## Como o reflexo no jogo funciona

```
 Editor ──escreve──▶ MAPAS[id] ◀──lê── Mundo.livre() / render.ts
```

Não há sincronização nem cópia: o editor escreve no mesmo objeto que o jogo lê. Enquanto a aba
do editor está aberta o loop não atualiza o jogo (ele fica congelado), e o editor desenha os
tiles com a mesma função do jogo (`motor/desenhoTiles.ts`).

Uma exceção: os NPCs vivos (com posição e IA) são criados a partir dos dados quando o mapa
carrega. Por isso, ao voltar para a aba Jogo, se objetos ou o tamanho do mapa atual mudaram, o
mapa é recarregado com o herói no mesmo lugar. Mudanças só de tiles não recarregam nada.

Para o desfazer funcionar sem quebrar essa ligação, restaurar uma foto usa `Object.assign` no
**mesmo** objeto `MapaDef`, em vez de trocá-lo por outro.

## Arquivos

| Arquivo | Papel |
|---------|-------|
| `src/editor/editor.ts` | A aba: ponteiro (tela → tile), ferramentas, painéis e desenho |
| `src/editor/operacoes.ts` | Funções puras: pintar, balde, retângulo, redimensionar, novo mapa, ler linhas |
| `src/editor/objetos.ts` | Camada de objetos: achar, criar, remover e o formulário de campos |
| `src/editor/validacao.ts` | Avisos de conteúdo |
| `src/editor/historico.ts` | Desfazer e refazer com fotos do catálogo (padrão Memento) |
| `src/editor/exportar.ts` | Mapa em memória → texto TypeScript |
| `src/editor/armazenamento.ts` | Persistência no `localStorage` |
| `src/motor/desenhoTiles.ts` | Aparência dos tiles, compartilhada com o jogo |
| `src/main.ts` | As abas e o loop. `Entrada.ativa` desliga o teclado do jogo na aba do editor |
| `Jogo.teleportar()` | Usado por "Herói" e pela sincronização ao voltar ao jogo |

## Persistência

Os mapas editados (inteiros) e os criados no editor são salvos no `localStorage` do navegador
(chave `rpg-tiles:mapas-editados:v2`) e reaplicados por cima de `MAPAS` quando a página abre.
Edições da versão anterior (só tiles, chave `v1`) são migradas.

- **Vale só neste navegador.** No Artefato, cada pessoa/dispositivo tem as suas edições.
  O iPhone não enxerga o que você editou no desktop.
- Para tornar permanente (para todos, e no git): **Copiar código** e substituir a entrada do
  mapa em `MAPAS` (`dados/mapas.ts`), ou colar como entrada nova no caso de um mapa criado no
  editor. Depois, **Restaurar original** limpa o salvo.
- Cada edição guarda o mapa original da época. Se `dados/mapas.ts` mudar depois, a edição
  antiga é descartada em vez de sobrescrever a mudança nova.
- Se o `localStorage` estiver bloqueado (aba anônima), o editor funciona, mas não persiste.

## Limites atuais

- Falas condicionais e o `INICIO` do jogo ainda se editam só no código.
- Uma camada de tiles só (como o motor).
- Salvar direto no arquivo (sem copiar e colar) é a etapa 8 da P-001.

## Publicar

O editor faz parte do mesmo build: `scripts/gerar-artefato.sh` e a skill `publicar-artefato`
servem sem mudanças. Ver [`ARTEFATO.md`](ARTEFATO.md).

## Verificado

Com Playwright (Chromium headless, desktop): retângulo, desfazer e refazer, conta-gotas;
+1 linha em cima na vila deslocando NPCs e o portal da casa que chega nela, sem avisos; mover
e renomear o Ancião e vê-lo no jogo; criar e remover baú; criar mapa novo com portal (aviso de
"sem volta" aparece); importar linhas inválidas (erro) e válidas; apagar mapa com dois toques;
colocar o herói e jogar; edições sobrevivendo a reload; sem erros no console. No iPhone 13
emulado: tocar seleciona objeto, zoom funciona, sem rolagem horizontal da página. Não foi
testado em um iPhone físico.
