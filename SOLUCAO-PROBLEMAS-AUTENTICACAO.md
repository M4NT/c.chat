# Guia de Solução de Problemas de Autenticação

## Problemas Identificados

1. **Duplicação de Providers**: Havia uma duplicação do `AuthProvider` no código, o que poderia causar conflitos na gestão do estado de autenticação.
2. **Falta de Proteção na Rota Principal**: A página principal não estava usando o componente `ProtectedRoute` para garantir que apenas usuários autenticados pudessem acessá-la.
3. **Problemas com Políticas RLS**: As políticas de Row Level Security (RLS) no Supabase estão causando recursão infinita, impedindo o acesso aos dados mesmo quando o usuário está autenticado.
4. **Problema de Redirecionamento após Login**: Após fazer login com sucesso, o usuário é redirecionado de volta para a página de login, mesmo com mensagens de sucesso nos logs.

## Soluções Implementadas

1. **Remoção do AuthProvider Duplicado**: Removemos o `AuthProvider` duplicado do `app/layout.tsx`, já que ele já estava sendo usado dentro do componente `Providers`.
2. **Adição de Proteção na Rota Principal**: Adicionamos o componente `ProtectedRoute` na página principal para garantir que apenas usuários autenticados possam acessá-la.
3. **Melhoria no Gerenciamento de Sessão**: Modificamos o `loginAction` para garantir que a sessão seja mantida corretamente após o login, incluindo a definição de cookies para armazenar os tokens de acesso e refresh.
4. **Logs Detalhados para Diagnóstico**: Adicionamos logs detalhados no `ProtectedRoute` e no `AuthProvider` para facilitar o diagnóstico de problemas de autenticação.
5. **Scripts para Corrigir Políticas RLS**: Criamos scripts SQL (`fix-rls-recursion.sql` e `fix-rls-simple.sql`) para corrigir o problema de recursão infinita nas políticas RLS.
6. **Melhoria na Definição de Cookies**:
   - Adicionado `sameSite: 'lax'` aos cookies para melhorar a compatibilidade com navegadores.
   - Adicionado um cookie não-httpOnly `sb-user-id` para facilitar a verificação do lado do cliente.
   - Melhorado o logging para incluir informações sobre os tokens.
7. **Aprimoramento do `ProtectedRoute`**:
   - Implementada verificação dupla de autenticação (via `AuthProvider` e diretamente via Supabase).
   - Adicionado estado `sessionChecked` para evitar redirecionamentos prematuros.
   - Implementada renovação automática de tokens próximos de expirar.
   - Melhorado o logging para diagnóstico.
8. **Aprimoramento do `AuthProvider`**:
   - Melhorada a recuperação de dados do usuário quando a sessão existe mas `getCurrentUser` falha.
   - Adicionado tratamento para o evento `USER_UPDATED`.
   - Melhorado o logging para diagnóstico.
9. **Scripts de Diagnóstico**:
   - Criado script `check-session.js` para verificar o estado da sessão e diagnosticar problemas.
   - Implementadas verificações de configuração de autenticação.
   - Adicionadas instruções para verificar cookies no navegador.

## Verificação de Autenticação

Se você ainda estiver enfrentando problemas de autenticação, siga estas etapas:

1. **Verifique o Estado da Sessão**:
   ```bash
   node check-session.js
   ```
   Este script verificará se há uma sessão ativa e mostrará informações detalhadas sobre o usuário autenticado.

2. **Verifique a Configuração de Cookies**:
   ```bash
   node check-cookies.js
   ```
   Este script verificará se os cookies estão sendo definidos corretamente para manter a sessão.

3. **Verifique a Estrutura das Tabelas**:
   ```bash
   node check-tables.js
   ```
   Este script verificará a estrutura das tabelas no Supabase e as políticas RLS aplicadas.

4. **Verifique o Console do Navegador**:
   Abra as ferramentas de desenvolvedor do navegador (F12) e verifique se há erros no console relacionados à autenticação. Procure por mensagens de log com os prefixos "AuthProvider" e "ProtectedRoute" para entender o fluxo de autenticação.

5. **Limpe os Cookies e o Armazenamento Local**:
   - Abra as ferramentas de desenvolvedor do navegador
   - Vá para a aba "Application" (Aplicação)
   - Selecione "Clear storage" (Limpar armazenamento)
   - Marque "Cookies" e "Local Storage"
   - Clique em "Clear site data" (Limpar dados do site)
   - Recarregue a página e tente fazer login novamente

6. **Verifique as Variáveis de Ambiente**:
   Certifique-se de que as variáveis de ambiente estão configuradas corretamente no arquivo `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
   ```

7. **Verifique as Políticas RLS no Supabase**:
   - Acesse o painel de controle do Supabase
   - Vá para "Authentication" > "Policies"
   - Verifique se as políticas estão configuradas corretamente para permitir que usuários autenticados acessem os dados

## Problemas Comuns e Soluções

### "Nenhum usuário autenticado, não carregando chats"

Este erro ocorre quando o componente `AppShell` não consegue detectar um usuário autenticado. Possíveis soluções:

1. **Verifique se você está realmente autenticado**:
   - Execute o script `check-session.js` para verificar se há uma sessão ativa
   - Se não houver sessão, faça login novamente

2. **Verifique se o AuthProvider está funcionando corretamente**:
   - Certifique-se de que o `AuthProvider` está sendo usado corretamente
   - Verifique se o hook `useAuth` está retornando o usuário corretamente

3. **Verifique se as políticas RLS estão permitindo acesso aos dados**:
   - Execute o script `check-session.js` para verificar as políticas RLS
   - Se você vir erros de "recursão infinita", execute um dos scripts SQL para corrigir as políticas:
     - Para uma solução detalhada: `fix-rls-recursion.sql`
     - Para uma solução rápida e permissiva (apenas para desenvolvimento): `fix-rls-simple.sql`

