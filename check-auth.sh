#!/bin/bash

echo "Verificador de Autenticação e Banco de Dados Supabase"
echo "==================================================="
echo

echo "Verificando se o Node.js está instalado..."
if ! command -v node &> /dev/null; then
  echo "Erro: Node.js não encontrado. Por favor, instale o Node.js antes de continuar."
  exit 1
fi

echo "Node.js encontrado!"
echo

echo "Verificando se as dependências estão instaladas..."
if [ ! -d "node_modules" ]; then
  echo "Instalando dependências..."
  npm install dotenv @supabase/supabase-js
else
  echo "Dependências já instaladas."
fi
echo

echo "Executando script de verificação..."
node check-auth.js
echo

echo "Script concluído!" 