# Roadmap do rpg-tiles

Painel único de evolução. Cada linha aponta para a proposta quando existe uma.
Como usar: [`docs/README.md`](README.md). Última revisão: 2026-11-08.

## Em andamento

_Nada no momento._

## Próximo

| ID | Item | Status | Proposta |
|----|------|--------|----------|
| P-002 | Separar o motor do jogo: fronteira verificada dentro do projeto (etapas 1 a 7), pacote e segundo jogo depois (8 e 9). Sugestão: etapas 1 a 4 antes da P-001 | Rascunho | [P-002](propostas/P-002-separar-motor-do-jogo.md) |
| P-001 | Editor de mapas e tiles, em 11 etapas (começar pelas etapas 0 e 1) | Rascunho | [P-001](propostas/P-001-editor-de-mapas.md) |

## Backlog

Exercícios de estudo, em ordem de dificuldade. O conceito treinado está na última coluna.

| ID | Item | Conceito |
|----|------|----------|
| E-01 | Terceiro mapa (uma loja) com porta nova na vila | Conteúdo como dados, portais nos dois sentidos |
| E-02 | Guarda sai do caminho quando a flag `bau:pocao` estiver ligada | Flags controlando o mundo |
| E-03 | Estado `menu` (tecla Esc) listando o inventário numa janela azul | Novo estado na máquina de estados |
| E-04 | Trocar os retângulos por um tileset PNG (`drawImage` recortando 16x16) | Tileset, separação lógica/aparência |
| E-05 | Encontros aleatórios na grama (1 chance em 20 por passo) | Eventos de "pisar", transição para batalha |
| E-06 | Batalha ATB: barra por combatente que enche com a velocidade | ATB, estado com sub-estados |
| E-07 | Carregar mapas exportados do Tiled (JSON) | Pipeline de conteúdo. Veja P-001, etapa 8 |

## Feito

| Data | Item |
|------|------|
| 2026-11-08 | Base do jogo: casa e vila, movimento em grade, NPCs com 3 comportamentos, diálogo, baú, placa, portais e flags |
| 2026-11-08 | Build publicado como Artefato Claude para jogar no celular |
| 2026-11-08 | Docs de evolução: roadmap, propostas e changelog |
