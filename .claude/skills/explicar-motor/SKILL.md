---
name: explicar-motor
description: Explica didaticamente como o rpg-tiles funciona por dentro (game loop, movimento tile a tile, colisão, máquina de estados, flags, renderização) com referências ao código real. Use quando perguntarem "como funciona", "por que" ou pedirem para entender uma parte do jogo.
---

# Explicar o motor

Público: desenvolvedor experiente (C#, Node/TS/React) novo em game dev. Não explique o que é uma
classe ou um `switch`; explique o *conceito de jogo* e aponte onde ele vive no código.

## Roteiro por conceito (com arquivo)

| Conceito | Onde | Ideia central |
|----------|------|---------------|
| Game loop e `dt` | `src/main.ts` | ler input, atualizar, desenhar; `dt` tira a dependência da velocidade da máquina |
| Mundo como dados | `src/tipos.ts`, `src/dados/` | o motor lê dados; conteúdo novo não exige código |
| Movimento tile a tile | `src/motor/ator.ts` | posição lógica inteira vira o destino no início do passo; a visual só interpola |
| Colisão | `src/jogo/mundo.ts` (`livre`) | uma função responde se o tile está livre; NPCs e baús entram nela |
| Máquina de estados | `src/jogo/jogo.ts` | só um estado manda; batalha e menu seriam mais `case` |
| IA de NPC | `src/jogo/npcIA.ts` | comportamento é dado + `switch` |
| Câmera e profundidade | `src/motor/render.ts` | câmera trava nas bordas; ordenar por Y dá a ilusão de profundidade |
| Entrada | `src/motor/entrada.ts` | teclado e toque alimentam a mesma interface |

## Como responder

1. Comece pela ideia em duas frases, sem código.
2. Aponte o trecho real (`arquivo:linha`) e leia-o junto, em vez de reescrever.
3. Compare com algo que o dono conhece (C#/React) só quando ajudar, por exemplo: o loop é como um
   `useEffect` com `requestAnimationFrame`; as flags são um `HashSet<string>` global.
4. Feche com um experimento de um minuto (mudar `VEL_HEROI`, `TILE` ou `VEL_TEXTO` em `src/config.ts`
   e ver o efeito) ou com o exercício do README mais próximo do assunto.
5. Se a explicação revelar um bug ou ponto confuso no código, diga, em vez de contornar na fala.
