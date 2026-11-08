# Changelog do rpg-tiles

O que entrou no jogo, do mais novo para o mais antigo. Uma linha por mudança relevante,
com o ID do roadmap quando houver (ex.: `P-001 etapa 2`, `E-03`).

## 2026-11-08

- P-001 etapas 1, 3, 4, 5 e 6 completas: zoom, mão e grade; importar linhas; retângulo, conta-gotas e refazer; novo mapa e redimensionar; camada de objetos (mover, criar, editar e remover NPCs, baús, placas e portais) com avisos de conteúdo. Desenho dos tiles extraído para `motor/desenhoTiles.ts`.
- P-001 etapas 0, 2 e 7 (primeira versão): aba `Editor de mapa` no mesmo artefato, pintando direto em `MAPAS`; pincel, balde, desfazer, colocar herói, ver colisão, exportar código e persistência no `localStorage` (`docs/EDITOR.md`).
- E-01: loja `Armazém do Tião`, porta nova na vila e tile `prateleira`.
- Docs de evolução: `ROADMAP.md`, `propostas/` com modelo, este changelog. Exercícios saíram do README e viraram o backlog do roadmap.
- Proposta P-001 (editor de mapas e tiles) criada como Rascunho.
- Build publicado como Artefato Claude (`docs/ARTEFATO.md`).
- Versão inicial: casa e vila em tiles, movimento tile a tile com colisão, NPCs parado/vagando/rota, diálogo com máquina de escrever, baú, placa, portais com fade e flags que mudam falas.
