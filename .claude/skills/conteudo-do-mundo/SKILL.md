---
name: conteudo-do-mundo
description: Como adicionar ou alterar conteúdo do rpg-tiles como dados, sem mexer no motor: novos mapas, tiles, portais, NPCs, baús, placas e falas condicionais. Use ao pedirem um mapa, NPC, item, loja, porta ou diálogo novo.
---

# Conteúdo do mundo (dados, não código)

O mundo é descrito em `rpg-tiles/src/tipos.ts` e preenchido em `rpg-tiles/src/dados/`.
Quase tudo se faz editando dados. Só mexa em `src/motor/` ou `src/jogo/` quando a regra for nova.

## Novo tile
1. Escolha um caractere livre e acrescente em `dados/tiles.ts`: `'k': { nome: 'cerca', solido: true }`.
2. A aparência fica em `motor/render.ts`, na função de desenho de tile, com um `case` pelo `nome`.
   Sem esse `case` o tile aparece preto (`default`).

## Editor de mapa (aba da página)
Para mexer só na grade de tiles, prefira a aba **Editor de mapa** (`rpg-tiles/docs/EDITOR.md`):
pinta, o jogo reflete na hora, e **Copiar código** gera o `linhas` para colar em `dados/mapas.ts`.
Ele não edita NPCs, baús, portais nem placas, e não redimensiona o mapa.

## Novo mapa
1. Em `dados/mapas.ts`, crie a entrada em `MAPAS` com `id`, `nome`, `linhas` (todas do mesmo
   comprimento, um caractere por tile), `portais`, `npcs`, `baus`, `placas`.
2. Ligue com **portais nos dois sentidos**: um portal no mapa antigo apontando para o novo
   (`paraMapa`, `paraX`, `paraY`, `olhando`) e outro de volta. O destino deve cair num tile livre,
   de preferência ao lado do portal de volta (para não voltar sem querer ao pisar nele).
3. Portal fica em tile não sólido (porta `D`, saída `X`).

## NPC
`NpcDef`: `id` único, `nome`, `x`,`y`, `olhando`, `cores`, `comportamento` (`parado`, `vagando` com
`raio`, `rota` com `passos`), `falas`, e opcionalmente `falasCondicionais` (a primeira cuja flag
estiver ligada ganha). Não coloque NPC em tile sólido nem em cima de portal.

## Baú e placa
- Baú: `id` único, `x`,`y`, `item`. Ao abrir liga a flag `bau:<id>`; use essa flag em falas condicionais.
- Placa: tile `P` (sólido) no mapa, mais uma `PlacaDef` com `x`,`y`,`texto[]` na mesma posição.

## Flags
`mundo.flags` é a memória do jogo (um `Set<string>`). Padrão de nome: `tipo:nome` (`bau:pocao`,
`missao:lenha`). Missões são cadeias de flags lidas por falas condicionais.

## Depois de mudar
1. `scripts/checar.sh`.
2. Se mudou o mapa, jogue: `scripts/rodar-jogo.sh` e ande até a mudança (Playwright serve para isso).
3. Atualize o README do projeto se a mudança for um novo conceito (ex.: nova tabela de leitura) e
   registre a mudança em `docs/CHANGELOG.md` (e no roadmap, se era um item dele).
