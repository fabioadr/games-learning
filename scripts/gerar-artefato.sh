#!/usr/bin/env bash
# Gera rpg-tiles/artefato/vila-de-pedravento.html (build em arquivo único) e imprime o caminho.
# Publicar de fato é feito com a ferramenta Artifact (veja .claude/skills/publicar-artefato).
set -euo pipefail
JOGO="$(cd "$(dirname "$0")/.." && pwd)/rpg-tiles"
[ -d "$JOGO/node_modules" ] || (cd "$JOGO" && npm install --no-audit --no-fund)
cd "$JOGO" && npm run artefato
