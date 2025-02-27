const fs = require('fs');
const path = require('path');

function checkAuthProviderDuplication() {
  console.log('=== Verificando duplicação do AuthProvider ===');
  
  const layoutPath = path.join(process.cwd(), 'app/layout.tsx');
  const providersPath = path.join(process.cwd(), 'components/providers.tsx');
  
  try {
    // Verificar se os arquivos existem
    const layoutExists = fs.existsSync(layoutPath);
    const providersExists = fs.existsSync(providersPath);
    
    console.log(`app/layout.tsx existe: ${layoutExists}`);
    console.log(`components/providers.tsx existe: ${providersExists}`);
    
    if (!layoutExists || !providersExists) {
      console.log('Um ou ambos os arquivos não existem. Não é possível verificar duplicação.');
      return;
    }
    
    // Ler o conteúdo dos arquivos
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    const providersContent = fs.readFileSync(providersPath, 'utf8');
    
    // Verificar se o AuthProvider está presente em cada arquivo
    const layoutHasAuthProvider = layoutContent.includes('AuthProvider');
    const providersHasAuthProvider = providersContent.includes('AuthProvider');
    
    console.log(`AuthProvider em app/layout.tsx: ${layoutHasAuthProvider ? 'SIM' : 'NÃO'}`);
    console.log(`AuthProvider em components/providers.tsx: ${providersHasAuthProvider ? 'SIM' : 'NÃO'}`);
    
    if (layoutHasAuthProvider && providersHasAuthProvider) {
      console.log('ALERTA: O AuthProvider está presente em ambos os arquivos!');
      console.log('Isso pode causar problemas de autenticação devido à duplicação de contexto.');
      
      // Verificar se o Providers está sendo usado no layout
      const layoutUsesProviders = layoutContent.includes('<Providers>') || 
                                 layoutContent.includes('Providers>');
      
      if (layoutUsesProviders) {
        console.log('O componente Providers está sendo usado no layout.tsx.');
        console.log('Recomendação: Remova o AuthProvider do layout.tsx, pois ele já está no Providers.');
      } else {
        console.log('O componente Providers NÃO está sendo usado no layout.tsx.');
        console.log('Recomendação: Use o Providers no layout.tsx OU remova o AuthProvider do Providers.');
      }
    } else {
      console.log('OK: O AuthProvider não está duplicado nos arquivos verificados.');
    }
  } catch (error) {
    console.error('Erro ao verificar duplicação:', error);
  }
}

checkAuthProviderDuplication(); 