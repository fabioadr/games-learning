# Artefato Claude do jogo

O build do jogo está publicado como um **Artefato Claude**, o que permite abrir e jogar
no celular (iOS/Android) sem hospedar nada. O servidor local (`127.0.0.1:5173`) só existe
na máquina onde o `npm run dev` roda, então ele não serve para testar no celular.

| Item | Valor |
|------|-------|
| Artefato (use este em `url`) | https://claude.ai/code/artifact/743c882c-6ee2-4faf-bfd9-0e4c01803778?org=99a8aa4b-2e8f-4d33-962b-3d8ad7914f1c |
| Link de visualização | https://claude.ai/artifact/FMVkGCMhLz34ncCezf6Ezs |
| Título | Vila de Pedravento |
| Acesso | Privado (só o dono). Compartilhar é pelo menu **Share** da página |
| Arquivo publicado | `rpg-tiles/artefato/vila-de-pedravento.html` (gerado, não vai para o git) |

## Abas: Jogo e Editor de mapa

O mesmo artefato tem duas abas. **Jogo** é a tela de sempre; **Editor de mapa** edita os
mapas (tiles, tamanho, NPCs, baús, placas e portais) e o jogo já reflete a mudança. Detalhes e limites (as edições ficam no `localStorage`
de cada navegador, não no arquivo publicado) em [`EDITOR.md`](EDITOR.md).

## Como o build vira artefato

O Artefato é uma página única e só aceita fontes do Google Fonts como recurso externo. O
Vite gera `dist/index.html` mais um `.js` separado, então o script
`rpg-tiles/scripts/gerar-artefato.mjs` faz a conversão:

1. embute o JavaScript do bundle numa tag `<script type="module">`;
2. remove `<!doctype>`, `<html>`, `<head>` e `<body>` (a plataforma monta o esqueleto);
3. grava `rpg-tiles/artefato/vila-de-pedravento.html`.

O `index.html` do jogo já carrega o que o artefato exige: `<title>`, a meta
`claude:viewport-fit-sides`, gutter lateral com `env(safe-area-inset-*)` e tema escuro
definido por tokens. Ao editar o `index.html`, mantenha isso.

## Publicar uma nova versão

Com o Claude Code, peça: **"publique o build no artefato"** (ou use o comando
`/publicar-artefato`). O passo a passo está em `.claude/skills/publicar-artefato/SKILL.md`.

Manualmente, o fluxo é:

```bash
scripts/gerar-artefato.sh        # build + arquivo único
```

Depois, com a ferramenta Artifact: `read` na URL do artefato (obrigatório em uma sessão
nova) e `publish` do arquivo gerado com `url` apontando para ele. Isso mantém o mesmo
link. Não passe `icon` na atualização.

## Se o link parar de funcionar

Se o artefato foi apagado ou a sessão não tem acesso de edição, publique sem `url`
(primeira publicação, com `icon: "game"`) e atualize a URL neste arquivo e no
`CLAUDE.md`.

## O que já foi verificado

- Jogo no desktop (Chromium headless): carrega, anda, interage, sem erros de script.
- Editor: pintar, voltar ao jogo e ver a mudança; persistência após reload; sem erros no console.
- Layout em iPhone 13 emulado: sem rolagem horizontal, botões de toque visíveis.
- Não foi testado em um iPhone físico.
