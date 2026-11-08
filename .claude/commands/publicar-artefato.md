---
description: Gera o build do rpg-tiles em arquivo único e publica no Artefato Claude existente (mesmo link)
---

Publique o build atual do jogo no artefato, seguindo a skill `publicar-artefato`.

Resumo: rode `scripts/checar.sh`, depois `scripts/gerar-artefato.sh`, leia o artefato da URL
registrada no `CLAUDE.md` com `Artifact` (`action: "read"`) e publique
`rpg-tiles/artefato/vila-de-pedravento.html` por cima com `url` (sem `icon`).

$ARGUMENTS

Ao final, informe o link, o que mudou na versão e lembre que o artefato é privado.
