@echo off
echo Verificador de Autenticacao e Banco de Dados Supabase
echo ===================================================
echo.

echo Verificando se o Node.js esta instalado...
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Erro: Node.js nao encontrado. Por favor, instale o Node.js antes de continuar.
  exit /b 1
)

echo Node.js encontrado!
echo.

echo Verificando se as dependencias estao instaladas...
if not exist node_modules (
  echo Instalando dependencias...
  call npm install dotenv @supabase/supabase-js
) else (
  echo Dependencias ja instaladas.
)
echo.

echo Executando script de verificacao...
node check-auth.js
echo.

echo Script concluido!
pause 