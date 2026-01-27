import { Client } from 'pg';

// Tente diferentes configurações de host:
// 1. n8n_postgres - se estiver dentro do mesmo docker network
// 2. localhost - se o banco estiver exposto localmente
// 3. IP específico - se souber o IP do container/servidor

const configs = [
  {
    name: 'Remote Server (148.230.73.27)',
    connectionString: 'postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable'
  },
  {
    name: 'Docker Network (n8n_postgres)',
    connectionString: 'postgresql://n8n_user:n8n_pw@n8n_postgres:5432/postgres?sslmode=disable'
  },
  {
    name: 'Localhost',
    connectionString: 'postgresql://n8n_user:n8n_pw@localhost:5432/postgres?sslmode=disable'
  },
  {
    name: '127.0.0.1',
    connectionString: 'postgresql://n8n_user:n8n_pw@127.0.0.1:5432/postgres?sslmode=disable'
  }
];

async function testConnection(config: typeof configs[0]) {
  const client = new Client({
    connectionString: config.connectionString,
  });

  try {
    await client.connect();
    console.log(`✅ Conectado com sucesso usando: ${config.name}`);
    await client.end();
    return true;
  } catch (error: any) {
    console.log(`❌ Falha ao conectar com ${config.name}: ${error.message}`);
    return false;
  }
}

async function analyzeRidesTable() {
  // Testar conexões
  console.log('🔍 Testando diferentes configurações de conexão...\n');
  
  let workingConfig = null;
  for (const config of configs) {
    if (await testConnection(config)) {
      workingConfig = config;
      break;
    }
  }
  
  if (!workingConfig) {
    console.error('\n❌ Não foi possível conectar ao banco de dados com nenhuma configuração.');
    console.log('\n💡 Dica: Verifique se:');
    console.log('   1. O container n8n_postgres está rodando');
    console.log('   2. A porta 5432 está exposta e acessível');
    console.log('   3. As credenciais estão corretas');
    console.log('\n📝 Execute "docker ps" para ver os containers rodando');
    console.log('📝 Execute "docker inspect n8n_postgres" para ver detalhes do container');
    return;
  }
  
  console.log(`\n🎯 Usando configuração: ${workingConfig.name}\n`);
  
  const client = new Client({
    connectionString: workingConfig.connectionString,
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados n8n');

    // Verificar se a tabela existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'dashboard' 
        AND table_name = 'rides'
      );
    `);
    
    console.log('\n📊 Tabela rides existe:', tableExists.rows[0].exists);

    if (tableExists.rows[0].exists) {
      // Obter estrutura da tabela
      console.log('\n📋 Estrutura da tabela dashboard.rides:');
      const columns = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'dashboard' 
        AND table_name = 'rides'
        ORDER BY ordinal_position;
      `);
      
      console.table(columns.rows);

      // Contar registros
      const count = await client.query('SELECT COUNT(*) FROM dashboard.rides');
      console.log('\n📈 Total de registros:', count.rows[0].count);

      // Mostrar exemplo de dados (primeiras 5 linhas)
      console.log('\n🔍 Exemplo de dados (primeiras 5 linhas):');
      const sample = await client.query('SELECT * FROM dashboard.rides LIMIT 5');
      console.table(sample.rows);

      // Analisar cidades com mais corridas
      console.log('\n🏙️ Cidades com mais corridas:');
      const citiesQuery = await client.query(`
        SELECT 
          city,
          COUNT(*) as total_rides,
          MIN("createdAt") as first_ride,
          MAX("createdAt") as last_ride
        FROM dashboard.rides
        WHERE city IS NOT NULL
        GROUP BY city
        ORDER BY total_rides DESC
        LIMIT 10;
      `);
      console.table(citiesQuery.rows);

      // Analisar por período (se houver campo de data)
      console.log('\n📅 Distribuição por mês:');
      const monthlyQuery = await client.query(`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as total_rides
        FROM dashboard.rides
        WHERE "createdAt" IS NOT NULL
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12;
      `);
      console.table(monthlyQuery.rows);

    } else {
      console.log('❌ Tabela dashboard.rides não encontrada');
      
      // Listar tabelas disponíveis no schema dashboard
      console.log('\n📋 Tabelas disponíveis no schema dashboard:');
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'dashboard'
        ORDER BY table_name;
      `);
      console.table(tables.rows);
    }

  } catch (error) {
    console.error('❌ Erro ao analisar tabela:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

analyzeRidesTable();
