# games-learning

Repositório de **estudo de programação de jogos 2D top-down**. O objetivo é aprender lendo e
modificando código pequeno, sem engine. O dono é desenvolvedor experiente (C#, Node/TS/React),
então explique conceitos de game dev, não de programação em geral. Responda em português do Brasil.

## Projetos

| Pasta | O que é |
|-------|---------|
| `rpg-tiles/` | "Vila de Pedravento": RPG 16-bit estilo SNES em TypeScript puro + Canvas 2D + Vite |

Novos estudos entram como pastas irmãs de `rpg-tiles/`, cada uma com README, `package.json` e `docs/`.

## Comandos (dentro de `rpg-tiles/`)

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # só tipos (tsc)
npm run build      # tsc + vite build -> dist/
npm run artefato   # build + arquivo único para o Artefato Claude -> artefato/
```

Da raiz: `scripts/rodar-jogo.sh`, `scripts/checar.sh`, `scripts/gerar-artefato.sh`.
Não há testes automatizados. A verificação é `scripts/checar.sh` mais jogar (Playwright
está disponível nas sessões na nuvem: `require('playwright')`, sem `playwright install`).

## Arquitetura do rpg-tiles (resumo)

- `src/main.ts`: game loop (input, atualizar, desenhar) com `dt`.
- `src/tipos.ts`: o mundo descrito como dados (MapaDef, NpcDef, Portal, BauDef, PlacaDef).
- `src/dados/`: `tiles.ts` (legenda: caractere -> sólido ou não) e `mapas.ts` (mapas em texto).
- `src/motor/`: `ator.ts` (movimento tile a tile), `render.ts` (câmera, ordem por Y, janelas), `entrada.ts`.
- `src/editor/`: `editor.ts` (aba Editor de mapa, pinta em `MAPAS[id].linhas`) e `armazenamento.ts` (persistência no localStorage). Ver `rpg-tiles/docs/EDITOR.md`.
- `src/jogo/`: `mundo.ts` (estado vivo, `livre(x,y)` é toda a colisão), `jogo.ts` (máquina de estados), `npcIA.ts`.

Princípios que o código ensina e que **não devem ser quebrados** sem avisar:

1. Lógica separada da aparência (`tiles.ts` diz o que é; `render.ts` diz como aparece).
2. Posição lógica inteira + posição visual interpolada.
3. Composição em vez de herança (NPC *tem* um `Ator`).
4. Memória do jogo em `mundo.flags` (ex.: `bau:pocao`).
5. Estados explícitos (`explorando`, `dialogo`, `transicao`); novos sistemas viram novos estados.
6. O editor não tem cópia dos mapas: escreve nos mesmos dados que o jogo lê. Não duplique o mapa no editor.

## Convenções

- Nomes de domínio em português (`mundo`, `ator`, `entrada`), como já está no código.
- Todo arquivo novo começa com um comentário curto dizendo o que ele ensina.
- Comentários explicam o *porquê* e o conceito de game dev; o código é pequeno e legível, sem abstração prematura.
- Sem dependências de runtime. Só TypeScript e Vite como devDependencies.
- Mudou a mecânica? Atualize a tabela de leitura e os exercícios do README do projeto.
- Antes de commitar: `scripts/checar.sh`.

## Artefato Claude (jogar no celular)

O build (aba Jogo + aba Editor de mapa) está publicado como Artefato Claude para o dono abrir no iPhone. Detalhes em
`rpg-tiles/docs/ARTEFATO.md`.

- URL do artefato: https://claude.ai/code/artifact/743c882c-6ee2-4faf-bfd9-0e4c01803778?org=99a8aa4b-2e8f-4d33-962b-3d8ad7914f1c
- **Quando pedirem para publicar o build**: use a skill `publicar-artefato` (ou `/publicar-artefato`).
  Resumo: `scripts/gerar-artefato.sh`, depois Artifact `read` na URL acima, depois Artifact
  `publish` de `rpg-tiles/artefato/vila-de-pedravento.html` com `url` (mesmo link, sem `icon`).
- O artefato é privado. Não diga que testou no iPhone sem ter testado.
- `rpg-tiles/artefato/` e `dist/` são gerados e ficam fora do git.

## Git

- Desenvolva no branch designado pela sessão e faça push nele. Não abra PR sem pedido explícito.
- Commits em português, no imperativo, com um corpo curto quando a mudança não for óbvia.

## O que há em .claude/

- `commands/`: `/publicar-artefato`, `/rodar-jogo`, `/checar`, `/exercicio`, `/novo-mapa`.
- `skills/`: `publicar-artefato`, `conteudo-do-mundo` (mapas, NPCs, baús, tiles), `explicar-motor`.
- `agents/`: `tutor-game-dev` (explica e propõe exercícios), `revisor-didatico` (revisa se a mudança mantém o código ensinável).
