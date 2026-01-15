const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: '148.230.73.27',
  port: 5436,
  user: 'urbanexpansao',
  password: 'urban2026',
  database: 'dashboard_de_Expansao'
});

async function setup() {
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL remoto');
    
    // 1. Executar migration statement por statement
    console.log('\n📋 Executando migration...');
    const migrationSQL = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf-8');
    
    // Separar statements (remover comentários e linhas vazias)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement) {
        try {
          await client.query(statement);
        } catch (err) {
          // Ignorar erros de "já existe"
          if (!err.message.includes('already exists')) {
            console.error(`⚠️  Erro no statement: ${err.message}`);
          }
        }
      }
    }
    console.log('✅ Migration executada com sucesso');
    
    // 2. Verificar tabelas criadas
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name;
    `);
    console.log('\n📊 Tabelas criadas:', tablesResult.rows.length);
    tablesResult.rows.forEach(row => console.log('  -', row.table_name));
    
    // 3. Popular com dados IBGE
    console.log('\n🌍 Buscando dados do IBGE...');
    const ibgeResponse = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios');
    const municipios = await ibgeResponse.json();
    console.log(`✅ ${municipios.length} municípios encontrados`);
    
    // Mapeamento de mesorregiões
    const mesoMap = {
      5101: 'NORTE_MATOGROSSENSE',
      5102: 'NORDESTE_MATOGROSSENSE', 
      5103: 'CENTRO_SUL_MATOGROSSENSE',
      5104: 'SUDESTE_MATOGROSSENSE',
      5105: 'SUDOESTE_MATOGROSSENSE'
    };
    
    let inserted = 0;
    let skipped = 0;
    
    for (const mun of municipios) {
      const mesoId = mun.microrregiao?.mesorregiao?.id;
      const mesorregion = mesoMap[mesoId];
      
      if (!mesorregion) {
        console.log(`⚠️  Pulando ${mun.nome} - mesorregião ${mesoId} não mapeada`);
        skipped++;
        continue;
      }
      
      try {
        await client.query(`
          INSERT INTO "City" (id, name, state, mesorregion, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            mesorregion = EXCLUDED.mesorregion,
            "updatedAt" = NOW();
        `, [mun.id, mun.nome, 'MT', mesorregion]);
        inserted++;
      } catch (err) {
        console.error(`❌ Erro ao inserir ${mun.nome}:`, err.message);
      }
    }
    
    console.log(`\n✅ População concluída: ${inserted} cidades inseridas, ${skipped} puladas`);
    
    // 4. Verificar total
    const countResult = await client.query('SELECT COUNT(*) FROM "City"');
    console.log(`\n📊 Total de cidades no banco: ${countResult.rows[0].count}`);
    
    await client.end();
    console.log('\n🎉 Setup completo!');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error(err);
    process.exit(1);
  }
}

setup();
