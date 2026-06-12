@echo off
setlocal
cd /d "%~dp0..\.."
where py >nul 2>&1 && (set "PY=py -3") || (set "PY=python")
set "OVA_DIR=OVAS\Ronald - Johel\FASS-Sistema-de-Simulaci-n-de-Aut-matas-Finitos"
echo [USB OVA] Iniciando API FASS (Ronald ^& Johel) en http://localhost:5000
cd /d "%OVA_DIR%"
if not exist "venv\Scripts\python.exe" (
  echo Creando entorno virtual...
  %PY% -m venv venv
  call venv\Scripts\activate.bat
  pip install -r requirements.txt
) else (
  call venv\Scripts\activate.bat
)
set FLASK_ENV=development
python app.py

