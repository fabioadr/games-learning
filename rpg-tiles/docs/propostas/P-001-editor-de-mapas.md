# P-001: Editor de mapas e tiles

| Campo | Valor |
|-------|-------|
| Status | Rascunho |
| Criada em | 2026-11-08 |
| Depende de | Nada para as etapas 0 a 9. A etapa 10 depende de E-04 (tileset PNG) |

## Objetivo

Um editor visual, no navegador, para criar e alterar o conteúdo do jogo (mapas, objetos
e tipos de tile) sem escrever arrays de texto à mão. Ele cresce em etapas pequenas: cada
uma já é útil sozinha e nenhuma exige terminar a próxima.

## O que se aprende

Todo jogo de tiles tem uma ferramenta assim (o RPG Maker nasceu disso), e construir uma
treina coisas que o jogo sozinho não treina:

- Converter coordenadas de tela em coordenadas de tile (o caminho inverso da câmera).
- Flood fill (o balde de tinta) e o padrão Command (desfazer e refazer).
- Separar a camada de tiles da camada de entidades (NPCs, baús, portais).
- Validar conteúdo: dados ruins quebram o jogo tanto quanto código ruim.
- Desacoplar o motor do conteúdo, a ponto de o motor rodar um mapa que nunca foi salvo.
- Montar um pipeline de ferramentas: o editor grava arquivos e o jogo recarrega sozinho.

## Fora do escopo

- Editar diálogos longos, missões ou scripts de evento. Fica para uma proposta futura.
- Camadas múltiplas de tiles (chão + decoração por cima). O motor ainda só tem uma.
- Compatibilidade com o formato do Tiled. Isso é o exercício E-07.
- Qualquer dependência de runtime (React, bibliotecas de UI). Só TypeScript e Canvas 2D,
  como o jogo.

## Etapas

Etapas 1 a 4 precisam funcionar com toque, porque o dono testa no iPhone.

- [ ] **Etapa 0: base.** Página `editor.html` no mesmo projeto Vite. O desenho de cada
  tile sai de `render.ts` para um módulo compartilhado (`motor/desenhoTiles.ts`), usado
  pelo jogo e pelo editor. **Pronto quando:** o editor abre e mostra a vila exatamente
  como o jogo desenha, e o jogo continua igual. **Conceito:** reaproveitar o renderizador
  sem duplicar código.

- [ ] **Etapa 1: navegar e inspecionar.** Escolher o mapa, zoom, arrastar a vista, grade
  ligável e um painel com coordenada, caractere, nome e "sólido?" do tile sob o
  dedo/cursor. Um modo que pinta de vermelho os tiles sólidos. **Pronto quando:** dá para
  achar qualquer tile da vila e saber se ele bloqueia. **Conceito:** tela → mundo → tile.

- [ ] **Etapa 2: pintar.** Paleta com todos os tiles de `TILES` e pincel com clique ou
  arrasto. As mudanças ficam só na memória. **Pronto quando:** dá para abrir um caminho
  novo na vila arrastando o dedo. **Conceito:** a grade como estado mutável; pointer
  events e captura de ponteiro.

- [ ] **Etapa 3: exportar e importar.** Botão que gera o bloco `linhas: [...]` pronto
  para colar em `mapas.ts`, com botão de copiar. Campo para colar linhas e carregar.
  Validação: todas as linhas com a mesma largura e só caracteres conhecidos.
  **Pronto quando:** um mapa editado volta para o jogo por copiar e colar.
  **Conceito:** serialização e validação de conteúdo.

- [ ] **Etapa 4: ferramentas.** Balde (flood fill), retângulo, conta-gotas, desfazer e
  refazer. **Pronto quando:** dá para trocar toda a grama de uma área num toque e
  desfazer. **Conceito:** flood fill com fila (BFS); padrão Command.

- [ ] **Etapa 5: mapa novo e redimensionar.** Criar mapa vazio de L×A preenchido com um
  tile, e adicionar ou remover linhas e colunas nas bordas, deslocando objetos junto.
  **Pronto quando:** dá para criar o interior da loja do E-01 do zero. **Conceito:**
  coordenadas de entidades dependem da origem da grade.

