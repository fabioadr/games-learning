---
description: Implementa um exercício do backlog do rpg-tiles (docs/ROADMAP.md), explicando o conceito
---

Implemente o exercício do backlog em `rpg-tiles/docs/ROADMAP.md` indicado em $ARGUMENTS (ID `E-NN`,
número ou descrição). Se for uma etapa de proposta (`P-NNN etapa N`), siga a proposta em `docs/propostas/`.
Sem argumento, sugira o próximo exercício ainda não feito, com uma justificativa de duas frases,
e espere a escolha.

Passos:
1. Use o agente `tutor-game-dev` para explicar o conceito antes de codar (curto).
2. Implemente seguindo as convenções do `CLAUDE.md` (dados antes de código, comentário didático,
   sem dependências novas, estados novos como `case` em `jogo.ts`).
3. Rode `scripts/checar.sh` e jogue a mudança com Playwright.
4. Atualize os docs de evolução: roadmap (mova para Feito), `CHANGELOG.md` e, se for etapa de proposta,
   a caixa e o Diário da proposta. Atualize a tabela de leitura do README se surgiu arquivo novo.
5. Use o agente `revisor-didatico` na diff e aplique o que for relevante.
6. Resuma o que o dono aprende lendo o diff e em quais arquivos olhar.
