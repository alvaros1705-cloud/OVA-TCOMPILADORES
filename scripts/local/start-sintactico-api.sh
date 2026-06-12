#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OVA_DIR="$ROOT/OVAS/Fabian - Sofi/analizador-sintactico"
echo "[USB OVA] Iniciando API Analizador Sintáctico (Fabian & Sofi) en http://localhost:8001"
cd "$OVA_DIR"
if [ ! -d "venv" ]; then
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
else
  source venv/bin/activate
fi
exec uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001