- [ ] **Etapa 6: camada de objetos.** NPCs, baús, placas e portais aparecem como
  marcadores que se arrastam. Um painel edita os campos (nome, falas, item, destino do
  portal). Avisos: objeto em tile sólido, dois objetos no mesmo tile, portal para mapa
  inexistente ou sem volta. O export da etapa 3 passa a incluir esses dados. **Pronto
  quando:** dá para montar a loja do E-01 inteira no editor, com porta nos dois sentidos.
  **Conceito:** camada de tiles vs. camada de entidades.

- [ ] **Etapa 7: testar no jogo.** Botão "jogar daqui": roda o motor de verdade com o
  mapa em memória, herói no tile escolhido. Exige que `Jogo`/`Mundo` recebam o catálogo
  de mapas por parâmetro em vez de importar `MAPAS` direto. **Pronto quando:** dá para
  editar, testar e voltar ao editor sem salvar nada. **Conceito:** motor que não conhece
  o conteúdo (injeção do catálogo de dados).

- [ ] **Etapa 8: mapas em JSON e salvar direto.** Os mapas saem de `mapas.ts` para
  `src/dados/mapas/*.json`. Um plugin do Vite, só em `npm run dev`, expõe uma rota que
  grava o arquivo. O editor ganha "Salvar", e o jogo recarrega sozinho. **Pronto
  quando:** salvar no editor muda o jogo aberto em outra aba sem copiar e colar.
  **Conceito:** pipeline de conteúdo e hot reload. Prepara o terreno para o E-07.

- [ ] **Etapa 9: editor de tipos de tile.** Criar e editar entradas da legenda
  (caractere, nome, sólido) com uma aparência simples (cor base e um detalhe).
  **Pronto quando:** dá para criar um tile "ponte" sobre a água sem tocar no código.
  **Conceito:** atributos de tile como tabela de dados, igual às tabelas dos jogos de SNES.

- [ ] **Etapa 10: editor de pixels 16×16.** Depende do E-04. Desenhar tiles pixel a pixel
  no tileset, com paleta limitada a 16 cores (como os tiles 4bpp do SNES) e prévia ao
  vivo no mapa. **Pronto quando:** um tile redesenhado aparece no jogo.
  **Conceito:** tileset, paleta indexada e por que os consoles limitavam cores.

## Decisões técnicas

- **Onde mora:** recomendado dentro de `rpg-tiles/`, como segunda página do Vite
  (`editor.html` + `src/editor/`). Assim o editor importa `tipos.ts`, `TILES` e o
  desenho dos tiles do próprio jogo, e não existe chance de os dois divergirem. A
  alternativa é uma pasta irmã `editor-mapas/`, mais isolada, mas que teria de importar
  código de outro projeto.
- **Estado do editor:** um objeto de dados (mapa em edição, ferramenta, seleção) mais
  funções que o alteram, no mesmo estilo do `Mundo`. Sem framework.
- **Desfazer:** cada edição vira um comando com `aplicar()` e `desfazer()`, guardado numa
  pilha. Começa na etapa 4; as etapas anteriores não precisam pensar nisso.
- **Salvar no celular:** o Artefato não deixa baixar arquivos, mas deixa copiar. Por isso
  as etapas 1 a 7 usam copiar e colar, e o "Salvar" direto da etapa 8 só existe rodando
  `npm run dev` no computador.

## Perguntas em aberto

1. Editor dentro de `rpg-tiles/` (recomendado) ou em pasta irmã?
2. Publicar o editor como um segundo Artefato, para usar no iPhone? Se sim, a partir de
   qual etapa? A sugestão é a etapa 3, quando ele já devolve algo para o jogo.
3. Fazer o E-04 (tileset PNG) antes da etapa 9, para o editor de tiles já nascer
   trabalhando com imagem?

## Diário

_Nenhuma etapa feita ainda._
