const fs = require('fs');
const path = require('path');

// Função para verificar e corrigir o arquivo app/auth/login/page.tsx
function fixLoginPage() {
  console.log('=== Verificando e corrigindo a página de login ===');
  
  const loginPagePath = path.join(process.cwd(), 'app/auth/login/page.tsx');
  
  try {
    if (!fs.existsSync(loginPagePath)) {
      console.error('Arquivo app/auth/login/page.tsx não encontrado');
      return false;
    }
    
    let content = fs.readFileSync(loginPagePath, 'utf8');
    
    // Verificar se o redirecionamento está sendo feito corretamente
    const hasRedirect = content.includes('router.push');
    const hasWindowLocation = content.includes('window.location');
    
    console.log(`Redirecionamento via router.push: ${hasRedirect ? 'SIM' : 'NÃO'}`);
    console.log(`Redirecionamento via window.location: ${hasWindowLocation ? 'SIM' : 'NÃO'}`);
    
    // Se não tiver redirecionamento via window.location, adicionar
    if (!hasWindowLocation) {
      console.log('Adicionando redirecionamento alternativo via window.location...');
      
      // Encontrar o useEffect que lida com o redirecionamento
      const redirectEffectRegex = /useEffect\(\s*\(\)\s*=>\s*\{\s*if\s*\(state\?\.\s*success\)\s*\{\s*.*?router\.push\(['"]\/(.*?)['"]\)/s;
      const match = content.match(redirectEffectRegex);
      
      if (match) {
        const redirectPath = match[1] || '';
        
        // Substituir o useEffect por uma versão com window.location
        const oldEffect = match[0];
        const newEffect = `useEffect(() => {
    if (state?.success) {
      console.log('Login bem-sucedido, redirecionando para a página principal...');
      
      // Tentar redirecionamento com router.push
      router.push('/${redirectPath}');
      
      // Como fallback, usar window.location após um pequeno delay
      setTimeout(() => {
        console.log('Aplicando redirecionamento alternativo...');
        window.location.href = '/${redirectPath}';
      }, 500);
    }`;
        
        content = content.replace(oldEffect, newEffect);
        
        // Salvar as alterações
        fs.writeFileSync(loginPagePath, content, 'utf8');
        console.log('Arquivo app/auth/login/page.tsx atualizado com sucesso!');
        return true;
      } else {
        console.log('Não foi possível encontrar o useEffect de redirecionamento para modificar');
        return false;
      }
    } else {
      console.log('O redirecionamento alternativo já está presente. Nenhuma alteração necessária.');
      return true;
    }
  } catch (error) {
    console.error('Erro ao verificar/corrigir a página de login:', error);
    return false;
  }
}

// Função para verificar e corrigir o arquivo components/protected-route.tsx
function fixProtectedRoute() {
  console.log('\n=== Verificando e corrigindo o ProtectedRoute ===');
  
  const protectedRoutePath = path.join(process.cwd(), 'components/protected-route.tsx');
  
  try {
    if (!fs.existsSync(protectedRoutePath)) {
      console.error('Arquivo components/protected-route.tsx não encontrado');
      return false;
    }
    
    let content = fs.readFileSync(protectedRoutePath, 'utf8');
    
    // Verificar se o redirecionamento tem delay
    const hasDelayedRedirect = content.includes('setTimeout') && content.includes('router.push');
    
    console.log(`Redirecionamento com delay: ${hasDelayedRedirect ? 'SIM' : 'NÃO'}`);
    
    // Se não tiver redirecionamento com delay, adicionar
    if (!hasDelayedRedirect) {
      console.log('Adicionando delay ao redirecionamento...');
      
      // Encontrar o trecho que faz o redirecionamento
      const redirectRegex = /(if\s*\(\!user\s*&&\s*\!isAuthenticated\)\s*\{\s*.*?console\.log\(['"](.*?)['"].*?\)\s*router\.push\(redirectTo\))/s;
      const match = content.match(redirectRegex);
      
      if (match) {
        const oldRedirect = match[0];
        const logMessage = match[2] || 'ProtectedRoute - Usuário não autenticado, redirecionando...';
        
        // Substituir o redirecionamento por uma versão com delay
        const newRedirect = `if (!user && !isAuthenticated) {
				console.log('${logMessage}')
				
				// Adicionar um pequeno delay antes de redirecionar
				// Isso dá tempo para que qualquer atualização de estado pendente seja concluída
				setTimeout(() => {
					console.log('ProtectedRoute - Executando redirecionamento para', redirectTo)
					router.push(redirectTo)
				}, 300)`;
        
        content = content.replace(oldRedirect, newRedirect);
        
        // Salvar as alterações
        fs.writeFileSync(protectedRoutePath, content, 'utf8');
        console.log('Arquivo components/protected-route.tsx atualizado com sucesso!');
        return true;
      } else {
        console.log('Não foi possível encontrar o trecho de redirecionamento para modificar');
        return false;
      }
    } else {
      console.log('O redirecionamento com delay já está presente. Nenhuma alteração necessária.');
      return true;
    }
  } catch (error) {
    console.error('Erro ao verificar/corrigir o ProtectedRoute:', error);
    return false;
  }
}

// Função principal
function main() {
  console.log('=== Correção de Problemas de Redirecionamento ===\n');
  
  const loginPageFixed = fixLoginPage();
  const protectedRouteFixed = fixProtectedRoute();
  
  console.log('\n=== Resumo das Alterações ===');
  console.log(`Página de login: ${loginPageFixed ? 'Corrigida' : 'Não modificada'}`);
  console.log(`ProtectedRoute: ${protectedRouteFixed ? 'Corrigido' : 'Não modificado'}`);
  
  if (loginPageFixed || protectedRouteFixed) {
    console.log('\nAlterações realizadas com sucesso!');
    console.log('Por favor, reinicie o servidor de desenvolvimento para aplicar as alterações:');
    console.log('1. Pressione Ctrl+C para parar o servidor atual');
    console.log('2. Execute "npm run dev" para iniciar o servidor novamente');
    console.log('3. Teste o login novamente');
  } else {
    console.log('\nNenhuma alteração foi necessária ou possível.');
    console.log('Se o problema persistir, verifique manualmente os arquivos.');
  }
}

main(); 