# Chat App

Aplicativo de chat em tempo real construído com Next.js, Supabase e Tailwind CSS.

## Configuração do Banco de Dados

Para configurar o banco de dados no Supabase, siga os passos abaixo:

1. Acesse o [Console do Supabase](https://app.supabase.io/) e faça login na sua conta.
2. Crie um novo projeto ou use um projeto existente.
3. Vá para a seção "SQL Editor" no menu lateral.
4. Execute os scripts SQL na seguinte ordem:

### 1. Criar Tabelas e Estrutura do Banco de Dados

Copie e cole o conteúdo do arquivo `supabase_schema.sql` no editor SQL e execute.

Este script irá:
- Criar todas as tabelas necessárias (users, chats, groups, chat_participants, messages, files, message_reactions)
- Criar índices para melhorar o desempenho
- Configurar triggers para atualizar automaticamente os timestamps

### 2. Configurar Permissões e Políticas de Segurança

Copie e cole o conteúdo do arquivo `supabase_permissions.sql` no editor SQL e execute.

Este script irá:
- Habilitar Row Level Security (RLS) em todas as tabelas
- Criar políticas de acesso para cada tabela
- Conceder permissões necessárias para os diferentes roles

### 3. Configurar Trigger para Novos Usuários

Copie e cole o conteúdo do arquivo `supabase_trigger.sql` no editor SQL e execute.

Este script irá:
- Criar uma função para lidar com novos usuários
- Configurar um trigger para inserir automaticamente novos usuários na tabela `users` quando eles são criados na tabela `auth.users`

## Configuração do Projeto

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd chat-app
```

2. Instale as dependências:
```bash
npm install
```

3. Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:
```
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse o aplicativo em `http://localhost:3000`

## Inicialização de Dados de Exemplo

Para inicializar dados de exemplo no aplicativo:

1. Faça login no aplicativo
2. Clique no botão "Inicializar dados de exemplo" na tela principal
3. Aguarde a confirmação de que os dados foram inicializados
4. A página será recarregada automaticamente e você verá os chats de exemplo

## Solução de Problemas

### Problema: Lista de conversas não carrega

Se a lista de conversas não carregar, verifique:

1. Se você executou todos os scripts SQL no Supabase
2. Se as políticas de RLS estão configuradas corretamente
3. Se o usuário tem permissão para acessar as tabelas
4. Se há dados nas tabelas (use o botão "Inicializar dados de exemplo")

### Problema: Erro ao registrar novo usuário

Se ocorrer um erro ao registrar um novo usuário, verifique:

1. Se o trigger `on_auth_user_created` está configurado corretamente
2. Se a função `handle_new_user` está funcionando corretamente
3. Se as políticas de RLS permitem a inserção de novos usuários

## Tecnologias Utilizadas

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [TypeScript](https://www.typescriptlang.org/)
