require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Inicializar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key (primeiros 5 caracteres):', supabaseAnonKey?.substring(0, 5) + '...')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não estão definidas.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Verifica a estrutura de uma tabela
 */
async function checkTableStructure(tableName) {
  console.log(`\n--- Verificando estrutura da tabela ${tableName} ---`)
  
  try {
    // Consulta para obter informações sobre as colunas da tabela
    const { data, error } = await supabase.rpc('get_table_info', { table_name: tableName })
    
    if (error) {
      console.error(`Erro ao verificar estrutura da tabela ${tableName}:`, error.message)
      
      // Tentar uma abordagem alternativa
      console.log(`Tentando abordagem alternativa para verificar a tabela ${tableName}...`)
      
      // Tentar selecionar uma linha para ver quais colunas existem
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (sampleError) {
        console.error(`Erro ao selecionar dados da tabela ${tableName}:`, sampleError.message)
        return
      }
      
      if (!sampleData || sampleData.length === 0) {
        console.log(`Nenhum dado encontrado na tabela ${tableName}.`)
        return
      }
      
      console.log(`Colunas encontradas na tabela ${tableName}:`)
      const columns = Object.keys(sampleData[0])
      columns.forEach(column => {
        console.log(`- ${column}`)
      })
      
      return
    }
    
    if (!data || data.length === 0) {
      console.log(`Nenhuma informação encontrada para a tabela ${tableName}.`)
      return
    }
    
    console.log(`Colunas da tabela ${tableName}:`)
    data.forEach(column => {
      console.log(`- ${column.column_name} (${column.data_type})${column.is_nullable === 'YES' ? ' (nullable)' : ''}`)
    })
  } catch (err) {
    console.error(`Erro ao verificar estrutura da tabela ${tableName}:`, err.message)
  }
}

/**
 * Verifica as políticas RLS de uma tabela
 */
async function checkTablePolicies(tableName) {
  console.log(`\n--- Verificando políticas RLS da tabela ${tableName} ---`)
  
  try {
    // Consulta para obter informações sobre as políticas da tabela
    const { data, error } = await supabase.rpc('get_policies', { table_name: tableName })
    
    if (error) {
      console.error(`Erro ao verificar políticas da tabela ${tableName}:`, error.message)
      return
    }
    
    if (!data || data.length === 0) {
      console.log(`Nenhuma política encontrada para a tabela ${tableName}.`)
      return
    }
    
    console.log(`Políticas da tabela ${tableName}:`)
    data.forEach(policy => {
      console.log(`- ${policy.policyname} (${policy.cmd}):`)
      console.log(`  Expressão: ${policy.expr}`)
      console.log(`  Roles: ${policy.roles}`)
      console.log('---')
    })
  } catch (err) {
    console.error(`Erro ao verificar políticas da tabela ${tableName}:`, err.message)
  }
}

/**
 * Verifica a existência de uma função no banco de dados
 */
async function checkFunction(functionName) {
  console.log(`\n--- Verificando existência da função ${functionName} ---`)
  
  try {
    // Consulta para verificar se a função existe
    const { data, error } = await supabase.rpc('function_exists', { function_name: functionName })
    
    if (error) {
      console.error(`Erro ao verificar existência da função ${functionName}:`, error.message)
      return false
    }
    
    if (data) {
      console.log(`Função ${functionName} existe.`)
      return true
    } else {
      console.log(`Função ${functionName} não existe.`)
      return false
    }
  } catch (err) {
    console.error(`Erro ao verificar existência da função ${functionName}:`, err.message)
    return false
  }
}

/**
 * Cria funções auxiliares para verificação
 */
async function createHelperFunctions() {
  console.log('\n--- Criando funções auxiliares ---')
  
  try {
    // Função para verificar se outra função existe
    const functionExistsQuery = `
      CREATE OR REPLACE FUNCTION function_exists(function_name text)
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        func_exists boolean;
      BEGIN
        SELECT EXISTS (
          SELECT 1
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public'
          AND p.proname = function_name
        ) INTO func_exists;
        
        RETURN func_exists;
      END;
      $$;
    `
    
    const { error: functionExistsError } = await supabase.rpc('exec_sql', { sql: functionExistsQuery })
    
    if (functionExistsError) {
      console.error('Erro ao criar função function_exists:', functionExistsError.message)
    } else {
      console.log('Função function_exists criada com sucesso.')
    }
    
    // Função para obter informações sobre tabelas
    const getTableInfoQuery = `
      CREATE OR REPLACE FUNCTION get_table_info(table_name text)
      RETURNS TABLE (
        column_name text,
        data_type text,
        is_nullable text
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          c.column_name::text,
          c.data_type::text,
          c.is_nullable::text
        FROM
          information_schema.columns c
        WHERE
          c.table_schema = 'public'
          AND c.table_name = table_name
        ORDER BY
          c.ordinal_position;
      END;
      $$;
    `
    
    const { error: getTableInfoError } = await supabase.rpc('exec_sql', { sql: getTableInfoQuery })
    
    if (getTableInfoError) {
      console.error('Erro ao criar função get_table_info:', getTableInfoError.message)
    } else {
      console.log('Função get_table_info criada com sucesso.')
    }
    
    // Função para obter políticas de uma tabela
    const getPoliciesQuery = `
      CREATE OR REPLACE FUNCTION get_policies(table_name text)
      RETURNS TABLE (
        policyname text,
        tablename text,
        cmd text,
        roles text,
        expr text
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          p.policyname::text,
          p.tablename::text,
          p.cmd::text,
          p.roles::text,
          p.qual::text as expr
        FROM
          pg_policies p
        WHERE
          p.tablename = table_name
          AND p.schemaname = 'public';
      END;
      $$;
    `
    
    const { error: getPoliciesError } = await supabase.rpc('exec_sql', { sql: getPoliciesQuery })
    
    if (getPoliciesError) {
      console.error('Erro ao criar função get_policies:', getPoliciesError.message)
    } else {
      console.log('Função get_policies criada com sucesso.')
    }
    
    // Função para executar SQL
    const execSqlQuery = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `
    
    const { error: execSqlError } = await supabase.rpc('exec_sql', { sql: execSqlQuery })
    
    if (execSqlError) {
      console.error('Erro ao criar função exec_sql:', execSqlError.message)
    } else {
      console.log('Função exec_sql criada com sucesso.')
    }
  } catch (err) {
    console.error('Erro ao criar funções auxiliares:', err.message)
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('Iniciando verificação das tabelas...')
  
  // Criar funções auxiliares
  await createHelperFunctions()
  
  // Verificar se as funções foram criadas
  const functionExistsExists = await checkFunction('function_exists')
  const getTableInfoExists = await checkFunction('get_table_info')
  const getPoliciesExists = await checkFunction('get_policies')
  
  if (!functionExistsExists || !getTableInfoExists || !getPoliciesExists) {
    console.error('Erro: Não foi possível criar todas as funções auxiliares necessárias.')
    console.log('Continuando com funcionalidade limitada...')
  }
  
  // Lista de tabelas para verificar
  const tables = ['users', 'chats', 'chat_participants', 'messages', 'groups']
  
  // Verificar estrutura e políticas de cada tabela
  for (const table of tables) {
    await checkTableStructure(table)
    await checkTablePolicies(table)
  }
  
  console.log('\nVerificação concluída.')
}

// Executar função principal
main().catch(err => {
  console.error('Erro durante a verificação:', err)
  process.exit(1)
}) 