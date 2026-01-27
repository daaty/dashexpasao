import { n8nDatabase } from '../src/config/n8nDatabase';

async function testQuery() {
  try {
    await n8nDatabase.connect();
    console.log('✅ Conectado ao banco N8N');

    // Teste 1: Query simples com city em minúsculas
    console.log('\n🔍 Teste 1: Busca por "nova monte verde" (minúsculas)');
    const test1 = await n8nDatabase.query(`
      SELECT city, COUNT(*) as total
      FROM dashboard.rides
      WHERE LOWER(city) = 'nova monte verde'
      GROUP BY city
    `);
    console.log('Resultado:', test1.rows);

    // Teste 2: Query com LIKE
    console.log('\n🔍 Teste 2: Busca com LIKE "%Nova Monte%"');
    const test2 = await n8nDatabase.query(`
      SELECT city, COUNT(*) as total
      FROM dashboard.rides
      WHERE city LIKE '%Nova Monte%'
      GROUP BY city
    `);
    console.log('Resultado:', test2.rows);

    // Teste 3: Todas as cidades únicas
    console.log('\n🔍 Teste 3: Todas as cidades únicas');
    const test3 = await n8nDatabase.query(`
      SELECT DISTINCT city, COUNT(*) as total
      FROM dashboard.rides
      WHERE city IS NOT NULL
      GROUP BY city
      ORDER BY total DESC
      LIMIT 15
    `);
    console.log('Resultado:', test3.rows);

    await n8nDatabase.disconnect();
  } catch (error) {
    console.error('Erro:', error);
  }
}

testQuery();
