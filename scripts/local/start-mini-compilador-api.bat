@echo off
setlocal
cd /d "%~dp0..\.."
where py >nul 2>&1 && (set "PY=py -3") || (set "PY=python")
set "BACKEND_DIR=OVAS\Islender - Jhoan\mini_compiler\backend"
echo [USB OVA] Iniciando API Mini Compilador (Islender ^& Jhoan) en http://localhost:8002
cd /d "%BACKEND_DIR%"
if not exist "..\venv\Scripts\python.exe" (
  echo Creando entorno virtual...
  cd ..
  %PY% -m venv venv
  call venv\Scripts\activate.bat
  pip install -r requirements.txt
  cd backend
) else (
  call ..\venv\Scripts\activate.bat
)
uvicorn main:app --reload --host 127.0.0.1 --port 8002
