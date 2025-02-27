# Guia de Solução de Problemas do Supabase

Este guia contém instruções para resolver problemas comuns com o Supabase na aplicação de chat.

## Problema Identificado

Após a análise da aplicação, identificamos os seguintes problemas:

1. **Recursão infinita nas políticas RLS**: As políticas de Row Level Security (RLS) estão causando recursão infinita, impedindo o acesso às tabelas `chats`, `chat_participants`, `messages` e `groups`.

2. **Problema de autenticação**: A aplicação não está conseguindo autenticar corretamente os usuários, resultando na mensagem "Nenhum usuário autenticado, não carregando chats".

## Soluções

### 1. Corrigir as Políticas RLS

O arquivo `fix-rls-policies.sql` contém as correções necessárias para as políticas RLS. Siga estas etapas para aplicar as correções:

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para a seção "SQL Editor"
4. Crie um novo script SQL
5. Copie e cole o conteúdo do arquivo `fix-rls-policies.sql`
6. Execute o script

### 2. Verificar o Projeto Supabase

O projeto Supabase atual pode não estar mais ativo ou pode ter sido excluído. Verifique se o projeto ainda existe:

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Verifique se o projeto com ID `nssldsdyczxvthmsnjcm` ainda existe
3. Se o projeto não existir, você precisará criar um novo projeto

### 3. Criar um Novo Projeto Supabase (se necessário)

Se o projeto atual não estiver mais disponível, siga estas etapas para criar um novo:

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Clique em "New Project"
3. Preencha as informações necessárias e crie o projeto
4. Copie a URL e a chave anônima do novo projeto
5. Atualize o arquivo `.env.local` com as novas credenciais:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-novo-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-nova-chave-anonima
   ```
6. Execute o script `supabase_schema.sql` no editor SQL do novo projeto para criar as tabelas necessárias
7. Execute o script `fix-rls-policies.sql` para configurar as políticas RLS corretamente

### 4. Verificar a Autenticação

Após corrigir as políticas RLS ou criar um novo projeto, verifique se a autenticação está funcionando corretamente:

1. Execute o script `check-auth-session.js` para verificar a autenticação:
   ```
   node check-auth-session.js
   ```
2. Se o script mostrar "Erro ao fazer login: Invalid login credentials", você precisará criar um novo usuário:
   ```
   node fix-supabase.js
   ```

### 5. Reiniciar a Aplicação

Após fazer as correções, reinicie a aplicação:

```
npm run dev
```

## Scripts de Diagnóstico

Este projeto inclui vários scripts para diagnosticar problemas com o Supabase:

- `check-supabase-url.js`: Verifica se a URL do Supabase está acessível
- `check-auth.js`: Verifica a autenticação e o estado do banco de dados
- `fix-supabase.js`: Verifica e tenta corrigir a conexão com o Supabase
- `check-rls.js`: Verifica as políticas RLS
- `check-auth-session.js`: Verifica a autenticação na aplicação

Execute estes scripts para diagnosticar problemas específicos:

```
node nome-do-script.js
```

## Problemas Comuns e Soluções

### 1. "Nenhum usuário autenticado, não carregando chats"

Este erro ocorre quando:
- O usuário não está autenticado
- As políticas RLS estão impedindo o acesso às tabelas
- O projeto Supabase não está mais ativo

**Solução**: Siga as etapas 1-5 acima.

### 2. "Erro ao fazer login: Invalid login credentials"

Este erro ocorre quando:
- O usuário não existe
- A senha está incorreta
- O projeto Supabase foi recriado e os usuários não foram migrados

**Solução**: Crie um novo usuário usando o script `fix-supabase.js`.

### 3. "infinite recursion detected in policy for relation"

Este erro ocorre quando:
- As políticas RLS estão causando recursão infinita

**Solução**: Execute o script `fix-rls-policies.sql` no editor SQL do Supabase.

## Contato

Se você continuar enfrentando problemas após seguir este guia, entre em contato com a equipe de suporte. 