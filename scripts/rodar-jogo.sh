#!/usr/bin/env bash
# Sobe o servidor de desenvolvimento do jogo (Vite) em segundo plano e confirma que respondeu.
# Uso: scripts/rodar-jogo.sh [porta]    (padrão 5173)
# Para parar: pkill -f vite
set -euo pipefail

PORTA="${1:-5173}"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
JOGO="$RAIZ/rpg-tiles"
LOG="${TMPDIR:-/tmp}/rpg-tiles-vite.log"

[ -d "$JOGO/node_modules" ] || (cd "$JOGO" && npm install --no-audit --no-fund)

if curl -fs -o /dev/null "http://127.0.0.1:$PORTA/"; then
  echo "Já está rodando em http://127.0.0.1:$PORTA/"; exit 0
fi

(cd "$JOGO" && nohup npx vite --host 127.0.0.1 --port "$PORTA" >"$LOG" 2>&1 &)

for _ in $(seq 1 20); do
  if curl -fs -o /dev/null "http://127.0.0.1:$PORTA/"; then
    echo "Jogo em http://127.0.0.1:$PORTA/  (log: $LOG)"
    echo "Atenção: esse endereço só existe nesta máquina. Para abrir no celular, publique o artefato."
    exit 0
  fi
  sleep 0.5
done
echo "O servidor não respondeu a tempo. Veja $LOG" >&2; exit 1
