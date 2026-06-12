#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OVA_DIR="$ROOT/OVAS/Ronald - Johel/FASS-Sistema-de-Simulaci-n-de-Aut-matas-Finitos"
echo "[USB OVA] Iniciando API FASS (Ronald & Johel) en http://localhost:5000"
cd "$OVA_DIR"
if [ ! -d venv ]; then
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
else
  source venv/bin/activate
fi
export FLASK_ENV=development
python app.py
