#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND_DIR="$ROOT/OVAS/Islender - Jhoan/mini_compiler/backend"
MINI_DIR="$ROOT/OVAS/Islender - Jhoan/mini_compiler"
echo "[USB OVA] Iniciando API Mini Compilador (Islender & Jhoan) en http://localhost:8002"
cd "$MINI_DIR"
if [ ! -d "venv" ]; then
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
else
  source venv/bin/activate
fi
cd backend
exec uvicorn main:app --reload --host 127.0.0.1 --port 8002