### Recursão Infinita nas Políticas RLS

Se você estiver vendo erros como "infinite recursion detected in policy for relation 'chat_participants'", siga estas etapas:

1. **Execute o Script de Correção Simplificado**:
   - Acesse o painel de controle do Supabase
   - Vá para "SQL Editor"
   - Crie um novo script
   - Cole o conteúdo do arquivo `fix-rls-simple.sql`
   - Execute o script
   - **ATENÇÃO**: Este script cria políticas muito permissivas e deve ser usado apenas para fins de desenvolvimento

2. **Ou Execute o Script de Correção Detalhado**:
   - Acesse o painel de controle do Supabase
   - Vá para "SQL Editor"
   - Crie um novo script
   - Cole o conteúdo do arquivo `fix-rls-recursion.sql`
   - Execute o script
   - Este script cria políticas mais restritivas e adequadas para um ambiente de produção

3. **Verifique se as Políticas Foram Corrigidas**:
   - Execute o script `check-session.js` novamente para verificar se os erros de recursão foram resolvidos
   - Se os erros persistirem, verifique se há outras políticas que possam estar causando recursão

4. **Reinicie o Servidor de Desenvolvimento**:
   - Pare o servidor de desenvolvimento (Ctrl+C)
   - Inicie o servidor novamente com `npm run dev`

### Redirecionamento para a Página de Login após Login Bem-Sucedido

Se você está sendo redirecionado de volta para a página de login mesmo após um login bem-sucedido, verifique:

1. **Cookies e Armazenamento Local**:
   - Verifique se os cookies estão sendo definidos corretamente
   - Execute o script `check-cookies.js` para verificar a configuração de cookies
   - Limpe os cookies e o armazenamento local do navegador e tente novamente

2. **Fluxo de Autenticação**:
   - Verifique o console do navegador para ver os logs detalhados do fluxo de autenticação
   - Procure por mensagens de erro ou avisos que possam indicar problemas

3. **Configuração do CORS**:
   - Verifique se o CORS está configurado corretamente no Supabase
   - Acesse o painel de controle do Supabase e verifique as configurações de CORS

4. **Reinicie o Servidor de Desenvolvimento**:
   - Pare o servidor de desenvolvimento (Ctrl+C)
   - Inicie o servidor novamente com `npm run dev`

### Problemas de Login

Se você não conseguir fazer login, verifique:

1. **Credenciais corretas**:
   - Certifique-se de que está usando o email e senha corretos
   - Verifique se a conta existe no Supabase

2. **Conexão com o Supabase**:
   - Verifique se o URL e a chave anônima do Supabase estão corretos
   - Verifique se o projeto do Supabase está ativo

3. **Erros no console**:
   - Verifique se há erros no console do navegador relacionados à autenticação

## Contato para Suporte

Se você continuar enfrentando problemas após seguir este guia, entre em contato com o suporte técnico para obter ajuda adicional. 

## Checklist de Verificação

Se você estiver enfrentando problemas de autenticação, siga estas etapas:

1. **Verificar Logs**:
   - Verifique os logs do console para mensagens de erro ou avisos relacionados à autenticação.
   - Procure por mensagens como "Sessão encontrada" ou "Nenhuma sessão encontrada".

2. **Verificar Cookies**:
   - Abra as ferramentas de desenvolvedor (F12)
   - Vá para a aba "Application" > "Storage" > "Cookies"
   - Verifique se os cookies `sb-access-token`, `sb-refresh-token` e `sb-user-id` estão presentes.

3. **Executar Script de Diagnóstico**:
   ```
   node check-session.js
   ```

4. **Verificar Configuração**:
   - Certifique-se de que o `AuthProvider` está sendo usado apenas uma vez na árvore de componentes.
   - Verifique se o `ProtectedRoute` está sendo usado corretamente nas páginas que requerem autenticação.

## Problemas Comuns e Soluções

### 1. Sessão não é mantida após login

**Possíveis causas**:
- Cookies não estão sendo definidos corretamente
- Problemas com CORS ou configurações de segurança do navegador
- Configuração incorreta do Supabase

**Soluções**:
- Verifique se os cookies estão sendo definidos com as propriedades corretas (httpOnly, secure, sameSite)
- Verifique se o domínio dos cookies corresponde ao domínio da aplicação
- Certifique-se de que o Supabase está configurado corretamente

### 2. Redirecionamento em loop

**Possíveis causas**:
- `ProtectedRoute` está redirecionando prematuramente
- Estado de autenticação não está sendo sincronizado corretamente
- Duplicação do `AuthProvider`

**Soluções**:
- Verifique se o `ProtectedRoute` está aguardando a conclusão de todas as verificações antes de redirecionar
- Certifique-se de que o `AuthProvider` está sendo usado apenas uma vez
- Verifique se o estado de autenticação está sendo atualizado corretamente

### 3. Erro "getCurrentUser retornou null após login bem-sucedido"

**Possíveis causas**:
- Problemas com as políticas RLS no Supabase
- Usuário não existe na tabela `users`
- Erro na função `getCurrentUser`

**Soluções**:
- Verifique as políticas RLS para a tabela `users`
- Certifique-se de que o usuário existe na tabela `users`
- Verifique se a função `getCurrentUser` está tratando corretamente os erros

## Recursos Adicionais

- [Documentação do Supabase Auth](https://supabase.com/docs/guides/auth)
- [Guia de Cookies em Next.js](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [Guia de Autenticação em Next.js](https://nextjs.org/docs/authentication) 