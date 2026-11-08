#!/usr/bin/env bash
# Verificação rápida antes de commitar: tipos (tsc) e build de produção (vite).
set -euo pipefail
JOGO="$(cd "$(dirname "$0")/.." && pwd)/rpg-tiles"
[ -d "$JOGO/node_modules" ] || (cd "$JOGO" && npm install --no-audit --no-fund)
cd "$JOGO"
npm run check
npm run build
echo "OK: tipos e build passaram."
