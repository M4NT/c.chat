# Instruções para Resolver o Problema de Contatos Não Exibidos

## Diagnóstico do Problema

O problema principal é que os usuários cadastrados não estão aparecendo na lista de contatos devido a erros nas políticas RLS (Row Level Security) do Supabase. Especificamente, há uma "recursão infinita" nas políticas que impede o acesso aos dados.

## Solução 1: Aplicar o Script SQL para Corrigir as Políticas RLS

1. Acesse o painel de administração do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. No menu lateral, clique em "SQL Editor"
4. Crie um novo script SQL
5. Cole o conteúdo do arquivo `fix-recursion.sql` que criamos
6. Execute o script clicando em "Run"

Este script irá:
- Remover as políticas RLS problemáticas
- Criar novas políticas sem recursão
- Permitir que usuários autenticados vejam outros usuários e seus próprios chats

## Solução 2: Criar uma Função RPC para Contornar as Políticas RLS

Se a Solução 1 não funcionar ou você não tiver acesso para modificar as políticas RLS, você pode criar uma função RPC que contorna as políticas:

1. Acesse o painel de administração do Supabase
2. No menu lateral, clique em "SQL Editor"
3. Crie um novo script SQL
4. Cole o conteúdo do arquivo `create-rpc-function.sql` que criamos
5. Execute o script clicando em "Run"

Esta função permite buscar todos os usuários sem passar pelas políticas RLS.

## Solução 3: Usar Dados de Exemplo Temporariamente

Se as soluções acima não funcionarem, modificamos o código para exibir contatos de exemplo quando ocorrer um erro ao carregar os contatos reais. Isso permite que você continue testando a aplicação enquanto resolve os problemas de acesso aos dados.

## Como Verificar se a Solução Funcionou

1. Reinicie o servidor de desenvolvimento com `npm run dev`
2. Faça login na aplicação
3. Verifique se os contatos estão sendo exibidos na lista de contatos
4. Verifique os logs do console para ver se há erros relacionados ao carregamento de contatos

## Logs para Depuração

Se você continuar tendo problemas, verifique os logs do console no navegador para ver mensagens detalhadas sobre o que está acontecendo durante o carregamento de contatos.

## Próximos Passos

Depois de resolver o problema de exibição de contatos, você poderá:
1. Iniciar conversas com outros usuários
2. Criar grupos
3. Enviar mensagens

Lembre-se de que as políticas RLS são importantes para a segurança da sua aplicação, então a Solução 1 é a mais recomendada para ambientes de produção. 