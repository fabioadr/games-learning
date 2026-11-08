# Roadmap do rpg-tiles

Painel único de evolução. Cada linha aponta para a proposta quando existe uma.
Como usar: [`docs/README.md`](README.md). Última revisão: 2026-11-08.

## Em andamento

| ID | Item | Status | Proposta |
|----|------|--------|----------|
| P-001 | Editor de mapas e tiles: etapas 0 a 7 feitas (aba Editor de mapa). Próxima: etapa 8 (mapas em JSON e salvar direto) | Em andamento | [P-001](propostas/P-001-editor-de-mapas.md) |

## Próximo

_Nada no momento._

## Backlog

Exercícios de estudo, em ordem de dificuldade. O conceito treinado está na última coluna.

| ID | Item | Conceito |
|----|------|----------|
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
| 2026-11-08 | E-01: loja (`Armazém do Tião`) com porta na vila e tile prateleira |
| 2026-11-08 | P-001 etapas 0 a 7: editor de mapa numa aba do artefato, refletindo no jogo |
