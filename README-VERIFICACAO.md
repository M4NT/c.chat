# Verificação de Autenticação e Banco de Dados Supabase

Este conjunto de scripts permite verificar o estado da autenticação e do banco de dados Supabase na aplicação de chat.

## Pré-requisitos

- Node.js instalado (versão 14 ou superior)
- Arquivo `.env.local` configurado com as credenciais do Supabase

## Arquivos Incluídos

1. **check-auth.js** - Script principal que verifica a conexão com o Supabase, tabelas existentes, políticas RLS e testa a autenticação.
2. **check-auth.bat** - Script batch para Windows que instala as dependências necessárias e executa o script principal.
3. **check-auth.sh** - Script shell para Linux/Mac que instala as dependências necessárias e executa o script principal.
4. **supabase_rpc.sql** - Script SQL que adiciona funções RPC úteis ao Supabase para diagnóstico.

## Como Usar

### 1. Configurar o Supabase

Antes de executar os scripts de verificação, é necessário adicionar as funções RPC ao Supabase:

1. Acesse o painel de administração do Supabase
2. Vá para a seção "SQL Editor"
3. Crie uma nova consulta
4. Cole o conteúdo do arquivo `supabase_rpc.sql`
5. Execute a consulta

### 2. Executar a Verificação

#### No Windows:

1. Dê um duplo clique no arquivo `check-auth.bat`
2. Aguarde a execução do script
3. Analise os resultados exibidos no terminal

#### No Linux/Mac:

1. Abra um terminal na pasta do projeto
2. Torne o script executável: `chmod +x check-auth.sh`
3. Execute o script: `./check-auth.sh`
4. Analise os resultados exibidos no terminal

## O Que é Verificado

O script de verificação realiza as seguintes operações:

1. **Conexão com o Supabase** - Verifica se é possível estabelecer conexão com o Supabase usando as credenciais fornecidas.
2. **Tabelas Existentes** - Verifica se todas as tabelas necessárias existem no banco de dados e quantos registros cada uma contém.
3. **Políticas RLS** - Lista todas as políticas de Row Level Security configuradas no banco de dados.
4. **Usuários Existentes** - Lista os usuários cadastrados no sistema (limitado a 10).
5. **Autenticação** - Tenta fazer login com um usuário de teste e, se não for possível, tenta criar um novo usuário de teste.

## Solução de Problemas

### Erro de Conexão com o Supabase

Se o script não conseguir se conectar ao Supabase, verifique:

1. Se o arquivo `.env.local` existe e contém as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` corretas.
2. Se o projeto Supabase está ativo e acessível.
3. Se há algum problema de rede impedindo a conexão.

### Tabelas Não Encontradas

Se alguma tabela não for encontrada, execute o script `supabase_schema.sql` no SQL Editor do Supabase para criar as tabelas necessárias.

### Erro na Função RPC

Se o script reportar erro ao chamar a função `get_policies`, verifique se o script `supabase_rpc.sql` foi executado com sucesso no Supabase.

### Erro de Autenticação

Se o teste de autenticação falhar, verifique:

1. Se o serviço de autenticação do Supabase está configurado corretamente.
2. Se as políticas RLS estão permitindo as operações necessárias.
3. Se o trigger `handle_new_user` está funcionando corretamente para criar registros na tabela `users` quando um novo usuário é registrado. 