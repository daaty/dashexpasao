import { Client } from 'pg';

async function checkRecharges() {
  const client = new Client({
    host: '148.230.73.27',
    port: 5432,
    database: 'postgres',
    user: 'n8n_user',
    password: 'n8n_pw',
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco N8N\n');

    // Consulta para buscar recargas por mês para Nova Bandeirantes
    const query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', t."timestamp"), 'YYYY-MM') as month,
        COUNT(*) as total_recargas,
        SUM(t.amount) as valor_total,
        MIN(t."timestamp") as primeira_recarga,
        MAX(t."timestamp") as ultima_recarga
      FROM dashboard.transactions t
      INNER JOIN dashboard.drivers d ON t."driverId" = d.id
      WHERE LOWER(d.city) LIKE '%nova bandeirantes%'
        AND t.type = 'CREDIT'
        AND LOWER(t.description) LIKE '%recarga%'
      GROUP BY DATE_TRUNC('month', t."timestamp")
      ORDER BY month ASC
    `;

    const result = await client.query(query);
    
    console.log('=== RECARGAS EM NOVA BANDEIRANTES POR MÊS ===\n');
    
    if (result.rows.length === 0) {
      console.log('⚠️ Nenhuma recarga encontrada para Nova Bandeirantes');
      await client.end();
      return;
    }

    result.rows.forEach((row, index) => {
      const mesNum = index + 1;
      console.log(`📅 Mês ${mesNum} (${row.month}):`);
      console.log(`   Total de recargas: ${row.total_recargas}`);
      console.log(`   Valor total: R$ ${parseFloat(row.valor_total).toFixed(2)}`);
      console.log(`   Primeira recarga: ${new Date(row.primeira_recarga).toLocaleDateString('pt-BR')}`);
      console.log(`   Última recarga: ${new Date(row.ultima_recarga).toLocaleDateString('pt-BR')}`);
      console.log('');
    });

    // Mostrar o 3º mês especificamente
    if (result.rows[2]) {
      console.log('\n🎯 RESPOSTA PARA MÊS 3:');
      console.log(`   Total de recargas: ${result.rows[2].total_recargas}`);
      console.log(`   Período: ${result.rows[2].month}`);
      console.log(`   Valor total: R$ ${parseFloat(result.rows[2].valor_total).toFixed(2)}`);
    } else {
      console.log('\n⚠️ Não há dados para o 3º mês');
    }

    await client.end();
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    await client.end();
  }
}

checkRecharges();
