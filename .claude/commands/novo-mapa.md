---
description: Cria um mapa novo no rpg-tiles (tiles, portais nos dois sentidos, NPCs, baús)
---

Crie um mapa novo conforme a descrição em $ARGUMENTS, seguindo a skill `conteudo-do-mundo`.

Confira antes de terminar:
- todas as linhas do mapa têm o mesmo comprimento e só usam caracteres de `dados/tiles.ts`
  (novos tiles precisam de `case` em `motor/render.ts`);
- há portal de ida e de volta, e o destino cai num tile livre;
- nenhum NPC ou baú fica em tile sólido ou em cima de portal;
- `scripts/checar.sh` passa e o mapa foi visitado no jogo (Playwright).
