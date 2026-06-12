@echo off
setlocal
cd /d "%~dp0..\.."
where py >nul 2>&1 && (set "PY=py -3") || (set "PY=python")
set "OVA_DIR=OVAS\Fabian - Sofi\analizador-sintactico"
echo [USB OVA] Iniciando API Analizador Sintactico (Fabian ^& Sofi) en http://localhost:8001
cd /d "%OVA_DIR%"
if not exist "venv\Scripts\python.exe" (
  echo Creando entorno virtual...
  %PY% -m venv venv
  call venv\Scripts\activate.bat
  pip install -r requirements.txt
) else (
  call venv\Scripts\activate.bat
)
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001
