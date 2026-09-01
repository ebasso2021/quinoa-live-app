@echo off
cd /d "%~dp0"
echo Iniciando Quinoa...
echo (deja esta ventana abierta mientras uses la app)
echo.
if not exist node_modules (
  echo Instalando dependencias por primera vez...
  call npm install
)
if not exist .env (
  copy .env.example .env >nul
  echo Se creo el archivo .env con valores de PRUEBA. Edítalo con tus claves de Stripe cuando quieras cobrar de verdad.
)
call npm start
pause
